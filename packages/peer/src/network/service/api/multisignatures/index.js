/**
 * MultisignaturesRouter接口
 * wangxm   2019-03-27
 */
import DdnCrypto from '@ddn/crypto'
import DdnUtils from '@ddn/utils'

class MultisignaturesRouter {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  /**
     * 在现有账户基础上，创建多重签名账号
     * @param {*} req 'min', 'lifetime', 'keysgroup', 'secret' 是必须的
     */
  async put (req) {
    const body = Object.assign({}, req.body, req.query)
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
        min: {
          type: 'integer',
          minimum: 2,
          maximum: 16
        },
        lifetime: {
          type: 'integer',
          minimum: 1,
          maximum: 24
        },
        keysgroup: {
          type: 'array',
          minLength: 1,
          maxLength: 10
        }
      },
      required: ['min', 'lifetime', 'keysgroup', 'secret']
    }, body)
    if (validateErrors) {
      return {
        success: false,
        error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    if (body.publicKey) {
      if (keypair.publicKey !== body.publicKey) {
        throw new Error('Invalid passphrase')
      }
    }

    return new Promise((resolve, reject) => {
      this.balancesSequence.add(async (cb) => {
        const publicKey = keypair.publicKey

        let account

        try {
          account = await this.runtime.account.getAccountByPublicKey(publicKey) //
        } catch (err) {
          return cb(err)
        }

        if (!account) {
          return cb('Account ' + publicKey + ' not found')
        }

        // fixme: getAccountByPublicKey 方法已经处理
        account.publicKey = publicKey

        if (account.second_signature && !body.secondSecret) {
          return cb('Invalid second passphrase')
        }

        let second_keypair = null
        if (account.second_signature) {
          second_keypair = DdnCrypto.getKeys(body.secondSecret)
        }

        try {
          const transaction = await this.runtime.transaction.create({
            type: DdnUtils.assetTypes.MULTISIGNATURE,
            sender: account,
            keypair,
            second_keypair,
            min: body.min,
            keysgroup: body.keysgroup,
            lifetime: body.lifetime
          })

          const transactions = await this.runtime.transaction.receiveTransactions([transaction])
          cb(null, transactions)
        } catch (e) {
          this.logger.error('create multisignatures error', DdnUtils.system.getErrorMsg(e))
          return cb(e)
        }
      }, (err, transactions) => {
        if (err) {
          return reject(err)
        } else {
          setImmediate(async () => {
            try {
              await this.runtime.socketio.emit('multisignatures/change', {})
            } catch (err2) {
              this.logger.error('socket emit error: multisignatures/change', DdnUtils.system.getErrorMsg(err2))
            }
          })

          resolve({
            success: true,
            transactionId: transactions[0].id
          })
        }
      })
    })
  }

  async postSign (req) {
    const body = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        secret: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        secondSecret: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        publicKey: {
          type: 'string',
          format: 'publicKey'
        },
        transactionId: {
          type: 'string'
        }
      },
      required: ['transactionId', 'secret']
    }, body)
    if (validateErrors) {
      return {
        success: false,
        error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    const transaction = await this.runtime.transaction.getUnconfirmedTransaction(body.transactionId)
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    if (body.publicKey) {
      if (keypair.publicKey !== body.publicKey) {
        throw new Error('Invalid passphrase')
      }
    }

    const sign = await this.runtime.transaction.multisign(transaction, keypair)

    if (transaction.type === DdnUtils.assetTypes.MULTISIGNATURE) {
      if ((!transaction.asset.multisignature.keysgroup.includes(`+${keypair.publicKey}`)) ||
                (transaction.signatures && transaction.signatures.includes(sign.toString('hex')))) {
        // 是多重签名交易（asset），但签名者不属于签名组里的人，也不在交易的多个签名里
        throw new Error('1. Permission to sign transaction denied')
      }

      setImmediate(async () => {
        try {
          await this.runtime.socketio.emit('multisignatures/singature/change', {})
        } catch (err) {
          this.logger.error('socket emit error: multisignatures/singature/change')
        }
      })
    } else {
      const account = await this.runtime.account.getAccountByAddress(transaction.senderId)
      if (!account) {
        throw new Error('Account ' + transaction.senderId + ' not found')
      }

      if (!transaction.requester_public_key) { // wxm block database
        if (!account.multisignatures.includes(keypair.publicKey)) {
          // 不是多重签名交易，交易也没有接收方，交易发起者的多重签名里，也不包含该交易发起者的公钥（transaction.senderId ！== keypair.publicKey）
          this.logger.error('multisignatures trs', transaction)
          throw new Error('2. Permission to sign transaction denied')
        }
      } else {
        if (account.publicKey !== keypair.publicKey ||
                    transaction.senderPublicKey !== keypair.publicKey) {
          // 交易有接收方，但交易发起者与当前操作的用户不一致
          throw new Error('3. Permission to sign transaction denied')
        }
      }

      if (transaction.signatures && transaction.signatures.includes(sign)) {
        // 已经签过名
        throw new Error('4. Permission to sign transaction denied')
      }

      setImmediate(async () => {
        try {
          await this.runtime.socketio.emit('multisignatures/singature/change', {})
        } catch (err) {
          this.logger.error('socket emit error: multisignatures/singature/change')
        }
      })
    }

    return new Promise((resolve, reject) => {
      this.balancesSequence.add(async (cb) => {
        const transaction = await this.runtime.transaction.getUnconfirmedTransaction(body.transactionId)
        if (!transaction) {
          return cb('Transaction not found')
        }

        transaction.signatures = transaction.signatures || []
        transaction.signatures.push(sign)

        setImmediate(async () => {
          try {
            await this.runtime.peer.broadcast.broadcastNewSignature({
              signature: sign,
              transaction: transaction.id
            })
          } catch (err) {
            this.logger.error(`Broadcast new signature failed: ${DdnUtils.system.getErrorMsg(err)}`)
          }
        })

        cb()
      }, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            success: true,
            transactionId: transaction.id
          })
        }
      })
    })
  }

  async getPending (req) {
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
      return {
        success: false,
        error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    let transactions = await this.runtime.transaction.getUnconfirmedTransactionList()
    // wxm TODO 此处不应该用DdnUtils.assetTypes.DAPP_OUT，或者单独一个接口道aob包里
    if (query.isOutTransfer) {
      transactions = transactions.filter(({
        type
      }) => type === DdnUtils.assetTypes.DAPP_OUT)
    }

    const pendings = []
    for (let i = 0; i < transactions.length; i++) {
      const item = transactions[i]

      let signed = false
      let verify = false

      if (!verify && item.signatures && item.signatures.length > 0) {
        for (const i in item.signatures) {
          const signature = item.signatures[i]

          try {
            verify = await this.runtime.transaction.verifySignature(item, signature, query.publicKey)
          } catch (e) {
            this.logger.error('/multisignatures/pending verify fail, error is ', DdnUtils.system.getErrorMsg(e))
            verify = false
          }

          if (verify) {
            break
          }
        }

        if (verify) {
          signed = true
        }
      }

      if (!signed && item.senderPublicKey === query.publicKey) { // wxm block database
        signed = true
      }

      try {
        const sender = await this.runtime.account.getAccountByPublicKey(item.senderPublicKey)
        if (!sender) {
          break
        }

        if ((sender.publicKey === query.publicKey && sender.u_multisignatures.length > 0) ||
                    sender.u_multisignatures.includes(query.publicKey) ||
                    sender.multisignatures.includes(query.publicKey)) {
          const min = sender.u_multimin || sender.multimin
          const lifetime = sender.u_multilifetime || sender.multilifetime
          const signatures = sender.u_multisignatures.length

          pendings.push({
            max: signatures.length,
            min,
            lifetime,
            signed,
            transaction: item
          })
        }
      } catch (err) {
        break
      }
    }

    return {
      success: true,
      transactions: pendings
    }
  }

  async getAccounts (req) {
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
      return {
        success: false,
        error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    return new Promise((resolve, reject) => {
      this.dao.findList('mem_accounts2multisignature', {
        dependent_id: query.publicKey // wxm block database
      }, null, null, false, false,
      [
        [this.dao.db_fnGroupConcat('account_id'), 'account_id']
      ], // wxm block database   library.dao.db_fn('group_concat', library.dao.db_col('accountId'))
      null, async (err, rows) => {
        if (err) {
          this.logger.error(DdnUtils.system.getErrorMsg(err))
          return reject(err)
        }

        const addresses = rows[0].account_id.split(',') // wxm block database

        try {
          const rows = await this.runtime.account.getAccountList({
            address: {
              $in: addresses
            },
            sort: [
              ['balance', 'ASC']
            ] // wxm block database
          }, ['address', 'balance', 'multisignatures', 'multilifetime', 'multimin'])

          for (let i = 0; i < rows.length; i++) {
            const account = rows[i]

            const addresses = []
            for (let j = 0; j < account.multisignatures.length; j++) {
              addresses.push(this.runtime.account.generateAddressByPublicKey(account.multisignatures[j]))
            }

            const multisigaccounts = await this.runtime.account.getAccountList({
              address: {
                $in: addresses
              }
            }, ['address', 'publicKey', 'balance'])
            account.multisigaccounts = multisigaccounts
          }

          resolve({
            accounts: rows
          })
        } catch (e) {
          this.logger.error(DdnUtils.system.getErrorMsg(e))
          return reject(e)
        }
      })
    })
  }
}

export default MultisignaturesRouter
