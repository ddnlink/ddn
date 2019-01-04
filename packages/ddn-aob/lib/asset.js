const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const Helper = require('ddn-utils')


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
        field: "str4",
        prop: "allow_writeoff"
      },
      {
        field: "str5",
        prop: "allow_whitelist"
      },
      {
        field: "str6",
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

      const fullName = asset.name;
      const issuerName = nameParts[0];
      const tokenName = nameParts[1];
      if (!tokenName || !/^[A-Z]{3,6}$/.test(tokenName)) return setImmediate(cb, 'Invalid asset currency name form ddn-aob')
      if (!asset.desc) return setImmediate(cb, 'Invalid asset desc form ddn-aob')
      if (asset.desc.length > 4096) return setImmediate(cb, 'Invalid asset desc size form ddn-aob')

      if (asset.precision > 16 || asset.precision < 0) return setImmediate(cb, 'Invalid asset precision form ddn-aob')

      if (asset.strategy && asset.strategy.length > 256) return setImmediate(cb, 'Invalid asset strategy size form ddn-aob')
      if (asset.allow_writeoff !== '0' && asset.allow_writeoff !== '1') return setImmediate(cb, 'Asset allowWriteoff is not valid form ddn-aob')
      if (asset.allow_whitelist !== '0' && asset.allow_whitelist !== '1') return setImmediate(cb, 'Asset allowWhitelist is not valid form ddn-aob')
      if (asset.allow_blacklist !== '0' && asset.allow_blacklist !== '1') return setImmediate(cb, 'Asset allowBlacklist is not valid form ddn-aob')

      try {
        const where = { name: asset.name }
        const orders = null;
        const returnTotal = null;
        const pageIndex = 1;
        const pageSize = 1;

        console.log('第一次去查询')

        let assetData = await super.queryAsset(where, orders, returnTotal, pageIndex, pageSize);
        if (assetData && assetData.length > 0) {
          cb('asset->name Double register form ddn-aob');
        }
        assetData = assetData[0];
        console.log('第二次去查询')

        // 缺少更多判断
        const issuerWhere = { name: issuerName };
        let issuerData = await super.queryAsset(issuerWhere, orders, returnTotal, pageIndex, pageSize, 75);

        if (issuerData && issuerData.length > 0) {
          issuerData = issuerData[0]
        } else {
          return cb('Issuer not exists form ddn-aob')
        }
        console.log('issuerData:', issuerData)
        console.log('sender:', sender)
        if (issuerData.issuer_id != sender.address) return cb('Permission not allowed form ddn-aob');

        return cb(null);

      } catch (err2) {

        console.log('err2', err2)

        cb(err2);
      }
    })
  }

}
module.exports = Asset;