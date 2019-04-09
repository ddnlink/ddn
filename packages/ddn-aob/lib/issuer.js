const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');

class Issuer extends AssetBase {
  // eslint-disable-next-line class-methods-use-this
  async propsMapping() {
    return [
      {
        field: 'str1',
        prop: 'name',
        required: true,
      },
      {
        field: 'str2',
        prop: 'issuer_id',
      },
      {
        field: 'str10',
        prop: 'desc',
      },
    ];
  }

  async calculateFee() {
    return bignum.multiply(100, this.tokenSetting.fixedPoint);
  }

  async verify(trs, sender) {
    // 先调用基类的验证
    const trans = await super.verify(trs, sender);
    // 验证是否存在重复数据
    const data1 = await super.queryAsset({
      name: trans.asset.aobIssuer.name,
    }, null, null, 1, 1);
    const data2 = await super.queryAsset({
      issuer_id: trs.sender_id,
    }, null, null, 1, 1);
    const results = data1.concat(data2);
    if (results && results.length > 0) {
      throw new Error('Evidence name/issuer_id already exists');
    } else {
      return trans;
    }
  }
}
module.exports = Issuer;
