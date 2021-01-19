import * as DdnCrypto from '@ddn/crypto'
import { assetTypes, bignum } from '@ddn/utils'
/**
 * DelegatesRouter 接口
 * wangxm   2019-03-22
 */
class DelegatesRouter {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  /**
   * 获取全部受托人
   * 默认检索的是 vote 排行前 this.constants.delegates 数量的受托人，无论
   *
   * for example:
   *
   * 1. ?address=... 将与该账户投票的delegates对比，获得列表中 delegate 的 voted 状态是 true 或 false
   *
   * http://localhost:8001/api/delegates?address=H8NqZeDoejQbDXR5Z225Y94T9QFtKZbGNv
   *
   * add field: { voted: true, ...}
   *
   * 2. orderBy = fieldname: sortMode
   *
   * http://localhost:8001/api/delegates?orderBy=vote:desc
   *
   * number fields: 'approval', 'productivity', 'rate', 'vote', 'missedblocks', 'producedblocks', 'fees', 'rewards', 'balance'
   * string fields: 'username'
   *
   * 3. offset=1， limit=30
   *
   * http://localhost:8001/api/delegates?address=HByps9Q7SwijgHs2AhGtVoLBk2wcy9Dk8j&offset=1&limit=30
   *
   * @param {*} req 参数对象，{ offset, limit, address, orderBy }
   */
  async get (req) {
    const query = Object.assign({}, req.body, req.query)

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            minLength: 1
          },
          limit: {
            type: 'integer',
            minimum: 0,
            maximum: this.constants.delegates
          },
          offset: {
            type: 'integer',
            minimum: 0
          },
          orderBy: {
            type: 'string'
          }
        }
      },
      query
    )
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

    if (
      [
        'approval',
        'productivity',
        'rate',
        'vote',
        'missedblocks',
        'producedblocks',
        'fees',
        'rewards',
        'balance'
      ].includes(result.orderBy)
    ) {
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
        item.voted = voter.delegates.includes(item.publicKey)
      })
    }

    return { success: true, delegates, totalCount: result.count }
  }

  async getGet (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate(
      {
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
      },
      query
    )
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
    const count = await this.dao.count('delegate')
    return { success: true, count }
  }

  async getVoters (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          publicKey: {
            type: 'string',
            format: 'publicKey'
          }
        },
        required: ['publicKey']
      },
      query
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    let rows = await this.dao.findList('mem_accounts2delegate', { dependent_id: query.publicKey }, [
      [this.dao.db_fnGroupConcat('account_id'), 'account_id']
    ])
    let addresses = []
    if (rows[0] && rows[0].account_id) {
      addresses = rows[0].account_id.split(',') // wxm block database
    }
    rows = await this.runtime.account.getAccountList(
      {
        address: {
          $in: addresses
        },
        sort: [['balance', 'ASC']]
      },
      ['address', 'balance', 'publicKey', 'username']
    )
    const lastBlock = this.runtime.block.getLastBlock()
    const totalSupply = this.runtime.block.getBlockStatus().calcSupply(lastBlock.height)
    rows.forEach(row => {
      // row.weight = bignum.divide(row.balance, totalSupply)
      row.weight = bignum.divide(row.balance, bignum.multiply(totalSupply, 100))
    })

    return { success: true, accounts: rows }
  }

  async getFee () {
    const fee = bignum.multiply(this.constants.net.fees.delegate, this.constants.fixedPoint).toString()
    return { success: true, fee }
  }

  /**
   * Register delegate
   */
  async put (req) {
    const body = req.body

    const validateErrors = await this.ddnSchema.validate(
      {
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
      },
      body
    )
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
      this.balancesSequence.add(
        async cb => {
          if (body.multisigAccountPublicKey && body.multisigAccountPublicKey !== keypair.publicKey) {
            let account
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

            if (!requester || !requester.publicKey) {
              // wxm block database
              return cb('Invalid requester')
            }

            if (requester.second_signature && !body.secondSecret) {
              return cb('Invalid second passphrase')
            }

            if (requester.publicKey === account.publicKey) {
              // wxm block database
              return cb('Incorrect requester')
            }

            let second_keypair = null
            if (requester.second_signature) {
              second_keypair = DdnCrypto.getKeys(body.secondSecret)
            }

            try {
              const transaction = await this.runtime.transaction.create({
                type: assetTypes.DELEGATE,
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
                type: assetTypes.DELEGATE,
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
        },
        (err, transactions) => {
          if (err) {
            reject(err)
          } else {
            resolve({ success: true, transaction: transactions[0] })
          }
        }
      )
    })
  }
}

export default DelegatesRouter
