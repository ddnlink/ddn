const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
// eslint-disable-next-line
const _ = require('lodash');
const ddnUtils = require('ddn-utils');
const flagsHelper = require('./flagsHelper');

class Acl extends AssetBase {
  // eslint-disable-next-line class-methods-use-this
  async propsMapping() {
    return [{
      field: 'str1',
      prop: 'currency',
      required: true,
    },
    {
      field: 'str2',
      prop: 'operator',
    },
    {
      field: 'str10',
      prop: 'list',
    },
    {
      field: 'int1',
      prop: 'flag',
    },
    ];
  }

  async calculateFee() {
    return bignum.multiply(2, this.tokenSetting.fixedPoint);
  }

  async verify(trs, sender) {
    if (trs.recipient_id) {
      throw new Error('Invalid recipient');
    }
    if (!bignum.isZero(trs.amount)) {
      throw new Error('Invalid transaction amount');
    }
    const asset = trs.asset.aobAcl;
    if (['+', '-'].indexOf(asset.operator) === -1) {
      throw new Error('nvalid acl operator');
    }
    if (!flagsHelper.isValidFlag(1, asset.flag)) {
      throw new Error('Invalid acl flag');
    }
    if (!_.isArray(asset.list) || asset.list.length === 0 || asset.list.length > 10) {
      throw new Error('Invalid acl list');
    }
    for (let i = 0; i < asset.list.length; i += 1) {
      if (!ddnUtils.Address.isAddress(asset.list[i])) {
        throw new Error('Acl contains invalid address');
      }
      if (sender.address === asset.list[i]) {
        throw new Error('Issuer should not be in ACL list');
      }
    }
    if (_.uniq(asset.list).length !== asset.list.length) {
      throw new Error('Duplicated acl address');
    }

    const assetData = await super.queryAsset({
      name: asset.currency,
    }, null, null, 1, 1, 61);
    if (assetData && assetData.length > 0) {
      throw new Error('asset->name Double register form ddn-aob');
    }
    if (assetData[0].writeoff) {
      throw new Error('Asset already writeoff');
    }
    if (!Number(assetData[0].allow_writeoff) && asset.flag_type === 2) {
      throw new Error('Writeoff not allowed');
    }
    if (!Number(assetData[0].allow_whitelist) && asset.flag_type === 1 && asset.flag === 1) {
      throw new Error('Whitelist not allowed');
    }
    if (!Number(assetData[0].allow_blacklist) && asset.flag_type === 1 && asset.flag === 0) {
      throw new Error('Blacklist not allowed');
    }
    const issuerData = await super.queryAsset({
      name: asset.currency,
    }, null, null, 1, 1, 60);
    if (issuerData[0].issuer_id !== sender.address) {
      throw new Error('Permission not allowed');
    }

    const table = flagsHelper.getAclTable(asset.flag);
    const condition = [{
      currency: asset.currency,
    },
    {
      address: {
        $in: asset.list,
      },
    },
    ];
    if (asset.operator === '+') {
      await this.model.exists(table, condition);
    }
    return null;
  }

  // eslint-disable-next-line
  async getBytes(trs) {
    // eslint-disable-next-line no-undef
    const bb = new ByteBuffer();
    const asset = trs.asset.aobAcl;
    bb.writeString(asset.currency);
    bb.writeString(asset.operator);
    bb.writeByte(asset.flag);
    for (let i = 0; i < asset.list.length; i += 1) {
      bb.writeString(asset.list[i]);
    }
    bb.flip();
    return bb.toBuffer();
  }


  async apply(trs, block, sender, dbTrans, cb) {
    const asset = trs.asset.aobAcl;
    const table = flagsHelper.getAclTable(asset.flag);
    if (asset.operator === '+') {
      this.model.addAssetAcl(table, asset.currency, asset.list, dbTrans, cb);
    } else {
      this.model.removeAssetAcl(table, asset.currency, asset.list, dbTrans, cb);
    }
    return null;
  }

  async undo(trs, block, sender, dbTrans, cb) {
    const asset = trs.asset.aobAcl;
    const table = flagsHelper.getAclTable(asset.flag);
    if (asset.operator === '-') {
      this.model.addAssetAcl(table, asset.currency, asset.list, dbTrans, cb);
    } else {
      this.model.removeAssetAcl(table, asset.currency, asset.list, dbTrans, cb);
    }
    return null;
  }

  async dbSave(trs, dbTrans) {
    const asset = trs.asset.aobAcl;
    const values = {
      transaction_id: trs.id,
      currency: asset.currency,
      operator: asset.operator,
      flag: asset.flag,
      list: asset.list.join(','),
    };
    const trans = trs;
    trans.asset.aobAcl = values;
    super.dbSave(trans, dbTrans);
  }
}
module.exports = Acl;
