import _ from 'lodash'

import Asset from '@ddn/asset-base'
import DdnUtils from '@ddn/utils'
import DdnCrypto from '@ddn/crypto'

class Transfer extends Asset.Base {
  async propsMapping () {
    return [
      {
        field: 'str1',
        prop: 'currency'
      },
      {
        field: 'str2',
        prop: 'amount'
      }
    ]
  }

  async create (data, trs) {
    trs.recipientId = data.recipientId
    trs.amount = '0'

    const assetJsonName = await this.getAssetJsonName(trs.type)
    // eslint-disable-next-line require-atomic-updates
    trs.asset[assetJsonName] = data[assetJsonName]
    return trs
  }

  async verify (trs, sender) {
    if (!this.address.isAddress(trs.recipientId)) {
      throw new Error('Invalid recipient')
    }
    if (!DdnUtils.bignum.isZero(trs.amount)) {
      throw new Error('Invalid transaction amount')
    }
    const assetData = trs.asset.aobTransfer
    const error = DdnUtils.amount.validate(assetData.amount)
    if (error) {
      throw new Error(error)
    }

    const assetInst = await this.getAssetInstanceByName('AobAsset')
    const data = await assetInst.queryAsset({
      name: assetData.currency
    }, null, null, 1, 1)
    if (data.length <= 0) {
      throw new Error(`Asset ${assetData.currency} not exists`)
    }

    const assetDetail = data[0]
    if (assetDetail.writeoff === '1') {
      throw new Error('Asset already writeoff')
    }

    if (assetDetail.allow_whitelist === '0' &&
            assetDetail.allow_blacklist === '0') {
      return trs
    }

    if (assetDetail.acl === 0) { // 检查黑白名单
      if (await this.isInBlackList(assetData.currency, sender.address) ||
                await this.isInBlackList(assetData.currency, trs.recipientId)) {
        throw new Error('Permission not allowed')
      }
    } else if (assetDetail.acl === 1) { // 检查白名单
      const issuerInst = await this.getAssetInstanceByName('AobIssuer')
      const data2 = await issuerInst.queryAsset({
        name: assetDetail.issuer_name
      }, null, null, 1, 1)
      if (data2.length <= 0) {
        throw new Error('Issuer not exists')
      }
      const issuerInfo = data2[0]

      if (((sender.address !== issuerInfo.issuer_id) &&
                !(await this.isInWhiteList(assetData.currency, sender.address))) ||
                ((trs.recipientId !== issuerInfo.issuer_id) &&
                    !(await this.isInWhiteList(assetData.currency, trs.recipientId)))) {
        throw new Error('Permission not allowed.')
      }
    }

    return trs
  }

  async isInWhiteList (currency, address) {
    return new Promise((resolve, reject) => {
      this.dao.findOne('acl_white', { currency, address },
        null, null, (err, result) => {
          if (err) {
            return reject(err)
          }

          resolve(result)
        })
    })
  }

  async isInBlackList (currency, address) {
    return new Promise((resolve, reject) => {
      this.dao.findOne('acl_black', { currency, address },
        null, null, (err, result) => {
          if (err) {
            return reject(err)
          }

          resolve(result)
        })
    })
  }

