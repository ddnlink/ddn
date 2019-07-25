const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');

const _dappOuttransferUnconfirmeds = {};

class OutTransfer extends AssetBase {

    async propsMapping() {
        return [
            {
                field: "str2",
                prop: "dapp_id",
                required: true
            },
            {
                field: "str4",
                prop: "outtransaction_id"
            },
            {
                field: "str1",
                prop: "currency",
                required: true
            },
            {
                field: "str3",
                prop: "amount",
                required: true
            }
        ];
    }

    async create(data, trs) {
        trs.recipient_id = data.recipient_id;
        trs.amount = "0";

        const assetJsonName = await this.getAssetJsonName(trs.type);
        trs.asset[assetJsonName] = data[assetJsonName];

        return trs;
    }

    async verify(trs, sender) {
        // await super.verify(trs, sender);

        if (!trs.recipient_id) {
            throw new Error('Invalid recipient')
        }

        if (!bignum.isZero(trs.amount)) {
            throw new Error('Invalid transaction amount')
        }

        if (!trs.signatures || !trs.signatures.length) {
            throw new Error('Invalid signatures')
        }

        const transfer = await this.getAssetObject(trs);
        const currency = transfer.currency;

        if (currency != this.tokenSetting.tokenName) {
            const aobAssetInst = await this.getAssetInstanceByName("AobAsset");
            const aobAssetResult = await aobAssetInst.queryAsset({ name: currency }, null, false, 1, 1);
            if (aobAssetResult.length <= 0) {
                throw new Error("Asset not exists");
            }

            const aobAssetDetail = aobAssetResult[0];
            if (aobAssetDetail.writeoff == "1") {
                throw new Error('Asset already writeoff')
            }

            if (aobAssetDetail.allow_whitelist == "1" || aobAssetDetail.allow_blacklist == "1") {
                const aobTransferInst = await this.getAssetInstanceByName("AobTransfer");
                if (await aobTransferInst.isInBlackList(currency, sender.address)) {
                    throw new Error("Permission not allowed");
                }

                //wxm TODO Aob中需增加isInBlackList方法
                // const aclTable = aobAssetDetail.acl == 0 ? 'acl_black' : 'acl_white';
                // library.model.checkAcl(aclTable, currency, sender.address, null, (err, isInList) => {
                //     if (err) return cb(`Database error when query acl: ${err}`);
                //     if ((aobAssetDetail.acl == 0) == isInList) return cb('Permission not allowed')
                //     cb();
                // })
            }
        }

        return trs;
    }

    async process(trs, sender, cb) {
        var dapp = null;

        const transfer = await this.getAssetObject(trs);

        const dappInst = await this.getAssetInstanceByName("Dapp");
        const dappResult = await dappInst.queryAsset({ trs_id: transfer.dapp_id }, null, false, 1, 1);
        if (dappResult.length > 0) {
            dapp = dappResult[0];
        }

        if (!dapp) {
            throw new Error(`DApp not found: ${transfer.dapp_id}`);
        }

        if (_dappOuttransferUnconfirmeds[trs.id]) {
            throw new Error(`Transaction is already processing: ${trs.id}`);
        }

        dapp.delegates = dapp.delegates.split(',');
        if (dapp.delegates.indexOf(trs.sender_public_key) === -1) {
            throw new Error('Sender must be dapp delegate');
        }

        if (!trs.signatures || trs.signatures.length !== dapp.unlock_delegates) {
            throw new Error('Invalid signature number');
        }

        let validSignatureNumber = 0;
        const bytes = await this.runtime.transaction.getBytes(trs, true, true);
        try {
            for (let i in trs.signatures) {
                for (let j in dapp.delegates) {
                    if (await this.runtime.transaction.verifyBytes(bytes, dapp.delegates[j], trs.signatures[i])) {
                        validSignatureNumber++;
                        break;
                    }
                }
                if (validSignatureNumber >= dapp.unlock_delegates) break;
            }
        } catch (e) {
            throw new Error(`Failed to verify signatures: ${e}`)
        }

        if (validSignatureNumber < dapp.unlock_delegates) {
            throw new Error('Valid signatures not enough')
        }

        const count = await this.queryAssetCount({ transaction_id: trs.id });
        if (count) {
            throw new Error('Transaction is already confirmed')
        }

        return trs;
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

    async apply(trs, block, sender, dbTrans) {
        const transfer = await this.getAssetObject(trs);

        _dappOuttransferUnconfirmeds[trs.id] = false;

        if (transfer.currency !== this.tokenSetting.tokenName) {
            this.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, transfer.amount);

            await this._updateAssetBalance(transfer.currency, 
                `-${transfer.amount}`, transfer.dapp_id, dbTrans);
            await this._updateAssetBalance(this.tokenSetting.tokenName,
                `-${trs.fee}`, transfer.dapp_id, dbTrans);
            await this._updateAssetBalance(transfer.currency,
                transfer.amount, trs.recipient_id, dbTrans);   //wxm block database
        } else {
            await this.runtime.account.setAccount({ address: trs.recipient_id }, dbTrans);

            const amount = bignum.new(transfer.amount);    //bignum update Number(transfer.amount);
            await this.runtime.account.merge(trs.recipient_id, {
                address: trs.recipient_id,   //wxm block database
                balance: amount.toString(),     //bignum update
                u_balance: amount.toString(),   //bignum update
                block_id: block.id,  //wxm block database
                round: await this.runtime.round.calc(block.height)
            }, dbTrans);

            var minusSum = bignum.minus(0, amount, trs.fee);
            await this._updateAssetBalance(this.tokenSetting.tokenName,
                minusSum.toString(), transfer.dapp_id, dbTrans);
        }
    }

