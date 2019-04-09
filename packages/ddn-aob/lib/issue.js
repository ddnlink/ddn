const AssetBase = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');
const mathjs = require('mathjs');
const aobUtils = require('./aobUtils');

class Issue extends AssetBase {
  // eslint-disable-next-line class-methods-use-this
  async propsMapping() {
    return [
      {
        field: 'str1',
        prop: 'currency',
        required: true,
      },
      {
        field: 'str2',
        prop: 'amount',
      },
    ];
  }

  async verify(trs, sender) {
    // 检查参数
    if (trs.recipient_id) {
      throw new Error('Invalid recipient');
    }
    if (!bignum.isZero(trs.amount)) {
      throw new Error('Invalid transaction amount');
    }
    const { amount } = trs.asset.aobIssue;
    const error = ddnUtils.Amount.validate(amount);
    if (error) {
      throw new Error('Invalid transaction amount');
    }
    // (1)得到资产数据
    const resultArr = await aobUtils.getAssets(this, super.valueOf() instanceof Object, {
      name: trs.asset.aobIssue.currency,
    }, 1, 1);
    console.log('resultArr', resultArr);
    const result = resultArr[0];
    if (!result) {
      throw new Error('Asset not exists --- from ddn-aob -> issue.verify');
    }
    if (result.issuer_id !== sender.address) {
      throw new Error('Permission not allowed --- from ddn-aob -> issue.verify');
    }
    if (result.writeoff) {
      throw new Error('Asset already writeoff --- from ddn-aob -> issue.verify');
    }
    const { maximum } = result;
    const { quantity } = result;
    const { precision } = result;
    if (bignum.isGreaterThan(bignum.plus(quantity, amount), maximum)) {
      throw new Error('Exceed issue limit --- from ddn-aob -> issue.verify');
    }
    const { strategy } = result;
    const genesisHeight = result.height;
    const height = bignum.plus(this.blocks.getLastBlock().height, 1);
    if (strategy) {
      const context = {
        maximum: mathjs.bignumber(maximum),
        precision,
        quantity: mathjs.bignumber(quantity).plus(amount),
        genesisHeight: mathjs.bignumber(genesisHeight), // bignum update
        height: mathjs.bignumber(height.toString()), // bignum update
      };
      const evalRet = mathjs.eval(strategy, context);
      if (!evalRet) {
        throw new Error('Strategy not allowed --- from ddn-aob -> issue.verify');
      }
    }
    return null;
  }

  async apply(trs, block, sender, dbTrans) {
    const { currency } = trs.asset.aobIssue;
    const { amount } = trs.asset.aobIssue;
    this.balanceCache.addAssetBalance(sender.address, currency, amount);
    const data = await super.queryAsset({ name: currency, trs_type: 76 }, null, null, 1, 1, 'AobAsset');
    const { quantity } = data[0];
    await super.update({ quantity: bignum.plus(quantity, amount).toString() }, { name: currency, trs_type: 76 }, 'AobAsset', dbTrans);
    const assetBalancedata = await this.dao.findOne('mem_asset_balance', { address: sender.address, currency }, ['balance']);
    const balance = (assetBalancedata && assetBalancedata.balance) ? assetBalancedata.balance : '0';
    const newBalance = bignum.plus(balance, amount);
    if (bignum.isLessThan(newBalance, 0)) {
      throw new Error('Asset balance not enough');
    }
    if (data) {
      await this.dao.update('mem_asset_balance', { balance: newBalance.toString() }, { address: sender.address, currency }, dbTrans);
    } else {
      await this.dao.insert('mem_asset_balance', { address: sender.address, currency, balance: newBalance.toString() }, dbTrans);
    }
    return null;
  }

  async undo(trs, block, sender, dbTrans) {
    const { currency } = trs.asset.aobIssue;
    const { amount } = trs.asset.aobIssue;
    const balance = this.balanceCache.getAssetBalance(sender.address, currency) || 0;
    // bignum update if (bignum(balance).lt(amount))
    if (bignum.isLessThan(balance, amount)) {
      throw new Error(`Invalid asset balance: ${balance}`);
    }
    this.balanceCache.addAssetBalance(sender.address, currency, `-${amount}`);
    const data = await super.queryAsset({ name: currency, trs_type: 76 }, null, null, 1, 1, 'AobAsset');
    const { quantity } = data[0];
    await super.update({ quantity: bignum.plus(quantity, amount).toString() }, { name: currency, trs_type: 76 }, 'AobAsset', dbTrans);
    // helper.updateAssetBalance(currency, amount, sender.address, dbTrans, next);
    const assetBalancedata = await this.dao.findOne('mem_asset_balance', { address: sender.address, currency }, ['balance']);
    const balance2 = (assetBalancedata && assetBalancedata.balance) ? assetBalancedata.balance : '0';
    const newBalance = bignum.plus(balance2, amount);
    if (bignum.isLessThan(newBalance, 0)) {
      throw new Error('Asset balance not enough');
    }
    if (data) {
      await this.dao.update('mem_asset_balance', { balance: newBalance.toString() }, { address: sender.address, currency }, dbTrans);
    } else {
      await this.dao.insert('mem_asset_balance', { address: sender.address, currency, balance: newBalance.toString() }, dbTrans);
    }
  }
}
module.exports = Issue;
