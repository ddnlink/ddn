/**
 * Peer Sync
 * wangxm   2019-01-15
 */
import ip from 'ip'
import { bignum } from '@ddn/utils'
import { System } from '../../utils/system'

let _singleton

class PeerSync {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new PeerSync(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async _getIdSequence (height) {
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

  async _addLackBlocks (peer, lastBlock) {
    const peerStr = peer ? `${ip.fromLong(peer.host)}:${peer.port}` : 'unknown'
    this.logger.info(`Looking for common block with ${peerStr}`)

    // modules.blocks.getCommonBlock
    // 2020.8.13 不要重复调用，前面传过来，
    // const lastBlock = this.runtime.block.getLastBlock()

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
          `peer-sync._addLackBlocks result.body.common.previous_block is ${result.body.common.previous_block}`
        )
        this.logger.debug(`peer-sync._addLackBlocks row.previous_block is ${row.previous_block}`)
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

    // rollback blocks TODO 这是要回滚那么分叉的区块
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
          this.logger.debug('rollback blocks querySimpleBlockData, backHeight: ', backHeight.toString())

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
      this.logger.error(`Failed to load blocks, ban 60 min: ${peerStr}`, err)
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
  async _cloneBlocksFromPeer (peer, blockId) {
    const peerStr = peer ? `${ip.fromLong(peer.host)}:${peer.port}` : 'unknown'

    let lastClonedBlock = null
    let queryBlockId = blockId
    let loaded = false
    let count = 0

    while (!loaded && count < 30) {
      count++
      const res = await this.runtime.peer.p2p.get('/block', { lastBlockId: queryBlockId, limit: 200 }, peer)
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

        try {
          block = await this.runtime.block.objectNormalize(block)
        } catch (e) {
          this.logger.error(`Failed to normalize block, ban 60 min, block: ${block ? block.id : 'null'} `, peerStr)
          return null
        }

        try {
          await this.runtime.block.processBlock(block, null, false, true, true)
        } catch (err) {
          this.logger.error(`Failed to process block: ${err}`)
          if (err.message === 'DDN is preparing') {
            // return setTimeout(() => {
            //   _cloneBlocksFromPeer(peer, blockId)
            // }, 10)
            return
          }
          this.logger.error(`Block is not valid, ban 60 min, block: ${block ? block.id : 'null'} `, peerStr)
          return null
        }

        queryBlockId = block.id
        lastClonedBlock = block
        this.logger.log(`Block ${block.id} loaded from ${peerStr} at`, block.height)
      }
    }

    return lastClonedBlock
  }

  /**
   * 从随机节点同步区块数据
   */
  async trySyncBlockData () {
    let res = await this.runtime.peer.p2p.get('/height')
    if (!res) {
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
        this.logger.log(
          `Failed to parse blockchain height: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
        )
        // 2020.8.28 添加返回结果
        return false
      }

      const lastBlock = this.runtime.block.getLastBlock()
      if (bignum.isLessThan(lastBlock.height, res.body.height)) {
        let syncLastBlock = null

        this.logger.debug(`Got lastBlock height is ${lastBlock.height}`)
        if (lastBlock.id !== this.genesisblock.id) {
          this.logger.debug('Must get syncLastBlock')
          syncLastBlock = await this._addLackBlocks(res.peer, lastBlock)
        } else {
          syncLastBlock = await this._cloneBlocksFromPeer(res.peer, lastBlock.id)
        }
        this.logger.debug(`Got syncLastBlock: ${syncLastBlock}`)
        if (syncLastBlock) {
          res = await this.runtime.peer.p2p.get('/height')
          if (res && res.body && bignum.new(syncLastBlock.height).eq(res.body.height)) {
            return true
          } else {
            return false
          }
        } else {
          return false
        }
      } else {
        return true
      }
    } else {
      this.logger.log('Failed to get height from remote peer')
      return false
    }
  }

  async trySyncSignatures () {
    let res
    try {
      res = await this.runtime.peer.p2p.get('/signature')
    } catch (err) {
      this.logger.error(`Sync Signatures has error: ${err}`)
      return
    }

    if (!res || !res.body || !res.body.success) {
      return
    }

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          signatures: {
            type: 'array',
            uniqueItems: true
          }
        },
        required: ['signatures']
      },
      res.body
    )
    if (validateErrors) {
      this.logger.error(`${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
      return
    }

    return new Promise((resolve, reject) => {
      this.sequence.add(
        async cb => {
          for (let i = 0; i < res.body.signatures.length; i++) {
            const signature = res.body.signatures[i]
            for (let j = 0; j < signature.signatures; j++) {
              const s = signature.signatures[j]
              try {
                await this.runtime.multisignature.processSignature({
                  signature: s,
                  transaction: signature.transaction
                })
              } catch (e) {
                cb(e)
              }
            }
          }

          cb()
        },
        err => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
  }

  /**
   * 从随机节点同步未确认交易
   */
  async trySyncUnconfirmedTransactions () {
    let res
    try {
      res = await this.runtime.peer.p2p.get('/tx')
    } catch (err) {
      this.logger.error(`Sync UnconfirmedTransactions has error: ${err}`)
      return
    }

    if (!res || !res.body) {
      return
    }

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          transactions: {
            type: 'array',
            uniqueItems: true
          }
        },
        required: ['transactions']
      },
      res.body
    )
    if (validateErrors) {
      this.logger.error(validateErrors[0].message)
      return
    }

    const transactions = res.body.transactions
    for (let i = 0; i < transactions.length; i++) {
      try {
        transactions[i] = await this.runtime.transaction.objectNormalize(transactions[i])
      } catch (e) {
        this.logger.log(`Transaction ${transactions[i] ? transactions[i].id : 'null'} is not valid`)
        return
      }
    }

    const trs = []
    for (let i = 0; i < transactions.length; ++i) {
      // fixme 2020.8.13
      // if (!await this.runtime.transaction.hasUnconfirmedTransaction(transactions[i])) {
      if (await this.runtime.transaction.hasUnconfirmedTransaction(transactions[i])) {
        // fixme no promise 2020.8.17 这里应该退出整个函数还是for循环 AA
        // return reject('Transaction already exists.')
        throw new Error('Transaction already exists.')
        // this.logger.error('Transaction already exists.')
        // continue
      }
      trs.push(transactions[i])
    }

    return new Promise((resolve, reject) => {
      this.balancesSequence.add(
        async cb => {
          try {
            await this.runtime.transaction.receiveTransactions(trs)
            cb()
          } catch (e) {
            cb(e)
          }
        },
        err => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
  }
}

export default PeerSync
