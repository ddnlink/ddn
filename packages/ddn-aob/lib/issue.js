const { AssetBase } = require('ddn-asset-base');
const async = require('async');
const mathjs = require('mathjs');
const bignum = require('bignum-utils');
const { Amount } = require('ddn-utils');

class Issue extends AssetBase {
  create (data, trs) {
    trs.recipient_id = null //wxm block database
    trs.amount = "0";   //bignum update
    trs.asset.aobIssue = {
      currency: data.currency,
      amount: data.amount + ""  //bignum update
    }
    return trs
  }

  calculateFee (trs, sender) {library.base.block.calculateFee()}

  verify (trs, sender, cb) {
    if (trs.recipient_id) return setImmediate(cb, 'Invalid recipient')
    //bignum update if (trs.amount != 0) 
    if (!bignum.isZero(trs.amount))
        return setImmediate(cb, 'Invalid transaction amount')

    const amount = trs.asset.aobIssue.amount;
    const error = Amount.validate(amount);
    if (error) return setImmediate(cb, error)

    library.model.getAssetByName(trs.asset.aobIssue.currency, (err, result) => {
      if (err) return cb(`Database error: ${err}`);
      if (!result) return cb('Asset not exists')
      if (result.issuer_id !== sender.address) return cb('Permission not allowed')
      if (result.writeoff) return cb('Asset already writeoff')

      const maximum = result.maximum;
      const quantity = result.quantity;
      const precision = result.precision;
    //bignum update   if (bignum(quantity).plus(amount).gt(maximum)) 
      if (bignum.isGreaterThan(bignum.plus(quantity, amount), maximum))
        return cb('Exceed issue limit')

      const strategy = result.strategy;
      const genesisHeight = result.height;
      
    //bignum update   const height = modules.blocks.getLastBlock().height + 1;
      const height = bignum.plus(modules.blocks.getLastBlock().height, 1);

      if (strategy) {
        try {
          const context = {
            maximum: mathjs.bignumber(maximum),
            precision,
            quantity: mathjs.bignumber(quantity).plus(amount),
            genesisHeight: mathjs.bignumber(genesisHeight), //bignum update
            height: mathjs.bignumber(height.toString()) //bignum update
          };
          var evalRet = mathjs.eval(strategy, context);
          if (!evalRet) return cb('Strategy not allowed');
        } catch (e) {
          return cb('Failed to execute strategy')
        }
      }
      return cb()
    })
  }

  process (trs, sender, cb) {
    setImmediate(cb, null, trs)
  }

  getBytes (trs) {
    const buffer = Buffer.concat([
      new Buffer(trs.asset.aobIssue.currency, 'utf8'),
      new Buffer(trs.asset.aobIssue.amount, 'utf8')
    ]);
    return buffer
  }

  // 新增事务dbTrans ---wly
  apply (trs, block, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const currency = trs.asset.aobIssue.currency;
    const amount = trs.asset.aobIssue.amount;
    library.balanceCache.addAssetBalance(sender.address, currency, amount)
    async.series([
      next => {
        library.model.addAssetQuantity(currency, amount, dbTrans, next)
      },
      next => {
        library.model.updateAssetBalance(currency, amount, sender.address, dbTrans, next)
      }
    ], cb)
  }
  // 新增事务dbTrans ---wly
  undo (trs, block, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const currency = trs.asset.aobIssue.currency;
    const amount = trs.asset.aobIssue.amount;
    const senderBalanceKey = `${currency}:${sender.address}`;
    const balance = library.balanceCache.getAssetBalance(sender.address, currency) || 0;
    //bignum update if (bignum(balance).lt(amount)) 
    if (bignum.isLessThan(balance, amount))
        return setImmediate(cb, `Invalid asset balance: ${balance}`);
    library.balanceCache.addAssetBalance(sender.address, currency, `-${amount}`)
    async.series([
      next => {
        library.model.addAssetQuantity(currency, `-${amount}`, dbTrans, next)
      },
      next => {
        library.model.updateAssetBalance(currency, `-${amount}`, sender.address, dbTrans, next)
      }
    ], cb)
  }
  // 新增事务dbTrans ---wly
  applyUnconfirmed (trs, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const key = `${trs.asset.aobIssue.currency}:${trs.type}`;
    if (library.oneoff.has(key)) {
      return setImmediate(cb, 'Double submit')
    }
    library.oneoff.set(key, true)
    setImmediate(cb)
  }
  // 新增事务dbTrans ---wly
  undoUnconfirmed (trs, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    library.oneoff.delete(`${trs.asset.aobIssue.currency}:${trs.type}`)
    setImmediate(cb)
  }

  objectNormalize (trs) {
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
    }, trs.asset.aobIssue);

    if (!report) {
      throw Error(`Can't parse issue: ${library.scheme.errors[0]}`)
    }

    return trs
  }

  dbRead (raw) {
    if (!raw.issues_currency) {
      return null
    } else {
      const asset = {
        transaction_id: raw.t_id,
        currency: raw.issues_currency,
        amount: raw.issues_amount
      };

      return { aobIssue: asset }
    }
  }

	/**
	 * 功能:新增一条issues数据
	*/
  dbSave (trs, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const currency = trs.asset.aobIssue.currency;
    const amount = trs.asset.aobIssue.amount;
    const values = {
      transaction_id: trs.id,
      currency,
      amount
    };
    library.dao.insert('issue', values, dbTrans, cb);
  }

  ready (trs, sender) {
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
module.exports = Issue;