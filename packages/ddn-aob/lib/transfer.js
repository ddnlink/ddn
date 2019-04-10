const {
  AssetBase,
} = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');
const Helper = require('./helper');

class Transfer extends AssetBase {
  // eslint-disable-next-line class-methods-use-this
  async propsMapping() {
    return [
      {
        field: 'str1',
        prop: 'currency',
      },
      {
        field: 'str2',
        prop: 'amount',
      },
    ];
  }

  async verify(trs, sender, cb) {
    if (!ddnUtils.Address.isAddress(trs.recipient_id)) return cb('Invalid recipient');
    if (!bignum.isZero(trs.amount)) return setImmediate(cb, 'Invalid transaction amount');
    const asset = trs.asset.aobTransfer;
    const error = ddnUtils.Amount.validate(asset.amount);
    if (error) return setImmediate(cb, error);

    const helper = new Helper(this.library, this.modules);
    const where = {
      name: asset.currency,
      trs_type: '76',
    };
    helper.getAssets(where, 1, 1, (err, data) => {
      if (err) return cb(`Database error: ${err}`);
      if (!data) return cb('Asset not exists');
      const assetDetail = data[0];
      if (!assetDetail) return cb('Asset not exists');
      if (assetDetail.writeoff) return cb('Asset already writeoff');
      if (!assetDetail.allow_whitelist && !assetDetail.allow_blacklist) return cb();
      const aclTable = assetDetail.acl === 0 ? 'acl_black' : 'acl_white';
      this.model.checkAcl(aclTable, asset.currency, sender.address, trs.recipient_id,
        (terr, isInList) => {
          // wxm block database
          if (terr) return cb(`Database error when query acl: ${terr}`);
          if ((assetDetail.acl === 0) === isInList) return cb('Permission not allowed');
          return null;
        });
      return null;
    });
    return null;
  }

  // 新增事务dbTrans ---wly
  async apply(trs, block, sender, dbTrans) {
    const transfer = trs.asset.aobTransfer;
    this.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, transfer.amount);
    // (1)
    const assetBalancedata = this.dao.findOne('mem_asset_balance', {
      address: sender.address,
      currency: transfer.currency,
    }, ['balance']);
    const balance = (assetBalancedata && assetBalancedata.balance) ? assetBalancedata.balance : '0';
    const newBalance = bignum.plus(balance, `-${transfer.amount}`);
    if (bignum.isLessThan(newBalance, 0)) {
      throw new Error('Asset balance not enough');
    }
    if (assetBalancedata) {
      this.dao.update('mem_asset_balance', {
        balance: newBalance.toString(),
      }, {
        address: sender.address,
        currency: transfer.currency,
      }, dbTrans);
    } else {
      this.dao.insert('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
        balance: newBalance.toString(),
      }, dbTrans);
    }
    // (2)
    const assetBalancedata2 = this.dao.findOne('mem_asset_balance', {
      address: trs.recipient_id,
      currency: transfer.currency,
    }, ['balance']);
    const balance2 = (assetBalancedata2 && assetBalancedata2.balance) ? assetBalancedata2.balance : '0';
    const newBalance2 = bignum.plus(balance2, transfer.amount);
    if (bignum.isLessThan(newBalance2, 0)) {
      throw new Error('Asset balance not enough');
    }
    if (assetBalancedata2) {
      this.dao.update('mem_asset_balance', {
        balance: newBalance2.toString(),
      }, {
        address: sender.address,
        currency: transfer.currency,
      }, dbTrans);
    } else {
      this.dao.insert('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
        balance: newBalance.toString(),
      }, dbTrans);
    }
  }

  async undo(trs, block, sender, dbTrans) {
    const transfer = trs.asset.aobTransfer;
    this.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, `-${transfer.amount}`);

    // (1)
    const assetBalancedata = this.dao.findOne('mem_asset_balance', {
      address: sender.address,
      currency: transfer.currency,
    }, ['balance']);
    const balance = (assetBalancedata && assetBalancedata.balance) ? assetBalancedata.balance : '0';
    const newBalance = bignum.plus(balance, transfer.amount);
    if (bignum.isLessThan(newBalance, 0)) {
      throw new Error('Asset balance not enough');
    }
    if (assetBalancedata) {
      this.dao.update('mem_asset_balance', {
        balance: newBalance.toString(),
      }, {
        address: sender.address,
        currency: transfer.currency,
      }, dbTrans);
    } else {
      this.dao.insert('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
        balance: newBalance.toString(),
      }, dbTrans);
    }
    // (2)
    const assetBalancedata2 = this.dao.findOne('mem_asset_balance', {
      address: trs.recipient_id,
      currency: transfer.currency,
    }, ['balance']);
    const balance2 = (assetBalancedata2 && assetBalancedata2.balance) ? assetBalancedata2.balance : '0';
    const newBalance2 = bignum.plus(balance2, `-${transfer.amount}`);
    if (bignum.isLessThan(newBalance2, 0)) {
      throw new Error('Asset balance not enough');
    }
    if (assetBalancedata2) {
      this.dao.update('mem_asset_balance', {
        balance: newBalance2.toString(),
      }, {
        address: sender.address,
        currency: transfer.currency,
      }, dbTrans);
    } else {
      this.dao.insert('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
        balance: newBalance.toString(),
      }, dbTrans);
    }
  }

  async applyUnconfirmed(trs, sender) {
    const transfer = trs.asset.aobTransfer;
    const balance = this.balanceCache.getAssetBalance(
      sender.address, transfer.currency,
    ) || 0;
    const surplus = bignum.minus(balance, transfer.amount);
    if (bignum.isLessThan(surplus, 0)) {
      throw new Error('Insufficient asset balance');
    }
    this.balanceCache.setAssetBalance(sender.address, transfer.currency, surplus.toString());
    return null;
  }

  async undoUnconfirmed(trs, sender) {
    const transfer = trs.asset.aobTransfer;
    this.balanceCache.addAssetBalance(sender.address, transfer.currency, transfer.amount);
    return null;
  }
}
module.exports = Transfer;
