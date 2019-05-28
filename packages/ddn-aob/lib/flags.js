const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const flagsHelper = require('./flagsHelper');

class Flags extends AssetBase {
  // eslint-disable-next-line
  async propsMapping() {
    return [{
      field: 'str1',
      prop: 'currency',
      required: true,
    },
    {
      field: 'int1',
      prop: 'flag',
    },
    {
      field: 'int2',
      prop: 'flag_type',
    },
    ];
  }
  // eslint-disable-next-line
  async verify(trs, sender) {
    if (trs.recipient_id) {
      throw new Error('Invalid recipient');
    }
    if (!bignum.isZero(trs.amount)) {
      throw new Error('Invalid transaction amount');
    }
    const asset = trs.asset.aobFlags;
    if (!flagsHelper.isValidFlagType(asset.flag_type)) {
      throw new Error('Invalid asset flag type');
    }
    if (!flagsHelper.isValidFlag(asset.flag_type, asset.flag)) {
      throw new Error('Invalid asset flag');
    }

    const assetData = await super.queryAsset({
      name: trs.asset.aobFlags.currency,
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
      name: trs.asset.aobFlags.currency,
    }, null, null, 1, 1, 60);
    if (issuerData[0].issuer_id !== sender.address) {
      throw new Error('Permission not allowed');
    }
    if (flagsHelper.isSameFlag(asset.flag_type, asset.flag, assetData)) {
      throw new Error('Flag double set');
    }
    return null;
  }

  async apply(trs, block, sender, dbTrans) {
    const asset = trs.asset.aobFlags;
    const where = {
      name: asset.currency,
      trs_type: 61,
    };
    const obj = {
      [flagsHelper.getTypeName(asset.flag_type)]: asset.flag,
    };
    super.update(obj, where, 'AobAsset', dbTrans);
    return null;
  }

  undo(trs, block, sender, dbTrans) {
    const asset = trs.asset.aobFlags;
    const where = {
      name: asset.currency,
      trs_type: 61,
    };
    const obj = {
      // eslint-disable-next-line no-bitwise
      [flagsHelper.getTypeName(asset.flag_type)]: asset.flag ^ 1,
    };
    super.update(obj, where, 'AobAsset', dbTrans);
    return null;
  }

  async dbSave(trs, dbTrans) {
    const asset = trs.asset.aobFlags;
    const values = {
      transaction_id: trs.id,
      currency: asset.currency,
      flag_type: asset.flag_type,
      flag: asset.flag,
    };
    const trans = trs;
    trans.asset.aobFlags = values;
    super.dbSave(trans, dbTrans);
  }
}
module.exports = Flags;
