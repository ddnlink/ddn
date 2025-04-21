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

            // 如果高度差异过大，可能是完全不同的链或者需要大规模回滚
            const heightDiff = bignum.minus(lastBlock.height, block.height)
            if (bignum.isGreaterThan(heightDiff, '1000')) {
              this.logger.warn(`Height difference too large (${heightDiff}), skipping block`)
              continue
            }

            try {
              // 如果是高度为1的区块（创世区块），特殊处理
              if (bignum.isEqualTo(block.height, '1')) {
                // 程序启动时已经验证过创世区块，这里只需要跳过即可
                this.logger.debug(`Skipping block with height 1, genesis block is already verified during startup`)
                continue;
              }

              // 尝试找到共同区块
              const commonBlock = await this.runtime.block.getCommonBlock(block)
              if (commonBlock) {
                this.logger.info(`Found common block at height ${commonBlock.height}. Rolling back to this height.`)
                await this.runtime.block.rollbackToBlock(commonBlock.height)

                // 重置当前循环，重新处理当前区块
                j--;
                continue;
              } else {
                // 如果没有找到共同区块，但高度差异不大，尝试跳过该区块
                this.logger.warn(`No common block found for block at height ${block.height}, skipping`)
                continue
              }
            } catch (err) {
              // 检查是否是创世区块相关错误
              if (err.message && (err.message.includes('genesis block') || err.message.includes('Genesis block'))) {
                this.logger.debug(`Genesis block related error: ${err.message}, skipping block`)
                // 跳过该区块
                continue;
              }

              this.logger.error(`Failed to handle lower height block: ${err.message}`)
              // 如果处理失败，跳过该区块
              continue
            }
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
