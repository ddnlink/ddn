import Asset from '@ddn/asset-base'
import DdnUtils from '@ddn/utils'

class InTransfer extends Asset.Base {
  async propsMapping () {
    return [
      {
        field: 'str2',
        prop: 'dapp_id',
        required: true
      },
      {
        field: 'str1',
        prop: 'currency',
        required: true
      },
      {
        field: 'str3',
        prop: 'amount'
      }
    ]
  }

  async create (data, trs) {
    trs.recipientId = null

    const assetJsonName = await this.getAssetJsonName(trs.type)
    // eslint-disable-next-line require-atomic-updates
    trs.asset[assetJsonName] = data[assetJsonName]

    if (data[assetJsonName].currency === this.constants.tokenName) {
      // eslint-disable-next-line require-atomic-updates
      trs.amount = data.amount + ''
      delete data[assetJsonName].amount
    }

    return trs
  }

  async verify (trs, sender) {
    if (trs.recipientId) {
      throw new Error('Invalid recipient')
    }

    if (!this.address.isAddress(sender.address)) {
      throw new Error('Invalid address')
    }

    const inTransfer = await this.getAssetObject(trs)
    if (inTransfer.currency !== this.constants.tokenName) {
      if ((typeof (trs.amount) !== 'undefined' && !DdnUtils.bignum.isZero(trs.amount)) ||
                (typeof (inTransfer.amount) === 'undefined' || DdnUtils.bignum.isZero(inTransfer.amount))) {
        throw new Error('Invalid transfer amount')
      }

      const error = DdnUtils.amount.validate(inTransfer.amount)
      if (error) {
        throw error
      }
    } else {
      if ((typeof (trs.amount) === 'undefined' || DdnUtils.bignum.isZero(trs.amount)) ||
                (typeof (inTransfer.amount) !== 'undefined' && !DdnUtils.bignum.isZero(inTransfer.amount))) {
        throw new Error('Invalid transfer amount')
      }
    }

    const dappInst = await this.getAssetInstanceByName('Dapp')
    const count = await dappInst.queryAssetCount({ transaction_id: inTransfer.dapp_id })
    if (count === 0) {
      throw new Error(`Dapp not found: ${inTransfer.dapp_id}`)
    }

    const currency = inTransfer.currency
    if (currency !== this.constants.tokenName) {
      const aobAssetInst = await this.getAssetInstanceByName('AobAsset')
      const aobAssetResult = await aobAssetInst.queryAsset({ name: currency }, null, false, 1, 1)
      if (aobAssetResult.length <= 0) {
        throw new Error('Asset not exists')
      }

      const aobAssetDetail = aobAssetResult[0]
      if (aobAssetDetail.writeoff === '1') {
        throw new Error('Asset already writeoff')
      }

      if (aobAssetDetail.allow_whitelist === '1' || aobAssetDetail.allow_blacklist === '1') {
        const aobTransferInst = await this.getAssetInstanceByName('AobTransfer')
        if (await aobTransferInst.isInBlackList(currency, sender.address)) {
          throw new Error('Permission not allowed')
        }

        // wxm TODO Aob中需增加isInBlackList方法
        // const aclTable = assetDetail.acl === 0 ? 'acl_black' : 'acl_white';
        // library.model.checkAcl(aclTable, currency, sender.address, null, (err, isInList) => {
        //     if (err) return cb(`Database error when query acl: ${err}`);
        //     if ((assetDetail.acl === 0) === isInList) return cb('Permission not allowed')
        //     cb()
        // })
      }
    }
  }

  async getBytes (trs) {
    const transfer = await this.getAssetObject(trs)

    var buf = Buffer.from([])
    const dappId = Buffer.from(transfer.dapp_id, 'utf8')
    // again !!!
    // if (trs.asset.inTransfer.currency !== this.library.constants.tokenName) {
    if (transfer.currency !== this.constants.tokenName) {
      const currency = Buffer.from(transfer.currency, 'utf8')
      const amount = Buffer.from(transfer.amount, 'utf8')
      buf = Buffer.concat([buf, dappId, currency, amount])
    } else {
      const currency = Buffer.from(transfer.currency, 'utf8')
      buf = Buffer.concat([buf, dappId, currency])
    }

    return buf
  }

  async _updateAssetBalance (currency, amount, address, dbTrans) {
    const condition = {
      address,
      currency
    }

    return new Promise((resolve, reject) => {
      this.dao.findOne('mem_asset_balance',
        condition, ['balance'], dbTrans,
        (err, row) => {
          if (err) {
            return reject(err)
          }

          let balance = '0'
          if (row) {
            balance = row.balance
          }

          const newBalance = DdnUtils.bignum.plus(balance, amount)
          if (DdnUtils.bignum.isLessThan(newBalance, 0)) {
            return reject('Asset balance not enough')
          }

          condition.balance = newBalance.toString()
          this.dao.insertOrUpdate('mem_asset_balance',
            condition, dbTrans, (err2, result) => {
              if (err2) {
                return reject(err2)
              }

              resolve(result)
            })
        })
    })
  }

  // 新增事务dbTrans ---wly
  async apply (trs, _block, sender, dbTrans) {
    const asset = await this.getAssetObject(trs)
    const dappId = asset.dapp_id

    if (asset.currency === this.constants.tokenName) {
      this.balanceCache.addAssetBalance(dappId, asset.currency, trs.amount)
      await this._updateAssetBalance(asset.currency, trs.amount, dappId, dbTrans)
    } else {
      this.balanceCache.addAssetBalance(dappId, asset.currency, asset.amount)
      await this._updateAssetBalance(asset.currency, `-${asset.amount}`, sender.address, dbTrans)
      await this._updateAssetBalance(asset.currency, asset.amount, dappId, dbTrans)
    }
  }

  async undo (trs, _block, sender, dbTrans) {
    const asset = await this.getAssetObject(trs)
    const transfer = await this.getAssetObject(trs)
    const dappId = asset.dapp_id

    if (transfer.currency === this.constants.tokenName) {
      this.balanceCache.addAssetBalance(dappId, transfer.currency, `-${trs.amount}`)
      await this._updateAssetBalance(transfer.currency, `-${trs.amount}`, dappId, dbTrans)
    } else {
      this.balanceCache.addAssetBalance(dappId, transfer.currency, transfer.amount)
      await this._updateAssetBalance(transfer.currency, transfer.amount, sender.address, dbTrans)
      await this._updateAssetBalance(transfer.currency, `-${transfer.amount}`, dappId, dbTrans)
    }
  }

  async applyUnconfirmed (trs, sender) {
    const transfer = await this.getAssetObject(trs)
    if (transfer.currency !== this.constants.tokenName) {
      const balance = this.balanceCache.getAssetBalance(sender.address, transfer.currency) || 0
      const surplus = DdnUtils.bignum.minus(balance, transfer.amount)
      if (DdnUtils.bignum.isLessThan(surplus, 0)) {
        throw new Error('Insufficient asset balance')
      }
      this.balanceCache.setAssetBalance(sender.address, transfer.currency, surplus.toString())
    }
  }

  async undoUnconfirmed (trs, sender) {
    const transfer = await this.getAssetObject(trs)
    if (transfer.currency !== this.constants.tokenName) {
      this.balanceCache.addAssetBalance(sender.address, transfer.currency, transfer.amount)
    }
  }
}

export default InTransfer
