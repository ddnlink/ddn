const { AssetBase } = require('ddn-asset-base');
const assert = require('assert');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');


class Asset extends AssetBase {
  propsMapping() {
    return [{
        field: "str1",
        prop: "name",
        required: true
      },
      {
        field: "str9",
        prop: "desc"
      },
      {
        field: "str2",
        prop: "maximum"
      },
      {
        field: "str3",
        prop: "quantity"
      },
      {
        field: "str4",
        prop: "issuer_name"
      },
      {
        field: "str10",
        prop: "strategy"
      },
      {
        field: "int1",
        prop: "precision"
      },
      {
        field: "int2",
        prop: "acl"
      },
      {
        field: "int3",
        prop: "writeoff"
      },
      {
        field: "str5",
        prop: "allow_writeoff"
      },
      {
        field: "str6",
        prop: "allow_whitelist"
      },
      {
        field: "str7",
        prop: "allow_blacklist"
      },
    ];
  }

  create(data, trs) {
    trs.recipient_id = null
    trs.amount = "0";
    trs.asset.aobAsset = {
      name: data.name,
      desc: data.desc,
      maximum: data.maximum,
      precision: data.precision,
      strategy: data.strategy,
      allow_writeoff: data.allow_writeoff,
      allow_whitelist: data.allow_whitelist,
      allow_blacklist: data.allow_blacklist
    }
    return trs;
  }

  calculateFee(trs, sender) {
    return bignum.multiply(500, this.library.tokenSetting.fixedPoint);
  }

  verify(trs, sender, cb) {
    super.verify(trs, sender, async(err, trans) => {
      if (err) {
        return cb(err);
      }
      const asset = trs.asset.aobAsset;
      const nameParts = (asset.name || '').split('.');
      if (nameParts.length != 2) return setImmediate(cb, 'Invalid asset full name form ddn-aob')
      const issuerName = nameParts[0];
      const tokenName = nameParts[1];
      if (!tokenName || !/^[A-Z]{3,6}$/.test(tokenName)) return setImmediate(cb, 'Invalid asset currency name form ddn-aob')
      if (!asset.desc) return swetImmediate(cb, 'Invalid asset desc form ddn-aob')
      if (asset.desc.length > 4096) return setImmediate(cb, 'Invalid asset desc size form ddn-aob')
      if (asset.precision > 16 || asset.precision < 0) return setImmediate(cb, 'Invalid asset precision form ddn-aob')
      const error = ddnUtils.Amount.validate(asset.maximum);
      if (error) return setImmediate(cb, error);
      if (asset.strategy && asset.strategy.length > 256) return setImmediate(cb, 'Invalid asset strategy size form ddn-aob')
      if (asset.allow_writeoff !== '0' && asset.allow_writeoff !== '1') return setImmediate(cb, 'Asset allowWriteoff is not valid form ddn-aob')
      if (asset.allow_whitelist !== '0' && asset.allow_whitelist !== '1') return setImmediate(cb, 'Asset allowWhitelist is not valid form ddn-aob')
      if (asset.allow_blacklist !== '0' && asset.allow_blacklist !== '1') return setImmediate(cb, 'Asset allowBlacklist is not valid form ddn-aob')
      try {
        const where = { name: asset.name };
        const orders = null;
        const returnTotal = null;
        const pageIndex = 1;
        const pageSize = 1;
        let assetData = await super.queryAsset(where, orders, returnTotal, pageIndex, pageSize);
        if (assetData && assetData.length > 0) {
          cb('asset->name Double register form ddn-aob');
        }
        assetData = assetData[0];
        const issuerWhere = { name: issuerName };
        let issuerData = await super.queryAsset(issuerWhere, orders, returnTotal, pageIndex, pageSize, 75);
        if (issuerData && issuerData.length > 0) {
          issuerData = issuerData[0]
        } else {
          return cb('Issuer not exists form ddn-aob')
        }
        if (issuerData.issuer_id != sender.address) return cb('Permission not allowed form ddn-aob');
        return cb(null);
      } catch (err2) {
        cb(err2);
      }
    })
  }

  getBytes (trs) {
    const asset = trs.asset.aobAsset;
    let buffer = Buffer.concat([
      new Buffer(asset.name, 'utf8'),
      new Buffer(asset.desc, 'utf8'),
      new Buffer(asset.maximum, 'utf8'),
      Buffer.from([asset.precision || 0]),
      new Buffer(asset.strategy || '', 'utf8'),
      Buffer.from([asset.allow_writeoff || '0']),
      Buffer.from([asset.allow_whitelist || '0']),
      Buffer.from([asset.allow_blacklist || '0'])
    ]);

    const strategy = trs.asset.aobAsset.strategy;
    if (strategy) {
      buffer = Buffer.concat([buffer, ]);
    }
    return buffer;
  }

  dbSave (trs, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
		};
    const asset = trs.asset.aobAsset;
    const nameParts = asset.name.split('.');
    assert(nameParts.length == 2)
    const values = {
      issuer_name: nameParts[0],
      quantity: '0',
      name: asset.name,
      desc: asset.desc,
      maximum: asset.maximum,
      precision: asset.precision,
      strategy: asset.strategy,
      allow_writeoff: asset.allow_writeoff || '0',
      allow_whitelist: asset.allow_whitelist || '0',
      allow_blacklist: asset.allow_blacklist || '0',
      acl: 0,
      writeoff: 0
    };
    trs.asset.aobAsset = values;
    super.dbSave(trs, dbTrans, cb);
  }
 
}
module.exports = Asset;