import DdnCrypto from '@ddn/crypto'
import DdnUtils from '@ddn/utils'

/**
 * RootRouter接口
 * wangxm   2019-03-22
 */
class RootRouter {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async get (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        address: {
          type: 'string',
          minLength: 1
        },
        limit: {
          type: 'integer',
          minimum: 0,
          maximum: 101
        },
        offset: {
          type: 'integer',
          minimum: 0
        },
        orderBy: {
          type: 'string'
        }
      }
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const result = await this.runtime.delegate.getDelegates(query)

    function compareNumber (a, b) {
      const sorta = parseFloat(a[result.orderBy])
      const sortb = parseFloat(b[result.orderBy])
      if (result.sortMode === 'asc') {
        return sorta - sortb
      } else {
        return sortb - sorta
      }
    }

    function compareString (a, b) {
      const sorta = a[result.orderBy]
      const sortb = b[result.orderBy]
      if (result.sortMode === 'asc') {
        return sorta.localeCompare(sortb)
      } else {
        return sortb.localeCompare(sorta)
      }
    }

    if (result.delegates.length > 0 && typeof result.delegates[0][result.orderBy] === 'undefined') {
      result.orderBy = 'rate'
    }

    if (['approval', 'productivity', 'rate', 'vote', 'missedblocks', 'producedblocks', 'fees', 'rewards', 'balance'].includes(result.orderBy)) {
      result.delegates = result.delegates.sort(compareNumber)
    } else {
      result.delegates = result.delegates.sort(compareString)
    }

    const delegates = result.delegates.slice(result.offset, result.limit)

    if (!query.address) {
      return { success: true, delegates, totalCount: result.count }
    }

    const voter = await this.runtime.account.getAccountByAddress(query.address)
    if (voter && voter.delegates) {
      delegates.map(item => {
        item.voted = (voter.delegates.includes(item.publicKey))
      })
    }

    return { success: true, delegates, totalCount: result.count }
  }

  async getGet (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        transactionId: {
          type: 'string'
        },
        publicKey: {
          type: 'string'
        },
        username: {
          type: 'string'
        }
      }
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const result = await this.runtime.delegate.getDelegates(query)
    const delegate = result.delegates.find(({ publicKey, username }) => {
      if (query.publicKey) {
        return publicKey === query.publicKey
      }
      if (query.username) {
        return username === query.username
      }
      return false
    })

    if (delegate) {
      return { success: true, delegate }
    } else {
      throw new Error('Delegate not found')
    }
  }

  async getCount (req) {
    return new Promise((resolve, reject) => {
      this.dao.count('delegate', null, (err, count) => {
        if (err) {
          reject(err)
        } else {
          resolve({ success: true, count })
        }
      })
    })
  }

  async getVoters (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          format: 'publicKey'
        }
      },
      required: ['publicKey']
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    return new Promise((resolve, reject) => {
      this.dao.findList('mem_accounts2delegate', { dependent_id: query.publicKey },
        [[this.dao.db_fnGroupConcat('account_id'), 'account_id']], null, null,
        async (err, rows) => {
          if (err) {
            reject(err)
          } else {
            let addresses = []
            if (rows[0] && rows[0].account_id) {
              addresses = rows[0].account_id.split(',') // wxm block database
            }
            try {
              rows = await this.runtime.account.getAccountList({
                address: {
                  $in: addresses
                },
                sort: [['balance', 'ASC']]
              }, ['address', 'balance', 'publicKey', 'username'])
            } catch (e) {
              return reject(e)
            }

            const lastBlock = this.runtime.block.getLastBlock()
            const totalSupply = this.runtime.block.getBlockStatus().calcSupply(lastBlock.height)
            rows.forEach(row => {
              row.weight = DdnUtils.bignum.divide(row.balance, DdnUtils.bignum.multiply(totalSupply, 100))
            })

            resolve({ success: true, accounts: rows })
          }
        })
    })
  }

  async getFee () {
    const fee = DdnUtils.bignum.multiply(100, this.constants.fixedPoint)
    return { fee }
  }

  /**
     * Register delegate
    */
  async put (req) {
    const body = req.body

    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        secret: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        publicKey: {
          type: 'string',
          format: 'publicKey'
        },
        secondSecret: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        username: {
          type: 'string'
        }
      },
      required: ['secret', 'username']
    }, body)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    if (body.publicKey) {
      if (keypair.publicKey !== body.publicKey) {
        throw new Error('Invalid passphrase')
      }
    }

    return new Promise((resolve, reject) => {
      this.balancesSequence.add(async (cb) => {
        if (body.multisigAccountPublicKey &&
                    body.multisigAccountPublicKey !== keypair.publicKey) {
          var account
          try {
            account = await this.runtime.account.getAccountByPublicKey(body.multisigAccountPublicKey)
          } catch (err) {
            return cb(err)
          }

          if (!account) {
            return cb('Multisignature account not found')
          }

          if (!account.multisignatures || !account.multisignatures) {
            return cb('Account does not have multisignatures enabled')
          }

          if (!account.multisignatures.includes(keypair.publicKey)) {
            return cb('Account does not belong to multisignature group')
          }

          let requester
          try {
            requester = await this.runtime.account.getAccountByPublicKey(keypair.publicKey)
          } catch (err) {
            return cb(err)
          }

          if (!requester || !requester.publicKey) { // wxm block database
            return cb('Invalid requester')
          }

          if (requester.second_signature && !body.secondSecret) {
            return cb('Invalid second passphrase')
          }

          if (requester.publicKey === account.publicKey) { // wxm block database
            return cb('Incorrect requester')
          }

          let second_keypair = null
          if (requester.second_signature) {
            second_keypair = DdnCrypto.getKeys(body.secondSecret)
          }

          try {
            const transaction = await this.runtime.transaction.create({
              type: DdnUtils.assetTypes.DELEGATE,
              username: body.username,
              sender: account,
              keypair,
              second_keypair,
              requester: keypair
            })
            const transactions = await this.runtime.transaction.receiveTransactions([transaction])
            cb(null, transactions)
          } catch (e) {
            cb(e)
          }
        } else {
          let account
          try {
            account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey)
          } catch (err) {
            return cb(err)
          }

          if (!account) {
            return cb('Account not found')
          }

          if (account.second_signature && !body.secondSecret) {
            return cb('Invalid second passphrase')
          }

          let second_keypair = null
          if (account.second_signature) {
            second_keypair = DdnCrypto.getKeys(body.secondSecret)
          }

          try {
            const transaction = await this.runtime.transaction.create({
              type: DdnUtils.assetTypes.DELEGATE,
              username: body.username,
              sender: account,
              keypair,
              second_keypair
            })
            const transactions = await this.runtime.transaction.receiveTransactions([transaction])
            cb(null, transactions)
          } catch (e) {
            cb(e)
          }
        }
      }, (err, transactions) => {
        if (err) {
          reject(err)
        } else {
          resolve({ success: true, transaction: transactions[0] })
        }
      })
    })
  }
}

export default RootRouter
