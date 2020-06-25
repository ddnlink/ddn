import Asset from '@ddn/asset-base'
import DdnUtils from '@ddn/utils'
import DdnCrypto from '@ddn/crypto'

const _dappOuttransferUnconfirmeds = {}

class OutTransfer extends Asset.Base {
  async propsMapping () {
    return [
      {
        field: 'str2',
        prop: 'dapp_id',
        required: true
      },
      {
        field: 'str4',
        prop: 'outtransaction_id'
      },
      {
        field: 'str1',
        prop: 'currency',
        required: true
      },
      {
        field: 'str3',
        prop: 'amount',
        required: true
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
    // await super.verify(trs, sender);

    if (!trs.recipientId) {
      throw new Error('Invalid recipient')
    }

    if (!DdnUtils.bignum.isZero(trs.amount)) {
      throw new Error('Invalid transaction amount')
    }

    if (!trs.signatures || !trs.signatures.length) {
      throw new Error('Invalid signatures')
    }

    const transfer = await this.getAssetObject(trs)
    const currency = transfer.currency

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
        // const aclTable = aobAssetDetail.acl === 0 ? 'acl_black' : 'acl_white';
        // library.model.checkAcl(aclTable, currency, sender.address, null, (err, isInList) => {
        //     if (err) return cb(`Database error when query acl: ${err}`);
        //     if ((aobAssetDetail.acl === 0) === isInList) return cb('Permission not allowed')
        //     cb();
        // })
      }
    }

    return trs
  }

