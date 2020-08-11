/**
 * Peer Sync
 * wangxm   2019-01-15
 */
import ip from 'ip'
import { bignum, system } from '@ddn/utils'

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

  async trySyncBlockData () {
    let remotePeerHeight = await this.runtime.peer.request({ api: '/height' })
    if (remotePeerHeight === false) {
      return false
    }

    const peerStr = remotePeerHeight && remotePeerHeight.peer ? `${ip.fromLong(remotePeerHeight.peer.ip)}:${remotePeerHeight.peer.port}` : 'unknown'

    if (remotePeerHeight && remotePeerHeight.body) {
      this.logger.info(`Check blockchain on ${peerStr}`)

      const validateErrors = await this.ddnSchema.validate({
        type: 'object',
        properties: {
          height: {
            type: 'string'
          }
        },
        required: ['height']
      }, remotePeerHeight.body)
      if (validateErrors) {
        this.logger.log(`Failed to parse blockchain height: ${peerStr} ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
      }

      if (bignum.isLessThan(this.runtime.block.getLastBlock().height, remotePeerHeight.body.height)) {
        let syncLastBlock = null
        const lastBlock = this.runtime.block.getLastBlock()
        if (lastBlock.id !== this.genesisblock.id) {
          syncLastBlock = await this._addLackBlocks(remotePeerHeight.peer)
        } else {
          syncLastBlock = await this._cloneBlocksFromPeer(remotePeerHeight.peer, lastBlock.id)
        }

        if (syncLastBlock) {
          remotePeerHeight = await this.runtime.peer.request({ api: '/height' })
          if (remotePeerHeight && remotePeerHeight.body &&
                        syncLastBlock.height === remotePeerHeight.body.height) {
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
      this.logger.log(`Failed to get height from peer: ${peerStr}`)
      return false
    }
  }

  async _getIdSequence (height) {
    return new Promise((resolve, reject) => {
      this.dao.findPage('block', {
        height: {
          $lte: height
        }
      }, 5, 0, false, ['id', 'height'],
      [['height', 'DESC']], (err, rows) => {
        if (err || !rows || !rows.length) {
          reject(err ? err.toString() : `Can't get sequence before: ${height}`)
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

        resolve({
          firstHeight,
          ids
        })
      })
    })
  }

  async _addLackBlocks (peer) {
    const peerStr = peer ? `${ip.fromLong(peer.ip)}:${peer.port}` : 'unknown'
    this.logger.info(`Looking for common block with ${peerStr}`)

    const lastBlock = this.runtime.block.getLastBlock()

    let lastLackBlock = null
    let currProcessHeight = lastBlock.height
    while (!lastLackBlock && bignum.isGreaterThan(currProcessHeight, 1)) {
      const data = await this._getIdSequence(currProcessHeight)

      const maxHeight = currProcessHeight
      currProcessHeight = data.firstHeight

      const result = await this.runtime.peer.request({ peer, api: `/blocks/common?ids=${data.ids}&max=${maxHeight}&min=${currProcessHeight}` })
      if (result && result.body && result.body.common) {
        lastLackBlock = await new Promise(
          (resolve, reject) => {
            this.dao.findOne('block', {
              id: result.body.common.id,
              height: result.body.common.height
            }, ['previous_block'], (err, row) => {
              if (err || !row) {
                this.logger.error(err || "Can't compare blocks")
                resolve()
              } else if (result.body.common.previous_block === row.previous_block) {
                resolve(result.body.common)
              } else {
                resolve()
              }
            })
          }
        )
      }
    }

    if (!lastLackBlock) {
      this.logger.error('Failed to get common block')
      return
    }

    this.logger.info(`Found common block ${lastLackBlock.id} (at ${lastLackBlock.height}) with peer ${peerStr}, last block height is ${lastBlock.height}`)
    const toRemove = bignum.minus(lastBlock.height, lastLackBlock.height)

    if (bignum.isGreaterThanOrEqualTo(toRemove, 5)) {
      this.logger.error('long fork, ban 60 min', peerStr)
      this.runtime.peer.changeState(peer.ip, peer.port, 0, 3600)
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

    // rollback blocks
    if (lastLackBlock.id !== lastBlock.id) {
      try {
        const currentRound = await this.runtime.round.getRound(lastBlock.height)
        const backRound = await this.runtime.round.getRound(lastLackBlock.height)
        let backHeight = lastLackBlock.height

        this.logger.debug('rollback blocks querySimpleBlockData, backRound', backRound)
        if (currentRound !== backRound || bignum.isEqualTo(bignum.modulo(lastBlock.height, this.constants.delegates), 0)) {
          if (bignum.isEqualTo(backRound, 1)) {
            backHeight = '1'
          } else {
            backHeight = bignum.minus(backHeight, bignum.modulo(backHeight, this.constants.delegates))
          }
          this.logger.debug('rollback blocks querySimpleBlockData, backHeight: ', backHeight.toString())

          const result = await this.runtime.block.querySimpleBlockData({ height: backHeight.toString() })
          if (result && result.block) {
            lastLackBlock = result.block
          }
        }

        this.logger.info(`start to roll back blocks before ${lastLackBlock.height}`)
        await this.runtime.round.directionSwap('backward', lastBlock)

        // wxm TODO  有些资产里处理了这个逻辑，如DAPP
        await this.runtime.block.deleteBlocksBefore(lastLackBlock)
        await this.runtime.round.directionSwap('forward', lastBlock)
      } catch (err) {
        this.logger.error(`Failed to rollback blocks before ${lastLackBlock.height}`, system.getErrorMsg(err))
        process.exit(1)
      }
    }
    // rollback blocks end

    this.logger.debug(`Loading blocks from peer ${peerStr}`)

    try {
      lastLackBlock = await this._cloneBlocksFromPeer(peer, lastLackBlock.id)
    } catch (err) {
      this.logger.error(`Failed to load blocks, ban 60 min: ${peerStr}`, err)
      await this.runtime.peer.changeState(peer.ip, peer.port, 0, 3600)
    }

    try {
      await this.runtime.transaction.receiveTransactions(unconfirmedTrs)
    } catch (err) {
      this.logger.error('Failed to redo unconfirmed transactions', err)
    }

    return lastLackBlock
  }

  async _cloneBlocksFromPeer (peer, blockId) {
    const peerStr = peer ? `${ip.fromLong(peer.ip)}:${peer.port}` : 'unknown'
    if (blockId === this.genesisblock.id) {
      this.logger.debug(`Loading blocks from genesis from ${peerStr}`)
    }

    let lastClonedBlock = null
    let queryBlockId = blockId
    let loaded = false
    let count = 0

    while (!loaded && count < 30) {
      count++
      const data = await this.runtime.peer.request({ peer, api: `/blocks?lastBlockId=${queryBlockId}&limit=200` })

      let blocks = data.body.blocks

      // wxm TODO
      // if (typeof blocks === "string") {
      //     blocks = library.dbLite.parseCSV(blocks);
      // }

      const validateErrors = await this.ddnSchema.validate({
        type: 'array'
      }, blocks)
      if (validateErrors) {
        throw new Error(`Can't parse blocks: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
      }

      // wxm block databsae
      // blocks = blocks.map(row2parsed, parseFields(privated.blocksDataFields));
      blocks = await this.runtime.block._parseObjectFromFullBlocksData(blocks)
      if (blocks.length === 0) {
        loaded = true
        break
      } else {
        this.logger.log(`Loading ${blocks.length} blocks from`, peerStr)
        for (let j = 0; j < blocks.length; j++) {
          let block = blocks[j]

          try {
            block = await this.runtime.block.objectNormalize(block)
          } catch (e) {
            this.logger.error(`Failed to normalize block: ${e}`, block)
            this.logger.error(`Block ${block ? block.id : 'null'} is not valid, ban 60 min`, peerStr)
            this.runtime.peer.changeState(peer.ip, peer.port, 0, 3600)
            return
          }

          try {
            await this.runtime.block.processBlock(block, null, false, true, true)
          } catch (err) {
            this.logger.error(`Failed to process block: ${err}`, block)
            this.logger.error(`Block ${block ? block.id : 'null'} is not valid, ban 60 min`, peerStr)
            this.runtime.peer.changeState(peer.ip, peer.port, 0, 3600)
            return
          }

          queryBlockId = block.id
          lastClonedBlock = block

          this.logger.log(`Block ${block.id} loaded from ${peerStr} at`, block.height)
        }
      }
    }

    return lastClonedBlock
  }

  async trySyncSignatures () {
    let data
    try {
      data = await this.runtime.peer.request({ api: '/signatures' })
    } catch (err) {
      this.logger.error(`Sync Signatures has error: ${err}`)
      return
    }

    if (data === false) {
      return
    }

    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        signatures: {
          type: 'array',
          uniqueItems: true
        }
      },
      required: ['signatures']
    }, data.body)
    if (validateErrors) {
      this.logger.error(`${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
      return
    }

    return new Promise((resolve, reject) => {
      this.sequence.add(async (cb) => {
        for (let i = 0; i < data.body.signatures.length; i++) {
          const signature = data.body.signatures[i]
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
      }, err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async trySyncUnconfirmedTransactions () {
    let data
    try {
      data = await this.runtime.peer.request({ api: '/transactions' })
    } catch (err) {
      this.logger.error(`Sync UnconfirmedTransactions has error: ${err}`)
      return
    }

    if (data === false) {
      return
    }

    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          uniqueItems: true
        }
      },
      required: ['transactions']
    }, data.body)
    if (validateErrors) {
      this.logger.error(validateErrors[0].message)
      return
    }

    const transactions = data.body.transactions
    for (let i = 0; i < transactions.length; i++) {
      try {
        transactions[i] = await this.runtime.transaction.objectNormalize(transactions[i])
      } catch (e) {
        const peerStr = data.peer ? `${ip.fromLong(data.peer.ip)}:${data.peer.port}` : 'unknown'
        this.logger.log(`Transaction ${transactions[i] ? transactions[i].id : 'null'} is not valid, ban 60 min`, peerStr)
        await this.runtime.peer.changeState(data.peer.ip, data.peer.port, 0, 3600)
        return
      }
    }

    const trs = []
    for (let i = 0; i < transactions.length; ++i) {
      if (!await this.runtime.transaction.hasUnconfirmedTransaction(transactions[i])) {
        trs.push(transactions[i])
      }
    }

    return new Promise((resolve, reject) => {
      this.balancesSequence.add(async (cb) => {
        try {
          await this.runtime.transaction.receiveTransactions(trs)
          cb()
        } catch (e) {
          cb(e)
        }
      }, err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}

export default PeerSync
