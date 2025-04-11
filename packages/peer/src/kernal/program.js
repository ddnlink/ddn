/**
 * 主程序
 * wangxm   2018-12-27
 */
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import extend from 'extend2'
import * as DdnCrypto from '@ddn/crypto'
import { DVM, Compiler } from '@ddn/contract'

import { System, Logger, Energy, StateMachine } from '../utils'

import Context from './context'
import Block from './block/block'
import Transaction from './transaction/transaction'
import Account from './account/account'
import {
  Slot,
  Round,
  Delegate,
  Consensus,
  DataQuery,
  MultiSignature
} from './consensus'

import Peer from './peer/peer'
import { ForgeManager } from './peer/forge-manager';

import dbUpgrade from '../db/db-upgrade'
import HttpServer from '../network/http-server'

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

  // 在 _init 方法中初始化
  async _init(options) {
    options.logger = Logger(options)

    if (!options.configObject.publicIp) {
      options.configObject.publicIp = System.getPublicIp()
    }

    // 初始化上下文
    this.ctx = new Context()
    await this.ctx.init(options)

    // 初始化加载状态
    this.ctx.runtime.loaded = false

    // 初始化运行时状态机
    this.ctx.runtime.stateMachine = new StateMachine()

    // 区块核心处理模块
    this.ctx.runtime.block = Block.singleton(this.ctx)
    // 交易核心处理模块
    this.ctx.runtime.transaction = Transaction.singleton(this.ctx)
    // 账户核心处理模块
    this.ctx.runtime.account = Account.singleton(this.ctx)
    // multisignature
    this.ctx.runtime.multisignature = MultiSignature.singleton(this.ctx)
    // Slot
    this.ctx.runtime.slot = Slot.singleton(this.ctx)
    // Delegate
    this.ctx.runtime.delegate = Delegate.singleton(this.ctx)
    // Round
    this.ctx.runtime.round = Round.singleton(this.ctx)
    // Consensus
    this.ctx.runtime.consensus = Consensus.singleton(this.ctx)
    // Peer
    this.ctx.runtime.peer = Peer.singleton(this.ctx)
    // Data Query
    this.ctx.runtime.dataquery = DataQuery.singleton(this.ctx)
    // Energy
    this.ctx.runtime.energy = Energy.singleton(this.ctx)
    // Compiler
    this.ctx.runtime.compiler = new Compiler()
    // negotiate
    this.ctx.runtime.dvm = new DVM({
      dataDir: path.join(this.ctx.baseDir, '/db/contracts'),
      logDir: path.join(this.ctx.baseDir, '/logs/'),
      logLevel: options.configObject.logLevel,
      isDev: process.env.NODE_ENV !== 'production'
    })

    // console.log('configObject', options.configObject);

    // 初始化配置信息
    this.ctx.config = extend(true, {}, defaultConfig, options.configObject)
    // 兼容旧版本 imfly 20240701
    this._context = this.ctx

    // 锁文件，存储当前运行进程的ID
    this._pid_file = path.join(options.baseDir, 'ddn.pid')

    // 节点列表同步任务的轮询间隔（3-1个轮询会执行一次同步）
    this._peerSyncCounter = 3

    // 非运行时函数
    this.forgeManager = new ForgeManager(this.ctx);
  }

  /**
   * 文件锁，保证系统只能运行一份
   */
  _checkProcessState() {
    if (this.ctx.isDaemonMode) {
      try {
        fs.writeFileSync(this._pid_file, process.pid.toString(), { flag: 'wx' })
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
  _resetProcessState() {
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
  async _applyDatabaseUpgrade() {
    return await dbUpgrade.upgrade(this.ctx)
  }

  /**
   * 校验创世区块的数据
   */
  async _checkGenesisBlock() {
    const block = this.ctx.genesisblock

    let payloadBytes = ''
    let payloadLength = 0

    for (const trs of block.transactions) {
      const bytes = DdnCrypto.getBytes(trs)
      payloadLength += bytes.length
      payloadBytes += bytes
    }

    const payloadHash = DdnCrypto.createHash(Buffer.from(payloadBytes))
    const id = await this.ctx.runtime.block.getId(block)
    assert(payloadLength === block.payload_length, 'Unexpected payloadLength')
    assert(payloadHash.toString('hex') === block.payload_hash, 'Unexpected payloadHash')
    assert(id === block.id, 'Unexpected block id')

    return true
  }

  async run(options) {
    // 如果是后台模式，禁止输出
    if (options.isDaemonMode) {
      require('daemon')({ cwd: process.cwd() })
    }
    // 提供系统默认配置文件
    options.configObject = extend(true, defaultConfig, options.configObject)

    // 添加全局事件处理
    process.once('cleanup', async () => {
      this.ctx.logger.info('Cleaning up...')
      await this._beforeClose()
      await this.ctx.close()
      this._resetProcessState()
      process.exit(1)
    })

    process.once('SIGTERM', () => {
      process.emit('cleanup')
    })

    process.once('exit', () => {
      process.emit('cleanup')
      this.ctx.logger.info('process exited')
    })

    process.once('SIGINT', () => {
      process.emit('cleanup')
    })

    process.on('unhandledRejection', (reason, p) => {
      console.log('Unhandled Rejection at: ', p, 'reason:', reason)
    })

    process.on('uncaughtException', err => {
      this.ctx.logger.fatal('uncaughtException', { message: err.message, stack: err.stack })
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

    // 简化上下文
    const ctx = this.ctx;

    // 应用最新数据库升级
    await this._applyDatabaseUpgrade()

    // 验证创世区块数据是否合法
    if (!(await this._checkGenesisBlock())) {
      process.exit(1)
    }

    if (!ctx.config.publicIp) {
      ctx.logger.warn('Failed to get public ip, block forging may not work!')
    }

    // 启动dvm，独立运行
    await ctx.runtime.dvm.run()
    // dvm 就绪回調函數
    this._dvmReady()

    // 初始化创世区块
    await ctx.runtime.block.handleGenesisBlock()

    // 初始化账户以及余额
    try {
      // TODO next optimize initAccountsAndBalances like onInitAccountsAndBalances use
      await ctx.runtime.account.initAccountsAndBalances()

      // init asset banlance when start program
      await ctx.runtime.transaction.execAssetFunc('onInitAccountsAndBalances')

    } catch (err) {
      ctx.logger.error('Failed to load blockchain', System.getErrorMsg(err))
      return process.exit(1)
    }
    // 启动准备（节点）
    await ctx.runtime.peer.prepare()

    // 启动准备（Round）
    await ctx.runtime.round.prepare()

    // 启动准备（受托人）
    await ctx.runtime.delegate.prepare()

    // 启动节点网络服务
    ctx.runtime.httpserver = await HttpServer.newServer(ctx).start()

    // 程序准备完毕
    ctx.runtime.loaded = true
    if (ctx.isDaemonMode) {
      ctx.logger.info('DDN server started as daemon ...')
    } else {
      ctx.logger.info('DDN Start Successfully!')
    }

    // 启动各种服务
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

    ctx.runtime.loaded = true

    // 启动监控
    if (process.env.NODE_ENV === 'development') {
      this._monitorRuntimeState() // 添加监控
    }
  }

  async _bindReady() {
    // 通知资产系统已就绪事件
    await this.ctx.runtime.transaction.execAssetFunc('onBind')
  }

  async _blockchainReady() {
    // 通知资产系统区块链已就绪
    await this.ctx.runtime.transaction.execAssetFunc('onBlockchainReady')
    // 块加载完成
    this.ctx.runtime.stateMachine.transitionTo('Ready')

    // 节点就绪生命周期函數
    await this._appReady()
  }

  // lifeCycle function
  async _configWillLoad(options) {
    if ((options.lifeCycle || {}).configWillLoad) await this.ctx.configWillLoad()
  }

  async _configLoaded() {
    if (this.ctx.configLoaded) await this.ctx.configLoaded()
  }

  async _assetsLoaded() {
    if (this.ctx.assetsLoaded) await this.ctx.assetsLoaded()
  }

  async _dvmReady() {
    if (this.ctx.dvmReady) await this.ctx.dvmReady()
  }

  async _appReady() {
    if (this.ctx.appReady) await this.ctx.appReady()
  }

  // lifeCycle function end
  async _beforeClose() {
    if (this.ctx.beforeClose) await this.ctx.beforeClose()
  }

  /**
   * 签名同步任务（轮询）
   */
  async startSignaturesSyncTask() {
    try {
      await this.ctx.runtime.peer.syncSignatures()
    } catch (err) {
      this.ctx.logger.warn('The signatures sync task error: ' + err)
    }

    setTimeout(() => {
      this.startSignaturesSyncTask()
    }, 1000 * 14)
  }

  /**
   * 同步未确认交易（轮询）
   */
  async startUnconfirmedTransactionSyncTask() {
    try {
      if (this.ctx.runtime.stateMachine.isSyncing()) {
        return
      }

      await this.ctx.runtime.peer.syncUnconfirmedTransactions()
    } catch (err) {
      this.ctx.logger.warn('The unconfirmed transaction sync task error: ' + err)
    }

    setTimeout(() => {
      this.startUnconfirmedTransactionSyncTask()
    }, 1000 * 14)
  }

  /**
   * 同步节点区块数据（轮询）
   */
  async startBlockDataSyncTask() {
    this.ctx.logger.debug('startBlockDataSyncTask enter...')

    // 定义下一次同步的调度函数
    const next = (delay = 10) => {
      setTimeout(() => {
        this.startBlockDataSyncTask()
      }, 1000 * delay) // 默认10秒，可以根据情况调整延迟
    }

    // 获取对等节点
    const peer = await this.ctx.runtime.peer.getPeer()
    if (!peer) {
      this.ctx.logger.debug("No available peers, change state to 'ready'")
      if (!this.ctx.runtime.stateMachine.isReady()) {
        await this._blockchainReady()
      }
      next()
      return
    }

    try {
      // 如果已经在同步中，避免重复同步
      if (this.ctx.runtime.stateMachine.isSyncing()) {
        this.ctx.logger.debug('Already syncing, skip this round')
        next()
        return
      }

      const lastBlock = this.ctx.runtime.block.getLastBlock()
      const lastSlot = this.ctx.runtime.slot.getSlotNumber(lastBlock.timestamp)
      const nextSlot = this.ctx.runtime.slot.getNextSlot()
      const slotDiff = nextSlot - lastSlot

      this.ctx.logger.debug('startBlockDataSyncTask state: ', {
        state: this.ctx.runtime.stateMachine.current,
        loaded: this.ctx.runtime.loaded,
        lastSlot,
        nextSlot,
        slotDiff
      })

      // 只有当时间槽差异足够大时才进行同步
      if (slotDiff < 3) {
        this.ctx.logger.debug(`Slot difference (${slotDiff}) too small, skip sync`)
        next()
        return
      }

      // 转换状态为同步中
      this.ctx.runtime.stateMachine.transitionTo('Syncing')

      // 执行区块同步
      this.ctx.logger.info(`Starting block sync with peer ${peer.host}:${peer.port}`)
      const success = await this.ctx.runtime.peer.syncBlocks()

      if (success) {
        this.ctx.logger.info('Block synchronization completed successfully')
        await this._blockchainReady()
        next(5) // 成功后可以稍微减少同步频率
      } else {
        this.ctx.logger.warn('Block synchronization failed, changing state to pending')
        this.ctx.runtime.stateMachine.transitionToPending()
        next(15) // 失败后增加延迟，避免频繁重试
      }
    } catch (err) {
      this.ctx.logger.error(`Block sync task error: ${err.message || err}`)
      this.ctx.runtime.stateMachine.transitionToPending()
      next(20) // 错误后增加更长的延迟
    }
  }

  // 添加状态监控
  async _monitorRuntimeState() {
    setInterval(() => {
      this.ctx.logger.debug('Runtime State Report', {
        state: this.ctx.runtime.stateMachine.current,
        loaded: this.ctx.runtime.loaded,
        lastBlock: this.ctx.runtime.block.getLastBlock().height
      })
    }, 60 * 1000) // 每分钟记录状态
  }

  /**
   * 尝试铸造区块（轮询）
   */
  async startForgeBlockTask() {
    await this.forgeManager.startForgeBlockTask();
  }

  // 销毁程序
  destroy() {
    this._resetProcessState()
  }
}

export default Program



