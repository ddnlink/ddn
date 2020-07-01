/**
 * PeerService 接口
 * wangxm   2019-01-11
 */
import ip from 'ip'

import DdnUtils from '@ddn/utils'
import DdnCrypto from '@ddn/crypto'

class PeerService {
  constructor (context) {
    Object.assign(this, context)
    this._context = context

    this._invalidTrsCache = new DdnUtils.LimitCache()
  }

  async filter ({
    headers,
    connection,
    body
  }, res, next) {
    const peerIp = headers['x-forwarded-for'] || connection.remoteAddress
    if (!peerIp) {
      return res
        .status(500)
        .send({
          success: false,
          error: 'Wrong header data'
        })
    }

    headers.port = parseInt(headers.port)

    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        os: {
          type: 'string',
          maxLength: 64
        },
        nethash: {
          type: 'string',
          maxLength: 8
        },
        version: {
          type: 'string',
          maxLength: 11
        }
      },
      required: ['nethash', 'version']
    },
    headers
    )
    if (validateErrors) {
      return res
        .status(500)
        .send({
          success: false,
          error: validateErrors[0].message
        })
    }

    if (headers.nethash !== this.config.nethash) {
      return res.status(500).send({
        success: false,
        error: 'Request is made on the wrong network',
        expected: this.config.nethash,
        received: headers.nethash
      })
    }

    if (!headers.version) {
      return next()
    }

    const peer = {
      ip: ip.toLong(peerIp),
      port: headers.port,
      state: 2,
      os: headers.os,
      version: headers.version
    }

    if (body && body.dappId) {
      peer.dappId = body.dappId
    }

    if (peer.port && peer.port > 0 && peer.port <= 65535) {
      if (await this.runtime.peer.isCompatible(peer.version)) {
        if (peer.version) {
          setImmediate(async () => {
            await this.runtime.peer.update(peer)
          })
        }
      } else {
        return res.status(500).send({
          success: false,
          error: 'Version is not comtibleVersion'
        })
      }
    }

    if (peerIp === '127.0.0.1' || peerIp === this.config.publicIp) {
      return next()
    }

    next()
  }

  async getHeight (req) {
    const lastBlock = this.runtime.block.getLastBlock()
    return {
      height: lastBlock && lastBlock.height ? lastBlock.height : 0
    }
  }

  async getAll (req) {
    let peers
    try {
      peers = await this.runtime.peer.queryDappPeers()
    } catch (err) {
      this.logger.error(`${err}`)
    }
    return {
      peers: peers || []
    }
  }

  async postPropose ({
    body
  }) {
    if (typeof body.propose === 'string') {
      body.propose = this.protobuf.decodeBlockPropose(
        Buffer.from(body.propose, 'base64')
      )
    }

    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        height: {
          type: 'string'
        },
        id: {
          type: 'string',
          maxLength: 64
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
      required: [
        'height',
        'id',
        'timestamp',
        'generator_public_key',
        'address',
        'hash',
        'signature'
      ]
    },
    body.propose
    )

    if (validateErrors) {
      return {
        success: false,
        error: `Schema validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    setImmediate(async () => {
      await this.runtime.block.receiveNewPropose(body.propose)
    })

    return {
      success: true
    }
  }

  async postVotes ({
    body
  }) {
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        height: {
          type: 'string'
        },
        id: {
          type: 'string',
          maxLength: 64
        },
        signatures: {
          type: 'array',
          minLength: 1,
          maxLength: 101
        }
      },
      required: ['height', 'id', 'signatures']
    },
    body
    )
    if (validateErrors) {
      return {
        success: false,
        error: 'Schema validation error'
      }
    }

    setImmediate(async () => {
      await this.runtime.block.receiveVotes(body)
    })

    return {
      success: true
    }
  }

  async getSignatures (req) {
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

  async postSignatures ({
    body
  }) {
    const validateErrors = await this.ddnSchema.validate({
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
      return {
        success: false,
        error: 'Process signature error'
      }
    }
  }

  async getTransactions (req) {
    const unconfirmedTransactions = await this.runtime.transaction.getUnconfirmedTransactionList()
    return {
      transactions: unconfirmedTransactions
    }
  }

  // todo: 这个借口太宽泛了
  async postTransactions ({
    headers,
    connection,
    body
  }) {
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

    const peerIp = headers['x-forwarded-for'] || connection.remoteAddress
    const peerStr = peerIp
      ? `${peerIp}:${
            isNaN(headers.port) ? 'unknown' : headers.port
            }`
      : 'unknown'
    if (typeof body.transaction === 'string') {
      body.transaction = this.protobuf.decodeTransaction(
        Buffer.from(body.transaction, 'base64')
      )
    }

    let transaction
    try {
      transaction = await this.runtime.transaction.objectNormalize(
        body.transaction
      )

      transaction.asset = transaction.asset || {}
    } catch (e) {
      this.logger.error('transaction parse error', {
        raw: JSON.stringify(body),
        trs: transaction,
        error: e.message
      })

      if (peerIp && headers.port > 0 && headers['port' < 65536]) {
        await this.runtime.peer.changeState(
          ip.toLong(peerIp),
          headers.port,
          0,
          3600
        )
        this.logger.log(
                    `Received transaction ${
                    transaction ? transaction.id : 'null'
                    } is not valid, ban 60 min`,
                    peerStr
        )
      }

      return {
        success: false,
        error: DdnUtils.system.getErrorMsg(e.message) // "Invalid transaction body"
      }
    }

    if (!transaction.id) {
      transaction.id = await DdnCrypto.getId(transaction)
    }

    // 对缓存的非法交易直接返回
    if (this._invalidTrsCache.has(transaction.id)) {
      return {
        success: false,
        error: `The transaction ${transaction.id} is invalid, don't commit it again.`
      }
    }

    return new Promise((resolve, reject) => {
      this.balancesSequence.add(
        async cb => {
          if (
            await this.runtime.transaction.hasUnconfirmedTransaction(
              transaction
            )
          ) {
            return cb(
                            `The transaction ${transaction.id} is in process already..`
            ) // 这里是正常交易，仅是未确认,
          }

          this.logger.log(
                        `Received transaction ${transaction.id} from peer ${peerStr}`
          )

          try {
            const transactions = await this.runtime.transaction.receiveTransactions(
              [transaction]
            )
            cb(null, transactions)
          } catch (exp) {
            cb(exp)
          }
        },

        (err, transactions) => {
          let result = {
            success: true
          }

          if (err) {
            // 这里的错误就是上面 catch 的 exp，所以统一在这里处理就好
            this.logger.debug(
                            `Receive invalid transaction, transaction is ${
                            JSON.stringify(transaction)
                            }, ${DdnUtils.system.getErrorMsg(err)}`
            )

            this.logger.error(
                            `Receive invalid transaction, transaction type: ${JSON.stringify(transaction.type)}, ${DdnUtils.system.getErrorMsg(err)}`
            )

            // 缓存非法交易
            this._invalidTrsCache.set(transaction.id, true)

            result = {
              success: false,
              error: err.message ? err.message : err
            }
          } else if (transactions && transactions.length > 0) {
            result.transactionId = transactions[0].id
          }

          resolve(result)
        }
      )
    })
  }
}

export default PeerService
