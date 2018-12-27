const { AssetBase } = require('ddn-asset-base');

class Issuer extends AssetBase {
  propsMapping() {
    return [
        {field: "str1", prop: "name", required: true},
        {field: "str2", prop: "issuer_id" },
        {field: "str10", prop: "desc" },
    ];
  }

  calculateFee() {
    return bignum.multiply(100, super.library.tokenSetting.fixedPoint);
  }

  verify(trs, sender, cb) {
    // 先调用基类的验证
    super.verify(trs, sender,(err, trans) => {
      if(err) {
        return cb(err);
      }
      // 验证是否存在重复数据
      try{
        const issuer = trans.asset.aobIssuer;
        var results = super.queryAsset({ '$or': [ { name: issuer.name }, { issuer_id: issuer.issuer_id } ] }, null, false, 1, 1);
        if (results && results.length > 0) {
            cb('issuer name or issuer_id already exists');
        } else {
            cb(null, trans);
        }
      } catch (err2) {
        cb(err2);
      }
    })
  }

}
module.exports = Issuer;