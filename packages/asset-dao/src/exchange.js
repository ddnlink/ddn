/* ---------------------------------------------------------------------------------------------
 *  Updated by Imfly on Sat Dec 07 2019 09:37:37
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import ByteBuffer from 'bytebuffer'
import Asset from '@ddn/asset-base'
import DdnUtils from '@ddn/utils'
import DdnCrypto from '@ddn/crypto'

import daoUtil from './daoUtil.js'

/**
  * 企业号、媒体号等交易
  *
  * 卖媒体号：
  * @org_id 自治组织号 5-20，5位以下逐年开放注册；媒体号 midiumId 是自治组织的一种，可以以M为后缀，其他的以此类推；
  * @price 卖的价格
  * @receivedAddress 买方的钱包地址（即将绑定媒体号的新的钱包地址）
  * @senderAddress 卖方的钱包地址
  * @state 0-发起卖，1-确认买（同时向org增加一条绑定记录）
  *
  * @exchangeTrsId - 确认买的时候记录卖的记录id，发起卖的时候为空
  * @amout 0-发起卖，确认买的数量=@price
  * @fee 交易费用
  */
class Exchange extends Asset.Base {
  // eslint-disable-next-line class-methods-use-this
  async propsMapping () {
    return [{
      field: 'str1',
      prop: 'org_id',
      required: true
    }, {
      field: 'str2',
      prop: 'sender_address',
      required: true
    }, {
      field: 'str3',
      prop: 'received_address',
      required: true
    }, {
      field: 'str4',
      prop: 'exchange_trs_id'
    }, {
      field: 'str5',
      prop: 'price',
      required: true
    }, {
      field: 'int1',
      prop: 'state',
      required: true
    }]
  }

  // eslint-disable-next-line class-methods-use-this
  async create (data, trs) {
    const trans = trs

    trans.amount = '0'
    trans.recipientId = ''

    const assetJsonName = await this.getAssetJsonName(trs.type)
    trans.asset[assetJsonName] = {
      org_id: data[assetJsonName].org_id.toLowerCase(),
      price: data[assetJsonName].price || '0',
      state: data[assetJsonName].state,
      exchange_trs_id: data[assetJsonName].exchange_trs_id,
      sender_address: data[assetJsonName].sender_address,
      received_address: data[assetJsonName].received_address
    }

    if (data[assetJsonName].state === 1) {
      console.log('data[assetJsonName]', data[assetJsonName])

      trans.amount = trans.asset[assetJsonName].price
      trans.recipientId = trans.asset[assetJsonName].received_address
    }

    return trans
  }

  async verify (trs, sender) {
    const asset = await this.getAssetObject(trs)
    // check org id
    if (!daoUtil.isOrgId(asset.org_id.toLowerCase())) {
      console.log('exchange.js asset.org_id', asset.org_id)

      throw new Error('exchange org id not allow: ' + asset.org_id.toLowerCase())
    }
    if (!this.address.isAddress(sender.address)) {
      throw new Error('Invalid address')
    }
    if (!this.address.isAddress(asset.sender_address)) {
      throw new Error('senderAddress id not allow')
    }
    if (!this.address.isAddress(asset.received_address)) {
      throw new Error('receivedAddress id not allow')
    }
    if (asset.sender_address === asset.received_address) {
      throw new Error('senderAddress receivedAddress cat not equal')
    }
    if (asset.sender_address !== sender.address) {
      throw new Error('senderAddress and sender.address should be equal')
    }
    if (DdnUtils.bignum.isNaN(asset.price)) {
      throw new Error("Invalid exchange' price.")
    }
    // check state right
    if (asset.state === 0) {
      // send exchange
      if (!DdnUtils.bignum.isZero(trs.amount)) {
        throw new Error('Invalid transaction amount')
      }
      if (asset.exchange_trs_id) {
        throw new Error('not need confirm exchange trs_id')
      } else {
        // TODO: 判断媒体号是否由 sender 注册
        var effectiveOrgInfo = await daoUtil.getEffectiveOrgByOrgId(this._context, asset.org_id)
        if (!effectiveOrgInfo) {
          throw new Error(`Org "${asset.org_id}" not exists`)
        }

        if (effectiveOrgInfo.address !== sender.address) {
          throw new Error(`Org "${asset.org_id}" not belong to you`)
        }
      }
    } else if (asset.state === 1) {
      if (!asset.exchange_trs_id) {
        throw new Error('must give confirm exchange trs_id')
      }

      // 获取出售记录
      const exchangeRequestList = await this.queryAsset({ trs_id: asset.exchange_trs_id },
        [['trs_timestamp', 'DESC']], false, 1, 1, null)
      if (!(exchangeRequestList && exchangeRequestList.length)) {
        throw new Error('request exchange not find: ' + asset.exchange_trs_id)
      }
      const exchangeRequestObj = exchangeRequestList[0]
      console.log('exchangeRequestObj', exchangeRequestObj)

      // 获取对应的购买记录
      const confirmExchangeList = await this.queryAsset({ exchange_trs_id: asset.exchange_trs_id },
        [['trs_timestamp', 'DESC']], false, 1, 10, null)

      console.log('confirmExchangeList', confirmExchangeList)

      if (confirmExchangeList && confirmExchangeList.length) {
        throw new Error('confirm exchange already exists: ' + asset.exchange_trs_id)
      }

      // 获取该组织号的最新出售交易
      const latestExchangeRequestList = await this.queryAsset({ trs_type: await this.getTransactionType(), org_id: asset.org_id.toLowerCase(), state: 0 },
        [['trs_timestamp', 'DESC']], false, 1, 1, null)
      const latestExchangeRequestObj = latestExchangeRequestList[0]

      // 不是一条记录了
      if (latestExchangeRequestObj.transaction_id !== exchangeRequestObj.transaction_id) {
        throw new Error('request exchange is expired: ' + asset.exchange_trs_id)
      }

      //  fimxe: 这条记录应该永远不会发生啊
      if (latestExchangeRequestObj.org_id.toLowerCase() !== asset.org_id.toLowerCase()) {
        throw new Error('confirm exchange org_id invalid, exchange_trs_id: ' + asset.exchange_trs_id)
      }

      // 这里把 trs.amount 去掉，因为在 create 的时候，就会默认添加 trs.amount 属性；改为价格与记录相等，确保按照价格购买和转账；
      // if (!DdnUtils.bignum.isEqualTo(latestExchangeRequestObj.price, trs.amount)) {
      //     throw new Error('confirm exchange amount !== price, exchange_trs_id: ' + asset.exchange_trs_id)
      // }
      if (!DdnUtils.bignum.isEqualTo(latestExchangeRequestObj.price, asset.price)) {
        throw new Error('confirm exchange amount !== price, exchange_trs_id: ' + asset.exchange_trs_id)
      }

      // address is ok
      if (latestExchangeRequestObj.received_address !== asset.sender_address) {
        throw new Error('confirm exchange senderAddress error: ' + asset.exchange_trs_id)
      }
      if (latestExchangeRequestObj.sender_address !== asset.received_address) {
        throw new Error('confirm exchange receivedAddress error: ' + asset.exchange_trs_id)
      }

      if (!trs.recipientId) {
        throw new Error('Invalid params: recipientId')
      }

      if (trs.recipientId !== asset.received_address) {
        throw new Error('confirm exchange recipientId error: ' + asset.exchange_trs_id)
      }
    } else {
      throw new Error('not support dao exchange state')
    }
    return trs
  }

