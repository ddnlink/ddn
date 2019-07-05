const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');
const crypto = require('crypto');
const ed = require('ed25519');
const _ = require('lodash');
const asset = require('./asset');

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

    async create(data, trs) {
        trs.recipient_id = data.recipient_id;
        trs.amount = "0";

        const assetJsonName = await this.getAssetJsonName(trs.type);
        trs.asset[assetJsonName] = data[assetJsonName];
        return trs;
    }

    async verify(trs, sender) {
        if (!ddnUtils.Address.isAddress(trs.recipient_id)) {
            throw new Error('Invalid recipient');
        }
        if (!bignum.isZero(trs.amount)) {
            throw new Error('Invalid transaction amount');
        }
        const assetData = trs.asset.aobTransfer;
        const error = ddnUtils.Amount.validate(assetData.amount);
        if (error) {
            throw new Error(error);
        }
        const assetInst = await this.getAssetInstanceByName("AobAsset");
        const data = await assetInst.queryAsset({
            name: assetData.currency
        }, null, null, 1, 1);
        const assetDetail = data[0];
        if (!assetDetail) {
            throw new Error('Asset not exists');
        }
        if (assetDetail.writeoff == "1") {
            throw new Error('Asset already writeoff');
        }
        if (assetDetail.allow_whitelist == "0" &&
            assetDetail.allow_blacklist == "0") {
            return trs;
        }

        // 检查黑白名单
        if (assetDetail.acl == 0) {
            if (await this.isInBlackList(assetData.currency, sender.address) ||
                await this.isInBlackList(assetData.currency, trs.recipient_id)) {
                throw new Error('Permission not allowed');
            }
        }

        return trs;
    }

    async isInBlackList(currency, address) {
        return new Promise((resolve, reject) => {
            this.dao.findOne('acl_black', { currency, address },
                null, null, (err, result) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve(result);
                });
        });
    }

    // 新增事务dbTrans ---wly
    async apply(trs, block, sender, dbTrans) {
        const transfer = await this.getAssetObject(trs);
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
        const transfer = await this.getAssetObject(trs);
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
        const transfer = await this.getAssetObject(trs);
        const balance = this.balanceCache.getAssetBalance(
            sender.address, transfer.currency,
        ) || 0;
        const surplus = bignum.minus(balance, transfer.amount);
        if (bignum.isLessThan(surplus, 0)) {
            throw new Error('Insufficient asset balance');
        }
        this.balanceCache.setAssetBalance(sender.address, transfer.currency, surplus.toString());
        return trs;
    }

    async undoUnconfirmed(trs, sender) {
        const transfer = await this.getAssetObject(trs);
        this.balanceCache.addAssetBalance(sender.address, transfer.currency, transfer.amount);
        return trs;
    }

    /**
     * 自定义资产Api
     */
    async attachApi(router) {
        router.put('/transfers', async (req, res) => {
            try {
                const result = await this.putTransferAsset(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });
        router.get('/transactions/my/:address/', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address/:currency
            try {
                const result = await this.getMyTransactions(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });
        router.get('/transactions/my/:address/:currency', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address/:currency
            try {
                const result = await this.getMyTransactions(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });
        router.get('/transactions/:currency', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address/:currency
            try {
                const result = await this.getTransactions(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });
    }

    async putTransferAsset(req) {
        const { body } = req;
        const validateErrors = await this.ddnSchema.validate({
            type: 'object',
            properties: {
                secret: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 100,
                },
                currency: {
                    type: 'string',
                    maxLength: 22,
                },
                amount: {
                    type: 'string',
                    maxLength: 50,
                },
                recipientId: {
                    type: 'string',
                    minLength: 1,
                },
                publicKey: {
                    type: 'string',
                    format: 'publicKey',
                },
                secondSecret: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 100,
                },
                multisigAccountPublicKey: {
                    type: 'string',
                    format: 'publicKey',
                },
                message: {
                    type: 'string',
                    maxLength: 256,
                },
            },
            required: ['secret', 'amount', 'recipientId', 'currency'],
        }, body);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        const hash = crypto.createHash('sha256').update(body.secret, 'utf8').digest();
        const keypair = ed.MakeKeypair(hash);

        if (body.publicKey) {
            if (keypair.publicKey.toString('hex') !== body.publicKey) {
                return 'Invalid passphrase';
            }
        }

        return new Promise((resolve, reject) => {
            // eslint-disable-next-line consistent-return
            this.balancesSequence.add(async (cb) => {
                if (body.multisigAccountPublicKey && body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')) {
                    let account;
                    try {
                        account = await this.runtime.account.getAccountByPublicKey(
                            body.multisigAccountPublicKey,
                        );
                    } catch (e) {
                        return cb(e);
                    }
                    if (!account) {
                        return cb('Multisignature account not found');
                    }
                    if (!account.multisignatures) {
                        return cb('Account does not have multisignatures enabled');
                    }
                    if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
                        return cb('Account does not belong to multisignature group');
                    }
                    let requester;
                    try {
                        requester = await this.runtime.account.getAccountByPublicKey(keypair.publicKey);
                    } catch (e) {
                        return cb(e);
                    }
                    if (!requester || !requester.public_key) {
                        return cb('Invalid requester');
                    }
                    if (requester.second_signature && !body.secondSecret) {
                        return cb('Invalid second passphrase');
                    }

                    if (requester.public_key === account.public_key) {
                        return cb('Invalid requester');
                    }

                    let second_keypair = null;
                    if (requester.second_signature) {
                        const secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                        second_keypair = ed.MakeKeypair(secondHash);
                    }

                    try {
                        const data = {
                            type: await this.getTransactionType(),
                            sender: account,
                            keypair,
                            requester: keypair,
                            second_keypair,
                            recipient_id: body.recipientId,
                            message: body.message
                        };
                        var assetJsonName = await this.getAssetJsonName();
                        data[assetJsonName] = transfer;

                        var transaction = await this.runtime.transaction.create(data);

                        var transactions = await this.runtime.transaction.receiveTransactions([transaction]);
                        cb(null, transactions);
                    } catch (e) {
                        cb(e);
                    }
                    await this.runtime.transaction.receiveTransactions([transaction], cb);
                } else {
                    let account;
                    try {
                        account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey.toString('hex'));
                    } catch (e) {
                        return cb(e);
                    }
                    if (!account) {
                        return cb('Account not found');
                    }
                    if (account.second_signature && !body.secondSecret) {
                        return cb('Invalid second passphrase');
                    }

                    let second_keypair = null;
                    if (account.second_signature) {
                        const secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                        second_keypair = ed.MakeKeypair(secondHash);
                    }

                    try {
                        const data = {
                            type: await this.getTransactionType(),
                            sender: account,
                            keypair,
                            second_keypair,
                            recipient_id: body.recipientId,
                            message: body.message
                        };
                        var assetJsonName = await this.getAssetJsonName();
                        data[assetJsonName] = transfer;

                        var transaction = await this.runtime.transaction.create(data);

                        var transactions = await this.runtime.transaction.receiveTransactions([transaction]);
                        cb(null, transactions);
                    } catch (e) {
                        cb(e);
                    }
                }
            }, (err, transactions) => {
                if (err) {
                    return reject(err);
                }
                resolve({ success: true, transactionId: transactions[0].id });
            });
        });
    }

    async getMyTransactions(req) {
        const address = req.params.address;
        const currency = req.params.currency;
        const pageindex = req.query.pageindex || 1; 
        const pagesize = req.query.pagesize || 50;

        // (1)先查询到对应的transfer中的相关数据表查询到对应数据
        const where1 = {};
        if (currency) {
            where1.currency = currency;
        }
        const transfer = await this.queryAsset(where1, null, null, pageindex, pagesize);
        const tids = _.map(transfer, 'transaction_id');
        const where2 = { id: { $in: tids }, sender_id: address };
        const result = await this.runtime.dataquery.queryFullTransactionData(
            where2, null, null, null, null,
        );
        return {
            transactions: result,
            success: true,
        };
    }

    async getTransactions(req) {
        const currency = req.params.currency;
        const pageindex = req.query.pageindex || 1;
        const pagesize = req.query.pagesize || 50;

        // (1)先查询到对应的transfer中的相关数据表查询到对应数据
        const where1 = { currency };
        const transfer = await this.queryAsset(where1, null, null, pageindex, pagesize);
        const tids = _.map(transfer, 'transaction_id');
        const where2 = { id: { $in: tids } };
        const result = await this.runtime.dataquery.queryFullTransactionData(
            where2, null, null, null, null,
        );
        return {
            transactions: result,
            success: true,
        };
    }
}

module.exports = Transfer;
