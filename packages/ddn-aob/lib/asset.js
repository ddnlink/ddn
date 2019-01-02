const { AssetBase } = require('ddn-asset-base');

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
}
module.exports = Asset;