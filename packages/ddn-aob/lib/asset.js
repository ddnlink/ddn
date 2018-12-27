const { AssetBase } = require('ddn-asset-base');
const assert = require('assert');
const bignum = require('bignum-utils');
const { Amount } = require('ddn-utils');

class Asset extends AssetBase {
  create(data, trs) {
    trs.recipient_id = null
    trs.amount = "0"; //bignum update
    trs.asset.aobAsset = {
      name: data.name,
      desc: data.desc,
      maximum: data.maximum,
      precision: data.precision,
      strategy: data.strategy,
      allow_writeoff: data.allowWriteoff,
      allow_whitelist: data.allowWhitelist,
      allow_blacklist: data.allowBlacklist
    }
    return trs;
  }

  calculateFee(trs, sender) {
    return bignum.multiply(500, library.tokenSetting.fixedPoint);
  }


  verify(trs, sender, cb) {
    if (trs.recipient_id) return setImmediate(cb, 'Invalid recipient')
    //bignum update if (trs.amount != 0)
    if (!bignum.isZero(trs.amount))
      return setImmediate(cb, 'Invalid transaction amount')

    const asset = trs.asset.aobAsset;
    const nameParts = (asset.name || '').split('.');
    if (nameParts.length != 2) return setImmediate(cb, 'Invalid asset full name')

    const fullName = asset.name;
    const issuerName = nameParts[0];
    const tokenName = nameParts[1];
    if (!tokenName || !/^[A-Z]{3,6}$/.test(tokenName)) return setImmediate(cb, 'Invalid asset currency name')
    if (!asset.desc) return setImmediate(cb, 'Invalid asset desc')
    if (asset.desc.length > 4096) return setImmediate(cb, 'Invalid asset desc size')

    if (asset.precision > 16 || asset.precision < 0) return setImmediate(cb, 'Invalid asset precision')

    const error = Amount.validate(asset.maximum);
    if (error) return setImmediate(cb, error)

    if (asset.strategy && asset.strategy.length > 256) return setImmediate(cb, 'Invalid asset strategy size')

    if (asset.allow_writeoff !== 0 && asset.allow_writeoff !== 1) return setImmediate(cb, 'Asset allowWriteoff is not valid')
    if (asset.allow_whitelist !== 0 && asset.allow_whitelist !== 1) return setImmediate(cb, 'Asset allowWhitelist is not valid')
    if (asset.allow_blacklist !== 0 && asset.allow_blacklist !== 1) return setImmediate(cb, 'Asset allowBlacklist is not valid')

    library.model.exists('assets', {
      name: fullName
    }, (err, exists) => {

      if (err) return cb(err)
      if (exists) return cb('Double register')
      library.model.getIssuerByName(issuerName, ['issuer_id'], (err, issuer) => {
        if (err) return cb(err)
        if (!issuer) return cb('Issuer not exists')
        if (issuer.issuer_id != sender.address) return cb('Permission not allowed')
        return cb(null)
      })
    })
  }

  process(trs, sender, cb) {
    setImmediate(cb, null, trs)
  }

  getBytes(trs) {
    const asset = trs.asset.aobAsset;
    let buffer = Buffer.concat([
      new Buffer(asset.name, 'utf8'),
      new Buffer(asset.desc, 'utf8'),
      new Buffer(asset.maximum, 'utf8'),
      Buffer.from([asset.precision || 0]),
      new Buffer(asset.strategy || '', 'utf8'),
      Buffer.from([asset.allow_writeoff || 0]),
      Buffer.from([asset.allow_whitelist || 0]),
      Buffer.from([asset.allow_blacklist || 0])
    ]);

    const strategy = trs.asset.aobAsset.strategy;
    if (strategy) {
      buffer = Buffer.concat([buffer, ])
    }
    return buffer
  }

  // 新增事务dbTrans ---wly
  apply(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    setImmediate(cb)
  }

  // 新增事务dbTrans ---wly
  undo(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    setImmediate(cb)
  }

  // 新增事务dbTrans ---wly
  applyUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const key = `${trs.asset.aobAsset.name}:${trs.type}`;
    if (library.oneoff.has(key)) {
      return setImmediate(cb, 'Double submit')
    }
    library.oneoff.set(key, true)
    setImmediate(cb)
  }

  // 新增事务dbTrans ---wly
  undoUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    library.oneoff.delete(`${trs.asset.aobAsset.name}:${trs.type}`)
    setImmediate(cb)
  }

  objectNormalize(trs) {
    const report = library.scheme.validate({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          minLength: 3,
          maxLength: 22
        },
        desc: {
          type: 'string',
          minLength: 1,
          maxLength: 4096
        },
        maximum: {
          type: 'string',
          minLength: 1,
          maxLength: 50
        },
        precision: {
          type: 'integer',
          minimum: 0,
          maximum: 16
        },
        strategy: {
          type: 'string',
          maxLength: 256
        },
        allow_writeoff: {
          type: 'integer',
          mininum: 0,
          maximum: 1
        },
        allow_whitelist: {
          type: 'integer',
          mininum: 0,
          maximum: 1
        },
        allow_blacklist: {
          type: 'integer',
          mininum: 0,
          maximum: 1
        }
      },
      required: ['name', 'desc', 'maximum', 'precision']
    }, trs.asset.aobAsset);

    if (!report) {
      throw Error(`Can't parse asset: ${library.scheme.errors[0]}`)
    }

    return trs
  }

  dbRead(raw) {
    if (!raw.assets_name) {
      return null
    } else {
      const asset = {
        transaction_id: raw.t_id,
        name: raw.assets_name,
        desc: raw.assets_desc,
        maximum: raw.assets_maximum,
        precision: raw.assets_precision,
        strategy: raw.assets_strategy,
        allow_writeoff: raw.assets_allowWriteoff,
        allow_whitelist: raw.assets_allowWhitelist,
        allow_blacklist: raw.assets_allowBlacklist
      };

      return {
        aobAsset: asset
      }
    }
  }

  /**
   * 功能:新增一条assets数据
   */
  dbSave(trs, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const asset = trs.asset.aobAsset;
    const nameParts = asset.name.split('.');
    assert(nameParts.length == 2)
    // --wly 数据库字段修改
    const values = {
      transaction_id: trs.id,
      issuer_name: nameParts[0],
      quantity: '0',
      name: asset.name,
      desc: asset.desc,
      maximum: asset.maximum,
      precision: asset.precision,
      strategy: asset.strategy,
      allow_writeoff: asset.allow_writeoff || 0,
      allow_whitelist: asset.allow_whitelist || 0,
      allow_blacklist: asset.allow_blacklist || 0,
      acl: 0,
      writeoff: 0
    };
    library.dao.insert('asset', values, dbTrans, cb)
  }

  ready = (trs, sender) => {
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
module.exports = Asset;