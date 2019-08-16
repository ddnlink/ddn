const { AssetBase } = require('@ddn/ddn-asset-base');
const bignum = require('@ddn/bignum-utils');
const ddnUtils = require('@ddn/ddn-utils');
const daoUtil = require('./daoUtil');
const crypto = require('crypto');
const ed = require('ed25519');

/**
  * 确认交易
  * @receivedAddress 接收地址（媒体号的钱包地址）
  * @senderAddress 投稿者的钱包地址
  * @url 文章的dat地址
  * @state 0-不接受，1-确认接收
  * @contributionTrsId 投稿的交易id
  * @transactionId 交易id
  *
  * @amout 等于投稿时作者设定的 @price 的数量
  * @fee 0EBT
  */
class Confirmation extends AssetBase {
    // eslint-disable-next-line class-methods-use-this
    async propsMapping() {
        return [{
            field: 'str4',
            prop: 'received_address',
        },
        {
            field: 'str5',
            prop: 'sender_address',
        },
        {
            field: 'str6',
            prop: 'url',
        },
        {
            field: 'int1',
            prop: 'state',
        },
        {
            field: 'str2',
            prop: 'contribution_trs_id',
        }
        ];
    }

    // eslint-disable-next-line class-methods-use-this
    async create(data, trs) {
        const trans = trs;

        const assetJsonName = await this.getAssetJsonName(trs.type);
        if (data[assetJsonName].state === 0) {
            // 拒绝时没有转账交易
            trans.recipient_id = null; // wxm block database
            trans.amount = '0';
        } else if (data[assetJsonName].state === 1) {
            trans.recipient_id = data[assetJsonName].received_address; // wxm block database
            // 此处交易金额=投稿的price
            trans.amount = bignum.new((data[assetJsonName].price || 0)).toString();
        }
        trans.asset[assetJsonName] = data[assetJsonName];

        return trans;
    }

    async calculateFee(trs) {
        const confirmation = await this.getAssetObject(trs);
        if (confirmation.state === 0) {
            return '0'; // 拒绝稿件时手续费为0
        }
        return "100000000";
    }

    async verify(trs) {
        const confirmation = await this.getAssetObject(trs);
        if (!trs.asset || !confirmation) {
            throw new Error('Invalid transaction asset "Contribution"');
        }

        if (confirmation.state === 0) {
            if (trs.recipient_id) {
                throw new Error('Invalid recipient');
            }
        } else if (confirmation.state === 1) {
            if (!trs.recipient_id) {
                throw new Error('Invalid recipient');
            }
        } else {
            throw new Error('The value of state only can be: [0,1]');
        }

        if (confirmation.state === 0) {
            if (!bignum.isZero(trs.amount)) {
                throw new Error('Invalid transaction amount');
            }
        }

        if (!confirmation.received_address
            || confirmation.received_address.length > 128) {
            throw new Error('received_address is undefined or too long, don`t more than 128 characters.');
        }
        if (!ddnUtils.Address.isAddress(confirmation.received_address)) {
            throw new Error("Invalid confirmation's received_address");
        }

        if (!confirmation.sender_address
            || confirmation.sender_address.length > 128) {
            throw new Error('senderAddress is undefined or too long, don`t more than 128 characters.');
        }
        if (!ddnUtils.Address.isAddress(confirmation.sender_address)) {
            throw new Error("Invalid confirmation's senderAddress");
        }

        if (!confirmation.url
            || confirmation.url.length > 256) {
            throw new Error('url is undefined or too long, don`t more than 256 characters.');
        }

        if (!confirmation.contribution_trs_id
            || confirmation.contribution_trs_id.length > 64) {
            throw new Error('url is undefined or too long, don`t more than 256 characters.');
        }

        // (1)查询getConfirmation是否存在
        const confirmationRecords = await super.queryAsset({
            contribution_trs_id: confirmation.contribution_trs_id,
        }, null, false, 1, 1);
        if (confirmationRecords && confirmationRecords.length >= 1) {
            throw new Error(`The contribution has been confirmed: ${confirmation.contribution_trs_id}`);
        }

        // (2)如果不存在则继续查询
        const contributionInst = await this.getAssetInstanceByName("Contribution");

        const contributionRecords = await contributionInst.queryAsset({
            trs_id: confirmation.contribution_trs_id,
        }, null, false, 1, 1);
        if (contributionRecords && contributionRecords.length >= 1) {
            const contribution = contributionRecords[0];
            // 确认的请求地址必须和投稿的接收地址一致
            if (confirmation.sender_address !== contribution.received_address) {
                throw new Error("confirmation's sender address must same as contribution's received address");
            }
            // 确认的接收地址必须和投稿的发送地址一致
            if (confirmation.received_address !== contribution.sender_address) {
                throw new Error("confirmation's received address must same as contribution's sender address");
            }
            // 判断交易的价格是否和投稿的价值一致
            if (confirmation.state === 1) {
                if (!bignum.isEqualTo(trs.amount, contribution.price)) {
                    throw new Error(`The transaction's amount must be equal contribution's price: ${contribution.price}`);
                }
            }
        } else {
            throw new Error(`The contribution not found: ${confirmation.contribution_trs_id}`);
        }

        return trs;
    }

