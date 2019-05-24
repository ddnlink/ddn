const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');
const daoUtil = require('./daoUtil.js');
const ByteBuffer = require('bytebuffer');
const crypto = require('crypto');
const ed = require('ed25519');

/**
  * 企业号、媒体号等交易
  *
  * 卖媒体号：
  * @orgId 自治组织号 5-20，5位以下逐年开放注册；媒体号 midiumId 是自治组织的一种，可以以M为后缀，其他的以此类推；
  * @price 卖的价格
  * @receivedAddress 买方的钱包地址（即将绑定媒体号的新的钱包地址）
  * @senderAddress 卖方的钱包地址
  * @state 0-发起卖，1-确认买（同时向org增加一条绑定记录）
  *
  * @exchangeTrsId - 确认买的时候记录卖的记录id，发起卖的时候为空
  * @amout 0-发起卖，确认买的数量=@price
  * @fee 交易费用
  */
class Exchange extends AssetBase {
    // eslint-disable-next-line class-methods-use-this
    async propsMapping() {
        return [{
            field: 'str1',
            prop: 'org_id',
            required: true,
        }, {
            field: 'str2',
            prop: 'sender_address',
            required: true
        }, {
            field: 'str3',
            prop: 'received_address',
            required: true
        }, {
            field: 'str4',
            prop: 'exchange_trs_id',
        }, {
            field: 'str5',
            prop: 'price',
            required: true
        }, {
            field: 'int1',
            prop: 'state',
            required: true,
        }];
    }

    // eslint-disable-next-line class-methods-use-this
    async create(data, trs) {
        const trans = trs;

        trans.amount = '0';
        trans.recipient_id = "";

        const assetJsonName = await this.getAssetJsonName(trs.type);
        trans.asset[assetJsonName] = {
            org_id: data[assetJsonName].org_id.toLowerCase(),
            price: data[assetJsonName].price || '0',
            state: data[assetJsonName].state,
            exchange_trs_id: data[assetJsonName].exchange_trs_id,
            sender_address: data[assetJsonName].sender_address,
            received_address: data[assetJsonName].received_address,
        };

        if (data[assetJsonName].state == 1) {
            trans.amount = trans.asset[assetJsonName].price;
            trans.recipient_id = trans.asset[assetJsonName].received_address;
        }

        return trans;
    }

