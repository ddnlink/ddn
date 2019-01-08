const { AssetBase } = require('ddn-asset-base');
const _ = require('underscore');
const ddnUtils = require('ddn-utils');

class helper extends AssetBase {
  propsMapping() {
    return [];
  }
  async getAssets(where, pageIndex, pageSize, cb) {
    new Promise(async () => {
      try {
        let result; // 最后返回的值
        // (1)查询到asset的数据列表
        result = await super.queryAsset(where, null, null, pageIndex, pageSize, 76);
        // (2)查询到issuer的数据列表
        let issuerData = await super.queryAsset({ '$in': _.pluck(result, 'issuer_name') }, null, null, 1, 1000, 75);
        issuerData = _.indexBy(issuerData, 'name');
        result = _.map(result, num => {
          num.issuer_id = issuerData[num.issuer_name].issuer_id;
          return num;
        });
        // (3)查询到交易的相关数据
        let trData = await new Promise((reslove, reject) => {
          this.library.dao.findList('tr', { id: { '$in': _.pluck(result, 'transaction_id')}}, 1000, null, null, ['id', 'block_id'], null, (err, data) => {
            if (err) {
              return reject(err);
            }
            reslove(data)
          });
        });
        trData = _.indexBy(trData, 'id');
        result = _.map(result, num => {
          num.block_id = trData[num.transaction_id].block_id;
          return num;
        });
        // (4)查询到块的相关数据
        let blockData = await new Promise((reslove, reject) => {
          this.library.dao.findList('block', { id: { '$in': _.pluck(result, 'block_id')}}, 1000, null, null, ['height', 'id'], null, (err, data) => {
            if (err) {
              return reject(err);
            }
            reslove(data)
          });
        })
        const blockData = _.indexBy(blockData, 'id');
        result = _.map(result, num => {
          num.height = blockData[num.block_id].height;
          return num;
        });
        // 循环整合验证数据
        for (let i = 0; i < result.length; ++i) {
          let precision = result[i].precision
          result[i].maximum = bignum.new(result[i].maximum).toString(10);
          result[i].maximumShow = ddnUtils.Amount.calcRealAmount(result[i].maximum, precision);
          result[i].quantity = bignum.new(result[i].quantity).toString(10);
          result[i].quantityShow = ddnUtils.Amount.calcRealAmount(result[i].quantity, precision);
        }
        // 返回最终值
        cb(null, result)
      } catch(e){
        cb(e)
      }
    });
  }

  async addAssetQuantity(currency, amount, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    new Promise(async () => {
      const where = { name: currency }
      const data = await super.queryAsset(where, null, null, pageIndex, pageSize, 76);
      const quantity = data.quantity;
      const obj = { quantity: bignum.plus(quantity, amount).toString() };
      super.update(obj, where, 76, (err) => {
        if (err) {
          return reject(err);
        }
        cb();
      });

    })
  }

  async addAssetQuantity(currency, amount, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    new Promise(async () => {
      const where = { name: currency }
      let data = await super.queryAsset(where, null, null, pageIndex, pageSize, 76);
      data = data[0];
      const quantity = data.quantity;
      const obj = { quantity: bignum.plus(quantity, amount).toString() };
      super.insertOrUpdate(obj, 76, (err) => {
        if (err) {
          return reject(err);
        }
        cb();
      });
    })
  }


  updateAssetBalance(currency, amount, address, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    new Promise(async () => {
      const where = { address, currency }
      let data = await super.queryAsset(where, null, null, pageIndex, pageSize, 79);
      data = data[0];
      let balance = '0';
      if (data) {
        balance = data.balance
      }
      const newBalance = bignum.plus(balance, amount);
      var obj = { address, currency, balance: newBalance.toString() };
      super.insertOrUpdate(obj, 76, (err) => {
        if (err) {
          return reject(err);
        }
        cb();
      });
    })

  }


}
module.exports = helper;