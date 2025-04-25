
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

    // 设置全局运行时对象，用于在其他模块中访问
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
    await ctx.runtime.dvm.run()
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
   */
  async startBlockDataSyncTask() {
    this.ctx.logger.debug('startBlockDataSyncTask enter...')

    // 定义下一次同步的调度函数
    const next = (delay = 10) => {
      setTimeout(() => {
        this.startBlockDataSyncTask()
      }, 1000 * delay)
    }

    // 检查是否有实际的同步操作正在进行
    if (this._activeSyncInProgress) {
      this.ctx.logger.debug('Active sync operation already in progress, skip this round')
      next()
      return
    }

    // 获取可用节点
    const peer = await this.ctx.runtime.peer.getPeer()
    if (!peer) {
      this.ctx.logger.warn('No available peers for sync')
      // 如果没有可用节点，尝试转换到Ready状态，这样可以当单节点运行
      if (!this.ctx.runtime.stateMachine.isReady()) {
        try {
          await this._blockchainReady()
        } catch (err) {
          this.ctx.logger.error(`Failed to transition to Ready state: ${err.message}`)
        }
      }
      next(30) // 延长重试间隔
      return
    }

    try {
      // 标记正在进行实际的同步操作
      this._activeSyncInProgress = true

      // 获取当前区块信息
      const lastBlock = this.ctx.runtime.block.getLastBlock()
      const currentHeight = lastBlock.height

      // 获取远程节点高度
      let remoteHeight;
      try {
        const res = await this.ctx.runtime.peer.p2p.get('/height', {}, peer);
        if (res && res.body && res.body.height) {
          remoteHeight = res.body.height;
        }
      } catch (err) {
        this.ctx.logger.warn(`Failed to get remote height: ${err.message}`);
        // 即使获取高度失败，也继续尝试同步
      }

      // 记录同步检查信息
      this.ctx.logger.info(`Checking if sync needed with peer ${peer.host}:${peer.port}, local height: ${currentHeight}, remote height: ${remoteHeight || 'unknown'}`);

      // 使用专门的方法检查是否需要同步
      const syncCheck = this._checkNeedSync(lastBlock, remoteHeight);
      const needSync = syncCheck.needSync;

      // 只有在需要同步时才暂停和恢复锻造
      if (needSync) {
        // 暂停锻造过程
        const wasForgeEnabled = this.ctx.runtime.delegate.isForgeEnabled();
        if (wasForgeEnabled) {
          this.ctx.runtime.delegate.disableForging();
          this.ctx.logger.debug('Temporarily disabled forging during sync');
        }

        try {
          // 执行实际的同步操作
          if (this._recoveryMode) {
            await this._performRecoverySync(peer, lastBlock);
          } else {
            // 正常模式下执行同步
            await this._performNormalSync(peer);
          }
        } finally {
          // 恢复锻造过程
          if (wasForgeEnabled) {
            this.ctx.runtime.delegate.enableForging();
            this.ctx.logger.debug('Re-enabled forging after sync');
          }
        }
      }
    } catch (err) {
      this.ctx.logger.error(`Block synchronization error: ${err.message}`);
      this._syncFailCount = (this._syncFailCount || 0) + 1;

      // 处理连续失败
      if (this._syncFailCount >= 3) {
        this.ctx.logger.warn(`Block synchronization failed ${this._syncFailCount} times, entering recovery mode`);
        this._recoveryMode = true;
        this._recoveryAttempts = 0;
      }
    } finally {
      // 无论同步成功还是失败，都要清除标记
      this._activeSyncInProgress = false;
      next(this._recoveryMode ? 30 : 10); // 恢复模式下使用更长的间隔
    }
  }

  // 新增方法：执行恢复模式同步
  async _performRecoverySync(peer, lastBlock) {
    this.ctx.logger.info(`Syncing in recovery mode (attempt ${this._recoveryAttempts + 1}/${this._maxRecoveryAttempts})`);

    try {
      // 清理缓存和未确认交易
      this.ctx.oneoff.clear();
      await this.ctx.runtime.transaction.undoUnconfirmedList();

      // 计算回退高度，每次尝试回退更多区块
      const backSteps = Math.min(10 * (this._recoveryAttempts + 1), 100); // 最多回退100个区块
      const targetHeight = Math.max(1, lastBlock.height - backSteps); // 不低于高度1

      // 获取目标区块
      const targetBlock = await this.ctx.dao.findOne('block', {
        where: { height: targetHeight.toString() }
      });

      if (!targetBlock) {
        throw new Error(`Could not find block at height ${targetHeight} for recovery`);
      }

      this.ctx.logger.info(`Recovery: Starting sync from block at height ${targetHeight}`);

      // 使用目标区块ID开始同步
      const syncLastBlock = await this.ctx.runtime.peer.syncBlocksFromPeer(peer, targetBlock.id);

      // 检查同步结果
      if (syncLastBlock) {
        // 同步成功
        const newLastBlock = this.ctx.runtime.block.getLastBlock();
        this.ctx.logger.info(`Recovery successful: Block height changed from ${lastBlock.height} to ${newLastBlock.height}`);

        // 如果高度增加，退出恢复模式
        if (bignum.isGreaterThan(newLastBlock.height, lastBlock.height)) {
          this._recoveryMode = false;
          this._recoveryAttempts = 0;
          this.ctx.logger.info('Exiting recovery mode');

          // 尝试转换到Ready状态
          if (!this.ctx.runtime.stateMachine.isReady()) {
            await this._blockchainReady();
          }
        } else {
          // 高度没有增加，增加恢复尝试次数
          this._recoveryAttempts++;
          this.ctx.logger.warn(`Recovery did not increase block height, attempt ${this._recoveryAttempts}/${this._maxRecoveryAttempts}`);
        }
      } else {
        // 同步失败
        this._recoveryAttempts++;
        this.ctx.logger.warn(`Recovery sync failed, attempt ${this._recoveryAttempts}/${this._maxRecoveryAttempts}`);

        // 如果达到最大尝试次数，尝试更激进的恢复策略
        if (this._recoveryAttempts >= this._maxRecoveryAttempts) {
          this.ctx.logger.error(`Recovery failed after ${this._maxRecoveryAttempts} attempts, attempting more aggressive recovery`);

          // 尝试清理数据库和状态
          try {
            // 使用已有的方法清理状态
            this.ctx.runtime.consensus.clearState();

            // 使用已有的方法回滚到目标高度
            await this.ctx.runtime.block.rollbackToBlock(targetHeight);

            this._recoveryAttempts = 0; // 重置尝试次数，给清理后的数据库一次机会
            this.ctx.logger.info(`Aggressive recovery completed, will retry recovery`);
          } catch (cleanupErr) {
            this.ctx.logger.error(`Aggressive recovery failed: ${cleanupErr.message}`);
            this._recoveryMode = false;
            this._recoveryAttempts = 0;

            // 转换到Ready状态，让系统尝试正常运行
            if (!this.ctx.runtime.stateMachine.isReady()) {
              await this._blockchainReady();
            }
          }
        }
      }
    } catch (err) {
      // 处理特定类型的错误
      if (err.message && err.message.includes('Block already exists')) {
        this.ctx.logger.warn(`Recovery encountered 'Block already exists' error, attempting targeted cleanup`);

        try {
          // 尝试提取区块ID
          const blockIdMatch = err.message.match(/Block already exists: ([a-f0-9]+)/);
          if (blockIdMatch && blockIdMatch[1]) {
            const blockId = blockIdMatch[1];

            // 使用已有的方法删除特定区块
            await this.ctx.runtime.block.simpleDeleteAfterBlock(blockId);

            // 清理状态
            this.ctx.runtime.consensus.clearState();

            this.ctx.logger.info(`Targeted cleanup of block ${blockId} completed, will retry recovery`);

            // 减少恢复尝试次数，给清理后的数据库一次机会
            this._recoveryAttempts = Math.max(0, this._recoveryAttempts - 1);
            return; // 直接返回，下次循环会重试
          }
        } catch (cleanupErr) {
          this.ctx.logger.error(`Targeted block cleanup failed: ${cleanupErr.message}`);
        }
      }

      this.ctx.logger.error(`Recovery sync error: ${err.message}`);
      this._recoveryAttempts++;

      // 如果达到最大尝试次数，退出恢复模式
      if (this._recoveryAttempts >= this._maxRecoveryAttempts) {
        this.ctx.logger.error(`Recovery failed after ${this._maxRecoveryAttempts} attempts due to errors, exiting recovery mode`);
        this._recoveryMode = false;
        this._recoveryAttempts = 0;

        // 清理状态
        this.ctx.runtime.consensus.clearState();

        // 转换到Ready状态，让系统尝试正常运行
        if (!this.ctx.runtime.stateMachine.isReady()) {
          await this._blockchainReady();
        }
      }
    }
  }

  /**
   * 检查是否需要同步区块
   * 此方法仅判断是否需要同步，不执行实际的同步操作
   * @param {Object} lastBlock 当前最新区块
   * @param {String|Number} remoteHeight 远程节点高度
   * @returns {Object} 包含是否需要同步的标志和原因
   */
  _checkNeedSync(lastBlock, remoteHeight) {
    // 获取当前区块和时间槽信息
    const lastSlot = this.ctx.runtime.slot.getSlotNumber(lastBlock.timestamp);
    const nextSlot = this.ctx.runtime.slot.getNextSlot();
    const slotDiff = nextSlot - lastSlot;

    // 计算高度差
    const heightDiff = remoteHeight ? bignum.minus(remoteHeight, lastBlock.height) : 0;

    // 判断是否需要同步的条件
    const reasons = [];

    // 条件1: 时间槽差距过大（可能表示本地节点长时间未更新）
    if (slotDiff >= 3) {
      reasons.push(`slot diff (${slotDiff}) >= 3`);
    }

    // 条件2: 高度差距过大（远程节点比本地节点高出5个以上区块）
    if (bignum.isGreaterThan(heightDiff, 5)) {
      reasons.push(`height diff (${heightDiff}) > 5`);
    }

    // 条件3: 如果处于恢复模式，总是需要同步
    if (this._recoveryMode) {
      reasons.push('in recovery mode');
    }

    const needSync = reasons.length > 0;

    if (!needSync) {
      this.ctx.logger.debug(`No need to sync: slot diff=${slotDiff}, height diff=${heightDiff}`);
    } else {
      this.ctx.logger.info(`Need to sync because: ${reasons.join(', ')}`);
    }

    return {
      needSync,
      reasons,
      slotDiff,
      heightDiff
    };
  }

  /**
   * 执行正常模式同步
   * 此方法执行实际的同步操作，但不负责判断是否需要同步
   * @param {Object} peer 目标节点
   * @returns {Boolean} 是否成功执行了同步操作
   */
  async _performNormalSync(peer) {
    // 执行区块同步
    this.ctx.logger.info(`Starting normal sync with peer ${peer.host}:${peer.port}`);
    let result;

    try {
      // 使用更可靠的同步方法
      result = await this.ctx.runtime.peer.syncBlocks();

      if (result) {
        // 同步成功
        this.ctx.logger.info('Block synchronization completed successfully');
        this._syncFailCount = 0; // 重置失败计数

        // 尝试转换到Ready状态
        if (!this.ctx.runtime.stateMachine.isReady()) {
          await this._blockchainReady();
        }

        return true; // 返回true表示成功执行了同步操作
      } else {
        // 同步失败或没有新区块
        this.ctx.logger.debug('No new blocks found during sync');
        this._syncFailCount = 0; // 重置失败计数，因为这不是真正的失败
        return false; // 返回false表示没有执行实际的同步操作
      }
    } catch (err) {
      // 处理特定类型的错误
      if (err.message && err.message.includes('Block already exists')) {
        this.ctx.logger.warn(`Sync encountered 'Block already exists' error, may need database cleanup`);
        // 可以考虑添加数据库一致性检查
      } else if (err.message && err.message.includes('Buffers length is not right')) {
        this.ctx.logger.warn(`Sync encountered network buffer error, will retry with different peer`);
        // 可以考虑标记当前节点为不可靠，下次选择不同节点
      }

      throw err; // 重新抛出错误，让外层处理
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
    this.ctx.logger.debug(`startForgeBlockTask is starting...`);
    await this.forgeManager.startForgeBlockTask();
  }

  // 销毁程序
  destroy() {
    this._resetProcessState()
  }

  // 清理特定区块
  async _cleanupSpecificBlock(blockId) {
    this.ctx.logger.info(`Attempting to clean up specific block: ${blockId}`);

    // 查找区块
    const block = await this.ctx.dao.findOne('block', {
      where: { id: blockId }
    });

    if (!block) {
      this.ctx.logger.warn(`Block ${blockId} not found in database, nothing to clean up`);
      return;
    }

    // 删除区块相关的交易
    await this.ctx.dao.remove('transaction', {
      where: { block_id: blockId }
    });

    // 删除区块
    await this.ctx.dao.remove('block', {
      where: { id: blockId }
    });

    this.ctx.logger.info(`Successfully cleaned up block ${blockId}`);
  }

  // 清理高于指定高度的所有区块
  async _cleanupDatabase(targetHeight) {
    this.ctx.logger.info(`Attempting to clean up database above height ${targetHeight}`);

    // 查找所有高于目标高度的区块
    const blocks = await this.ctx.dao.findAll('block', {
      where: {
        height: {
          $gt: targetHeight.toString()
        }
      },
      attributes: ['id']
    });

    if (!blocks || blocks.length === 0) {
      this.ctx.logger.warn(`No blocks found above height ${targetHeight}, nothing to clean up`);
      return;
    }

    this.ctx.logger.info(`Found ${blocks.length} blocks to clean up above height ${targetHeight}`);

    // 获取所有区块ID
    const blockIds = blocks.map(block => block.id);

    // 删除这些区块相关的交易
    await this.ctx.dao.remove('transaction', {
      where: {
        block_id: {
          $in: blockIds
        }
      }
    });

    // 删除这些区块
    await this.ctx.dao.remove('block', {
      where: {
        id: {
          $in: blockIds
        }
      }
    });

    this.ctx.logger.info(`Successfully cleaned up ${blocks.length} blocks above height ${targetHeight}`);
  }
}

export default Program



