const { AssetBase } = require('ddn-asset-base');

class Issuer extends AssetBase {
  create (data, trs) {
    trs.recipient_id = null;
    trs.amount = "0";
    trs.asset.aobIssuer = {
      name: data.name,
      desc: data.desc
    }
    return trs;
  }

  calculateFee (trs, sender) {
    return bignum.multiply(100, library.tokenSetting.fixedPoint);
  }

  verify (trs, sender, cb) {
    if (trs.recipient_id) return setImmediate(cb, 'Invalid recipient')
    //bignum update if (trs.amount != 0) 
    if (!bignum.isZero(trs.amount))
        return setImmediate(cb, 'Invalid transaction amount')

    const issuer = trs.asset.aobIssuer;
    if (!/^[A-Za-z]{1,16}$/.test(issuer.name)) return setImmediate(cb, 'Invalid issuer name')
    if (!issuer.desc) return setImmediate(cb, 'Invalid issuer desc')
    if (issuer.desc.length > 4096) return setImmediate(cb, 'Invalid issuer desc size')

    library.model.isIssuerExists(issuer.name, sender.address, (err, exists) => {
      if (err) return cb(err)
      if (exists) return cb('Double register')
      setImmediate(cb, null, trs)
    })
  }

  process (trs, sender, cb) {
    setImmediate(cb, null, trs)
  }

  getBytes (trs) {
    return Buffer.concat([
      new Buffer(trs.asset.aobIssuer.name, 'utf8'),
      new Buffer(trs.asset.aobIssuer.desc, 'utf8')
    ])
  }
  // 新增事务dbTrans ---wly
  apply (trs, block, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    setImmediate(cb)
  }
  // 新增事务dbTrans ---wly
  undo (trs, block, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    setImmediate(cb)
  }
  // 新增事务dbTrans ---wly
  applyUnconfirmed (trs, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const nameKey = `${trs.asset.aobIssuer.name}:${trs.type}`;
    const idKey = `${sender.address}:${trs.type}`;
    if (library.oneoff.has(nameKey) || library.oneoff.has(idKey)) {
      return setImmediate(cb, 'Double submit')
    }
    library.oneoff.set(nameKey, true)
    library.oneoff.set(idKey, true)
    setImmediate(cb)
  }
  // 新增事务dbTrans ---wly
  undoUnconfirmed (trs, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const nameKey = `${trs.asset.aobIssuer.name}:${trs.type}`;
    const idKey = `${sender.address}:${trs.type}`;
    library.oneoff.delete(nameKey)
    library.oneoff.delete(idKey)
    setImmediate(cb)
  }

  objectNormalize (trs) {
    const report = library.scheme.validate({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 16
        },
        desc: {
          type: 'string',
          minLength: 1,
          maxLength: 4096
        }
      },
      required: ['name', 'desc']
    }, trs.asset.aobIssuer);
    if (!report) {
      const err = library.scheme.errors[0];
      const msg = err.dataPath + " " + err.message;
      throw Error(`Can't parse issuer: ${msg}`)
    }
    return trs;
  }

  dbRead (raw) {
    if (!raw.issuers_name) {
      return null
    } else {
      const issuer = {
        transaction_id: raw.t_id,
        name: raw.issuers_name,
        desc: raw.issuers_desc
      };

      return { aobIssuer: issuer }
    }
  }

	/**
	 * 功能:新增一条issuers数据
	*/
  dbSave (trs, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const asset = trs.asset.aobIssuer;
    const values = {
      transaction_id: trs.id,
      issuer_id: trs.sender_id, //wxm block database
      name: asset.name,
      desc: asset.desc
    };
    library.dao.insert('issuer', values, dbTrans, cb);
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
module.exports = Issuer;