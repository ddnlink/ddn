const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const async = require('async');
const ddnUtils = require('ddn-utils');

class Intransfer extends AssetBase {
  propsMapping() {
    return[
      {
        field: "str2",
        prop: "dapp_id"
      },
      {
        field: "str1",
        prop: "currency"
      },
      {
        field: "str3",
        prop: "amount"
      },
    ]
  }

  create(data, trs) {
    trs.recipient_id = null;

    if (data.currency === library.tokenSetting.tokenName) {
      trs.amount = data.amount + "";
      trs.asset.inTransfer = {
        dapp_id: data.dapp_id,
        currency: data.currency
      };
    } else {
      trs.asset.inTransfer = {
        dapp_id: data.dapp_id,
        currency: data.currency,
        amount: data.amount,
      };
    }

    return trs;
  }

  verify(trs, sender, cb) {
    super.verify(trs, sender, async(err, trans) => {
      if(err){
        cb(err);
      }
      if (trs.recipient_id) {
        return setImmediate(cb, "Invalid recipient");
      }
      if (!ddnUtils.Address.isAddress(sender.address)) {
        return setImmediate(cb, "Invalid address")
      }
      const asset = trs.asset.inTransfer;
      if (asset.currency !== library.tokenSetting.tokenName) {
        if (!bignum.isZero(trs.amount) || bignum.isZero(asset.amount)) {
          return setImmediate(cb, "Invalid transfer amount")
        }
        const error = ddnUtils.Amount.validate(trs.asset.inTransfer.amount);
        if (error) return setImmediate(cb, error)
      } else {
        if ((typeof (trs.amount) == "undefined" || bignum.isZero(trs.amount)) ||
          (typeof (asset.amount) != "undefined" && !bignum.isZero(asset.amount))) {
          return setImmediate(cb, "Invalid transfer amount")
        }
      }
      try {
        super.queryAssetCount({ transaction_id: trs.asset.inTransfer.dapp_id }, 'dapp', async(err, count) => {
          if (err) {
            library.logger.error(err.toString());
            return setImmediate(cb, `Dapp not found: ${trs.asset.inTransfer.dapp_id}`);
          }
          if (count === 0) {
            return setImmediate(cb, `Dapp not found: ${trs.asset.inTransfer.dapp_id}`);
          }
          const currency = trs.asset.inTransfer.currency;
          if (currency === library.tokenSetting.tokenName) return cb()

          const where = { name: currency, trs_type: 76 };
          const orders = null;
          const returnTotal = null;
          const pageIndex = 1;
          const pageSize = 1;
          let assetData = await super.queryAsset(where, orders, returnTotal, pageIndex, pageSize);
          assetData = assetData[0];
          if (!assetDetail) return cb('Asset not exists')
          if (assetDetail.writeoff) return cb('Asset already writeoff')
          if (!assetDetail.allow_whitelist && !assetDetail.allow_blacklist) return cb();
          const aclTable = assetDetail.acl == 0 ? 'acl_black' : 'acl_white';
          library.model.checkAcl(aclTable, currency, sender.address, null, (err, isInList) => {
            if (err) return cb(`Database error when query acl: ${err}`);
            if ((assetDetail.acl == 0) == isInList) return cb('Permission not allowed')
            cb()
          })
        })
      } catch(err2){
        cb(err2);
      }
    })
  }

  getBytes(trs) {
    try {
      var buf = new Buffer([]);
      const dappId = new Buffer(trs.asset.inTransfer.dapp_id, 'utf8');
      // if (trs.asset.inTransfer.currency !== this.library.tokenSetting.tokenName) {
      if (trs.asset.inTransfer.currency !== 'EOK') {
        var currency = new Buffer(trs.asset.inTransfer.currency, 'utf8');
        const amount = new Buffer(trs.asset.inTransfer.amount, 'utf8');
        buf = Buffer.concat([buf, dappId, currency, amount]);
      } else {
        var currency = new Buffer(trs.asset.inTransfer.currency, 'utf8');
        buf = Buffer.concat([buf, dappId, currency]);
      }
    } catch (e) {
      throw Error(e.toString());
    }
    return buf;
  }

   // 新增事务dbTrans ---wly
   apply(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const asset = trs.asset.inTransfer;
    const dappId = asset.dapp_id;

    if (asset.currency === library.tokenSetting.tokenName) {
      library.balanceCache.addAssetBalance(dappId, asset.currency, trs.amount)
      library.model.updateAssetBalance(asset.currency, trs.amount, dappId, dbTrans, cb)
    } else {
      library.balanceCache.addAssetBalance(dappId, asset.currency, asset.amount)
      async.series([
        next => {
          library.model.updateAssetBalance(asset.currency, `-${asset.amount}`, sender.address, dbTrans, next)
        },
        next => {
          library.model.updateAssetBalance(asset.currency, asset.amount, dappId, dbTrans, next)
        }
      ], cb)
    }
  }

  undo(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };

    const transfer = trs.asset.inTransfer;
    const dappId = asset.dapp_id;

    if (transfer.currency === library.tokenSetting.tokenName) {
      library.balanceCache.addAssetBalance(dappId, transfer.currency, `-${trs.amount}`)
      library.model.updateAssetBalance(transfer.currency, `-${trs.amount}`, dappId, dbTrans, cb)
    } else {
      library.balanceCache.addAssetBalance(dappId, transfer.currency, transfer.amount)
      async.series([
        next => {
          library.model.updateAssetBalance(transfer.currency, transfer.amount, sender.address, dbTrans, next)
        },
        next => {
          library.model.updateAssetBalance(transfer.currency, `-${transfer.amount}`, dappId, dbTrans, next)
        }
      ], cb)
    }
  }

  applyUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const transfer = trs.asset.inTransfer;
    if (transfer.currency === library.tokenSetting.tokenName) return setImmediate(cb)
    const balance = self.library.balanceCache.getAssetBalance(sender.address, transfer.currency) || 0;
    const surplus = bignum.minus(balance, transfer.amount);
    if (bignum.isLessThan(surplus, 0))return setImmediate(cb, 'Insufficient asset balance')
    library.balanceCache.setAssetBalance(sender.address, transfer.currency, surplus.toString())
    setImmediate(cb);
  }

  undoUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const transfer = trs.asset.inTransfer;
    if (transfer.currency === library.tokenSetting.tokenName) return setImmediate(cb)
    library.balanceCache.addAssetBalance(sender.address, transfer.currency, transfer.amount)
    setImmediate(cb);
  }


}
module.exports = Intransfer;