  async getBytes (trs) {
    const asset = await this.getAssetObject(trs) // trs.asset.exchange;

    const bb = new ByteBuffer()
    bb.writeString(asset.org_id.toLowerCase())
    bb.writeString(asset.exchange_trs_id)
    bb.writeString(asset.price)
    bb.writeInt8(asset.state)
    bb.writeString(asset.sender_address)
    bb.writeString(asset.received_address)
    bb.flip()
    return bb.toBuffer()
  }

  async applyUnconfirmed (trs, sender, dbTrans) {
    const assetObj = await this.getAssetObject(trs)
    const key = `${sender.address}:${trs.type}:${assetObj.org_id}:${assetObj.state}`
    if (assetObj.state === 0 && this.oneoff.has(key)) {
      throw new Error(`The exchange ${assetObj.org_id} is in process already.`)
    }

    await super.applyUnconfirmed(trs, sender, dbTrans)

    if (assetObj.state === 1) {
      this.oneoff.set(key, true)
    }
  }

  async undoUnconfirmed (trs, sender, dbTrans) {
    const assetObj = await this.getAssetObject(trs)
    if (assetObj.state === 1) {
      const key = `${sender.address}:${trs.type}:${assetObj.org_id}:${assetObj.state}`
      this.oneoff.delete(key)
    }

    var result = await super.undoUnconfirmed(trs, sender, dbTrans)
    return result
  }

  async dbSave (trs, dbTrans) {
    var result = await super.dbSave(trs, dbTrans)
    const asset = await this.getAssetObject(trs)
    if (asset.state === 1) {
      result = await daoUtil.exchangeOrg(this._context,
        asset.org_id, asset.sender_address, dbTrans)
    }
    return result
  }

  async attachApi (router) {
    router.put('/', async (req, res) => {
      try {
        const result = await this.putExchange(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
  }

  async putExchange (req) {
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
        price: {
          type: 'string'
        },
        state: {
          type: 'integer',
          minimum: 0,
          maximum: 1
        },
        org_id: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        exchangeTrsId: {
          type: 'string'
        },
        receivedAddress: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        }
      },
      required: ['secret', 'org_id', 'price', 'receivedAddress']
    }, body)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    if (body.publicKey) {
      if (keypair.publicKey.toString('hex') !== body.publicKey) {
        throw new Error('Invalid passphrase')
      }
    }

    const exchange = {
      org_id: body.org_id,
      price: body.price,
      received_address: body.receivedAddress,
      exchange_trs_id: body.exchangeTrsId || '',
      state: body.state ? body.state : 0
    }

    return new Promise((resolve, reject) => {
      this.balancesSequence.add(async (cb) => {
        if (body.multisigAccountPublicKey && body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')) {
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

          if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
            return cb('Account does not belong to multisignature group')
          }

          exchange.sender_address = account.address

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

          try {
            const data = {
              type: await this.getTransactionType(),
              sender: account,
              keypair: keypair,
              requester: keypair,
              second_keypair
            }
            const assetJsonName = await this.getAssetJsonName()
            data[assetJsonName] = exchange

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

          exchange.sender_address = account.address

          let second_keypair = null
          if (account.secondSignature) {
            second_keypair = DdnCrypto.getKeys(body.secondSecret)
          }

          try {
            const data = {
              type: await this.getTransactionType(),
              sender: account,
              keypair,
              second_keypair
            }
            const assetJsonName = await this.getAssetJsonName()
            data[assetJsonName] = exchange

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
}

export default Exchange