    async dbSave(trs, dbTrans) {
        const confirmation = await this.getAssetObject(trs);
        confirmation.url = (confirmation.url + "").toLowerCase();
        await super.dbSave(trs, dbTrans);
    }

    async attachApi(router) {
        router.put("/", async (req, res) => {
            try {
                const result = await this.putConfirmation(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/:orgId/list", async (req, res) => {
            try {
                const result = await this.getConfirmationsByOrgId(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });
    }

    async getConfirmationsByOrgId(req, res) {
        const orgId = req.params.orgId;
        const org = await daoUtil.getEffectiveOrgByOrgId(this._context, orgId);
        if (!org) {
            throw new Error("Org not found: " + orgId);
        }

        const validateErrors = await this.ddnSchema.validate({
            type: 'object',
            properties: {
                senderPublicKey: {
                    type: "string"
                },
                multisigAccountPublicKey: {
                    type: "string",
                    format: "publicKey"
                },
                url: {
                    type: "string"
                },
                timestamp: {
                    type: 'integer'
                },
                pageIndex: {
                    type: 'integer',
                    minimum: 1
                },
                pageSize: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 500
                }
            },
            required: []
        }, req.query);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        const where = {
            trs_type: await this.getTransactionType()
        };
        
        where.sender_address = org.address;
        if (req.query.url) {
            where.url = req.query.url.toLowerCase();
        }
        if (req.query.timestamp) {
            where.timestamp = {
                "$gt": req.query.timestamp
            }
        }

        var pageIndex = req.query.pageindex || 1;
        var pageSize = req.query.pagesize || 50;

        return await new Promise((resolve, reject) => {
            this.queryAsset(where, [], true, pageIndex, pageSize)
            .then(rows => {
                resolve({success: true, state: 0, data: rows});
            }).catch(err => {
                reject(err);
            });
        })
    }

    async putConfirmation(req, res) {
        const body = req.body;

        const validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                secret: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100
                },
                secondSecret: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100
                },
                multisigAccountPublicKey: {
                    type: "string",
                    format: "publicKey"
                },
                contributionTrsId: {
                    type: "string"
                },
                url: {
                    type: "string",
                    minimum: 1,
                    maximum: 256
                },
                state: {
                    type: "integer",
                    minimum: 0,
                    maximum: 1
                }
            },
            required: ['secret', 'contributionTrsId', 'state']
        }, body);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        const hash = crypto.createHash('sha256').update(body.secret, 'utf8').digest();
        const keypair = ed.MakeKeypair(hash);
        var senderPublicKey = keypair.publicKey.toString('hex')

        const contributionInst = await this.getAssetInstanceByName("Contribution");
        const contributionRecords = await contributionInst.queryAsset({
            trs_id: body.contributionTrsId,
        }, null, false, 1, 1);

        if (contributionRecords && contributionRecords.length) {
            const contribution = contributionRecords[0];

            var confirmation = {
                received_address: contribution.sender_address || "",
                contribution_trs_id: body.contributionTrsId,
                url: body.url || contribution.url || "",
                state: body.state,
                price: body.state == 1 ? contribution.price : "0"
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
    
                        confirmation.sender_address = account.address;

                        try {
                            var data = {
                                type: await this.getTransactionType(),
                                sender: account,
                                keypair,
                                requester: keypair,
                                second_keypair,
                            };
                            var assetJsonName = await this.getAssetJsonName();
                            data[assetJsonName] = confirmation;
    
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

                        let second_keypair = null;
                        if (account.secondSignature) {
                            const secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                            second_keypair = ed.MakeKeypair(secondHash);
                        }
    
                        confirmation.sender_address = account.address;
        
                        try {
                            var data = {
                                type: await this.getTransactionType(),
                                sender: account,
                                keypair,
                                second_keypair
                            }
                            var assetJsonName = await this.getAssetJsonName();
                            data[assetJsonName] = confirmation;
    
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
    
                    resolve({
                        success: true,
                        transactionId: transactions[0].id
                    });
                })
            });
        } else {
            throw new Error("The contribution is not find: " + body.contributionTrsId);
        }
    }
}

module.exports = Confirmation;
