/**
 * 主程序
 * wangxm   2018-12-27
 */
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import extend from 'extend2'
import * as DdnCrypto from '@ddn/crypto'
import { bignum, runtimeState } from '@ddn/utils'
import { System } from '../utils/system'
import { logger } from '../utils/logger'

import Context from './context'
import Block from './block/block'
import Transaction from './transaction/transaction'
import Account from './account/account'
import Slot from './consensus/slot'
import Round from './consensus/round'
import Delegate from './consensus/delegate'
import Consensus from './consensus/consensus'
import DataQuery from './consensus/data-query'
import Peer from './peer/peer'
import Energy from '../helpers/energy'
import dbUpgrade from '../db/db-upgrade'
import HttpServer from '../network/http-server'
import MultiSignature from './consensus/multisignature'
import { DVM, Compiler } from '@ddn/contract'

import defaultConfig from '../config.default.js'

/**
 * By default, Node has 4 workers to resolve DNS queries. If your DNS query takes long-ish time,
 * requests will block on the DNS phase, and the symptom is exactly ESOCKETTIMEDOUT or ETIMEDOUT.
 *
 * https://stackoverflow.com/questions/24320578/node-js-get-request-etimedout-esockettimedout
 * https://segmentfault.com/q/1010000012789448
 */
process.env.UV_THREADPOOL_SIZE = 20 // max: 128

class Program {
  async _init (options) {
    options.logger = logger(options)

    if (!options.configObject.publicIp) {
      options.configObject.publicIp = System.getPublicIp()
    }

    this._context = new Context()
    await this._context.init(options)

    this._context.runtime.state = runtimeState.Pending
    this._context.runtime.loaded = false

    // 区块核心处理模块
    this._context.runtime.block = Block.singleton(this._context)
    // 交易核心处理模块
    this._context.runtime.transaction = Transaction.singleton(this._context)
    // 账户核心处理模块
    this._context.runtime.account = Account.singleton(this._context)
    // multisignature
    this._context.runtime.multisignature = MultiSignature.singleton(this._context)
    // Slot
    this._context.runtime.slot = Slot.singleton(this._context)
    // Delegate
    this._context.runtime.delegate = Delegate.singleton(this._context)
    // Round
    this._context.runtime.round = Round.singleton(this._context)
    // Consensus
    this._context.runtime.consensus = Consensus.singleton(this._context)
    // Peer
    this._context.runtime.peer = Peer.singleton(this._context)
    // Data Query
    this._context.runtime.dataquery = DataQuery.singleton(this._context)
    // Energy
    this._context.runtime.energy = Energy.singleton(this._context)
    // Compiler
    this._context.runtime.compiler = new Compiler()
    // negotiate
    this._context.runtime.dvm = new DVM({
      dataDir: path.join(this._context.baseDir, '/db/contracts'),
      logDir: path.join(this._context.baseDir, '/logs/'),
      logLevel: options.configObject.logLevel,
      isDev: process.env.NODE_ENV !== 'production'
    })

    // 锁文件，存储当前运行进程的ID
    this._pid_file = path.join(options.baseDir, 'ddn.pid')

    // 节点列表同步任务的轮询间隔（3-1个轮询会执行一次同步）
    this._peerSyncCounter = 3
  }

  /**
   * 文件锁，保证系统只能运行一份
   */
  _checkProcessState () {
    if (this._context.isDaemonMode) {
      try {
        var fd = fs.openSync(this._pid_file, 'wx')
        fs.writeSync(fd, process.pid)
        fs.closeSync(fd)
      } catch (err) {
        console.log('Failed: DDN server already started')
        process.exit(1)
      }
    } else {
      if (fs.existsSync(this._pid_file)) {
        console.log('Failed: DDN server already started')
        process.exit(1)
      }
    }
  }

  /**
   * 释放文件锁
   */
  _resetProcessState () {
    try {
      if (fs.existsSync(this._pid_file)) {
        fs.unlinkSync(this._pid_file)
      }
    } catch (err) {
      console.error(System.getErrorMsg(err))
    }
  }

  /**
   * 升级数据库结构
   */
  async _applyDatabaseUpgrade () {
    return await dbUpgrade.upgrade(this._context)
  }

  /**
   * 校验创世区块的数据
   */
  async _checkGenesisBlock () {
    const block = this._context.genesisblock

    let payloadBytes = ''
    let payloadLength = 0

    for (const trs of block.transactions) {
      const bytes = DdnCrypto.getBytes(trs)
      payloadLength += bytes.length
      payloadBytes += bytes
    }

    const payloadHash = DdnCrypto.createHash(Buffer.from(payloadBytes))
    const id = await this._context.runtime.block.getId(block)
    assert(payloadLength === block.payload_length, 'Unexpected payloadLength')
    assert(payloadHash.toString('hex') === block.payload_hash, 'Unexpected payloadHash')
    assert(id === block.id, 'Unexpected block id')

    return true
  }