  // 新增事务dbTrans ---wly
  async apply (trs, block, sender, dbTrans) {
    const transfer = await this.getAssetObject(trs)
    this.balanceCache.addAssetBalance(trs.recipientId, transfer.currency, transfer.amount)
    // (1)
    const assetBalancedata = await new Promise((resolve) => {
      this.dao.findOne('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency
      }, ['balance'], (err, rows) => {
        if (err) {
          resolve(err)
        } else {
          resolve(rows)
        }
      })
    })
    const balance = (assetBalancedata && assetBalancedata.balance) ? assetBalancedata.balance : '0'
    const newBalance = DdnUtils.bignum.plus(balance, `-${transfer.amount}`)
    if (DdnUtils.bignum.isLessThan(newBalance, 0)) {
      throw new Error('Asset balance not enough')
    }
    if (assetBalancedata) {
      this.dao.update('mem_asset_balance', {
        balance: newBalance.toString()
      }, {
        address: sender.address,
        currency: transfer.currency
      }, dbTrans)
    } else {
      this.dao.insert('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
        balance: newBalance.toString()
      }, dbTrans)
    }
    // (2)
    const assetBalancedata2 = await new Promise((resolve) => {
      this.dao.findOne('mem_asset_balance', {
        address: trs.recipientId,
        currency: transfer.currency
      }, ['balance'], (err, rows) => {
        if (err) {
          resolve(err)
        } else {
          resolve(rows)
        }
      })
    })
    const balance2 = (assetBalancedata2 && assetBalancedata2.balance) ? assetBalancedata2.balance : '0'
    const newBalance2 = DdnUtils.bignum.plus(balance2, transfer.amount)
    if (DdnUtils.bignum.isLessThan(newBalance2, 0)) {
      throw new Error('Asset balance not enough')
    }
    if (assetBalancedata2) {
      this.dao.update('mem_asset_balance', {
        balance: newBalance2.toString()
      }, {
        address: trs.recipientId,
        currency: transfer.currency
      }, dbTrans)
    } else {
      this.dao.insert('mem_asset_balance', {
        address: trs.recipientId,
        currency: transfer.currency,
        balance: newBalance2.toString()
      }, dbTrans)
    }
  }

  async undo (trs, block, sender, dbTrans) {
    const transfer = await this.getAssetObject(trs)
    this.balanceCache.addAssetBalance(trs.recipientId, transfer.currency, `-${transfer.amount}`)

    // (1)
    const assetBalancedata = await new Promise((resolve) => {
      this.dao.findOne('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency
      }, ['balance'], (err, rows) => {
        if (err) {
          resolve(err)
        } else {
          resolve(rows)
        }
      })
    })
    const balance = (assetBalancedata && assetBalancedata.balance) ? assetBalancedata.balance : '0'
    const newBalance = DdnUtils.bignum.plus(balance, transfer.amount)
    if (DdnUtils.bignum.isLessThan(newBalance, 0)) {
      throw new Error('Asset balance not enough')
    }
    if (assetBalancedata) {
      this.dao.update('mem_asset_balance', {
        balance: newBalance.toString()
      }, {
        address: sender.address,
        currency: transfer.currency
      }, dbTrans)
    } else {
      this.dao.insert('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
        balance: newBalance.toString()
      }, dbTrans)
    }
    // (2)
    const assetBalancedata2 = await new Promise((resolve) => {
      this.dao.findOne('mem_asset_balance', {
        address: trs.recipientId,
        currency: transfer.currency
      }, ['balance'], (err, rows) => {
        if (err) {
          resolve(err)
        } else {
          resolve(rows)
        }
      })
    })
    const balance2 = (assetBalancedata2 && assetBalancedata2.balance) ? assetBalancedata2.balance : '0'
    const newBalance2 = DdnUtils.bignum.plus(balance2, `-${transfer.amount}`)
    if (DdnUtils.bignum.isLessThan(newBalance2, 0)) {
      throw new Error('Asset balance not enough')
    }
    if (assetBalancedata2) {
      this.dao.update('mem_asset_balance', {
        balance: newBalance2.toString()
      }, {
        address: trs.recipientId,
        currency: transfer.currency
      }, dbTrans)
    } else {
      this.dao.insert('mem_asset_balance', {
        address: trs.recipientId,
        currency: transfer.currency,
        balance: newBalance2.toString()
      }, dbTrans)
    }
  }

  async applyUnconfirmed (trs, sender) {
    const transfer = await this.getAssetObject(trs)
    const balance = this.balanceCache.getAssetBalance(
      sender.address, transfer.currency
    ) || 0

    const surplus = DdnUtils.bignum.minus(balance, transfer.amount)
    if (DdnUtils.bignum.isLessThan(surplus, 0)) {
      throw new Error('Insufficient asset balance')
    }
    this.balanceCache.setAssetBalance(sender.address, transfer.currency, surplus.toString())
    return trs
  }

  async undoUnconfirmed (trs, sender) {
    const transfer = await this.getAssetObject(trs)
    this.balanceCache.addAssetBalance(sender.address, transfer.currency, transfer.amount)
    return trs
  }

  /**
     * 自定义资产Api
     */
  async attachApi (router) {
    // TODO: imfly, /transfers
    router.put('/', async (req, res) => {
      try {
        const result = await this.putTransferAsset(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
    router.get('/my/:address/', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address/:currency
      try {
        const result = await this.getMyTransactions(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
    router.get('/my/:address/:currency', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address/:currency
      try {
        const result = await this.getMyTransactions(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
    router.get('/:currency', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address/:currency
      try {
        const result = await this.getTransactions(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
  }

  async putTransferAsset (req) {
    const { body } = req
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        secret: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        currency: {
          type: 'string',
          maxLength: 22
        },
        amount: {
          type: 'string',
          maxLength: 50
        },
        recipientId: {
          type: 'string',
          minLength: 1
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
        multisigAccountPublicKey: {
          type: 'string',
          format: 'publicKey'
        },
        message: {
          type: 'string',
          maxLength: 256
        }
      },
      required: ['secret', 'amount', 'recipientId', 'currency']
    }, body)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    if (body.publicKey) {
      if (keypair.publicKey.toString('hex') !== body.publicKey) {
        return 'Invalid passphrase'
      }
    }

    const transfer = {
      recipientId: body.recipientId,
      currency: body.currency,
      amount: body.amount + '',
      message: body.message,
      fee: '0'
    }

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line consistent-return
      this.balancesSequence.add(async (cb) => {
        if (body.multisigAccountPublicKey && body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')) {
          let account
          try {
            account = await this.runtime.account.getAccountByPublicKey(
              body.multisigAccountPublicKey
            )
          } catch (e) {
            return cb(e)
          }

          if (!account) {
            return cb('Multisignature account not found')
          }
          if (!account.multisignatures) {
            return cb('Account does not have multisignatures enabled')
          }
          if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
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

          // 请求者不是多重签名账号才对
          if (requester.publicKey === account.publicKey) {
            return cb('Invalid requester')
          }

          let second_keypair = null
          if (requester.second_signature) {
            second_keypair = DdnCrypto.getKeys(body.secondSecret)
          }

          try {
            const data = {
              type: await this.getTransactionType(),
              sender: account, // 多重签名账号
              keypair,
              requester: keypair, // 真正的请求者
              second_keypair, // requester的
              recipientId: body.recipientId,
              message: body.message
            }
            const assetJsonName = await this.getAssetJsonName()
            data[assetJsonName] = transfer

            const transaction = await this.runtime.transaction.create(data)
            const transactions = await this.runtime.transaction.receiveTransactions([transaction])
            cb(null, transactions)
          } catch (e) {
            cb(e)
          }
          // 2020.4.22 await this.runtime.transaction.receiveTransactions([transaction], cb);
        } else {
          let account
          try {
            account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey.toString('hex'))
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
          if (account.second_signature) {
            second_keypair = DdnCrypto.getKeys(body.secondSecret)
          }

          try {
            const data = {
              type: await this.getTransactionType(),
              sender: account,
              keypair,
              second_keypair,
              recipientId: body.recipientId,
              message: body.message
            }
            const assetJsonName = await this.getAssetJsonName()
            data[assetJsonName] = transfer

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
        resolve({ success: true, transactionId: transactions[0].id })
      })
    })
  }

  async getMyTransactions (req) {
    const address = req.params.address
    const currency = req.params.currency
    const pageindex = req.query.pageindex || 1
    const pagesize = req.query.pagesize || 50

    // (1)先查询到对应的transfer中的相关数据表查询到对应数据
    const where1 = {}
    if (currency) {
      where1.currency = currency
    } else {
      where1.$and = [
        {
          transaction_type: {
            $gte: 60
          }
        },
        {
          transaction_type: {
            $lte: 65
          }
        }
      ]
    }
    const transfer = await this.queryAsset(where1, null, true, pageindex, pagesize, null, false)
    const tids = _.map(transfer.rows, 'transaction_id')
    const where2 = { id: { $in: tids }, senderId: address }
    const result = await this.runtime.dataquery.queryFullTransactionData(
      where2, null, null, null, null
    )
    const trslist = []
    for (let i = 0; i < result.length; i++) {
      const newTrs = await this.runtime.transaction.serializeDbData2Transaction(result[i])
      trslist.push(newTrs)
    }
    return {
      success: true,
      result: {
        rows: trslist,
        total: transfer.total
      }
    }
  }

  async getTransactions (req) {
    const currency = req.params.currency
    const pageindex = req.query.pageindex || 1
    const pagesize = req.query.pagesize || 50

    // (1)先查询到对应的transfer中的相关数据表查询到对应数据
    const where1 = { currency }
    const transfer = await this.queryAsset(where1, null, true, pageindex, pagesize)
    const tids = _.map(transfer.rows, 'transaction_id')
    const where2 = { id: { $in: tids } }
    const result = await this.runtime.dataquery.queryFullTransactionData(
      where2, null, null, null, null
    )
    const trslist = []
    for (let i = 0; i < result.length; i++) {
      const newTrs = await this.runtime.transaction.serializeDbData2Transaction(result[i])
      trslist.push(newTrs)
    }
    return {
      success: true,
      result: {
        rows: trslist,
        total: transfer.total
      }
    }
  }
}

export default Transfer
