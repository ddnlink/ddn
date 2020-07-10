import DdnCrypto from '@ddn/crypto'
import DdnUtils from '@ddn/utils'

const { assetTypes, bignum } = DdnUtils

/**
 * RootRouter接口
 * wangxm   2019-03-22
 */
class RootRouter {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  /**
   * 获取用户所投的节点信息
   * @param {*} req address or publicKey
   */
  async get (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        address: {
          type: 'string',
          minLength: 1
        },

        publicKey: {
          type: 'string',
          minLength: 1
        }
      }
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    let account
    if (query.address) {
      account = await this.runtime.account.getAccountByAddress(query.address)
    } else if (query.publicKey) {
      account = await this.runtime.account.getAccountByPublicKey(query.publicKey)
    } else {
      throw new Error('Invalid parameters: address or publicKey is required.')
    }

    if (!account) {
      throw new Error('Account not found')
    }

    if (account.delegates) {
      const delegates = await this.runtime.account.getAccountList({
        is_delegate: 1, // wxm block database
        sort: [['vote', 'DESC'], ['publicKey', 'ASC']] // wxm block database
      }, ['username', 'address', 'publicKey', 'vote', 'missedblocks', 'producedblocks'])

      const lastBlock = this.runtime.block.getLastBlock()
      const totalSupply = this.runtime.block.getBlockStatus().calcSupply(lastBlock.height)

      for (let i = 0; i < delegates.length; i++) {
        delegates[i].rate = i + 1
        // console.log('delegates[i].vote, totalSupply', delegates[i].vote, totalSupply)

        delegates[i].approval = ((delegates[i].vote / totalSupply) * 100).toFixed(2)

        let percent = 100 - (delegates[i].missedblocks / ((delegates[i].producedblocks + delegates[i].missedblocks) / 100))
        percent = percent || 0
        const outsider = i + 1 > this.config.settings.delegateNumber // wxm   slots.delegates;
        delegates[i].productivity = (!outsider) ? parseFloat(Math.floor(percent * 100) / 100).toFixed(2) : 0
      }

      const result = delegates.filter(({ publicKey }) => account.delegates.includes(publicKey))
      return { success: true, delegates: result }
    } else {
      return { success: true, delegates: [] }
    }
  }

  async getFee (req) {
    return {
      success: true,
      fee: bignum.multiply(1, this.constants.fixedPoint)
    }
  }

  /**
   * 投票
   * @param {object} req form 对象，{ secret: 投票者密钥, publicKey: 投票者公钥 }
   */
  async put (req) {
    const body = req.body

    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        secret: {
          type: 'string',
          minLength: 1
        },
        publicKey: {
          type: 'string',
          format: 'publicKey'
        },
        secondSecret: {
          type: 'string',
          minLength: 1
        }
      }
    }, body)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    // 密钥和公钥都是投票者的
    if (body.publicKey) {
      if (keypair.publicKey !== body.publicKey) {
        throw new Error('Invalid passphrase')
      }
    }

    return new Promise((resolve, reject) => {
      this.balancesSequence.add(async (cb) => {
        if (body.multisigAccountPublicKey &&
                    body.multisigAccountPublicKey !== keypair.publicKey) {
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
            return cb('Invalid requester')
          }

          if (requester.second_signature && !body.secondSecret) {
            return cb('Invalid second passphrase')
          }

          if (requester.publicKey === account.publicKey) {
            return cb('Invalid requester')
          }

          let second_keypair = null
          if (requester.second_signature) {
            second_keypair = DdnCrypto.getKeys(body.secondSecret)
          }

          try {
            const transaction = await this.runtime.transaction.create({
              type: assetTypes.VOTE,
              votes: body.delegates,
              sender: account,
              keypair,
              second_keypair,
              requester: keypair
            })
            const transactions = await this.runtime.transaction.receiveTransactions([transaction])
            cb(null, transactions)
          } catch (err) {
            cb(err)
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
              type: assetTypes.VOTE,
              votes: body.delegates,
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
