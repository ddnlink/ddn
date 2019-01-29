const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');

class Issuer extends AssetBase {
  propsMapping() {
    return [{
      field: "str1",
      prop: "name",
      required: true
    },
    {
      field: "str2",
      prop: "issuer_id"
    },
    {
      field: "str10",
      prop: "desc"
    },
    ];
  }

  create(data, trs) {
    trs.recipient_id = null;
    trs.amount = "0";
    trs.asset.aobIssuer = {
      name: data.name,
      desc: data.desc,
      issuer_id: trs.sender_id,
    }
    return trs;
  }

  calculateFee() {
    return bignum.multiply(100, this.library.tokenSetting.fixedPoint);
  }

  verify(trs, sender, cb) {
    // 先调用基类的验证
    super.verify(trs, sender, async (err, trans) => {
      if (err) {
        return cb(err);
      }
      // 验证是否存在重复数据
      try {
        const issuer = trans.asset.aobIssuer;
        const orders = null;
        const returnTotal = null;
        const pageIndex = 1;
        const pageSize = 1;
        const data1 = await super.queryAsset({ name: issuer.name }, orders, returnTotal, pageIndex, pageSize);
        const data2 = await super.queryAsset({ issuer_id: trs.sender_id }, orders, returnTotal, pageIndex, pageSize);
        const results = data1.concat(data2);
        if (results && results.length > 0) {
          cb('Evidence name/issuer_id already exists');
        } else {
          cb(null, trans);
        }
      } catch (err2) {
        cb(err2);
      }
    })
  }

  apply(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    setImmediate(cb)
  }

  undo(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    setImmediate(cb)
  }

  applyUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const nameKey = `${trs.asset.aobIssuer.name}:${trs.type}`;
    const idKey = `${sender.address}:${trs.type}`;
    if (library.oneoff.has(nameKey) || library.oneoff.has(idKey)) {
      return setImmediate(cb, 'Double submit')
    }
    this.library.oneoff.set(nameKey, true)
    this.library.oneoff.set(idKey, true)
    setImmediate(cb)
  }

  undoUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const nameKey = `${trs.asset.aobIssuer.name}:${trs.type}`;
    const idKey = `${sender.address}:${trs.type}`;
    this.library.oneoff.delete(nameKey)
    this.library.oneoff.delete(idKey)
    setImmediate(cb)
  }

}
module.exports = Issuer;