    async verify(trs, sender) {
        const asset = await this.getAssetObject(trs);
        // check org id
        if (!daoUtil.isOrgId(asset.org_id.toLowerCase())) {
            throw new Error('exchange org id not allow: ' + asset.org_id.toLowerCase());
        }
        if (!ddnUtils.Address.isAddress(sender.address)) {
            throw new Error('Invalid address');
        }
        if (!ddnUtils.Address.isAddress(asset.sender_address)) {
            throw new Error('senderAddress id not allow');
        }
        if (!ddnUtils.Address.isAddress(asset.received_address)) {
            throw new Error('receivedAddress id not allow');
        }
        if (asset.sender_address === asset.received_address) {
            throw new Error('senderAddress receivedAddress cat not equal');
        }
        if (asset.sender_address !== sender.address) {
            throw new Error('senderAddress and sender.address should be equal');
        }
        if (bignum.isNaN(asset.price)) {
            throw new Error("Invalid exchange' price.");
        }
        // check state right
        if (asset.state === 0) {
            // send exchange
            // bignum update   if (trs.amount != 0)
            if (!bignum.isZero(trs.amount)) {
                throw new Error('Invalid transaction amount');
            }
            if (asset.exchange_trs_id) {
                throw new Error('not need confirm exchange trs_id');
            } else {
                // TODO: 判断媒体号是否由 sender 注册
                var effectiveOrgInfo = await daoUtil.getEffectiveOrgByOrgId(this._context, asset.org_id);
                if (!effectiveOrgInfo) {
                    throw new Error(`Org "${asset.org_id}" not exists`);
                }

                if (effectiveOrgInfo.address !== sender.address) {
                    throw new Error(`Org "${asset.org_id}" not belong to you`);
                }

                // this.modules.dao.__private.getEffectiveOrgByOrgId(asset.org_id, (err, org) => {
                //     // console.log(err, org)
                //     if (err) {
                //         return setImmediate(cb, err);
                //     }
                //     if (!org) {
                //         return setImmediate(cb, `Org "${asset.org_id}" not exists`);
                //     }
                //     if (org.address !== sender.address) {
                //         return setImmediate(cb, `Org "${asset.org_id}" not belong to you`);
                //     }
                //     return setImmediate(cb); // ok
                // });
            }
        } else if (asset.state === 1) {
            if (!asset.exchange_trs_id) {
                throw new Error('must give confirm exchange trs_id');
            }

            const exchangeRequestList = await this.queryAsset({ trs_id: asset.exchange_trs_id }, 
                [['trs_timestamp', 'DESC']], false, 1, 1, null);
            if (!(exchangeRequestList && exchangeRequestList.length)) {
                throw new Error('request exchange not find: ' + asset.exchange_trs_id)
            }

            const confirmExchangeList = await this.queryAsset({ exchange_trs_id: asset.exchange_trs_id }, 
                [['trs_timestamp', 'DESC']], false, 1, 1, null);
            if (confirmExchangeList && confirmExchangeList.length) {
                throw new Error('confirm exchange already exists: ' + asset.exchange_trs_id)
            }

            const latestExchangeRequestList = await this.queryAsset({ trs_type: await this.getTransactionType(), org_id: asset.org_id.toLowerCase() }, 
                [['trs_timestamp', 'DESC']], false, 1, 1, null);
            const latestExchangeRequestObj = latestExchangeRequestList[0];

            const exchangeRequestObj = exchangeRequestList[0];
            if (latestExchangeRequestObj.transaction_id != exchangeRequestObj.transaction_id) {
                throw new Error("request exchange is expired: " + asset.exchange_trs_id);
            }

            // console.log(latestExchangeRequestObj)
            if (latestExchangeRequestObj.org_id.toLowerCase() !== asset.org_id.toLowerCase()) {
                throw new Error('confirm exchange orgId atypism: ' + asset.exchange_trs_id)
            }
            // bignum update if (result.price !== trs.amount)
            if (!bignum.isEqualTo(latestExchangeRequestObj.price, trs.amount)) {
                throw new Error('confirm exchange amount & price atypism: ' + asset.exchange_trs_id)
            }
            // address is ok
            if (latestExchangeRequestObj.received_address !== asset.sender_address) {
                throw new Error('confirm exchange senderAddress error: ' + asset.exchange_trs_id);
            }
            if (latestExchangeRequestObj.sender_address !== asset.received_address) {
                throw new Error('confirm exchange receivedAddress error: ' + asset.exchange_trs_id)
            }

            if (!trs.recipient_id) {
                throw new Error("Invalid params: recipient_id");
            }

            if (trs.recipient_id !== asset.received_address) {
                throw new Error('confirm exchange recipient_id error: ' + asset.exchange_trs_id)
            }

            // orgid is ok
            // if (result3.org_id.toLowerCase() != asset.org_id.toLowerCase()) return setImmediate(cb, 'confirm exchange orgId should be equal');
            // to mark the exchange is confirm ok !!!
            // trs.asset.is_confirm_ok = true; // next dbSave to deal

            // if (!asset.exchange_trs_id) {
            //     return setImmediate(cb, 'must give confirm exchange trs_id');
            // }
            // // check exchangeTrsId for confirm
            // library.model.getExchanges({ exchange_trs_id: asset.exchange_trs_id }, { limit: 1 }, (err, result) => {
            //     if (err) { return setImmediate(cb, err); }
            //     if (result && result.length) { return setImmediate(cb, 'confirm exchange already exists'); }
            //     // confirm
            //     library.model.getExchangeByTrsId(asset.exchange_trs_id, (err, result) => {
            //         if (err) return setImmediate(cb, err);
            //         if (!result) return setImmediate(cb, 'confirm exchange not find');
            //         // console.log(trs)
            //         // console.log(result)
            //         if (result.org_id.toLowerCase() !== asset.org_id.toLowerCase()) return setImmediate(cb, 'confirm exchange orgId atypism');
            //         // bignum update if (result.price !== trs.amount)
            //         if (!bignum.isEqualTo(result.price, trs.amount)) return setImmediate(cb, 'confirm exchange amount & price atypism');
            //         // address is ok
            //         if (result.receivedAddress !== asset.sender_address) return setImmediate(cb, 'confirm exchange senderAddress error');
            //         if (result.senderAddress !== asset.received_address) return setImmediate(cb, 'confirm exchange receivedAddress error');
            //         // orgid is ok
            //         if (result.org_id.toLowerCase() != asset.org_id.toLowerCase()) return setImmediate(cb, 'confirm exchange orgId should be equal');
            //         // to mark the exchange is confirm ok !!!
            //         // trs.asset.is_confirm_ok = true; // next dbSave to deal
            //         return setImmediate(cb); // exchange is ok
            //     });
            // });
        } else {
            throw new Error('not support dao exchange state');
        }
        return trs;
    }

    // eslint-disable-next-line class-methods-use-this
    // async process(trs) {
    //     const trans = trs;
    //     trans.asset.exchange.org_id = trs.asset.exchange.org_id.toLowerCase();
    //     return trans;
    // }

    // eslint-disable-next-line class-methods-use-this
    async getBytes(trs) {
        // eslint-disable-next-line no-undef
        const asset = await this.getAssetObject(trs);   // trs.asset.exchange;
        const bb = new ByteBuffer();
        bb.writeString(asset.org_id.toLowerCase());
        bb.writeString(asset.exchange_trs_id);
        bb.writeString(asset.price);
        bb.writeInt8(asset.state);
        bb.writeString(asset.sender_address);
        bb.writeString(asset.received_address);
        bb.flip();
        return bb.toBuffer();
    }

