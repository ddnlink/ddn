
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
import { Energy } from '../asset/contract'

import { System, Logger, StateMachine } from '../utils'

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

    // 设置全局运行时对象，用于在其他模块（比如：database.js 等静态模块中无法访问this.ctx的地方）中访问
    global.DDN = {
      runtime: this.ctx.runtime,
      logger: this.ctx.logger
    }

    // 初始化活跃事务跟踪
    this.ctx.runtime.activeTransactions = new Set()
    this.ctx.runtime.isShuttingDown = false

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
      logDir: path.join(this.ctx.baseDir, '/logs'),
      logLevel: options.configObject.logLevel,
      isDev: process.env.NODE_ENV !== 'production',
      // 添加日志级别配置
      logLevelConfig: {
        defaultLogLevel: options.configObject.logLevel === 'debug' ? 2 : 3, // debug:2, info:3
        Compiler: 2, // 确保编译器日志级别为debug
        ContractSandbox: 2
      },
      // 启用合约日志
      enableContractLogger: true,
      // 添加日志文件名
      logFileName: 'contract',
      // 传递主程序的logger
      logger: this.ctx.logger
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

      // 标记系统正在关闭，防止新的操作开始
      this.ctx.runtime.isShuttingDown = true

      try {
        // 等待活跃事务完成
        if (this.ctx.runtime.activeTransactions && this.ctx.runtime.activeTransactions.size > 0) {
          this.ctx.logger.info(`Waiting for ${this.ctx.runtime.activeTransactions.size} active transactions to complete...`)

          // 最多等待10秒
          const maxWaitTime = 10000
          const startTime = Date.now()

          while (this.ctx.runtime.activeTransactions.size > 0 && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }

          if (this.ctx.runtime.activeTransactions.size > 0) {
            this.ctx.logger.warn(`Forced shutdown with ${this.ctx.runtime.activeTransactions.size} active transactions`)
          }
        }

        // 清理共识状态
        if (this.ctx.runtime.consensus) {
          await this.ctx.runtime.consensus.cleanup()
        }

        // 执行自定义清理
        await this._beforeClose()

        // 关闭数据库连接和其他资源
        await this.ctx.close()
      } catch (err) {
        this.ctx.logger.error(`Error during cleanup: ${err.message}`, err)
      } finally {
        // 释放文件锁
        this._resetProcessState()

        // 正常退出，使用代码0而不是1
        process.exit(0)
      }
    })

    process.once('SIGTERM', () => {
      this.ctx.logger.info('Received SIGTERM signal')
      process.emit('cleanup')
    })

    process.once('exit', () => {
      this.ctx.logger.info('Process exited')
    })

    process.once('SIGINT', () => {
      this.ctx.logger.info('Received SIGINT signal')
      process.emit('cleanup')
    })

    process.on('unhandledRejection', (reason, p) => {
      this.ctx.logger.error('Unhandled Promise Rejection', {
        promise: p.toString(),
        reason: reason instanceof Error ? reason.stack : reason
      })

      // 不立即退出，记录错误但允许程序继续运行
      // 严重错误会通过uncaughtException处理
    })

    process.on('uncaughtException', err => {
      this.ctx.logger.fatal('Uncaught Exception', {
        message: err.message,
        stack: err.stack,
        code: err.code
      })

      // 只有在严重错误时才退出
      const fatalErrors = ['EADDRINUSE', 'EACCES', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT']
      if (err.code && fatalErrors.includes(err.code)) {
        this.ctx.logger.fatal('Fatal error detected, initiating shutdown')
        process.emit('cleanup')
      } else {
        this.ctx.logger.warn('Non-fatal error, continuing execution')
      }
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
    await ctx.runtime.dvm.connect()
    // dvm 就绪回調函數
    this._dvmReady()

    // 初始化创世区块
    await ctx.runtime.block.handleGenesisBlock()

    // 初始化账户以及余额
    try {
      await ctx.runtime.account.initAccountsAndBalances()
      await ctx.runtime.transaction.execAssetFunc('onInitAccountsAndBalances')
    } catch (err) {
      ctx.logger.error('Failed to load blockchain', System.getErrorMsg(err))
      return process.exit(1)
    }

    // 启动节点网络服务
    ctx.runtime.httpserver = await HttpServer.newServer(ctx).start()

    // 启动准备（Round）
    await ctx.runtime.round.prepare()

    // 启动准备（受托人）
    await ctx.runtime.delegate.prepare()

    // 程序准备完毕
    ctx.runtime.loaded = true
    if (ctx.isDaemonMode) {
      ctx.logger.info('DDN server started as daemon ...')
    } else {
      ctx.logger.info('DDN server loaded successfully, preparing network...')
    }

    // 延迟启动节点网络，确保其他服务已经准备就绪
    // const self = this
    // setTimeout(async () => {
    //   // try {

    //   // } catch (err) {
    //   //   self.ctx.logger.error('Failed to start network services', System.getErrorMsg(err))
    //   //   // 即使网络服务启动失败，也不要退出程序，保证单节点可以运行
    //   // }
    // }, 5000); // 延迟10秒启动网络服务

    // 由于 prepare() 方法已经处理了重复调用的情况，这里可以直接调用
    await this.ctx.runtime.peer.prepare()

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

    this.ctx.logger.info('DDN network services started successfully!')

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

    // 网络消息处理已直接修改到 packages/p2p/src/message.js 中
    this.ctx.logger.info('Using enhanced network message handling for large messages');
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
   * 此方法已移动到 BlockSync 类中，这里只是一个代理方法
   */
  async startBlockDataSyncTask() {
    // 使用 BlockSync 类中的方法
    return await this.ctx.runtime.peer.blockSync.startBlockDataSyncTask();
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
    this.ctx.logger.debug(`startForgeBlockTask is starting...`);
    await this.forgeManager.startForgeBlockTask();
  }

  // 销毁程序
  async destroy() {
    this._resetProcessState()
    await this.ctx.runtime.dvm.disconnect()
  }
}

export default Program



