
/**
 * Block Sync
 * 负责处理区块的同步操作
 */
import ip from 'ip'
import { bignum } from '@ddn/utils'
import { System } from '../../../utils/system'

let _singleton

// 静态变量跟踪同步状态

export class BlockSync {
  // 静态属性，跟踪同步状态
  static _syncInProgress = false;
  static singleton(context) {
    if (!_singleton) {
      _singleton = new BlockSync(context)
    }
    return _singleton
  }

  constructor(context) {
    Object.assign(this, context)
    this._context = context

    // 恢复模式相关属性
    this._recoveryMode = false
    this._recoveryAttempts = 0
    this._maxRecoveryAttempts = 5
    this._syncFailCount = 0
    this._activeSyncInProgress = false
  }

  async _getIdSequence(height) {
    const rows = await this.dao.findList('block', {
      where: {
        height: {
          $lte: height
        }
      },
      limit: 5,
      offset: 0,
      attributes: ['id', 'height'],
      order: [['height', 'DESC']]
    })
    if (!rows || !rows.length) {
      throw new Error(`Can't get sequence before: ${height}`)
    }

    let firstHeight = ''
    let ids = ''
    for (let i = 0; i < rows.length; i++) {
      firstHeight = rows[i].height
      if (ids.length > 0) {
        ids += ','
      }
      ids += rows[i].id
    }

    return {
      firstHeight,
      ids
    }
  }

  async _addLackBlocks(peer, lastBlock) {
    const peerStr = peer ? `${ip.fromLong(peer.host)}:${peer.port}` : 'unknown'
    this.logger.info(`Looking for common block with ${peerStr}`)

    let lastLackBlock = null
    let currProcessHeight = lastBlock.height
    while (!lastLackBlock && bignum.isGreaterThan(currProcessHeight, 1)) {
      const data = await this._getIdSequence(currProcessHeight)

      const maxHeight = currProcessHeight // 119
      currProcessHeight = data.firstHeight // 114

      const result = await this.runtime.peer.p2p.get(
        '/block/common',
        {
          ids: data.ids,
          max: +maxHeight,
          min: currProcessHeight
        },
        peer
      )
      if (result && result.body && result.body.common) {
        const row = await this.dao.findOne('block', {
          where: {
            id: result.body.common.id,
            height: result.body.common.height
          },
          attributes: ['previous_block']
        })
        this.logger.debug(
          `result.body.common.previous_block is ${result.body.common.previous_block}`
        )
        this.logger.debug(`row.previous_block is ${row.previous_block}`)
        if (!row) {
          this.logger.error("Can't compare blocks")
          // FIXME: 2020.8.29 这里使用 reject 的流程是不一样的
          // resolve()
          throw new Error("Can't compare blocks")
        } else if (result.body.common.previous_block === row.previous_block) {
          // 确定那个正常的块
          lastLackBlock = result.body.common
        }
      }
    }

    if (!lastLackBlock) {
      this.logger.error('Failed to get common block')
      return
    }

    this.logger.info(
      `Found common block ${lastLackBlock.id} (at ${lastLackBlock.height}) with peer ${peerStr}, last block height is ${lastBlock.height}`
    )
    const toRemove = bignum.new(lastBlock.height).minus(lastLackBlock.height)
    this.logger.debug(`Got lastBlock.height = ${lastBlock.height}, lastLackBlock.height = ${lastLackBlock.height}`)

    if (bignum.isGreaterThanOrEqualTo(toRemove, 5)) {
      this.logger.error('long fork, ban 60 min', peerStr)
      return
    }

    const unconfirmedTrs = await this.runtime.transaction.getUnconfirmedTransactionList(true)
    this.logger.info('Undo unconfirmed transactions', unconfirmedTrs)

    try {
      await this.runtime.transaction.undoUnconfirmedList()
    } catch (err) {
      this.logger.error('Failed to undo uncomfirmed transactions', err)
      return process.exit(0)
    }

    // rollback blocks TODO 这是要回滚分叉的区块
    if (lastLackBlock.id !== lastBlock.id) {
      try {
        const currentRound = await this.runtime.round.getRound(lastBlock.height)
        const backRound = await this.runtime.round.getRound(lastLackBlock.height)
        let backHeight = lastLackBlock.height

        this.logger.debug('rollback blocks querySimpleBlockData, backRound', backRound)
        if (
          currentRound !== backRound ||
          bignum.isEqualTo(bignum.modulo(lastBlock.height, this.constants.delegates), 0)
        ) {
          if (bignum.isEqualTo(backRound, 1)) {
            backHeight = '1'
          } else {
            backHeight = bignum.minus(backHeight, bignum.modulo(backHeight, this.constants.delegates)).toString()
          }
          this.logger.debug('rollback blocks querySimpleBlockData, backHeight: ', backHeight)

          const result = await this.runtime.block.querySimpleBlockData({ height: backHeight })
          if (result && result.block) {
            // fixme: 2020.8.29 添加序列化数据
            const block = await this.runtime.block._parseObjectFromFullBlocksData([result.block])
            lastLackBlock = block.pop()
          }
        }

        this.logger.info(`start to roll back blocks before ${lastLackBlock.height}`)
        await this.runtime.round.directionSwap('backward', lastBlock)

        // wxm TODO  有些资产里处理了这个逻辑，如DAPP
        await this.runtime.block.deleteBlocksBefore(lastLackBlock)
        await this.runtime.round.directionSwap('forward', lastBlock)
      } catch (err) {
        this.logger.error(`Failed to rollback blocks before ${lastLackBlock.height}`, System.getErrorMsg(err))
        process.exit(1)
      }
    }
    // rollback blocks end

    this.logger.debug(`Loading blocks from peer ${peerStr}`)

    try {
      // TODO 最新缺失区块与最新区块 id 一致，这里仍然检索 200条，并循环处理 2020.8.8
      lastLackBlock = await this._cloneBlocksFromPeer(peer, lastLackBlock.id)
    } catch (err) {
      this.logger.error(`Failed to load Lack blocks: ${peerStr}`, err)
    }

    try {
      await this.runtime.transaction.receiveTransactions(unconfirmedTrs)
    } catch (err) {
      this.logger.error('Failed to redo unconfirmed transactions', err)
    }

    return lastLackBlock
  }

