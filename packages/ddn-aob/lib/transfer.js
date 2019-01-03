const { AssetBase } = require('ddn-asset-base');

class Transfer extends AssetBase {
  propsMapping() {
    return [{
      field: "str1",
      prop: "currency",
      required: true
    },
    {
      field: "str2",
      prop: "amount"
    }
    ];
  }
}
module.exports = Transfer;