    async undo(trs, block, sender, dbTrans) {
        const transfer = await this.getAssetObject(trs);

        _dappOuttransferUnconfirmeds[trs.id] = true;

        if (transfer.currency !== this.tokenSetting.tokenName) {
            this.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, transfer.amount);    //wxm block database

            await this._updateAssetBalance(transfer.currency, 
                transfer.amount, transfer.dapp_id, dbTrans);
            await this._updateAssetBalance(this.tokenSetting.tokenName,
                trs.fee, transfer.dapp_id, dbTrans);
            await this._updateAssetBalance(transfer.currency,
                `-${transfer.amount}`, trs.recipient_id, dbTrans);   //wxm block database
        } else {
            await this.runtime.account.setAccount({ address: trs.recipient_id }, dbTrans);

            const minusAmount = bignum.minus(0, transfer.amount);
            const sum = bignum.plus(transfer.amount, trs.fee);
            await this.runtime.account.merge(trs.recipient_id, {
                address: trs.recipient_id,   //wxm block database
                balance: minusAmount.toString(),
                u_balance: minusAmount.toString(),
                block_id: block.id,  //wxm block database
                round: await this.runtime.round.calc(block.height)
            }, dbTrans);
            await this._updateAssetBalance(this.tokenSetting.tokenName,
                sum, transfer.dapp_id, dbTrans);
        }
    }

    async applyUnconfirmed(trs, sender, dbTrans) {
        const transfer = await this.getAssetObject(trs);

        _dappOuttransferUnconfirmeds[trs.id] = true;
        
        const balance = this.balanceCache.getAssetBalance(transfer.dapp_id, transfer.currency) || 0;
        const fee = trs.fee;
        if (transfer.currency === this.tokenSetting.tokenName) {
            const amount = bignum.plus(transfer.amount, fee);
            if (bignum.isLessThan(balance, amount)) {
                throw new Error('Insufficient balance');
            }

            this.balanceCache.addAssetBalance(transfer.dapp_id, 
                transfer.currency, bignum.minus(0, amount).toString());//bignum update -amount
        } else {
            const ddnBalance = this.balanceCache.getAssetBalance(transfer.dapp_id, this.tokenSetting.tokenName) || 0;
            if (bignum.isLessThan(ddnBalance, fee)) {
                throw new Error('Insufficient balance')
            }
            if (bignum.isLessThan(balance, transfer.amount)) {
                throw new Error('Insufficient asset balance')
            }
            this.balanceCache.addAssetBalance(transfer.dapp_id, this.tokenSetting.tokenName, `-${fee}`);
            this.balanceCache.addAssetBalance(transfer.dapp_id, transfer.currency, `-${transfer.amount}`);
        }
    }

    async undoUnconfirmed(trs, sender, dbTrans) {
        _dappOuttransferUnconfirmeds[trs.id] = false;

        const transfer = await this.getAssetObject(trs);
        const fee = trs.fee;
        if (transfer.currency === this.tokenSetting.tokenName) {
            const amount = bignum.plus(transfer.amount, fee);
            this.balanceCache.addAssetBalance(transfer.dapp_id, transfer.currency, amount.toString());
        } else {
            this.balanceCache.addAssetBalance(transfer.dapp_id, this.tokenSetting.tokenName, fee);
            this.balanceCache.addAssetBalance(transfer.dapp_id, transfer.currency, transfer.amount);
        }
    }

    async dbSave(trs, dbTrans) {
        await super.dbSave(trs, dbTrans);

        // const transfer = trs.asset.outTransfer;
        // const dapp_id = transfer.dapp_id;
        // const currency = transfer.currency;
        // const amount = transfer.amount;
        // const outtransaction_id = transfer.outtransaction_id;
        // const values = {
        //     transaction_id: trs.id,
        //     dapp_id,
        //     currency,
        //     amount,
        //     outtransaction_id
        // };
        // trs.asset.outTransfer = values;
        // super.dbSave(trs, dbTrans, (err) => {
        //     if (err) return cb(err);
        //     library.bus.message(
        //         transfer.dapp_id,
        //         {
        //             topic: 'withdrawalCompleted',
        //             message: {
        //                 transaction_id: trs.id
        //             }
        //         },
        //         () => { }
        //     );
        //     return cb();
        // })
    }
}

module.exports = OutTransfer;