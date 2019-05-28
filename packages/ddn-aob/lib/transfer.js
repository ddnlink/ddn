const {
  AssetBase,
} = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');

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

  async verify(trs, sender) {
    if (!ddnUtils.Address.isAddress(trs.recipient_id)) {
      throw new Error('Invalid recipient');
    }
    if (!bignum.isZero(trs.amount)) {
      throw new Error('Invalid transaction amount');
    }
    const asset = trs.asset.aobTransfer;
    const error = ddnUtils.Amount.validate(asset.amount);
    if (error) {
      throw new Error(error);
    }
    const data = await super.queryAsset({
      name: asset.currency,
      trs_type: '61',
    }, null, null, 1, 1, 61);
    const assetDetail = data[0];
    if (!assetDetail) {
      throw new Error('Asset not exists');
    }
    if (assetDetail.writeoff) {
      throw new Error('Asset already writeoff');
    }
    if (!assetDetail.allow_whitelist && !assetDetail.allow_blacklist) {
      return null;
    }
    // 检查黑白名单
    const aclTable = assetDetail.acl === 0 ? 'acl_black' : 'acl_white';
    const count1 = await new Promise((resolve) => {
      this.dao.count(aclTable, {
        address: sender.address,
        currency: asset.currency,
      }, (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
    const count2 = await new Promise((resolve) => {
      this.dao.count(aclTable, {
        address: trs.recipient_id,
        currency: asset.currency,
      }, (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
    const isInList = (count1 + count2) !== 0;
    if ((assetDetail.acl === 0) === isInList) {
      throw new Error('Permission not allowed');
    }
    return null;
  }

  // 新增事务dbTrans ---wly
  async apply(trs, block, sender, dbTrans) {
    const transfer = trs.asset.aobTransfer;
    this.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, transfer.amount);
    // (1)
    const assetBalancedata = await new Promise((resolve) => {
      this.dao.findOne('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
      }, ['balance'], (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
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
    const assetBalancedata2 = await new Promise((resolve) => {
      this.dao.findOne('mem_asset_balance', {
        address: trs.recipient_id,
        currency: transfer.currency,
      }, ['balance'], (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
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
    const assetBalancedata = await new Promise((resolve) => {
      this.dao.findOne('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
      }, ['balance'], (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
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
    const assetBalancedata2 = await new Promise((resolve) => {
      this.dao.findOne('mem_asset_balance', {
        address: trs.recipient_id,
        currency: transfer.currency,
      }, ['balance'], (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
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
