import { LimitCache, checkAndReport } from '@ddn/utils'
import * as DdnCrypto from '@ddn/crypto'

/**
 * Routes
 * wangxm   2019-01-14
 */
class Router {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
    this._invalidTrsCache = new LimitCache()

    this.routes = {
      'POST /tx': this.newTx.bind(this),
      'POST /block': this.newBlock.bind(this),
      'POST /propose': this.newPropose.bind(this),
      'POST /vote': this.newVote.bind(this),
      'POST /signature': this.newSignature.bind(this),
      'GET /tx': this.getTx.bind(this),
      'GET /block': this.getBlock.bind(this),
      'GET /block/common': this.getCommonBlock.bind(this),
      'GET /signature': this.getSignature.bind(this),
      'GET /height': this.getBlockHeight.bind(this)
    }
  }

  async newTx ({ body, peer }) {
    const lastBlock = await this.runtime.block.getLastBlock()
    const lastSlot = this.runtime.slot.getSlotNumber(lastBlock.timestamp)

    if (this.runtime.slot.getNextSlot() - lastSlot >= 12) {
      this.logger.error('Blockchain is not ready', {
        getNextSlot: this.runtime.slot.getNextSlot(),
        lastSlot,
        lastBlockHeight: lastBlock.height
      })
      return {
        success: false,
        error: 'Blockchain is not ready'
      }
    }

    if (typeof body.transaction === 'string') {
      body.transaction = this.protobuf.decodeTransaction(Buffer.from(body.transaction, 'base64'))
    }

    let transaction
    try {
      transaction = await this.runtime.transaction.objectNormalize(body.transaction)
      transaction.asset = transaction.asset || {}
    } catch (e) {
      this.logger.error('transaction parse error', {
        raw: JSON.stringify(body),
        trs: transaction,
        error: e.message
      })

      return {
        success: false,
        error: e.message
      }
    }
    if (global.assets && global.assets.transTypeNames[90] && this.constants.net.superviseIp === this.config.publicIp) {
      const res = await checkAndReport(transaction, this, null, this.constants.net.superviseBaseUrl)
      if (!res.success) {
        return res
      }
    }
    if (!transaction.id) {
      transaction.id = await DdnCrypto.getId(transaction)
    }

    // 对缓存的非法交易直接返回
    if (this._invalidTrsCache.has(transaction.id)) {
      this.logger.debug(`The transaction ${transaction.id} is invalid, don't commit it again.`)
      return {
        success: false,
        error: `The transaction ${transaction.id} is invalid, don't commit it again.`
      }
    }

    let result = {
      success: true
    }

    try {
      if (await this.runtime.transaction.hasUnconfirmedTransaction(transaction)) {
        throw new Error(`The transaction ${transaction.id} is in process already..`)
      }

      this.logger.log(`Received transaction ${transaction.id} from peer ${peer.host}:${peer.port}`)
      const transactions = await this.runtime.transaction.receiveTransactions([transaction])
      if (transactions && transactions.length > 0) {
        result.transactionId = transactions[0].id
      }
    } catch (err) {
      this._invalidTrsCache.set(transaction.id, true)
      this.logger.warn(`Receive invalid transaction, transaction is ${JSON.stringify(transaction)}, ${err.message}`)
      result = {
        success: false,
        error: err.message ? err.message : err
      }
    }

    return result
  }

  async newBlock ({ body, peer }) {
    if (typeof body.block === 'string') {
      body.block = this.protobuf.decodeBlock(Buffer.from(body.block, 'base64'))
    }
    if (typeof body.votes === 'string') {
      body.votes = this.protobuf.decodeBlockVotes(Buffer.from(body.votes, 'base64'))
    }
    let block
    let votes
    try {
      block = await this.runtime.block.objectNormalize(body.block)
      votes = await this.runtime.consensus.normalizeVotes(body.votes)
    } catch (e) {
      this.logger.error(`normalize block or votes object error: ${e.toString()}`)
      return { success: false, error: e }
    }

    setImmediate(async () => {
      try {
        await this.runtime.block.receiveNewBlock(block, votes)
      } catch (err) {
        this.logger.error(`Process received new block failed: ${err}`)
      }
    })

    return { success: true }
  }

  async newPropose ({ body, peer }) {
    if (typeof body.propose === 'string') {
      body.propose = this.protobuf.decodeBlockPropose(Buffer.from(body.propose, 'base64'))
    }

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          height: {
            type: 'string'
          },
          id: {
            type: 'string',
            maxLength: 128
          },
          timestamp: {
            type: 'integer'
          },
          generator_public_key: {
            type: 'string',
            format: 'publicKey'
          },
          address: {
            type: 'string'
          },
          hash: {
            type: 'string',
            format: 'hex'
          },
          signature: {
            type: 'string',
            format: 'signature'
          }
        },
        required: ['height', 'id', 'timestamp', 'generator_public_key', 'address', 'hash', 'signature']
      },
      body.propose
    )

    if (validateErrors) {
      this.logger.error(`Invalid parameters: : ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
      return {
        success: false,
        error: `Invalid parameters: : ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    setImmediate(async () => {
      await this.runtime.block.receiveNewPropose(body.propose)
    })
    return {
      success: true
    }
  }

  async newVote ({ body, peer }) {
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          height: {
            type: 'string'
          },
          id: {
            type: 'string',
            maxLength: 128
          },
          signatures: {
            type: 'array',
            minLength: 1,
            maxLength: this.constants.delegates // 101
          }
        },
        required: ['height', 'id', 'signatures']
      },
      body
    )

    // Todo: 2020.9.3 请求本接口的方法应该对 success 做个判断，或者改成 throw
    if (validateErrors) {
      this.logger.error(`Invalid parameters: : ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
      return {
        success: false,
        error: `Invalid parameters: : ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    setImmediate(async () => {
      await this.runtime.block.receiveVotes(body)
    })

    return {
      success: true
    }
  }

  async newSignature ({ body, peer }) {
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          signature: {
            type: 'object',
            properties: {
              transaction: {
                type: 'string'
              },
              signature: {
                type: 'string',
                format: 'signature'
              }
            },
            required: ['transaction', 'signature']
          }
        },
        required: ['signature']
      },
      body
    )
    if (validateErrors) {
      this.logger.error(`Invalid parameters: : ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
      return {
        success: false,
        error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    try {
      await this.runtime.multisignature.processSignature(body.signature)
      return {
        success: true
      }
    } catch (err) {
      this.logger.error('Process signature error', err)
      return {
        success: false,
        error: 'Process signature error'
      }
    }
  }

  async getTx ({ body, params, peer }) {
    const unconfirmedTransactions = await this.runtime.transaction.getUnconfirmedTransactionList()
    return {
      success: true,
      transactions: unconfirmedTransactions
    }
  }

  async getBlock ({ body, params, peer }) {
    let limit = 200
    const page = body.limit
    const blockId = body.id
    const lastBlockId = body.lastBlockId
    if (page) {
      limit = Math.min(limit, Number(page))
    }
    try {
      const row = await this.dao.findOne('block', { where: { id: lastBlockId }, attributes: ['height'] })

      const where = {}
      if (blockId) {
        where.id = blockId
      }
      if (lastBlockId) {
        where.height = {
          $gt: row ? row.height : '0' // fixme 2020.8.13 height >= 1
        }
      }

      const data = await this.runtime.dataquery.queryFullBlockData(where, limit, 0, [['height', 'asc']])
      return { success: true, blocks: data }
    } catch (err) {
      this.logger.error(`Invalid parameters: ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  async getCommonBlock ({ body, params, peer }) {
    const max = body.max
    const min = body.min
    let ids = body.ids

    if (!max || !min || !ids) {
      return {
        success: false,
        error: `Invalid parameters: ${max} ${min} ${ids}`
      }
    }
    ids = ids.split(',')
    const escapedIds = ids.map(id => `'${id}'`)

    if (!escapedIds.length) {
      return { success: false, error: 'Invalid block id sequence' }
    }

    try {
      const rows = await this.dao.findList('block', {
        where: {
          id: { $in: ids },
          height: { $gte: min, $lte: max }
        },
        attributes: ['id', 'timestamp', 'previous_block', 'height'],
        order: [['height', 'DESC']]
      })
      const commonBlock = rows.length ? rows[0] : null
      return { success: true, common: commonBlock }
    } catch (err) {
      return { success: false, error: 'Database error' }
    }
  }

  async getSignature ({ body, params, peer }) {
    const signatures = []
    const unconfirmedList = await this.runtime.transaction.getUnconfirmedTransactionList()
    unconfirmedList.forEach(trs => {
      if (trs.signatures && trs.signatures.length) {
        signatures.push({
          transaction: trs.id,
          signatures: trs.signatures
        })
      }
    })

    return {
      success: true,
      signatures
    }
  }

  async getBlockHeight ({ body, peer }) {
    const lastBlock = this.runtime.block.getLastBlock()
    return {
      success: true,
      height: lastBlock && lastBlock.height ? lastBlock.height : '0'
    }
  }
}

export default Router
