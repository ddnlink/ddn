const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const flagsHelper = require('./flagsHelper');

class Flags extends AssetBase {
  propsMapping() {
    return [];
  }

  create(data, trs) {
    trs.recipient_id = null;
    trs.amount = "0";
    trs.asset.aobFlags = {
      currency: data.currency,
      flag_type: data.flag_type,
      flag: data.flag
    }
    return trs;
  }

  verify(trs, sender, cb) {
    const helper = new Helper(this.library, this.modules);
    super.verify(trs, sender, (err, trans) => {
      if (trs.recipient_id) return setImmediate(cb, 'Invalid recipient')
      if (!bignum.isZero(trs.amount)) return setImmediate(cb, 'Invalid transaction amount')
  
      const asset = trs.asset.aobFlags;
      if (!flagsHelper.isValidFlagType(asset.flag_type)) return setImmediate(cb, 'Invalid asset flag type')
      if (!flagsHelper.isValidFlag(asset.flag_type, asset.flag)) return setImmediate(cb, 'Invalid asset flag')

      try{
        const where = { name: trs.asset.aobFlags.currency }
        const pageIndex = 1;
        const pageSize = 1;
        helper.getAssets(where, pageIndex, pageSize, (err, resulr) => {
          if (err) return cb(`Database error: ${err}`);
          result = result[0];
          if (!result) return cb('Asset not exists');
          if (result.issuer_id !== sender.address) return cb('Permission not allowed');
          if (result.writeoff) return cb('Asset already writeoff');
          if (!Number(result.allow_writeoff) && asset.flag_type === 2) return cb('Writeoff not allowed');
          if (!Number(result.allow_whitelist) && asset.flag_type === 1 && asset.flag === 1) return cb('Whitelist not allowed');
          if (!Number(result.allow_blacklist) && asset.flag_type === 1 && asset.flag === 0) return cb('Blacklist not allowed');
          if (flagsHelper.isSameFlag(asset.flag_type, asset.flag, result)) return cb('Flag double set');
          return cb();
        })
      } catch(e){
        cb('form ddn-aob flag', e);
      }
    })
  }

  apply = (trs, block, sender, dbTrans, cb) => {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const asset = trs.asset.aobFlags;
    const helper = new Helper(this.library, this.modules);
    helper.updateAssetFlag(asset.currency, asset.flag, flagsHelper.getTypeName(asset.flag_type), dbTrans, cb)
  }

  undo = (trs, block, sender, dbTrans, cb) => {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const asset = trs.asset.aobFlags;
    const helper = new Helper(this.library, this.modules);
    helper.updateAssetFlag(asset.currency, asset.flag ^ 1, flagsHelper.getTypeName(asset.flag_type), dbTrans, cb)
    setImmediate(cb)
  }

  applyUnconfirmed = (trs, sender, dbTrans, cb) => {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const key = `${trs.asset.aobFlags.currency}:${trs.type}`;
    if (library.oneoff.has(key)) {
      return setImmediate(cb, 'Double submit')
    }
    this.library.oneoff.set(key, true)
    setImmediate(cb)
  }

  undoUnconfirmed = (trs, sender, dbTrans, cb) => {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    this.library.oneoff.delete(`${trs.asset.aobFlags.currency}:${trs.type}`)
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
        flag_type: {
          type: 'integer'
        },
        flag: {
          type: 'integer'
        }
      },
      required: ['currency', 'flag_type', 'flag']
    }, trs.asset.aobFlags);
    if (!report) {
      throw Error(`Can't parse flags: ${library.scheme.errors[0]}`);
    }
    return trs;
  }

  dbRead(raw) {
    if (!raw.flags_currency) {
      return null
    } else {
      const asset = {
        transaction_id: raw.t_id,
        currency: raw.flags_currency,
        flag_type: raw.flags_flagType,
        flag: raw.flags_flag
      };

      return { aobFlags: asset }
    }
  }

  dbSave(trs, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
		};
    const asset = trs.asset.aobFlags;
    const values = {
      transaction_id: trs.id,
      currency: asset.currency,
      flag_type: asset.flag_type,
      flag: asset.flag
    };
    library.dao.insert('flag', values, dbTrans, cb);
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
module.exports = Flags;