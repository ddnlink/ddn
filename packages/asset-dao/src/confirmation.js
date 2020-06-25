import DdnCrypto from '@ddn/crypto'

import Asset from '@ddn/asset-base'
import DdnUtils from '@ddn/utils'
import daoUtil from './daoUtil'

/**
  * 确认交易
  * @receivedAddress 接收地址（媒体号的钱包地址）
  * @senderAddress 投稿者的钱包地址
  * @url 文章的dat地址
  * @state 0-不接受，1-确认接收
  * @contribution_trs_id 投稿的交易id，关联到投稿内容
  * @transactionId 交易id
  *
  * @amout 等于投稿时作者设定的 @price 的数量
  * @fee 0EBT
  */
class Confirmation extends Asset.Base {
  // eslint-disable-next-line class-methods-use-this
  async propsMapping () {
    return [{
      field: 'str2', // 34 < 64
      prop: 'received_address'
    },
    {
      field: 'str3',
      prop: 'sender_address'
    },
    {
      field: 'str6', // 256
      prop: 'url'
    },
    {
      field: 'int1',
      prop: 'state'
    },
    {
      field: 'str4', // 128
      prop: 'contribution_trs_id'
    }
    ]
  }

  async create (data, trs) {
    const trans = trs

    const assetJsonName = await this.getAssetJsonName(trs.type)
    if (data[assetJsonName].state === 0) {
      // 拒绝时没有转账交易
      trans.recipientId = null // wxm block database
      trans.amount = '0'
    } else if (data[assetJsonName].state === 1) {
      trans.recipientId = data[assetJsonName].received_address // wxm block database
      // 此处交易金额=投稿的price
      trans.amount = DdnUtils.bignum.new((data[assetJsonName].price || 0)).toString()
    }
    trans.asset[assetJsonName] = data[assetJsonName]

    return trans
  }

  async calculateFee (trs) {
    const confirmation = await this.getAssetObject(trs)
    let feeBase = '1'
    if (confirmation.state === 0) {
      feeBase = '0' // 拒绝稿件时手续费为0
    }

    const result = DdnUtils.bignum.multiply(feeBase, this.constants.fixedPoint).toString()

    return result
  }

  async verify (trs) {
    const confirmation = await this.getAssetObject(trs)
    if (!trs.asset || !confirmation) {
      throw new Error('Invalid transaction asset "DaoContribution"')
    }

    if (confirmation.state === 0) {
      if (trs.recipientId) {
        throw new Error('Invalid recipient')
      }
    } else if (confirmation.state === 1) {
      if (!trs.recipientId) {
        throw new Error('Invalid recipient')
      }
    } else {
      throw new Error('The value of state only can be: [0,1]')
    }

    if (confirmation.state === 0) {
      if (!DdnUtils.bignum.isZero(trs.amount)) {
        throw new Error('Invalid transaction amount')
      }
    }

    if (!confirmation.received_address ||
            confirmation.received_address.length > 34) {
      throw new Error('received_address is undefined or too long, don`t more than 34 characters.')
    }
    if (!this.address.isAddress(confirmation.received_address)) {
      throw new Error("Invalid confirmation's received_address")
    }

    if (!confirmation.sender_address ||
            confirmation.sender_address.length > 128) {
      throw new Error('senderAddress is undefined or too long, don`t more than 128 characters.')
    }
    if (!this.address.isAddress(confirmation.sender_address)) {
      throw new Error("Invalid confirmation's senderAddress")
    }

    // TODO: 2020.4.8 如果使用dat协议，地址长度自然大于256，确认数据库字段从256 -> 512
    if (!confirmation.url ||
            confirmation.url.length > 512) {
      throw new Error('url is undefined or too long, don`t more than 512 characters.')
    }

    if (!confirmation.contribution_trs_id ||
            confirmation.contribution_trs_id.length > 128) {
      throw new Error('contribution_trs_id is undefined or too long, don`t more than 128 characters.')
    }

    // (1)查询getConfirmation是否存在
    const confirmationRecords = await super.queryAsset({
      contribution_trs_id: confirmation.contribution_trs_id
    }, null, false, 1, 1)

    if (confirmationRecords && confirmationRecords.length >= 1) {
      throw new Error(`The contribution has been confirmed: ${confirmation.contribution_trs_id}`)
    }

    // (2)如果不存在则继续查询
    const contributionInst = await this.getAssetInstanceByName('DaoContribution')

    const contributionRecords = await contributionInst.queryAsset({
      trs_id: confirmation.contribution_trs_id
    }, null, false, 1, 1)
    if (contributionRecords && contributionRecords.length >= 1) {
      const contribution = contributionRecords[0]
      // 确认的请求地址必须和投稿的接收地址一致
      if (confirmation.sender_address !== contribution.received_address) {
        throw new Error("confirmation's sender address must same as contribution's received address")
      }
      // 确认的接收地址必须和投稿的发送地址一致
      if (confirmation.received_address !== contribution.sender_address) {
        throw new Error("confirmation's received address must same as contribution's sender address")
      }
      // 判断交易的价格是否和投稿的价值一致
      if (confirmation.state === 1) {
        if (!DdnUtils.bignum.isEqualTo(trs.amount, contribution.price)) {
          throw new Error(`The transaction's amount must be equal contribution's price: ${contribution.price}`)
        }
      }
    } else {
      throw new Error(`The contribution not found: ${confirmation.contribution_trs_id}`)
    }

    return trs
  }