    async applyUnconfirmed(trs, sender, dbTrans) {
        const assetObj = await this.getAssetObject(trs);
        const key = `${sender.address}:${trs.type}:${assetObj.org_id}:${assetObj.state}`;
        if (assetObj.state == 0 && this.oneoff.has(key)) {
            throw new Error(`The exchange ${assetObj.org_id} is in process already.`);
        }

        await super.applyUnconfirmed(trs, sender, dbTrans);

        if (assetObj.state == 1) {
            this.oneoff.set(key, true);
        }
    }

    async undoUnconfirmed(trs, sender, dbTrans) {
        const assetObj = await this.getAssetObject(trs);
        if (assetObj.state == 1) {
            const key = `${sender.address}:${trs.type}:${assetObj.org_id}:${assetObj.state}`;
            this.oneoff.delete(key);
        }

        var result = await super.undoUnconfirmed(trs, sender, dbTrans);
        return result;
    }

    async dbSave(trs, dbTrans) {
        var result = await super.dbSave(trs, dbTrans);
        const asset = await this.getAssetObject(trs);
        if (asset.state == 1) {
            result = await daoUtil.exchangeOrg(this._context, 
                asset.org_id, asset.sender_address, dbTrans);
        }
        return result;
    }

    async attachApi(router) {
        router.put("/", async (req, res) => {
            try {
                const result = await this.putExchange(req, res);
                res.json(result);
            } catch (err) {
                res.json({success: false, error: err.message || err.toString()});
            }
        });
    }

    async putExchange(req, res) {
        const body = req.body;
        const validateErrors = await this.ddnSchema.validate({
            type: 'object',
            properties: {
                secret: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100
                },
                publicKey: {
                    type: "string",
                    format: "publicKey"
                },
                price: {
                    type: "string"
                },
                state: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 1,
                },
                orgId: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100
                },
                exchangeTrsId: {
                    type: "string",
                    minLength: 0,
                    maxLength: 100
                },
                receivedAddress: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100
                },
            },
            required: ['secret', 'orgId', 'price', 'receivedAddress']
        }, body);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        const hash = crypto.createHash('sha256').update(body.secret, 'utf8').digest();
        const keypair = ed.MakeKeypair(hash);

        if (body.publicKey) {
            if (keypair.publicKey.toString('hex') != body.publicKey) {
                throw new Error("Invalid passphrase");
            }
        }
        
        const exchange = {
            org_id: body.orgId,
            price: body.price,
            received_address: body.receivedAddress,
            exchange_trs_id: body.exchangeTrsId || "",
            state: body.state ? body.state : 0
        };

        return new Promise((resolve, reject) => {
            this.balancesSequence.add(async (cb) => {
                if (body.multisigAccountPublicKey && body.multisigAccountPublicKey != keypair.publicKey.toString('hex')) {
                    var account;
                    try {
                        account = await this.runtime.account.getAccountByPublicKey(body.multisigAccountPublicKey);
                    } catch (e) {
                        return cb(e);
                    }

                    if (!account) {
                        return cb("Multisignature account not found");
                    }

                    if (!account.multisignatures) {
                        return cb("Account does not have multisignatures enabled");
                    }

                    if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
                        return cb("Account does not belong to multisignature group");
                    }

                    exchange.sender_address = account.address;

                    var requester;
                    try {
                        requester = await this.runtime.account.getAccountByPublicKey(keypair.publicKey);
                    } catch (e) {
                        return cb(e);
                    }

                    if (!requester || !requester.public_key) {
                        return cb("Invalid requester");
                    }
            
                    if (requester.second_signature && !body.secondSecret) {
                        return cb("Invalid second passphrase");
                    }
            
                    if (requester.public_key == account.public_key) {
                        return cb("Invalid requester");
                    }
            
                    let second_keypair = null;
                    if (requester.second_signature) {
                        const secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                        second_keypair = ed.MakeKeypair(secondHash);
                    }

                    try {
                        var data = {
                            type: await this.getTransactionType(),
                            sender: account,
                            keypair: keypair,
                            requester: keypair,
                            second_keypair
                        };
                        var assetJsonName = await this.getAssetJsonName();
                        data[assetJsonName] = exchange;

                        var transaction = await this.runtime.transaction.create(data);
                  
                        var transactions = await this.runtime.transaction.receiveTransactions([transaction]);
                        cb(null, transactions);
                    } catch (e) {
                        cb(e);
                    }
                } else {
                    var account;
                    try {
                        account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey.toString('hex'));
                    } catch (e) {
                        return cb(e);
                    }

                    if (!account) {
                        return cb("Account not found");
                    }
              
                    if (account.second_signature && !body.secondSecret) {
                        return cb("Invalid second passphrase");
                    }

                    exchange.sender_address = account.address;

                    let second_keypair = null;
                    if (account.secondSignature) {
                        const secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                        second_keypair = ed.MakeKeypair(secondHash);
                    }

                    try {
                        var data = {
                            type: await this.getTransactionType(),
                            sender: account,
                            keypair,
                            second_keypair
                        }
                        var assetJsonName = await this.getAssetJsonName();
                        data[assetJsonName] = exchange;

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

                resolve({success: true, transactionId: transactions[0].id});
            });
        });
    }
}
module.exports = Exchange;
