import Asset from '@ddn/asset-base';
import DdnUtils from '@ddn/utils';
import mathjs from 'mathjs';
import _ from 'lodash';

class Issue extends Asset.Base {
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
        const assetIssue = await this.getAssetObject(trs);

        // 检查参数
        if (trs.recipient_id) {
            throw new Error('Invalid recipient');
        }
        if (!DdnUtils.bignum.isZero(trs.amount)) {
            throw new Error('Invalid transaction amount');
        }
        const { amount } = assetIssue;
        const error = DdnUtils.amount.validate(amount);
        if (error) {
            throw new Error('Invalid transaction amount');
        }
        // (1)得到资产数据
        // (1)查询到asset的数据列表
        let result;
        const assetInst = await this.getAssetInstanceByName("AobAsset");
        result = await assetInst.queryAsset({
            name: assetIssue.currency
        }, null, null, 1, 1);

        // (2)查询到issuer的数据列表
        const issuerInst = await this.getAssetInstanceByName("AobIssuer");
        let issuerData = await issuerInst.queryAsset({
            name: { $in: _.pluck(result, 'issuer_name') }
        }, null, null, 1, 1000);
        issuerData = _.indexBy(issuerData, 'name');

        let result2;
        result2 = _.map(result, (num) => {
            const num2 = num;
            num2.issuer_id = issuerData[num.issuer_name].issuer_id;
            return num2;
        });

        // (3)查询到交易的相关数据
        let trData = await new Promise((resolve) => {
            this.dao.findList('tr', {
                id: {
                    $in: _.pluck(result, 'transaction_id'),
                },
            }, null, null, (err, rows) => {
                if (err) {
                    resolve(err);
                } else {
                    resolve(rows);
                }
            });
        });
        trData = _.indexBy(trData, 'id');

        let result3;
        result3 = _.map(result2, (num) => {
            const num2 = num;
            num2.block_id = trData[num.transaction_id].block_id;
            return num2;
        });

        // (4)查询到块的相关数据
        let blockData = await new Promise((resolve) => {
            this.dao.findList('block', {
                id: {
                    $in: _.pluck(result, 'block_id'),
                },
            }, null, null, (err, rows) => {
                if (err) {
                    resolve(err);
                } else {
                    resolve(rows);
                }
            });
        });
        blockData = _.indexBy(blockData, 'id');

        let result4;
        result4 = _.map(result3, (num) => {
            const num2 = num;
            num2.height = blockData[num.block_id].height;
            return num2;
        });

        // 循环整合验证数据
        for (let i = 0; i < result4.length; i += 1) {
            const { precision } = result4[i];
            result4[i].maximum = DdnUtils.bignum.new(result4[i].maximum).toString(10);
            result4[i].maximumShow = DdnUtils.amount.calcRealAmount(result4[i].maximum, precision);
            result4[i].quantity = DdnUtils.bignum.new(result4[i].quantity).toString(10);
            result4[i].quantityShow = DdnUtils.amount.calcRealAmount(result4[i].quantity, precision);
        }
        const count = 0;

        let result5;
        result5 = result4[count];
        if (!result5) {
            throw new Error('Asset not exists --- from asset-aob -> issue.verify');
        }
        if (result5.issuer_id !== sender.address) {
            throw new Error('Permission not allowed --- from asset-aob -> issue.verify');
        }
        if (result5.writeoff) {
            throw new Error('Asset already writeoff --- from asset-aob -> issue.verify');
        }
        const { maximum } = result5;
        const { quantity } = result5;
        const { precision } = result5;
        if (DdnUtils.bignum.isGreaterThan(DdnUtils.bignum.plus(quantity, amount), maximum)) {
            throw new Error('Exceed issue limit --- from asset-aob -> issue.verify');
        }
        const { strategy } = result5;
        const genesisHeight = result5.height;
        const height = DdnUtils.bignum.plus(this.runtime.block.getLastBlock().height, 1);
        if (strategy) {
            // FIXME: 这里的mathjs.bignumber应该‘安全’地修改为Bignum
            const context = {
                maximum: mathjs.bignumber(maximum),
                precision,
                quantity: mathjs.bignumber(quantity).plus(amount),
                genesisHeight: mathjs.bignumber(genesisHeight), // DdnUtils.bignum update
                height: mathjs.bignumber(height.toString()), // DdnUtils.bignum update
            };
            const evalRet = mathjs.eval(strategy, context);
            if (!evalRet) {
                throw new Error('Strategy not allowed --- from asset-aob -> issue.verify');
            }
        }
        return null;
    }

    async apply(trs, block, sender, dbTrans) {
        const assetIssue = await this.getAssetObject(trs);
        const { currency, amount } = assetIssue;
        this.balanceCache.addAssetBalance(sender.address, currency, amount);
        const assetInst = await this.getAssetInstanceByName("AobAsset");
        const data = await assetInst.queryAsset({
            name: currency
        }, null, null, 1, 1);
        const { quantity } = data[0];
        await assetInst.update({ quantity: DdnUtils.bignum.plus(quantity, amount).toString() }, { name: currency }, dbTrans);
        const assetBalancedata = await new Promise((resolve, reject) => {
            this.dao.findOne('mem_asset_balance', { address: sender.address, currency }, ['balance'], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
        const balance = (assetBalancedata && assetBalancedata.balance) ? assetBalancedata.balance : '0';
        const newBalance = DdnUtils.bignum.plus(balance, amount);
        if (DdnUtils.bignum.isLessThan(newBalance, 0)) {
            throw new Error('Asset balance not enough');
        }
        if (assetBalancedata) {
            this.dao.update('mem_asset_balance', { balance: newBalance.toString() }, { address: sender.address, currency }, dbTrans);
        } else {
            this.dao.insert('mem_asset_balance', { address: sender.address, currency, balance: newBalance.toString() }, dbTrans);
        }
        return trs;
    }

    async undo(trs, block, sender, dbTrans) {
        const assetIssue = await this.getAssetObject(trs);
        const { currency, amount } = assetIssue;
        const balance = this.balanceCache.getAssetBalance(sender.address, currency) || 0;
        if (DdnUtils.bignum.isLessThan(balance, amount)) {
            throw new Error(`Invalid asset balance: ${balance}`);
        }
        this.balanceCache.addAssetBalance(sender.address, currency, `-${amount}`);
        const assetInst = await this.getAssetInstanceByName("AobAsset");
        const data = await assetInst.queryAsset({
            name: currency
        }, null, null, 1, 1);
        const { quantity } = data[0];
        await assetInst.update({ quantity: DdnUtils.bignum.plus(quantity, amount).toString() }, { name: currency }, dbTrans);
        const assetBalancedata = await new Promise((resolve, reject) => {
            this.dao.findOne('mem_asset_balance', { address: sender.address, currency }, ['balance'], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
        const balance2 = (assetBalancedata && assetBalancedata.balance) ? assetBalancedata.balance : '0';
        const newBalance = DdnUtils.bignum.plus(balance2, amount);
        if (DdnUtils.bignum.isLessThan(newBalance, 0)) {
            throw new Error('Asset balance not enough');
        }
        if (assetBalancedata) {
            this.dao.update('mem_asset_balance', { balance: newBalance.toString() }, { address: sender.address, currency }, dbTrans);
        } else {
            this.dao.insert('mem_asset_balance', { address: sender.address, currency, balance: newBalance.toString() }, dbTrans);
        }
    }
}

export default Issue;