  async dbSave (trs, dbTrans) {
    const confirmation = await this.getAssetObject(trs)
    confirmation.url = (confirmation.url + '').toLowerCase()
    await super.dbSave(trs, dbTrans)
  }

  async attachApi (router) {
    router.put('/', async (req, res) => {
      try {
        const result = await this.putConfirmation(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.get('/:org_id/all', async (req, res) => {
      try {
        const result = await this.getConfirmationsByOrgId(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
  }

  async getConfirmationsByOrgId (req) {
    const org_id = req.params.org_id
    const org = await daoUtil.getEffectiveOrgByOrgId(this._context, org_id)
    if (!org) {
      throw new Error('Org not found: ' + org_id)
    }

    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        senderPublicKey: {
          type: 'string'
        },
        multisigAccountPublicKey: {
          type: 'string',
          format: 'publicKey'
        },
        url: {
          type: 'string'
        },
        timestamp: {
          type: 'integer'
        },
        pageIndex: {
          type: 'integer',
          minimum: 1
        },
        // FIXME: 2020.4.8 这里出现错误 SQLITE_ERROR: no such column: trs_asset.pagesize"
        pageSize: {
          type: 'integer',
          minimum: 1,
          maximum: 500
        }
      },
      required: []
    }, req.query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const where = {
      trs_type: await this.getTransactionType()
    }

    where.sender_address = org.address
    if (req.query.url) {
      where.url = req.query.url.toLowerCase()
    }
    if (req.query.timestamp) {
      where.timestamp = {
        $gt: req.query.timestamp
      }
    }

    const pageIndex = req.query.pageindex || 1
    const pageSize = req.query.pagesize || 50

    return await new Promise((resolve, reject) => {
      this.queryAsset(where, [], true, pageIndex, pageSize)
        .then(rows => {
          resolve({ success: true, state: 0, result: rows })
        }).catch(err => {
          this.logger.error('confirmation error', err)
          reject(err)
        })
    })
  }

  async putConfirmation (req) {
    const body = req.body

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
        multisigAccountPublicKey: {
          type: 'string',
          format: 'publicKey'
        },
        contribution_trs_id: {
          type: 'string'
        },
        url: {
          type: 'string',
          minimum: 1,
          maximum: 256
        },
        state: {
          type: 'integer',
          minimum: 0,
          maximum: 1
        }
      },
      required: ['secret', 'contribution_trs_id', 'state']
    }, body)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }
    const keypair = DdnCrypto.getKeys(body.secret)

    // const senderPublicKey = keypair.publicKey

    const contributionInst = await this.getAssetInstanceByName('DaoContribution')
    const contributionRecords = await contributionInst.queryAsset({
      trs_id: body.contribution_trs_id
    }, null, false, 1, 1)

    if (contributionRecords && contributionRecords.length) {
      const contribution = contributionRecords[0]

      const confirmation = {
        received_address: contribution.sender_address || '',
        contribution_trs_id: body.contribution_trs_id,
        url: body.url || contribution.url || '',
        state: body.state,
        price: body.state === 1 ? contribution.price : '0'
      }

      return new Promise((resolve, reject) => {
        this.balancesSequence.add(async (cb) => {
          if (body.multisigAccountPublicKey && body.multisigAccountPublicKey !== keypair.publicKey) {
            let account
            try {
              account = await this.runtime.account.getAccountByPublicKey(body.multisigAccountPublicKey)
            } catch (e) {
              return cb(e)
            }

            if (!account) {
              return cb('Multisignature account not found')
            }

            if (!account.multisignatures) {
              return cb('Account does not have multisignatures enabled')
            }

            if (account.multisignatures.indexOf(keypair.publicKey) < 0) {
              return cb('Account does not belong to multisignature group')
            }

            let requester
            try {
              requester = await this.runtime.account.getAccountByPublicKey(keypair.publicKey)
            } catch (e) {
              return cb(e)
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

            confirmation.sender_address = account.address

            try {
              const data = {
                type: await this.getTransactionType(),
                sender: account,
                keypair,
                requester: keypair,
                second_keypair
              }
              const assetJsonName = await this.getAssetJsonName()
              data[assetJsonName] = confirmation

              const transaction = await this.runtime.transaction.create(data)

              const transactions = await this.runtime.transaction.receiveTransactions([transaction])
              cb(null, transactions)
            } catch (e) {
              cb(e)
            }
          } else {
            let account
            try {
              account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey)
            } catch (e) {
              return cb(e)
            }

            if (!account) {
              return cb('Account not found')
            }

            if (account.second_signature && !body.secondSecret) {
              return cb('Invalid second passphrase')
            }

            let second_keypair = null
            if (account.secondSignature) {
              second_keypair = DdnCrypto.getKeys(body.secondSecret)
            }

            confirmation.sender_address = account.address

            try {
              const data = {
                type: await this.getTransactionType(),
                sender: account,
                keypair,
                second_keypair
              }
              const assetJsonName = await this.getAssetJsonName()
              data[assetJsonName] = confirmation

              const transaction = await this.runtime.transaction.create(data)

              const transactions = await this.runtime.transaction.receiveTransactions([transaction])
              cb(null, transactions)
            } catch (e) {
              cb(e)
            }
          }
        }, (err, transactions) => {
          if (err) {
            return reject(err)
          }

          resolve({
            success: true,
            transactionId: transactions[0].id
          })
        })
      })
    } else {
      throw new Error('The contribution is not find: ' + body.contribution_trs_id)
    }
  }
}

export default Confirmation
