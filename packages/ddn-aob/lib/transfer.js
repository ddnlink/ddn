const { AssetBase } = require('ddn-asset-base');
const async = require('async');
const bignum = require('bignum-utils');
const { Address, Amount } = require('ddn-utils');

class Transfer extends AssetBase {
  create(data, trs) {
    trs.amount = "0";
    trs.recipient_id = data.recipient_id
    trs.asset.aobTransfer = {
      currency: data.currency,
      amount: data.amount
    }
    return trs;
  }

  calculateFee(trs, sender) {
    return library.base.block.calculateFee();
  }

  verify(trs, sender, cb) {
    if (!Address.isAddress(trs.recipient_id)) return cb("Invalid recipient")
    if (!bignum.isZero(trs.amount)) return setImmediate(cb, 'Invalid transaction amount')
    const asset = trs.asset.aobTransfer;
    const error = Amount.validate(asset.amount);
    if (error) return setImmediate(cb, error)
    library.model.getAssetByName(asset.currency, (err, assetDetail) => {
      if (err) return cb(`Database error: ${err}`);
      if (!assetDetail) return cb('Asset not exists')
      if (assetDetail.writeoff) return cb('Asset already writeoff')
      if (!assetDetail.allow_whitelist && !assetDetail.allow_blacklist) return cb()
      const aclTable = assetDetail.acl == 0 ? 'acl_black' : 'acl_white';
      library.model.checkAcl(aclTable, asset.currency, sender.address, trs.recipient_id, (err, isInList) => { //wxm block database
        if (err) return cb(`Database error when query acl: ${err}`);
        if ((assetDetail.acl == 0) == isInList) return cb('Permission not allowed')
        cb()
      })
    })
  }

  process(trs, sender, cb) {
    setImmediate(cb, null, trs)
  }

  getBytes(trs) {
    const buffer = Buffer.concat([
      new Buffer(trs.asset.aobTransfer.currency, 'utf8'),
      new Buffer(trs.asset.aobTransfer.amount, 'utf8')
    ]);
    return buffer
  }
  // 新增事务dbTrans ---wly
  apply(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const transfer = trs.asset.aobTransfer;
    library.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, transfer.amount) //wxm block database
    async.series([
      next => {
        library.model.updateAssetBalance(transfer.currency, `-${transfer.amount}`, sender.address, dbTrans, next)
      },
      next => {
        library.model.updateAssetBalance(transfer.currency, transfer.amount, trs.recipient_id, dbTrans, next) //wxm block database
      }
    ], cb)
  }
  // 新增事务dbTrans ---wly
  undo(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const transfer = trs.asset.aobTransfer;
    library.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, `-${transfer.amount}`) //wxm block database
    async.series([
      next => {
        library.model.updateAssetBalance(transfer.currency, transfer.amount, sender.address, dbTrans, next)
      },
      next => {
        library.model.updateAssetBalance(transfer.currency, `-${transfer.amount}`, trs.recipient_id, dbTrans, next) //wxm block database
      }
    ], cb)
  }
  // 新增事务dbTrans ---wly
  applyUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const transfer = trs.asset.aobTransfer;
    const balance = library.balanceCache.getAssetBalance(sender.address, transfer.currency) || 0;
    const surplus = bignum.minus(balance, transfer.amount);
    if (bignum.isLessThan(surplus, 0))
      return setImmediate(cb, 'Insufficient asset balance')

    library.balanceCache.setAssetBalance(sender.address, transfer.currency, surplus.toString())
    setImmediate(cb)
  }
  // 新增事务dbTrans ---wly
  undoUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const transfer = trs.asset.aobTransfer;
    library.balanceCache.addAssetBalance(sender.address, transfer.currency, transfer.amount)
    setImmediate(cb)
  }

  objectNormalize(trs) {
    const report = library.scheme.validate({
      type: 'object',
      properties: {
        currency: {
          type: 'string',
          minLength: 1,
          maxLength: 22
        },
        amount: {
          type: 'string',
          minLength: 1,
          maxLength: 50
        }
      },
      required: ['currency', 'amount']
    }, trs.asset.aobTransfer);

    if (!report) {
      throw Error(`Can't parse transfer: ${library.scheme.errors[0]}`)
    }

    return trs
  }

  dbRead(raw) {
    if (!raw.transfers_currency) {
      return null
    } else {
      const asset = {
        transaction_id: raw.t_id,
        currency: raw.transfers_currency,
        amount: raw.transfers_amount
      };

      return {
        aobTransfer: asset
      }
    }
  }

  /**
   * 功能:新增一条transfer数据
   */
  dbSave(trs, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const currency = trs.asset.aobTransfer.currency;
    const amount = trs.asset.aobTransfer.amount;
    const values = {
      transaction_id: trs.id,
      currency,
      amount
    };
    library.dao.insert('transfer', values, dbTrans, cb);
  }

  ready(trs, sender) {
    if (sender.multisignatures.length) {
      if (!trs.signatures) {
        return false
      }
      return trs.signatures.length >= sender.multimin - 1
    } else {
      return true
    }
  }
}
module.exports = Transfer;