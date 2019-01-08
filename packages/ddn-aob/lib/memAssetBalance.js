const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');


class memAssetBalance extends AssetBase {
  propsMapping() {
    return [{
        field: "str4",
        prop: "address",
        required: true
      },
      {
        field: "str2",
        prop: "balance"
      },
      {
        field: "str1",
        prop: "currency"
      },
    ];
  }
}
module.exports = memAssetBalance;