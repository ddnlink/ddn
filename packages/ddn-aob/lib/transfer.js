const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');

class Transfer extends AssetBase {
  propsMapping() {
    return [{
      field: "str1",
      prop: "currency"
    },
    {
      field: "str2",
      prop: "amount"
    }
    ];
  }

  verify(trs, sender, cb) {
    if (!bignum.isZero(trs.amount)) return setImmediate(cb, 'Invalid transaction amount')
    cb()
  }

}
module.exports = Transfer;