
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
import { bignum } from '@ddn/utils'

import Context from './context'
import Block from './block/block'
import { Transaction, MultiSignature } from './transaction'
import Account from './account/account'
import {
  Slot,
  Round,
  Delegate,
  Consensus,
  DataQuery
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

  constructor(context) {
    // 现有的初始化代码...

    // 添加恢复模式标志
    this._recoveryMode = false;
    this._recoveryAttempts = 0;
    this._maxRecoveryAttempts = 3;
  }

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

    // 初始化同步状态标记
    this._activeSyncInProgress = false
    this._lastStateChangeTime = Date.now()
    this._syncFailCount = 0

    // 将 startBlockDataSyncTask 方法添加到 runtime 对象中，供其他模块使用
    const self = this;
    this.ctx.runtime.startBlockDataSyncTask = function () {
      return self.startBlockDataSyncTask();
    }

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
    // 块加载完成
    this.ctx.runtime.stateMachine.transitionTo('Ready')

    // 通知资产系统区块链已就绪
    await this.ctx.runtime.transaction.execAssetFunc('onBlockchainReady')

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

    // 如果处于恢复模式，使用更保守的同步策略
    if (this._recoveryMode) {
      this.ctx.logger.info(`Syncing in recovery mode (attempt ${this._recoveryAttempts}/${this._maxRecoveryAttempts})`)

      try {
        // 尝试从更早的区块开始同步
        const lastBlock = this.ctx.runtime.block.getLastBlock()
        const earlierHeight = bignum.minus(lastBlock.height, 100).toString() // 回退100个区块

        // 获取早期区块
        const earlierBlock = await this.ctx.dao.findOne('block', {
          where: { height: earlierHeight }
        })

        if (earlierBlock) {
          this.ctx.logger.info(`Recovery: Starting sync from earlier block at height ${earlierHeight}`)

          // 获取可用节点
          const peer = await this.ctx.runtime.peer.getPeer()
          if (!peer) {
            this.ctx.logger.error('No available peers for recovery sync')
            next(30) // 延长重试间隔
            return
          }

          // 使用早期区块ID开始同步
          const syncLastBlock = await this.ctx.runtime.peer.syncBlocksFromPeer(peer, earlierBlock.id)

          // 如果同步成功，重置恢复模式
          if (syncLastBlock) {
            this._recoveryMode = false
            this._recoveryAttempts = 0
            this.ctx.logger.info('Recovery successful, exiting recovery mode')

            // 检查同步后的高度是否增加
            const newLastBlock = this.ctx.runtime.block.getLastBlock()
            if (bignum.isGreaterThan(newLastBlock.height, lastBlock.height)) {
              this.ctx.logger.info(`Block height increased from ${lastBlock.height} to ${newLastBlock.height} during recovery`)

              // 如果状态是Syncing，尝试转换到Ready
              if (this.ctx.runtime.stateMachine.isSyncing()) {
                try {
                  await this._blockchainReady()
                } catch (err) {
                  this.ctx.logger.error(`Failed to transition to Ready state: ${err.message}`)
                }
              }
            }
          } else {
            this.ctx.logger.warn('Recovery sync attempt failed, will retry')
            this._recoveryAttempts++

            // 如果达到最大尝试次数，退出恢复模式
            if (this._recoveryAttempts >= this._maxRecoveryAttempts) {
              this.ctx.logger.error(`Recovery failed after ${this._maxRecoveryAttempts} attempts, exiting recovery mode`)
              this._recoveryMode = false
              this._recoveryAttempts = 0
            }
          }
        } else {
          this.ctx.logger.error(`Could not find block at height ${earlierHeight} for recovery`)
          this._recoveryAttempts++
        }
      } catch (err) {
        this.ctx.logger.error(`Recovery sync failed: ${err.message}`)
        this._recoveryAttempts++

        // 如果达到最大尝试次数，退出恢复模式
        if (this._recoveryAttempts >= this._maxRecoveryAttempts) {
          this.ctx.logger.error(`Recovery failed after ${this._maxRecoveryAttempts} attempts, exiting recovery mode`)
          this._recoveryMode = false
          this._recoveryAttempts = 0
        }
      }

      // 继续下一次同步
      next(30) // 恢复模式下使用更长的间隔
      return
    }

    // 以下是原有的代码...
    // 检查是否长时间处于非Ready状态，如果是则尝试恢复
    if (!this.ctx.runtime.stateMachine.isReady() && !this.ctx.runtime.stateMachine.isSyncing()) {
      const lastStateChangeTime = this._lastStateChangeTime || 0
      const currentTime = Date.now()

      // 如果处于Pending状态超过3分钟，尝试恢复到Syncing状态
      if (this.ctx.runtime.stateMachine.isPending() &&
        (currentTime - lastStateChangeTime > 3 * 60 * 1000)) {
        this.ctx.logger.warn('System has been in Pending state for too long, attempting recovery')
        try {
          // 尝试转换到Syncing状态
          this.ctx.runtime.stateMachine.transitionTo('Syncing')
          this._lastStateChangeTime = currentTime
          this._syncFailCount = 0 // 重置失败计数
        } catch (err) {
          this.ctx.logger.error(`Failed to transition from Pending to Syncing: ${err.message}`)
        }
      }
    }

    // 获取对等节点
    const peer = await this.ctx.runtime.peer.getPeer()
    if (!peer) {
      // 如果没有可用节点，检查当前区块高度
      const lastBlock = this.ctx.runtime.block.getLastBlock()
      const currentHeight = lastBlock.height

      // 如果区块高度足够高，可以考虑设置为 ready 状态
      if (currentHeight > 100) {
        this.ctx.logger.debug(`No available peers, but block height (${currentHeight}) is sufficient, changing state to 'ready'`)
        if (!this.ctx.runtime.stateMachine.isReady()) {
          await this._blockchainReady()
          this._lastStateChangeTime = Date.now() // 记录状态变更时间
        }
      } else {
        // 如果区块高度低，保持 pending 状态并继续尝试连接
        this.ctx.logger.warn(`No available peers and block height (${currentHeight}) is low, staying in current state and retrying`)

        // 尝试重新连接种子节点
        try {
          await this.ctx.runtime.peer.prepare()
        } catch (err) {
          this.ctx.logger.error(`Failed to reconnect to seed nodes: ${err.message}`)
        }
      }

      // 无论如何，都要继续循环
      next(5) // 缩短重试间隔为5秒
      return
    }

    try {
      // 检查是否有实际的同步操作正在进行
      // 使用 _activeSyncInProgress 标志而不仅仅依赖状态机状态
      if (this._activeSyncInProgress === true) {
        this.ctx.logger.debug('Active sync operation already in progress, skip this round')
        next()
        return
      }

      // 即使状态是 Syncing，如果没有实际的同步操作，也应该启动同步
      if (this.ctx.runtime.stateMachine.isSyncing()) {
        this.ctx.logger.debug('State is Syncing but no active sync operation, proceeding with sync')
      }

      // 获取当前区块和时间槽信息
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
      try {
        this.ctx.runtime.stateMachine.transitionTo('Syncing')
      } catch (err) {
        // 如果状态转换失败，但已经在Syncing状态，可以继续
        if (this.ctx.runtime.stateMachine.isSyncing()) {
          this.ctx.logger.debug('Already in Syncing state, continuing with sync operation')
        } else {
          this.ctx.logger.error(`Failed to transition to Syncing state: ${err.message}`)
          next(5)
          return
        }
      }

      this._lastStateChangeTime = Date.now() // 记录状态变更时间

      // 标记正在进行实际的同步操作
      this._activeSyncInProgress = true

      // 执行区块同步
      this.ctx.logger.info(`Starting block sync with peer ${peer.host}:${peer.port}`)
      let result;
      try {
        result = await this.ctx.runtime.peer.syncBlocks()
      } catch (err) {
        this.ctx.logger.error(`Sync blocks error: ${err.message}`)
        result = false
      } finally {
        // 无论同步成功还是失败，都要清除标记
        this._activeSyncInProgress = false
      }

      if (result) {
        this.ctx.logger.info('Block synchronization completed successfully')
        await this._blockchainReady()
        this._lastStateChangeTime = Date.now() // 记录状态变更时间
        this._syncFailCount = 0 // 重置失败计数
        next(15) // 成功后也要继续循环同步，但间隔可以长一些
      } else {
        // 同步失败计数器
        this._syncFailCount = (this._syncFailCount || 0) + 1

        // 如果连续失败超过三次，才考虑转换状态
        if (this._syncFailCount >= 3) {
          // 如果当前高度小于一定值（例如200），保持在Syncing状态而不是转为Pending
          const currentHeight = this.ctx.runtime.block.getLastBlock().height
          if (bignum.isLessThan(currentHeight, 200)) {
            this.ctx.logger.warn(`Block synchronization failed ${this._syncFailCount} times, but keeping Syncing state due to low height (${currentHeight})`)
            this._syncFailCount = 1 // 减少计数而不是重置，保持一定的失败记忆
            next(10) // 稍微延长重试间隔
          } else {
            // 如果高度较高，尝试更激进的恢复策略
            this.ctx.logger.warn(`Block synchronization failed ${this._syncFailCount} times, attempting recovery`)

            // 检查是否已经尝试过恢复
            if (this._recoveryMode && this._recoveryAttempts >= this._maxRecoveryAttempts) {
              this.ctx.logger.error(`Recovery attempts exhausted (${this._recoveryAttempts}/${this._maxRecoveryAttempts}), changing state to pending`)
              this.ctx.runtime.stateMachine.transitionToPending()
              this._lastStateChangeTime = Date.now()
              this._recoveryMode = false
              this._recoveryAttempts = 0
              next(60) // 更长的延迟
              return
            }

            // 尝试清理缓存和未确认交易
            try {
              this.oneoff.clear()
              await this.ctx.runtime.transaction.undoUnconfirmedList()

              // 设置恢复标志，下次同步时使用更保守的策略
              this._recoveryMode = true
              this._recoveryAttempts++

              this.ctx.logger.info(`Entering recovery mode (attempt ${this._recoveryAttempts}/${this._maxRecoveryAttempts})`)

              // 保持在 Syncing 状态，但增加延迟
              next(30)
            } catch (err) {
              this.ctx.logger.error(`Recovery attempt failed: ${err.message}`)
              // 如果恢复失败，才转换到 Pending 状态
              this.ctx.runtime.stateMachine.transitionToPending()
              this._lastStateChangeTime = Date.now()
              next(60) // 更长的延迟
            }
          }
        } else {
          this.ctx.logger.warn(`Block synchronization failed (attempt ${this._syncFailCount}), will retry...`)
          next(5) // 尝试失败后稍微等待再重试
        }
      }
    } catch (err) {
      this._activeSyncInProgress = false
      this._syncFailCount = (this._syncFailCount || 0) + 1
      this.ctx.logger.error(`Block synchronization error: ${err.message}`)

      if (this._syncFailCount >= 3) {
        // 同样检查高度，低高度时保持Syncing状态
        const currentHeight = this.ctx.runtime.block.getLastBlock().height
        if (bignum.isLessThan(currentHeight, 200)) {
          this.ctx.logger.warn(`Block synchronization error ${this._syncFailCount} times, but keeping Syncing state due to low height (${currentHeight})`)
          this._syncFailCount = 1 // 减少计数而不是重置
          next(10) // 稍微延长重试间隔
        } else {
          this.ctx.logger.warn(`Block synchronization failed ${this._syncFailCount} times due to error, changing state to pending`)
          this.ctx.runtime.stateMachine.transitionToPending()
          this._lastStateChangeTime = Date.now() // 记录状态变更时间
          this._syncFailCount = 0 // 重置计数器
          next(20) // 错误后增加更长的延迟
        }
      } else {
        this.ctx.logger.warn(`Block synchronization error (attempt ${this._syncFailCount}), will retry...`)
        next(5) // 尝试失败后稍微等待再重试
      }
    }
  }

  // 添加状态监控和恢复机制
  async _monitorRuntimeState() {
    // 记录上次区块高度和状态变更时间
    let lastHeight = this.ctx.runtime.block.getLastBlock().height;
    let lastStateChangeTime = Date.now();
    let stuckCounter = 0;

    setInterval(() => {
      const currentState = this.ctx.runtime.stateMachine.current;
      const stateName = this.ctx.runtime.stateMachine._getStateName(currentState);
      const currentHeight = this.ctx.runtime.block.getLastBlock().height;
      const currentTime = Date.now();
      const timeSinceLastChange = currentTime - (this._lastStateChangeTime || lastStateChangeTime);

      // 记录运行状态
      this.ctx.logger.debug('Runtime State Report', {
        state: stateName,
        stateCode: currentState,
        loaded: this.ctx.runtime.loaded,
        lastBlock: currentHeight,
        timeSinceLastStateChange: Math.floor(timeSinceLastChange / 1000) + 's'
      });

      // 检测是否长时间处于非Ready状态
      if (!this.ctx.runtime.stateMachine.isReady() && timeSinceLastChange > 10 * 60 * 1000) { // 10分钟
        this.ctx.logger.warn(`System has been in ${stateName} state for ${Math.floor(timeSinceLastChange / 60000)} minutes`);

        // 如果在Pending状态停留超过10分钟，尝试恢复到Syncing状态
        if (this.ctx.runtime.stateMachine.isPending()) {
          this.ctx.logger.warn('Attempting recovery from long-standing Pending state to Syncing state');
          try {
            // 只有当没有正在进行的同步时才尝试恢复
            if (!this._activeSyncInProgress) {
              this.ctx.runtime.stateMachine.transitionTo('Syncing');
              this._lastStateChangeTime = currentTime;
              // 触发同步任务，但不设置 _activeSyncInProgress 标记
              // 因为该标记应该由 startBlockDataSyncTask 方法自己设置
              setImmediate(() => this.ctx.runtime.startBlockDataSyncTask());
            } else {
              this.ctx.logger.debug('Active sync already in progress, skipping recovery attempt');
            }
          } catch (err) {
            this.ctx.logger.error(`Failed to recover from Pending state: ${err.message}`);
          }
        }
      }

      // 检测区块高度是否长时间未变化
      if (currentHeight === lastHeight) {
        stuckCounter++;

        // 如果连续5次检测区块高度未变（约5分钟），尝试恢复
        if (stuckCounter >= 5) {
          this.ctx.logger.warn(`Block height stuck at ${currentHeight} for ${stuckCounter} checks. Current state: ${stateName}`);

          // 如果当前是Ready状态但区块高度未变，尝试切换到Syncing状态
          if (this.ctx.runtime.stateMachine.isReady()) {
            this.ctx.logger.warn('Attempting to transition from Ready to Syncing due to stuck block height');
            try {
              // 只有当没有正在进行的同步时才尝试恢复
              if (!this._activeSyncInProgress) {
                this.ctx.runtime.stateMachine.transitionTo('Syncing');
                this._lastStateChangeTime = currentTime;
                // 触发同步任务
                setImmediate(() => this.ctx.runtime.startBlockDataSyncTask());
                stuckCounter = 0; // 重置计数器
              } else {
                this.ctx.logger.debug('Active sync already in progress, skipping recovery attempt');
              }
            } catch (err) {
              this.ctx.logger.error(`Failed to transition to Syncing state: ${err.message}`);
            }
          }
          // 如果当前是Pending状态且区块高度未变，尝试切换到Syncing状态
          else if (this.ctx.runtime.stateMachine.isPending()) {
            this.ctx.logger.warn('Attempting to transition from Pending to Syncing due to stuck block height');
            try {
              // 只有当没有正在进行的同步时才尝试恢复
              if (!this._activeSyncInProgress) {
                this.ctx.runtime.stateMachine.transitionTo('Syncing');
                this._lastStateChangeTime = currentTime;
                // 触发同步任务
                setImmediate(() => this.ctx.runtime.startBlockDataSyncTask());
                stuckCounter = 0; // 重置计数器
              } else {
                this.ctx.logger.debug('Active sync already in progress, skipping recovery attempt');
              }
            } catch (err) {
              this.ctx.logger.error(`Failed to transition to Syncing state: ${err.message}`);
            }
          }
        }
      } else {
        // 区块高度变化了，重置计数器
        stuckCounter = 0;
        lastHeight = currentHeight;
      }

      // 更新上次状态变更时间
      lastStateChangeTime = this._lastStateChangeTime || lastStateChangeTime;
    }, 60 * 1000); // 每分钟检查一次
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



