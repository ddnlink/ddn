const { AssetBase } = require('ddn-asset-base');

class Issuer extends AssetBase {
  propsMapping() {
    return [
        {field: "str1", prop: "name", required: true},
        {field: "str2", prop: "issuer_id", required: true},
        {field: "str10", prop: "desc", required: true},
    ];
  }

  calculateFee() {
    return bignum.multiply(100, super.library.base.block.calculateFee());
  }

  verify(trs, sender, cb) {
    // 先调用基类的验证
    super.verify(trs, sender,(err, trans) => {
      if(err) {
        return cb(err);
      }
      // 验证是否存在重复数据
      const issuer = trans.asset.aobIssuer;
      var results = await super.queryAsset({ '$or': [ { name: issuer.name }, { issuer_id: issuer.issuer_id } ] }, ['name', 'issuer_id'], false, 1, 1);
      if (results && results.length > 0) {
          cb('issuer name or issuer_id already exists');
      } else {
          cb(null, trans);
      }
    })
  }

}
module.exports = Issuer;