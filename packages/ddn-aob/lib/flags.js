const { AssetBase } = require('ddn-asset-base');
const ByteBuffer = require('bytebuffer');
const bignum = require('bignum-utils');

class Flags extends AssetBase {
  create (data, trs) {
    trs.recipient_id = null //wxm block database
    trs.amount = "0";   //bignum update
    trs.asset.aobFlags = {
      currency: data.currency,
      flag_type: data.flag_type,
      flag: data.flag
    }
    return trs;
  }

  calculateFee (trs, sender) {
    super.library.base.block.calculateFee();
  }

  verify (trs, sender, cb) {
    if (trs.recipient_id) return setImmediate(cb, 'Invalid recipient')
    //bignum update if (trs.amount != 0) 
    if (!bignum.isZero(trs.amount))
        return setImmediate(cb, 'Invalid transaction amount')

    const asset = trs.asset.aobFlags;
    if (!flagsHelper.isValidFlagType(asset.flag_type)) return setImmediate(cb, 'Invalid asset flag type')
    if (!flagsHelper.isValidFlag(asset.flag_type, asset.flag)) return setImmediate(cb, 'Invalid asset flag')

    super.library.model.getAssetByName(trs.asset.aobFlags.currency, (err, result) => {
      if (err) return cb(`Database error: ${err}`);
      if (!result) return cb('Asset not exists')

      if (result.issuer_id !== sender.address) return cb('Permission not allowed')

      if (result.writeoff) return cb('Asset already writeoff')

      if (!result.allow_writeoff && asset.flag_type === 2) return cb('Writeoff not allowed')
      if (!result.allow_whitelist && asset.flag_type === 1 && asset.flag === 1) return cb('Whitelist not allowed')
      if (!result.allow_blacklist && asset.flag_type === 1 && asset.flag === 0) return cb('Blacklist not allowed')
      if (flagsHelper.isSameFlag(asset.flag_type, asset.flag, result)) return cb('Flag double set')

      return cb()
    })
  }

  process (trs, sender, cb) {
    setImmediate(cb, null, trs)
  }

  getBytes (trs) {
    const bb = new ByteBuffer();
    const asset = trs.asset.aobFlags;
    bb.writeString(asset.currency)
    bb.writeByte(asset.flag_type)
    bb.writeByte(asset.flag)
    bb.flip()
    return bb.toBuffer()
  }
  
  // 新增事务dbTrans ---wly
  apply (trs, block, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const asset = trs.asset.aobFlags;
    super.library.model.updateAssetFlag(asset.currency, asset.flag, flagsHelper.getTypeName(asset.flag_type), dbTrans, cb)
  }

  // 新增事务dbTrans ---wly
  undo (trs, block, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const asset = trs.asset.aobFlags;
    super.library.model.updateAssetFlag(asset.currency, asset.flag ^ 1, flagsHelper.getTypeName(asset.flag_type), dbTrans, cb)
    setImmediate(cb)
  }

  // 新增事务dbTrans ---wly
  applyUnconfirmed (trs, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const key = `${trs.asset.aobFlags.currency}:${trs.type}`;
    if (super.library.oneoff.has(key)) {
      return setImmediate(cb, 'Double submit')
    }
    super.library.oneoff.set(key, true)
    setImmediate(cb)
  }

  // 新增事务dbTrans ---wly
  undoUnconfirmed (trs, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    super.library.oneoff.delete(`${trs.asset.aobFlags.currency}:${trs.type}`)
    setImmediate(cb)
  }

  objectNormalize (trs) {
    const report = super.library.scheme.validate({
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
      throw Error(`Can't parse flags: ${super.library.scheme.errors[0]}`)
    }

    return trs
  }

  dbRead (raw) {
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

	/**
	 * 功能:新增一条flags数据
	*/
  dbSave (trs, dbTrans, cb) {
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
    super.library.dao.insert('flag', values, dbTrans, cb);
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
module.exports = Flags;