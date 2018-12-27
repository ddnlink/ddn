const { AssetBase } = require('ddn-asset-base');
const ByteBuffer = require('bytebuffer');
const bignum = require('bignum-utils');
const _ = require('lodash');
const { Address } = require('ddn-utils');

class Acl extends AssetBase {
  create(data, trs) {
    trs.recipient_id = null
    trs.amount = "0";
    trs.asset.aobAcl = {
      currency: data.currency,
      operator: data.operator,
      flag: data.flag,
      list: data.list
    }
    return trs;
  }

  calculateFee() {
    return bignum.multiply(2, library.base.block.calculateFee());
  }

  verify(trs, sender, cb) {
    if (trs.recipient_id) return setImmediate(cb, 'Invalid recipient')
    //bignum update if (trs.amount != 0) 
    if (!bignum.isZero(trs.amount))
      return setImmediate(cb, 'Invalid transaction amount')

    const asset = trs.asset.aobAcl;
    if (['+', '-'].indexOf(asset.operator) == -1) return setImmediate(cb, 'Invalid acl operator')
    if (!flagsHelper.isValidFlag(1, asset.flag)) return setImmediate(cb, 'Invalid acl flag')
    if (!_.isArray(asset.list) || asset.list.length == 0 || asset.list.length > 10) return setImmediate(cb, 'Invalid acl list')

    for (let i = 0; i < asset.list.length; ++i) {
      if (!Address.isAddress(asset.list[i])) return setImmediate(cb, 'Acl contains invalid address')
      if (sender.address === asset.list[i]) return setImmediate(cb, 'Issuer should not be in ACL list')
    }
    if (_.uniq(asset.list).length != asset.list.length) return setImmediate(cb, 'Duplicated acl address')

    library.model.getAssetByName(asset.currency, (err, result) => {
      if (err) return cb(err)
      if (!result) return cb('Asset not exists')

      if (result.issuer_id !== sender.address) return cb('Permission not allowed')

      if (result.writeoff) return cb('Asset already writeoff')
      // if (result.acl != asset.flag) return cb('Current flag not match')

      if (result.allow_whitelist === 0 && asset.flag === 1) return cb('Whitelist not allowed')
      if (result.allow_blacklist === 0 && asset.flag === 0) return cb('Blacklist not allowed')

      const table = flagsHelper.getAclTable(asset.flag);
      const condition = [{
          currency: asset.currency
        },
        {
          address: {
            $in: asset.list
          }
        }
      ];
      if (asset.operator == '+') {
        library.model.exists(table, condition, (err, exists) => {
          if (err) return cb(err)
          if (exists) return cb('Double add acl address')
          return cb()
        })
      } else {
        return cb()
      }
    })
  }

  process(trs, sender, cb) {
    setImmediate(cb, null, trs)
  }

  getBytes(trs) {
    const bb = new ByteBuffer();
    const asset = trs.asset.aobAcl;
    bb.writeString(asset.currency)
    bb.writeString(asset.operator)
    bb.writeByte(asset.flag)
    for (let i = 0; i < asset.list.length; ++i) {
      bb.writeString(asset.list[i])
    }
    bb.flip()
    return bb.toBuffer()
  }

  apply(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const asset = trs.asset.aobAcl;
    const table = flagsHelper.getAclTable(asset.flag);
    if (asset.operator == '+') {
      library.model.addAssetAcl(table, asset.currency, asset.list, dbTrans, cb)
    } else {
      library.model.removeAssetAcl(table, asset.currency, asset.list, dbTrans, cb)
    }
  }

  undo(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const asset = trs.asset.aobAcl;
    const table = flagsHelper.getAclTable(asset.flag);
    if (asset.operator == '-') {
      library.model.addAssetAcl(table, asset.currency, asset.list, dbTrans, cb)
    } else {
      library.model.removeAssetAcl(table, asset.currency, asset.list, dbTrans, cb)
    }
    setImmediate(cb)
  }

  applyUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const key = `${trs.asset.aobAcl.currency}:${trs.type}`;
    if (library.oneoff.has(key)) {
      return setImmediate(cb, 'Double submit')
    }
    library.oneoff.set(key, true)
    setImmediate(cb)
  }

  undoUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    library.oneoff.delete(`${trs.asset.aobAcl.currency}:${trs.type}`)
    setImmediate(cb)
  }

  /**
   * 功能:验证参数
   * @param {*} trs 
   */
  objectNormalize(trs) {
    const report = library.scheme.validate({
      type: 'object',
      properties: {
        currency: {
          type: 'string',
          minLength: 1,
          maxLength: 22
        },
        operator: {
          type: 'string',
          minLength: 1,
          maxLength: 1
        },
        flag: {
          type: 'integer'
        },
        list: {
          type: 'array',
          minLength: 1,
          maxLength: 10,
          uniqueItems: true
        }
      },
      required: ['currency', 'operator', 'flag', 'list']
    }, trs.asset.aobAcl);

    if (!report) {
      throw Error(`Can't parse acl: ${library.scheme.errors[0]}`)
    }

    return trs
  }

  dbRead(raw) {
    if (!raw.acls_currency) {
      return null
    } else {
      const asset = {
        transaction_id: raw.t_id,
        currency: raw.acls_currency,
        operator: raw.acls_operator,
        flag: raw.acls_flag,
        list: raw.acls_list.split(',')
      };
      return {
        aobAcl: asset
      }
    }
  }

  /**
   * 功能:新增一条acl数据
   */
  dbSave(trs, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const asset = trs.asset.aobAcl;
    const values = {
      transaction_id: trs.id,
      currency: asset.currency,
      operator: asset.operator,
      flag: asset.flag,
      list: asset.list.join(',')
    };
    library.dao.insert('acl', values, dbTrans, cb)
  }

  ready(trs, sender) {
    if (sender.multisignatures.length) {
      if (!trs.signatures) {
        return false
      }
      return trs.signatures.length >= sender.multimin - 1
    } else {
      return true
    }
  }

}

module.exports = Acl;