  async process (trs) {
    var dapp = null

    const transfer = await this.getAssetObject(trs)

    const dappInst = await this.getAssetInstanceByName('Dapp')
    const dappResult = await dappInst.queryAsset({ trs_id: transfer.dapp_id }, null, false, 1, 1)
    if (dappResult.length > 0) {
      dapp = dappResult[0]
    }

    if (!dapp) {
      throw new Error(`DApp not found: ${transfer.dapp_id}`)
    }

    if (_dappOuttransferUnconfirmeds[trs.id]) {
      throw new Error(`Transaction is already processing: ${trs.id}`)
    }

    dapp.delegates = dapp.delegates.split(',')
    if (dapp.delegates.indexOf(trs.senderPublicKey) === -1) {
      throw new Error('Sender must be dapp delegate')
    }

    if (!trs.signatures || trs.signatures.length !== dapp.unlock_delegates) {
      throw new Error('Invalid signature number')
    }

    let validSignatureNumber = 0
    const bytes = await DdnCrypto.getBytes(trs, true, true)
    try {
      for (const i in trs.signatures) {
        for (const j in dapp.delegates) {
          if (await this.runtime.transaction.verifyBytes(bytes, trs.signatures[i], dapp.delegates[j])) {
            validSignatureNumber++
            break
          }
        }
        if (validSignatureNumber >= dapp.unlock_delegates) break
      }
    } catch (e) {
      throw new Error(`Failed to verify signatures: ${e}`)
    }

    if (validSignatureNumber < dapp.unlock_delegates) {
      throw new Error('Valid signatures not enough')
    }

    const count = await this.queryAssetCount({ transaction_id: trs.id })
    if (count) {
      throw new Error('Transaction is already confirmed')
    }

    return trs
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
          // FIXME: let balanceExists = false;
          if (row) {
            balance = row.balance
            // balanceExists = true;
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

  async apply (trs, block, _sender, dbTrans) {
    const transfer = await this.getAssetObject(trs)

    _dappOuttransferUnconfirmeds[trs.id] = false

    if (transfer.currency !== this.constants.tokenName) {
      this.balanceCache.addAssetBalance(trs.recipientId, transfer.currency, transfer.amount)

      await this._updateAssetBalance(transfer.currency,
                `-${transfer.amount}`, transfer.dapp_id, dbTrans)
      await this._updateAssetBalance(this.constants.tokenName,
                `-${trs.fee}`, transfer.dapp_id, dbTrans)
      await this._updateAssetBalance(transfer.currency,
        transfer.amount, trs.recipientId, dbTrans) // wxm block database
    } else {
      await this.runtime.account.setAccount({ address: trs.recipientId }, dbTrans)

      const amount = DdnUtils.bignum.new(transfer.amount) // DdnUtils.bignum update Number(transfer.amount);
      await this.runtime.account.merge(trs.recipientId, {
        address: trs.recipientId, // wxm block database
        balance: amount.toString(), // DdnUtils.bignum update
        u_balance: amount.toString(), // DdnUtils.bignum update
        block_id: block.id, // wxm block database
        round: await this.runtime.round.calc(block.height)
      }, dbTrans)

      var minusSum = DdnUtils.bignum.minus(0, amount, trs.fee)
      await this._updateAssetBalance(this.constants.tokenName,
        minusSum.toString(), transfer.dapp_id, dbTrans)
    }
  }

  async undo (trs, block, _sender, dbTrans) {
    const transfer = await this.getAssetObject(trs)

    _dappOuttransferUnconfirmeds[trs.id] = true

    if (transfer.currency !== this.constants.tokenName) {
      this.balanceCache.addAssetBalance(trs.recipientId, transfer.currency, transfer.amount) // wxm block database

      await this._updateAssetBalance(transfer.currency,
        transfer.amount, transfer.dapp_id, dbTrans)
      await this._updateAssetBalance(this.constants.tokenName,
        trs.fee, transfer.dapp_id, dbTrans)
      await this._updateAssetBalance(transfer.currency,
                `-${transfer.amount}`, trs.recipientId, dbTrans) // wxm block database
    } else {
      await this.runtime.account.setAccount({ address: trs.recipientId }, dbTrans)

      const minusAmount = DdnUtils.bignum.minus(0, transfer.amount)
      const sum = DdnUtils.bignum.plus(transfer.amount, trs.fee)
      await this.runtime.account.merge(trs.recipientId, {
        address: trs.recipientId, // wxm block database
        balance: minusAmount.toString(),
        u_balance: minusAmount.toString(),
        block_id: block.id, // wxm block database
        round: await this.runtime.round.calc(block.height)
      }, dbTrans)
      await this._updateAssetBalance(this.constants.tokenName,
        sum, transfer.dapp_id, dbTrans)
    }
  }

  async applyUnconfirmed (trs) {
    const transfer = await this.getAssetObject(trs)

    _dappOuttransferUnconfirmeds[trs.id] = true

    const balance = this.balanceCache.getAssetBalance(transfer.dapp_id, transfer.currency) || 0
    const fee = trs.fee
    if (transfer.currency === this.constants.tokenName) {
      const amount = DdnUtils.bignum.plus(transfer.amount, fee)
      if (DdnUtils.bignum.isLessThan(balance, amount)) {
        throw new Error('Insufficient balance')
      }

      this.balanceCache.addAssetBalance(transfer.dapp_id,
        transfer.currency, DdnUtils.bignum.minus(0, amount).toString())// DdnUtils.bignum update -amount
    } else {
      const ddnBalance = this.balanceCache.getAssetBalance(transfer.dapp_id, this.constants.tokenName) || 0
      if (DdnUtils.bignum.isLessThan(ddnBalance, fee)) {
        throw new Error('Insufficient balance')
      }
      if (DdnUtils.bignum.isLessThan(balance, transfer.amount)) {
        throw new Error('Insufficient asset balance')
      }
      this.balanceCache.addAssetBalance(transfer.dapp_id, this.constants.tokenName, `-${fee}`)
      this.balanceCache.addAssetBalance(transfer.dapp_id, transfer.currency, `-${transfer.amount}`)
    }
  }

  async undoUnconfirmed (trs) {
    _dappOuttransferUnconfirmeds[trs.id] = false

    const transfer = await this.getAssetObject(trs)
    const fee = trs.fee
    if (transfer.currency === this.constants.tokenName) {
      const amount = DdnUtils.bignum.plus(transfer.amount, fee)
      this.balanceCache.addAssetBalance(transfer.dapp_id, transfer.currency, amount.toString())
    } else {
      this.balanceCache.addAssetBalance(transfer.dapp_id, this.constants.tokenName, fee)
      this.balanceCache.addAssetBalance(transfer.dapp_id, transfer.currency, transfer.amount)
    }
  }

  async dbSave (trs, dbTrans) {
    await super.dbSave(trs, dbTrans)
  }
}

export default OutTransfer
