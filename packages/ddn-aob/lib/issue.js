const { AssetBase } = require('ddn-asset-base');

class Issue extends AssetBase {
  propsMapping() {
    return [{
      field: "str1",
      prop: "currency",
      required: true
    },
    {
      field: "str2",
      prop: "amount",
      required: true
    }
    ];
  }
}
module.exports = Issue;