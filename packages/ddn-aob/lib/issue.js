const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');
const mathjs = require('mathjs');
const async = require('async');
const Helper = require('./helper');
class Issue extends AssetBase {
  propsMapping() {
    return [{
      field: "str1",
      prop: "currency",
      required: true
    },
    {
      field: "str2",
      prop: "amount"
    }
    ];
  }

  create(data, trs) {
    trs.recipient_id = null;
    trs.amount = "0";
    trs.asset.aobIssue = {
      currency: data.currency,
      amount: data.amount + ""
    }
    return trs;
  }

  verify(trs, sender, cb) {
    // 引入helper
    const helper = new Helper(this.library, this.modules);
    super.verify(trs, sender, async (err, trans) => {
      if (err) {
        return cb(err);
      }
      // 检查参数
      if (trs.recipient_id) return setImmediate(cb, 'Invalid recipient');
      if (!bignum.isZero(trs.amount)) return setImmediate(cb, 'Invalid transaction amount');

      const amount = trs.asset.aobIssue.amount;
      const error = ddnUtils.Amount.validate(amount);
      if (error) return cb(error);

      try {
        // (1)得到资产数据
        const where = { name: trs.asset.aobIssue.currency }
        const pageIndex = 1;
        const pageSize = 1;
        helper.getAssets(where, pageIndex, pageSize, (err, result) => {
          result = result[0];
          if (err) return cb(`Database error: ${err} --- from ddn-aob -> issue.verify`);
          if (!result) return cb('Asset not exists --- from ddn-aob -> issue.verify')
          if (result.issuer_id !== sender.address) return cb('Permission not allowed --- from ddn-aob -> issue.verify')
          if (result.writeoff) return cb('Asset already writeoff --- from ddn-aob -> issue.verify')
          const maximum = result.maximum;
          const quantity = result.quantity;
          const precision = result.precision;
          if (bignum.isGreaterThan(bignum.plus(quantity, amount), maximum)) return cb('Exceed issue limit --- from ddn-aob -> issue.verify');
          const strategy = result.strategy;
          const genesisHeight = result.height;
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
              if (!evalRet) return cb('Strategy not allowed --- from ddn-aob -> issue.verify');
            } catch (e) {
              return cb('Failed to execute strategy --- from ddn-aob -> issue.verify')
            }
          }
          return cb()
        })
      } catch (err2) {
        cb(err2, ' --- from ddn-aob -> issue.verify');
      }
    })
  }

  apply(trs, block, sender, dbTrans, cb) {
    // 引入helper
    const helper = new Helper(this.library, this.modules);
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const currency = trs.asset.aobIssue.currency;
    const amount = trs.asset.aobIssue.amount;
    this.library.balanceCache.addAssetBalance(sender.address, currency, amount)
    async.series([
      next => {
        helper.addAssetQuantity(currency, amount, dbTrans, next)
      },
      next => {
        helper.updateAssetBalance(currency, amount, sender.address, dbTrans, next)
      }
    ], cb)
  }
  
  undo(trs, block, sender, dbTrans, cb) {
    // 引入helper
    const helper = new Helper(this.library, this.modules);
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const currency = trs.asset.aobIssue.currency;
    const amount = trs.asset.aobIssue.amount;
    const senderBalanceKey = `${currency}:${sender.address}`;
    const balance = library.balanceCache.getAssetBalance(sender.address, currency) || 0;
    //bignum update if (bignum(balance).lt(amount)) 
    if (bignum.isLessThan(balance, amount)) return setImmediate(cb, `Invalid asset balance: ${balance}`);
    this.library.balanceCache.addAssetBalance(sender.address, currency, `-${amount}`)
    async.series([
      next => {
        helper.addAssetQuantity(currency, `-${amount}`, dbTrans, next)
      },
      next => {
        helper.updateAssetBalance(currency, `-${amount}`, sender.address, dbTrans, next)
      }
    ], cb)
  }
  
}
module.exports = Issue;