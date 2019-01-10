const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');
const Helper = require('./helper');
const async = require('async');

class Transfer extends AssetBase {
  propsMapping() {
    return [{
      field: "str1",
      prop: "currency"
    },
    {
      field: "str2",
      prop: "amount"
    }
    ];
  }

  create(data, trs) {
    trs.amount = "0";
    trs.recipient_id = data.recipient_id;
    trs.asset.aobTransfer = {
      currency: data.currency,
      amount: data.amount,
    }
    return trs;
  }

  verify(trs, sender, cb) {
    if (!ddnUtils.Address.isAddress(trs.recipient_id)) return cb("Invalid recipient")
    if (!bignum.isZero(trs.amount)) return setImmediate(cb, 'Invalid transaction amount')
    const asset = trs.asset.aobTransfer;
    const error = ddnUtils.Amount.validate(asset.amount);
    if (error) return setImmediate(cb, error)

    const helper = new Helper(this.library, this.modules);
    const where = { name: asset.currency, trs_type: 76 };

    helper.getAssets(where, 1, 1, (err, data) => {

      console.log('data', data)

      if (err) return cb(`Database error: ${err}`);
      assetDetail = data[0];
      if (!assetDetail) return cb('Asset not exists')
      if (assetDetail.writeoff) return cb('Asset already writeoff')
      if (!assetDetail.allow_whitelist && !assetDetail.allow_blacklist) return cb();
      const aclTable = assetDetail.acl == 0 ? 'acl_black' : 'acl_white';
      this.library.model.checkAcl(aclTable, asset.currency, sender.address, trs.recipient_id, (err, isInList) => {    //wxm block database
        if (err) return cb(`Database error when query acl: ${err}`);
        if ((assetDetail.acl == 0) == isInList) return cb('Permission not allowed')
        cb();
      })

    })
  }

   // 新增事务dbTrans ---wly
   apply (trs, block, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const transfer = trs.asset.aobTransfer;
    this.library.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, transfer.amount)   //wxm block database
    const helper = new Helper(this.library, this.modules);
    async.series([
      next => {
        helper.updateAssetBalance(transfer.currency, `-${transfer.amount}`, sender.address, dbTrans, next)
      },
      next => {
        helper.updateAssetBalance(transfer.currency, transfer.amount, trs.recipient_id, dbTrans, next)    //wxm block database
      }
    ], cb)
  }

  undo (trs, block, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const transfer = trs.asset.aobTransfer;
    this.library.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, `-${transfer.amount}`) //wxm block database
    const helper = new Helper(this.library, this.modules);
    async.series([
      next => {
        helper.updateAssetBalance(transfer.currency, transfer.amount, sender.address, dbTrans, next)
      },
      next => {
        helper.updateAssetBalance(transfer.currency, `-${transfer.amount}`, trs.recipient_id, dbTrans, next)  //wxm block database
      }
    ], cb)
  }
  applyUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const transfer = trs.asset.aobTransfer;
    const balance = this.library.balanceCache.getAssetBalance(sender.address, transfer.currency) || 0;
    const surplus = bignum.minus(balance, transfer.amount);
    if (bignum.isLessThan(surplus, 0))return setImmediate(cb, 'Insufficient asset balance')
    this.library.balanceCache.setAssetBalance(sender.address, transfer.currency, surplus.toString())
    setImmediate(cb)
  }
  
  undoUnconfirmed (trs, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const transfer = trs.asset.aobTransfer;
    this.library.balanceCache.addAssetBalance(sender.address, transfer.currency, transfer.amount)
    setImmediate(cb)
  }
  
}
module.exports = Transfer;