  /**
   * return lastClonedBlock from remote peer or null
   * @param {object} peer peer object
   * @param {string} blockId block id
   */
  async _cloneBlocksFromPeer(peer, blockId) {
    const peerStr = peer ? `${ip.fromLong(peer.host)}:${peer.port}` : 'unknown'

    let lastClonedBlock = null
    let queryBlockId = blockId
    let loaded = false
    let count = 0
    const limit = 200

    while (!loaded && count < 30) {
      count++
      const res = await this.runtime.peer.p2p.get('/block', { lastBlockId: queryBlockId, limit }, peer)
      let blocks = (res && res.body && res.body.blocks) || []

      if (blocks.length === 0) {
        loaded = true
        break
      }

      const validateErrors = await this.ddnSchema.validate(
        {
          type: 'array'
        },
        blocks
      )
      if (validateErrors) {
        throw new Error(`Can't parse blocks: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
      }

      // wxm block databsae
      blocks = await this.runtime.block._parseObjectFromFullBlocksData(blocks)

      for (let j = 0; j < blocks.length; j++) {
        let block = blocks[j]

        // Get last block for validation
        const lastBlock = this.runtime.block.getLastBlock()
        if (!lastBlock) {
          this.logger.error('Failed to get last block')
          return
        }

        // 处理高度为1的区块（创世区块）
        if (bignum.isEqualTo(block.height, '1')) {
          // 程序启动时已经验证过创世区块，这里只需要跳过即可
          this.logger.debug(`Skipping block with height 1, genesis block is already verified during startup`)
          continue
        }

        // 当前块，跳过
        if (block.previous_block === lastBlock.previous_block && bignum.isEqualTo(block.height, lastBlock.height) && block.id === lastBlock.id) {
          this.logger.debug(`The received is the current block, do nothing!`)
          continue
        }

        const heightDiff = bignum.new(block.height).minus(lastBlock.height)
        this.logger.debug(`Got lastBlock.height = ${lastBlock.height}, block.height = ${block.height}`)

        if (bignum.isGreaterThanOrEqualTo(heightDiff, 3)) {
          this.logger.info(`Received discontinuous block height ${block.height}, difference: ${heightDiff}`)
          // 不要递归调用 syncBlockData，而是返回 null 表示需要重新同步
          return null
        }

        // 检查区块高度是否连续
        const expectedHeight = bignum.plus(lastBlock.height, 1).toString()
        if (block.height !== expectedHeight) {
          this.logger.info(`Expected block height ${expectedHeight}, but got ${block.height}`)

          // 如果收到的区块高度小于当前高度，尝试找到共同区块并回滚
          if (bignum.isLessThan(block.height, lastBlock.height)) {
            this.logger.warn(`Received block with lower height (${block.height}) than current (${lastBlock.height}). Attempting to find common block and rollback.`)

            // 使用专门的方法处理回滚逻辑
            const shouldContinue = await this._handlePotentialRollback(block, lastBlock, j);
            if (shouldContinue) {
              continue;
            }

            // 如果_handlePotentialRollback返回false，表示已经处理了回滚并且需要重新处理当前区块
            j--;
            continue;
          }

          return null
        }

        // 已移动到上面并修改

        try {
          block = await this.runtime.block.objectNormalize(block)
        } catch (e) {
          this.logger.error(`Failed to normalize block, block: ${block ? block.id : 'null'} `, peerStr)
          continue
        }

        try {
          await this.runtime.block.processBlock(block, null, false, true, true)
        } catch (err) {
          this.logger.error(`Failed to process block: ${err}`)
          if (err.message === 'DDN is preparing') {
            // DDN 正在准备中，等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000))
            // 重试当前区块
            j--
            continue
          }
          this.logger.error(`Block is not valid, block: ${block ? block.id : 'null'} `, peerStr)
          continue
        }

        queryBlockId = block.id
        lastClonedBlock = block
        this.logger.info(`Block ${block.id} loaded from ${peerStr} at`, block.height)
      }
    }

    return lastClonedBlock
  }

  /**
   * 处理潜在的区块回滚情况
   * @param {Object} block 收到的区块
   * @param {Object} lastBlock 当前最后一个区块
   * @returns {Boolean} 如果应该跳过当前区块处理，返回true；如果已经处理了回滚，返回false
   * @private
   */
  async _handlePotentialRollback(block, lastBlock) {
    // 记录详细的调试信息，帮助诊断问题
    this.logger.debug(`Analyzing potential rollback: received block height=${block.height}, id=${block.id}, current height=${lastBlock.height}, id=${lastBlock.id}`);

    // 计算高度差
    const heightDiff = bignum.minus(lastBlock.height, block.height);
    this.logger.debug(`Height difference: ${heightDiff}`);

    // 条件1: 如果高度差太大（超过50个区块），跳过该区块以避免极端回滚
    const MAX_HEIGHT_DIFF = '50';
    if (bignum.isGreaterThan(heightDiff, MAX_HEIGHT_DIFF)) {
      this.logger.warn(`Height difference (${heightDiff}) exceeds maximum allowed (${MAX_HEIGHT_DIFF}). Skipping this block to avoid extreme rollback.`);
      return true;
    }

    try {
      // 尝试找到共同区块
      this.logger.debug(`Attempting to find common block between current chain and block ${block.id} at height ${block.height}`);
      const commonBlock = await this.runtime.block.getCommonBlock(block);

      // 如果没有找到共同区块，记录详细信息并跳过
      if (!commonBlock) {
        this.logger.warn(`No common block found between current chain and block ${block.id}. This is unusual and may indicate network issues.`);

        // 记录更多诊断信息
        this.logger.debug(`Block details: ${JSON.stringify(block)}`);
        this.logger.debug(`Last block details: ${JSON.stringify(lastBlock)}`);

        // 尝试获取更多区块信息以帮助诊断
        try {
          const blockDetails = await this.runtime.block.getBlockById(block.id);
          this.logger.debug(`Additional block details from DB: ${JSON.stringify(blockDetails || 'Not found in DB')}`);
        } catch (err) {
          this.logger.debug(`Failed to get additional block details: ${err.message}`);
        }

        return true;
      }

      this.logger.info(`Found common block: id=${commonBlock.id}, height=${commonBlock.height}`);

      // 条件2: 如果共同区块高度太低（例如只有创世区块或接近创世区块），考虑跳过该区块而不是回滚
      const MIN_COMMON_HEIGHT = '5';
      const MIN_CURRENT_HEIGHT = '30';
      if (bignum.isLessThanOrEqualTo(commonBlock.height, MIN_COMMON_HEIGHT) &&
          bignum.isGreaterThan(lastBlock.height, MIN_CURRENT_HEIGHT)) {
        this.logger.warn(`Common block at height ${commonBlock.height} is too low compared to current height ${lastBlock.height}. Skipping this block to avoid extreme rollback.`);
        return true;
      }

      // 计算回滚的区块数量
      const rollbackBlocks = bignum.minus(lastBlock.height, commonBlock.height);
      this.logger.debug(`Need to rollback ${rollbackBlocks} blocks to reach common block`);

      // 条件3: 如果需要回滚的区块数量太多，跳过该区块
      const MAX_ROLLBACK_BLOCKS = '30';
      if (bignum.isGreaterThan(rollbackBlocks, MAX_ROLLBACK_BLOCKS)) {
        this.logger.warn(`Need to rollback ${rollbackBlocks} blocks, which exceeds maximum allowed (${MAX_ROLLBACK_BLOCKS}). Skipping this block to avoid extreme rollback.`);
        return true;
      }

      // 执行回滚
      this.logger.info(`Rolling back to common block at height ${commonBlock.height}`);
      await this.runtime.block.rollbackToBlock(commonBlock.height);

      // 清理状态
      this.runtime.consensus.clearState();

      // 返回false表示已经处理了回滚，应该重新处理当前区块
      return false;
    } catch (err) {
      this.logger.error(`Error during rollback analysis: ${err.message}`, err);

      // 记录更多诊断信息
      if (err.stack) {
        this.logger.debug(`Error stack: ${err.stack}`);
      }

      // 出错时跳过当前区块
      return true;
    }
  }

  /**
   * 从随机节点同步区块数据
   */
  async syncBlockData() {
    // 使用静态变量跟踪同步状态，防止多个同步任务冲突
    if (BlockSync._syncInProgress) {
      this.logger.debug('Another sync operation is already in progress, skipping')
      return false
    }

    BlockSync._syncInProgress = true

    try {
      let res = await this.runtime.peer.p2p.get('/height')
      if (!res) {
        this.logger.error('Failed to get height: No response')
        BlockSync._syncInProgress = false
        return false
      }

      if (res && res.body) {
        const validateErrors = await this.ddnSchema.validate(
          {
            type: 'object',
            properties: {
              height: {
                type: 'string'
              }
            },
            required: ['height']
          },
          res.body
        )
        if (validateErrors) {
          this.logger.error(
            `Failed to parse blockchain height: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
          )
          return false
        }

        const lastBlock = this.runtime.block.getLastBlock()
        if (bignum.isLessThan(lastBlock.height, res.body.height)) {
          let syncLastBlock = null

          this.logger.debug(`Got lastBlock height is ${lastBlock.height}, remote height is ${res.body.height}`)
          if (lastBlock.id !== this.genesisblock.id) {
            this.logger.debug('Must get syncLastBlock')
            syncLastBlock = await this._addLackBlocks(res.peer, lastBlock)
          } else {
            syncLastBlock = await this._cloneBlocksFromPeer(res.peer, lastBlock.id)
          }

          // 检查 syncLastBlock 是否为 null
          if (syncLastBlock === null) {
            this.logger.warn('Failed to sync blocks: syncLastBlock is null, attempting recovery...')

            try {
              // 清理缓存和未确认交易
              this.oneoff.clear()
              await this.runtime.transaction.undoUnconfirmedList()

              // 获取当前最新区块
              const lastBlock = this.runtime.block.getLastBlock()

              // 尝试从更早的区块开始同步
              // 确保不会回退到负数高度
              const blockHeight = bignum.new(lastBlock.height)
              const earlierBlockHeight = bignum.isLessThanOrEqualTo(blockHeight, '10') ? '1' : bignum.minus(blockHeight, '10').toString() // 回退10个区块
              const earlierBlock = await this.dao.findOne('block', {
                where: { height: earlierBlockHeight }
              });

              if (earlierBlock) {
                this.logger.info(`Attempting to sync from earlier block at height ${earlierBlockHeight}`)
                syncLastBlock = await this._cloneBlocksFromPeer(res.peer, earlierBlock.id)
              }

              if (syncLastBlock === null) {
                this.logger.error('Recovery attempt failed, still unable to sync blocks')
                return false
              }

              this.logger.info('Recovery successful, blocks synchronized')
            } catch (err) {
              this.logger.error(`Recovery attempt failed: ${err.message || err}`)
              return false
            }
          }

          this.logger.debug(`Got syncLastBlock height: ${syncLastBlock ? syncLastBlock.height : 'undefined'}`)

          if (syncLastBlock) {
            res = await this.runtime.peer.p2p.get('/height')
            if (res && res.body && bignum.new(syncLastBlock.height).eq(res.body.height)) {
              return true
            } else {
              this.logger.debug(`Height mismatch after sync: local=${syncLastBlock.height}, remote=${res.body ? res.body.height : 'unknown'}`)
              return false
            }
          } else {
            this.logger.warn('Failed to sync blocks: syncLastBlock is falsy')
            return false
          }
        } else {
          this.logger.debug(`No need to sync: local height ${lastBlock.height} >= remote height ${res.body.height}`)
          return true
        }
      } else {
        this.logger.error('Failed to get height from remote peer: No body in response')
        BlockSync._syncInProgress = false
        return false
      }
    } catch (error) {
      this.logger.error(`Error in syncBlockData: ${error.message || error}`)
      BlockSync._syncInProgress = false
      return false
    } finally {
      // 确保在所有情况下都重置同步状态标志
      setTimeout(() => {
        BlockSync._syncInProgress = false
      }, 5000) // 延迟5秒重置，防止短时间内重复触发
    }
  }

  /**
   * 同步节点区块数据（轮询）
   * 从program.js移动过来的方法
   */
  async startBlockDataSyncTask() {
    this.logger.debug('startBlockDataSyncTask enter...')

    // 定义下一次同步的调度函数
    const next = (delay = 10) => {
      setTimeout(() => {
        this.startBlockDataSyncTask()
      }, 1000 * delay)
    }

    // 检查是否有实际的同步操作正在进行
    if (this._activeSyncInProgress) {
      this.logger.debug('Active sync operation already in progress, skip this round')
      next()
      return
    }

    // 获取可用节点
    const peer = await this.runtime.peer.getPeer()
    if (!peer) {
      this.logger.warn('No available peers for sync')
      // 如果没有可用节点，尝试转换到Ready状态，这样可以当单节点运行
      if (!this.runtime.stateMachine.isReady()) {
        try {
          // 直接使用状态机转换到Ready状态
          this.runtime.stateMachine.transitionTo('Ready')
          this.logger.info('Transitioned to Ready state for single node operation')
        } catch (err) {
          this.logger.error(`Failed to transition to Ready state: ${err.message}`)
        }
      }
      next(30) // 延长重试间隔
      return
    }

    try {
      // 标记正在进行实际的同步操作
      this._activeSyncInProgress = true

      // 获取当前区块信息
      const lastBlock = this.runtime.block.getLastBlock()
      const currentHeight = lastBlock.height

      // 获取远程节点高度
      let remoteHeight;
      try {
        const res = await this.runtime.peer.p2p.get('/height', {}, peer);
        if (res && res.body && res.body.height) {
          remoteHeight = res.body.height;
        }
      } catch (err) {
        this.logger.warn(`Failed to get remote height: ${err.message}`);
        // 即使获取高度失败，也继续尝试同步
      }

      // 记录同步检查信息
      this.logger.info(`Checking if sync needed with peer ${peer.host}:${peer.port}, local height: ${currentHeight}, remote height: ${remoteHeight || 'unknown'}`);

      // 使用专门的方法检查是否需要同步
      const syncCheck = this._checkNeedSync(lastBlock, remoteHeight);
      const needSync = syncCheck.needSync;

      // 只有在需要同步时才暂停和恢复锻造
      if (needSync) {
        // 暂停锻造过程
        const wasForgeEnabled = this.runtime.delegate.isForgeEnabled();
        if (wasForgeEnabled) {
          this.runtime.delegate.disableForging();
          this.logger.debug('Temporarily disabled forging during sync');
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
            this.runtime.delegate.enableForging();
            this.logger.debug('Re-enabled forging after sync');
          }
        }
      }
    } catch (err) {
      this.logger.error(`Block synchronization error: ${err.message}`);
      this._syncFailCount = (this._syncFailCount || 0) + 1;

      // 处理连续失败
      if (this._syncFailCount >= 3) {
        this.logger.warn(`Block synchronization failed ${this._syncFailCount} times, entering recovery mode`);
        this._recoveryMode = true;
        this._recoveryAttempts = 0;
      }
    } finally {
      // 无论同步成功还是失败，都要清除标记
      this._activeSyncInProgress = false;
      next(this._recoveryMode ? 30 : 10); // 恢复模式下使用更长的间隔
    }
  }

  /**
   * 执行恢复模式同步
   * 从program.js移动过来的方法
   * @param {Object} peer 目标节点
   * @param {Object} lastBlock 当前最新区块
   */
  async _performRecoverySync(peer, lastBlock) {
    this.logger.info(`Syncing in recovery mode (attempt ${this._recoveryAttempts + 1}/${this._maxRecoveryAttempts})`);

    try {
      // 清理缓存和未确认交易
      this.oneoff.clear();
      await this.runtime.transaction.undoUnconfirmedList();

      // 计算回退高度，每次尝试回退更多区块
      const backSteps = Math.min(10 * (this._recoveryAttempts + 1), 100); // 最多回退100个区块
      const targetHeight = Math.max(1, lastBlock.height - backSteps); // 不低于高度1

      // 获取目标区块
      const targetBlock = await this.dao.findOne('block', {
        where: { height: targetHeight.toString() }
      });

      if (!targetBlock) {
        throw new Error(`Could not find block at height ${targetHeight} for recovery`);
      }

      this.logger.info(`Recovery: Starting sync from block at height ${targetHeight}`);

      // 使用目标区块ID开始同步
      const syncLastBlock = await this.runtime.peer.syncBlocksFromPeer(peer, targetBlock.id);

      // 检查同步结果
      if (syncLastBlock) {
        // 同步成功
        const newLastBlock = this.runtime.block.getLastBlock();
        this.logger.info(`Recovery successful: Block height changed from ${lastBlock.height} to ${newLastBlock.height}`);

        // 如果高度增加，退出恢复模式
        if (bignum.isGreaterThan(newLastBlock.height, lastBlock.height)) {
          this._recoveryMode = false;
          this._recoveryAttempts = 0;
          this.logger.info('Exiting recovery mode');

          // 尝试转换到Ready状态
          if (!this.runtime.stateMachine.isReady()) {
            try {
              this.runtime.stateMachine.transitionTo('Ready');
              this.logger.info('Transitioned to Ready state after successful sync');
            } catch (err) {
              this.logger.error(`Failed to transition to Ready state: ${err.message}`);
            }
          }
        } else {
          // 高度没有增加，增加恢复尝试次数
          this._recoveryAttempts++;
          this.logger.warn(`Recovery did not increase block height, attempt ${this._recoveryAttempts}/${this._maxRecoveryAttempts}`);
        }
      } else {
        // 同步失败
        this._recoveryAttempts++;
        this.logger.warn(`Recovery sync failed, attempt ${this._recoveryAttempts}/${this._maxRecoveryAttempts}`);

        // 如果达到最大尝试次数，尝试更激进的恢复策略
        if (this._recoveryAttempts >= this._maxRecoveryAttempts) {
          this.logger.error(`Recovery failed after ${this._maxRecoveryAttempts} attempts, attempting more aggressive recovery`);

          // 尝试清理数据库和状态
          try {
            // 使用已有的方法清理状态
            this.runtime.consensus.clearState();

            // 使用已有的方法回滚到目标高度
            await this.runtime.block.rollbackToBlock(targetHeight);

            this._recoveryAttempts = 0; // 重置尝试次数，给清理后的数据库一次机会
            this.logger.info(`Aggressive recovery completed, will retry recovery`);
          } catch (cleanupErr) {
            this.logger.error(`Aggressive recovery failed: ${cleanupErr.message}`);
            this._recoveryMode = false;
            this._recoveryAttempts = 0;

            // 转换到Ready状态，让系统尝试正常运行
            if (!this.runtime.stateMachine.isReady()) {
              try {
                this.runtime.stateMachine.transitionTo('Ready');
                this.logger.info('Transitioned to Ready state after recovery failure');
              } catch (err) {
                this.logger.error(`Failed to transition to Ready state: ${err.message}`);
              }
            }
          }
        }
      }
    } catch (err) {
      // 处理特定类型的错误
      if (err.message && err.message.includes('Block already exists')) {
        this.logger.warn(`Recovery encountered 'Block already exists' error, attempting targeted cleanup`);

        try {
          // 尝试提取区块ID
          const blockIdMatch = err.message.match(/Block already exists: ([a-f0-9]+)/);
          if (blockIdMatch && blockIdMatch[1]) {
            const blockId = blockIdMatch[1];

            // 使用已有的方法删除特定区块
            await this.runtime.block.simpleDeleteAfterBlock(blockId);

            // 清理状态
            this.runtime.consensus.clearState();

            this.logger.info(`Targeted cleanup of block ${blockId} completed, will retry recovery`);

            // 减少恢复尝试次数，给清理后的数据库一次机会
            this._recoveryAttempts = Math.max(0, this._recoveryAttempts - 1);
            return; // 直接返回，下次循环会重试
          }
        } catch (cleanupErr) {
          this.logger.error(`Targeted block cleanup failed: ${cleanupErr.message}`);
        }
      }

      this.logger.error(`Recovery sync error: ${err.message}`);
      this._recoveryAttempts++;

      // 如果达到最大尝试次数，退出恢复模式
      if (this._recoveryAttempts >= this._maxRecoveryAttempts) {
        this.logger.error(`Recovery failed after ${this._maxRecoveryAttempts} attempts due to errors, exiting recovery mode`);
        this._recoveryMode = false;
        this._recoveryAttempts = 0;

        // 清理状态
        this.runtime.consensus.clearState();

        // 转换到Ready状态，让系统尝试正常运行
        if (!this.runtime.stateMachine.isReady()) {
          try {
            this.runtime.stateMachine.transitionTo('Ready');
            this.logger.info('Transitioned to Ready state after recovery error');
          } catch (err) {
            this.logger.error(`Failed to transition to Ready state: ${err.message}`);
          }
        }
      }
    }
  }

  /**
   * 检查是否需要同步区块
   * 此方法仅判断是否需要同步，不执行实际的同步操作
   * 从program.js移动过来的方法
   * @param {Object} lastBlock 当前最新区块
   * @param {String|Number} remoteHeight 远程节点高度
   * @returns {Object} 包含是否需要同步的标志和原因
   */
  _checkNeedSync(lastBlock, remoteHeight) {
    // 获取当前区块和时间槽信息
    const lastSlot = this.runtime.slot.getSlotNumber(lastBlock.timestamp);
    const nextSlot = this.runtime.slot.getNextSlot();
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
      this.logger.debug(`No need to sync: slot diff=${slotDiff}, height diff=${heightDiff}`);
    } else {
      this.logger.info(`Need to sync because: ${reasons.join(', ')}`);
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
   * 从program.js移动过来的方法
   * @param {Object} peer 目标节点
   * @returns {Boolean} 是否成功执行了同步操作
   */
  async _performNormalSync(peer) {
    // 执行区块同步
    this.logger.info(`Starting normal sync with peer ${peer.host}:${peer.port}`);
    let result;

    try {
      // 使用更可靠的同步方法
      result = await this.runtime.peer.syncBlocks();

      if (result) {
        // 同步成功
        this.logger.info('Block synchronization completed successfully');
        this._syncFailCount = 0; // 重置失败计数

        // 尝试转换到Ready状态
        if (!this.runtime.stateMachine.isReady()) {
          try {
            this.runtime.stateMachine.transitionTo('Ready');
            this.logger.info('Transitioned to Ready state after successful normal sync');
          } catch (err) {
            this.logger.error(`Failed to transition to Ready state: ${err.message}`);
          }
        }

        return true; // 返回true表示成功执行了同步操作
      } else {
        // 同步失败或没有新区块
        this.logger.debug('No new blocks found during sync');
        this._syncFailCount = 0; // 重置失败计数，因为这不是真正的失败
        return false; // 返回false表示没有执行实际的同步操作
      }
    } catch (err) {
      // 处理特定类型的错误
      if (err.message && err.message.includes('Block already exists')) {
        this.logger.warn(`Sync encountered 'Block already exists' error, may need database cleanup`);
        // 可以考虑添加数据库一致性检查
      } else if (err.message && err.message.includes('Buffers length is not right')) {
        this.logger.warn(`Sync encountered network buffer error, will retry with different peer`);
        // 可以考虑标记当前节点为不可靠，下次选择不同节点
      }

      throw err; // 重新抛出错误，让外层处理
    }
  }

  /**
   * 启动区块同步任务（轮询）
   * @param {number} interval 同步间隔，单位为秒，默认为10秒
   */
  async startSyncTask(interval = 10) {
    try {
      await this.syncBlockData()
    } catch (err) {
      this.logger.warn(`The block sync task error: ${err.message || err}`)
    }

    setTimeout(() => {
      this.startSyncTask(interval)
    }, 1000 * interval)
  }
}

export default BlockSync