  async run (options) {
    // 如果是后台模式，禁止输出
    if (options.isDaemonMode) {
      require('daemon')({ cwd: process.cwd() })
    }
    // 提供系统默认配置文件
    options.configObject = extend(true, defaultConfig, options.configObject)

    process.once('cleanup', async () => {
      this._context.logger.info('Cleaning up...')
      await this._beforeClose()
      await this._context.close()
      this._resetProcessState()
      process.exit(1)
    })

    process.once('SIGTERM', () => {
      process.emit('cleanup')
    })

    process.once('exit', () => {
      process.emit('cleanup')
      this._context.logger.info('process exited')
    })

    process.once('SIGINT', () => {
      process.emit('cleanup')
    })

    process.on('unhandledRejection', (reason, p) => {
      console.log('Unhandled Rejection at: ', p, 'reason:', reason)
    })

    process.on('uncaughtException', err => {
      this._context.logger.fatal('uncaughtException', { message: err.message, stack: err.stack })
      process.emit('cleanup')
    })

    if (typeof gc === 'function') {
      setInterval(() => {
        // eslint-disable-next-line no-undef
        gc()
      }, 1000 * 60 * 30)
    }

    // 配置加載之前回調函數
    await this._configWillLoad(options)
    // 初始化运行时上下文、核心模块等
    await this._init(options)
    // 配置加載完成回調函數
    await this._configLoaded()

    // 文件锁，保证系统只能运行一份
    this._checkProcessState()

    process.stdin.resume()

    // 应用最新数据库升级
    await this._applyDatabaseUpgrade()

    // 验证创世区块数据是否合法
    if (!(await this._checkGenesisBlock())) {
      process.exit(1)
    }

    if (!this._context.config.publicIp) {
      this._context.logger.warn('Failed to get public ip, block forging may not work!')
    }

    // 启动dvm
    await this._context.runtime.dvm.run()
    // const contracts = await this._context.dao.findList('contract', { where: { state: 0 } })
    // await this._context.runtime.dvm.loadContracts(contracts.map(c => c.id))
    // dvm 就緒回調函數
    this._dvmReady()

    // 初始化创世区块
    await this._context.runtime.block.handleGenesisBlock()

    // 初始化账户以及余额
    try {
      // TODO next optimize initAccountsAndBalances like onInitAccountsAndBalances use
      await this._context.runtime.account.initAccountsAndBalances()
      // init asset banlance when start program
      await this._context.runtime.transaction.execAssetFunc('onInitAccountsAndBalances')
    } catch (err) {
      this._context.logger.error('Failed to load blockchain', System.getErrorMsg(err))
      return process.exit(1)
    }

    // 启动准备（节点）
    await this._context.runtime.peer.prepare()

    // 启动准备（Round）
    await this._context.runtime.round.prepare()

    // 启动准备（受托人）
    await this._context.runtime.delegate.prepare()

    // 启动节点网络服务
    this._context.runtime.httpserver = await HttpServer.newServer(this._context).start()

    // 系统准备完毕，进入待命状态
    if (this._context.isDaemonMode) {
      this._context.logger.info('DDN server started as daemon ...')
    } else {
      this._context.logger.info('DDN Start Successfully!')
    }

    await this._bindReady()
    // assets 加載完成回調函數
    await this._assetsLoaded()
    // 启动区块数据同步任务
    await this.startBlockDataSyncTask()

    // 启动区块未确认交易的同步任务
    await this.startUnconfirmedTransactionSyncTask()

    // 启动签名同步任务
    await this.startSignaturesSyncTask()

    // 启动区块铸造任务
    await this.startForgeBlockTask()

    this._context.runtime.loaded = true
  }

  async _bindReady () {
    // if (this._context.runtime.loaded) {
    // 通知资产系统已就绪事件
    await this._context.runtime.transaction.execAssetFunc('onBind')
    // }
  }

  async _blockchainReady () {
    if (!this._blockchainReadyFired && this._context.runtime.state === runtimeState.Ready) {
      // 通知资产系统已就绪事件
      await this._context.runtime.transaction.execAssetFunc('onBlockchainReady')
      // 块加载完成

      this._blockchainReadyFired = true
      // 節點就緒回調函數
      await this._appReady()
    }
  }

  // lifeCycle function
  async _configWillLoad (options) {
    if ((options.lifeCycle || {}).configWillLoad) await this._context.configWillLoad()
  }

  async _configLoaded () {
    if (this._context.configLoaded) await this._context.configLoaded()
  }

  async _assetsLoaded () {
    if (this._context.assetsLoaded) await this._context.assetsLoaded()
  }

  async _dvmReady () {
    if (this._context.dvmReady) await this._context.dvmReady()
  }

