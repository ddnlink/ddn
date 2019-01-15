const { AssetBase } = require('ddn-asset-base');
const _ = require('underscore');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');
const async = require('async');

class helper extends AssetBase {
  propsMapping() {
    return [];
  }
  getAssets(where, pageIndex, pageSize, cb) {
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
        blockData = _.indexBy(blockData, 'id');
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
        cb(null, result);
      } catch(e){
        console.log('-- from ddn-aob.helper.getAssets -> e:',e);
        cb(e)
      }
    });
  }

  addAssetQuantity(currency, amount, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    new Promise(async () => {
      try{
        const where = { name: currency, trs_type: 76 }
        let data = await super.queryAsset(where, null, null, 1, 1, 'AobAsset');
        data = data[0];
        const quantity = data.quantity;
        const obj = { quantity: bignum.plus(quantity, amount).toString() };
        super.update(obj, where, 'AobAsset', dbTrans, (err) => {
          if (err) {
            console.log('-- from ddn-aob.helper.addAssetQuantity -> err:', err)
            cb(err);
          }
          cb();
        });
      } catch(e){
        console.log('-- from ddn-aob.helper.addAssetQuantity -> e:', e);
        cb(e);
      }

    })
  }

  updateAssetBalance(currency, amount, address, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    new Promise(async () => {
      try{
        async.waterfall([
          cbk => {
            library.dao.findOne('mem_asset_balance', { address, currency }, ["balance"], cbk);
          },
          (data, cbk) => {
            let balance = '0';
            if (data) {
              balance = data.balance
            }
            const newBalance = bignum.plus(balance, amount);
            if (bignum.isLessThan(newBalance, 0)) {
              return cbk('Asset balance not enough')
            }
            if(data){
              library.dao.update('mem_asset_balance', { balance: newBalance.toString() }, { address, currency }, dbTrans, cbk);
            } else {
              library.dao.insert('mem_asset_balance', { address, currency, balance: newBalance.toString() }, dbTrans, cbk);
            }
          }
        ],err => {
          if (err) return cb(`Database error when updateBalance: ${err}`);
          cb() 
        })
      } catch(e){
        console.log('-- from ddn-aob.helper.updateAssetBalance -> e:',e);
      }
    })
  }

  updateAssetFlag(currency, flag, flagName, dbTrans, cb){
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    try{
      const where = { name: currency, trs_type: 76 }
      const obj = { [flagName]: flag };
      super.update(obj, where, 'AobAsset', dbTrans, (err) => {
        if (err) {
          console.log('-- from ddn-aob.helper.updateAssetFlag -> err:', err)
          cb(err);
        }
        cb();
      });
    }catch(e){
      console.log('-- from ddn-aob.helper.updateAssetFlag -> e:', e);
      cb(e);
    }
  }


}
module.exports = helper;