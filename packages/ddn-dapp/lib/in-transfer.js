const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');

class InTransfer extends AssetBase {

    async propsMapping() {
        return [
            {
                field: "str2",
                prop: "dapp_id",
                required: true
            },
            {
                field: "str1",
                prop: "currency",
                required: true
            },
            {
                field: "str3",
                prop: "amount"
            },
        ]
    }

    async create(data, trs) {
        trs.recipient_id = null;

        const assetJsonName = await this.getAssetJsonName(trs.type);
        trs.asset[assetJsonName] = data[assetJsonName];

        if (data[assetJsonName].currency === this.tokenSetting.tokenName) {
            trs.amount = data.amount + "";
            delete data[assetJsonName].amount;
        }

        return trs;
    }

    async verify(trs, sender) {
        if (trs.recipient_id) {
            throw new Error("Invalid recipient")
        }

        if (!ddnUtils.Address.isAddress(sender.address)) {
            throw new Error("Invalid address")
        }

        const inTransfer = await this.getAssetObject(trs);
        if (inTransfer.currency !== this.tokenSetting.tokenName) {
            if ((typeof (trs.amount) != "undefined" && !bignum.isZero(trs.amount)) ||
                (typeof (inTransfer.amount) == "undefined" || bignum.isZero(inTransfer.amount))) {
                throw new Error("Invalid transfer amount")
            }

            const error = ddnUtils.Amount.validate(inTransfer.amount);
            if (error) {
                throw error;
            }
        } else {
            if ((typeof (trs.amount) == "undefined" || bignum.isZero(trs.amount)) ||
                (typeof (inTransfer.amount) != "undefined" && !bignum.isZero(inTransfer.amount))) {
                throw new Error("Invalid transfer amount")
            }
        }

        const dappInst = await this.getAssetInstanceByName("Dapp");
        const count = await dappInst.queryAssetCount({ transaction_id: inTransfer.dapp_id });
        if (count === 0) {
            throw new Error(`Dapp not found: ${inTransfer.dapp_id}`)
        }

        const currency = inTransfer.currency;
        if (currency != this.tokenSetting.tokenName) {
            const aobAssetInst = await this.getAssetInstanceByName("AobAsset");
            const aobAssetResult = await aobAssetInst.queryAsset({ name: currency }, null, false, 1, 1);
            if (aobAssetResult.length <= 0) {
                throw new Error("Asset not exists");
            }

            const aobAssetDetail = aobAssetResult[0];
            if (aobAssetDetail.writeoff) {
                throw new Error('Asset already writeoff')
            }

            if (aobAssetDetail.allow_whitelist || aobAssetDetail.allow_blacklist) {
                if (await aobAssetInst.isInBlackList(currency, sender.address)) {
                    throw new Error("Permission not allowed");
                }


                //wxm TODO Aob中需增加isInBlackList方法
                // const aclTable = assetDetail.acl == 0 ? 'acl_black' : 'acl_white';
                // library.model.checkAcl(aclTable, currency, sender.address, null, (err, isInList) => {
                //     if (err) return cb(`Database error when query acl: ${err}`);
                //     if ((assetDetail.acl == 0) == isInList) return cb('Permission not allowed')
                //     cb()
                // })
            }
        }

    }

    async getBytes(trs) {
        const transfer = await this.getAssetObject(trs);

        var buf = new Buffer([]);
        const dappId = new Buffer(transfer.dapp_id, 'utf8');
        // again !!!
        // if (trs.asset.inTransfer.currency !== this.library.tokenSetting.tokenName) {
        if (transfer.currency !== this.tokenSetting.tokenName) {
            var currency = new Buffer(transfer.currency, 'utf8');
            const amount = new Buffer(transfer.amount, 'utf8');
            buf = Buffer.concat([buf, dappId, currency, amount]);
        } else {
            var currency = new Buffer(transfer.currency, 'utf8');
            buf = Buffer.concat([buf, dappId, currency]);
        }

        return buf;
    }

    async _updateAssetBalance(currency, amount, address, dbTrans) {
        const condition = {
            address,
            currency
        };

        return new Promise((resolve, reject) => {
            this.dao.findOne("mem_asset_balance",
                condition, ['balance'], dbTrans,
                (err, row) => {
                    if (err) {
                        return reject(err);
                    }

                    let balance = '0';
                    let balanceExists = false;
                    if (row) {
                        balance = row.balance;
                        balanceExists = true;
                    }

                    const newBalance = bignum.plus(balance, amount);
                    if (bignum.isLessThan(newBalance, 0)) {
                        return reject('Asset balance not enough');
                    }

                    condition.balance = newBalance.toString();
                    this.dao.insertOrUpdate("mem_asset_balance",
                        condition, dbTrans, (err2, result) => {
                            if (err2) {
                                return reject(err2);
                            }

                            resolve(result);
                        });
                });
        });
    }

    // 新增事务dbTrans ---wly
    async apply(trs, block, sender, dbTrans) {
        const asset = await this.getAssetObject(trs);
        const dappId = asset.dapp_id;

        if (asset.currency === this.tokenSetting.tokenName) {
            this.balanceCache.addAssetBalance(dappId, asset.currency, trs.amount);
            await this._updateAssetBalance(asset.currency, trs.amount, dappId, dbTrans);
        } else {
            this.balanceCache.addAssetBalance(dappId, asset.currency, asset.amount);
            await this._updateAssetBalance(asset.currency, `-${asset.amount}`, sender.address, dbTrans);
            await this._updateAssetBalance(asset.currency, asset.amount, dappId, dbTrans);
        }
    }

    async undo(trs, block, sender, dbTrans) {
        const transfer = await this.getAssetObject(trs);
        const dappId = asset.dapp_id;

        if (transfer.currency === this.tokenSetting.tokenName) {
            this.balanceCache.addAssetBalance(dappId, transfer.currency, `-${trs.amount}`);
            await this._updateAssetBalance(transfer.currency, `-${trs.amount}`, dappId, dbTrans);
        } else {
            this.balanceCache.addAssetBalance(dappId, transfer.currency, transfer.amount);
            await this._updateAssetBalance(transfer.currency, transfer.amount, sender.address, dbTrans);
            await this._updateAssetBalance(transfer.currency, `-${transfer.amount}`, dappId, dbTrans);
        }
    }

    async applyUnconfirmed(trs, sender, dbTrans) {
        const transfer = await this.getAssetObject(trs);
        if (transfer.currency != this.tokenSetting.tokenName) {
            const balance = this.balanceCache.getAssetBalance(sender.address, transfer.currency) || 0;
            const surplus = bignum.minus(balance, transfer.amount);
            if (bignum.isLessThan(surplus, 0)) {
                throw new Error('Insufficient asset balance');
            }
            this.balanceCache.setAssetBalance(sender.address, transfer.currency, surplus.toString())
        }
    }

    async undoUnconfirmed(trs, sender, dbTrans) {
        const transfer = await this.getAssetObject(trs);
        if (transfer.currency != this.tokenSetting.tokenName) {
            this.balanceCache.addAssetBalance(sender.address, transfer.currency, transfer.amount);
        }
    }

}

module.exports = InTransfer;