  async _appReady () {
    if (this._context.appReady) await this._context.appReady()
  }

  async _beforeClose () {
    if (this._context.beforeClose) await this._context.beforeClose()
  }

  /**
   * 签名同步任务（轮询）
   */
  async startSignaturesSyncTask () {
    try {
      await this._context.runtime.peer.syncSignatures()
    } catch (err) {
      this._context.logger.warn('The signatures sync task error: ' + err)
    }

    setTimeout(() => {
      this.startSignaturesSyncTask()
    }, 1000 * 14)
  }

  /**
   * 同步未确认交易（轮询）
   */
  async startUnconfirmedTransactionSyncTask () {
    try {
      if (this._context.runtime.state === runtimeState.Syncing) {
        return
      }

      await this._context.runtime.peer.syncUnconfirmedTransactions()
    } catch (err) {
      this._context.logger.warn('The unconfirmed transaction sync task error: ' + err)
    }

    setTimeout(() => {
      this.startUnconfirmedTransactionSyncTask()
    }, 1000 * 14)
  }

  /**
   * 同步节点区块数据（轮询）
   */
  async startBlockDataSyncTask () {
    const next = () => {
      setTimeout(() => {
        this.startBlockDataSyncTask()
      }, 1000 * 10)
    }
    const peer = await this._context.runtime.peer.p2p.getPeer()

    // this._context.logger.warn('-----startBlockDataSyncTask------', peer)
    if (!peer) {
      this._context.logger.debug('change state is ready')
      this._context.runtime.state = runtimeState.Ready
      await this._blockchainReady()
      next()
      return
    }
    try {
      if (this._context.runtime.state === runtimeState.Syncing) {
        next()
        return
      }

      const lastBlock = this._context.runtime.block.getLastBlock()
      const lastSlot = this._context.runtime.slot.getSlotNumber(lastBlock.timestamp)
      if (this._context.runtime.slot.getNextSlot() - lastSlot < 3) {
        next()
        return
      }
      this._context.runtime.state = runtimeState.Syncing
      this._context.logger.debug('SyncBlocks enter')
      const success = await this._context.runtime.peer.syncBlocks()
      this._context.logger.debug('SyncBlocks outer')
      if (success) {
        this._context.runtime.state = runtimeState.Ready
        await this._blockchainReady()
      } else {
        this._context.logger.debug('SyncBlocks not complete change state pending')
        this._context.runtime.state = runtimeState.Pending
      }
    } catch (err) {
      this._context.logger.error('The block sync task error: ' + err)
    }

    next()
  }

  /**
   * 尝试铸造区块（轮询）
   */
  async startForgeBlockTask () {
    await (async () => {
      if (this._context.runtime.state !== runtimeState.Ready) {
        return
      }

      if (!this._context.runtime.delegate.isForgeEnabled()) {
        this._context.logger.trace('Loop:', 'forging disabled')
        return
      }

      if (!this._context.runtime.delegate.hasValidDelegates()) {
        this._context.logger.trace('Loop:', 'no delegates')
        return
      }

      const currentSlot = this._context.runtime.slot.getSlotNumber()

      const lastBlock = this._context.runtime.block.getLastBlock()
      if (currentSlot === this._context.runtime.slot.getSlotNumber(lastBlock.timestamp)) {
        this._context.logger.trace('Loop:', 'lastBlock is in the same slot')
        return
      }

      if (Date.now() % (this._context.constants.interval * 1000) > (this._context.constants.interval * 1000) / 2) {
        this._context.logger.trace('Loop:', 'maybe too late to collect votes')
        return
      }

      const forgeDelegateInfo = await this._context.runtime.delegate.getForgeDelegateWithCurrentTime(
        currentSlot,
        bignum.plus(lastBlock.height, 1)
      )
      if (forgeDelegateInfo === null) {
        this._context.logger.trace('Loop:', 'skipping slot')
        return
      }

      await new Promise(resolve => {
        this._context.sequence.add(
          async cb => {
            if (
              this._context.runtime.slot.getSlotNumber(forgeDelegateInfo.time) ===
                this._context.runtime.slot.getSlotNumber() &&
              this._context.runtime.block.getLastBlock().timestamp < forgeDelegateInfo.time
            ) {
              try {
                await this._context.runtime.block.generateBlock(forgeDelegateInfo.keypair, forgeDelegateInfo.time)
              } catch (err) {
                this._context.logger.error('Forged new block failed: ' + System.getErrorMsg(err))
                cb('Forged new block failed: ' + err) // Added: 2020.9.4
              }
            }

            cb()
          },
          err => {
            if (err) {
              this._context.logger.error('Failed generate block within slot:', err)
            }

            resolve()
          }
        )
      })
    })()

    setTimeout(() => {
      this.startForgeBlockTask()
    }, 100)
  }

  destory () {
    this._resetProcessState()
  }
}

export default Program
