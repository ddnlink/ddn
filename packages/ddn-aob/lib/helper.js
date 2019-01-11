const { AssetBase } = require('ddn-asset-base');
const _ = require('underscore');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');
const MemAssetBalance = require('./memAssetBalance');

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

  async addAssetQuantity(currency, amount, dbTrans, cb) {
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

  updateAssetBalance(trs, currency, amount, address, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    new Promise(async () => {
      try{
        const where = { address, currency, trs_type: '79' }
        let data = await super.queryAsset(where, null, null, 1, 1, 'MemAssetBalance');
        data = data[0];
        let balance = '0';
        if (data) {
          balance = data.balance
        }
        const newBalance = bignum.plus(balance, amount);
        // (1)先查询是否存在，在确定是更新还是添加
        if(data){
          // 存在data则进行更新
          const obj = { balance: newBalance.toString() };
          super.update(obj, where, 'MemAssetBalance', dbTrans,(err) => {
            if (err) {
              console.log('-- from ddn-aob.helper.updateAssetBalance -> err:', err)
              cb(err);
            }
            cb();
          });
        } else {
          const memAssetBalance = new MemAssetBalance(this.library, this.modules);
          // 不存在则创建一个trs,让trs创建对应的数据 fix 将数字使用方法查询到
          let id = trs.id.substr(0, trs.id.length - 3);
          id = id + 'abc';
          const newTrs = {
            id, // 造的假id!
            timestamp: trs.timestamp,
            type: '79',
            asset: {
              memAssetBalance: {
                address, currency, balance: newBalance.toString()
              }
            }
          }
          memAssetBalance.dbSave(newTrs, dbTrans, cb);
        }
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