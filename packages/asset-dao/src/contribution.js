import ByteBuffer from 'bytebuffer';
import Asset from '@ddn/asset-base';
import DdnUtils from '@ddn/utils';
import DdnCrypto from '@ddn/crypto';

import daoUtil from './daoUtil.js';

/**
 * 贡献（投稿）交易
 *
 * @receivedAddress 接收地址（媒体号的钱包地址）
 * @senderAddress 投稿者的钱包地址
 * @price 投稿者自定义价格，初期默认为 ‘0’；系统默认为 ‘0’；使用bignumber.js处理；
 * @url 文章的dat地址
 * @transactionId 交易id
 *
 * @fee 0.1EBT
 */
class Contribution extends Asset.Base {
    async propsMapping() {
        return [{
            field: 'str2',
            prop: 'title',
        },
        {
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
            field: 'str1',
            prop: 'price',
        }
        ];
    }

    async create(data, trs) {
        const trans = trs;
        trans.recipientId = null; // wxm block database
        trans.amount = '0';

        const assetJsonName = await this.getAssetJsonName(trs.type);
        trans.asset[assetJsonName] = data[assetJsonName];

        return trans;
    }

    async verify(trs) {
        const contribution = await this.getAssetObject(trs);

        if (trs.recipientId) {
            throw new Error('Invalid recipient');
        }
        if (!DdnUtils.bignum.isZero(trs.amount)) {
            throw new Error('Invalid transaction amount');
        }
        if (!trs.asset || !contribution) {
            throw new Error('Invalid transaction asset "Contribution"');
        }
        if (!contribution.title || contribution.title.length > 128) {
            throw new Error('title is undefined or too long, don`t more than 128 characters.');
        }
        if (!contribution.received_address
            || contribution.received_address.length > 128) {
            throw new Error('received_address is undefined or too long, don`t more than 128 characters.');
        }
        if (!this.address.isAddress(contribution.received_address)) {
            throw new Error("Invalid contribution's received_address");
        }
        if (!contribution.sender_address
            || contribution.sender_address.length > 128) {
            throw new Error('sender_address is undefined or too long, don`t more than 128 characters.');
        }
        if (!this.address.isAddress(contribution.sender_address)) {
            throw new Error("Invalid contribution's sender_address");
        }
        if (!contribution.url
            || contribution.url.length > 256) {
            throw new Error('url is undefined or too long, don`t more than 256 characters.');
        }

        if (DdnUtils.bignum.isNaN(contribution.price)) {
            throw new Error("Invalid contribution's price.");
        }

        const org = await daoUtil.getEffectiveOrgByAddress(this._context, contribution.received_address);
        if (!org) {
            throw new Error('no org was found based on received_address: ' + contribution.received_address);
        }

        return trs;
    }

    async getBytes(trs) {
        const contribution = await this.getAssetObject(trs);
        const bb = new ByteBuffer();
        bb.writeUTF8String(contribution.title);
        bb.writeUTF8String(contribution.received_address);
        bb.writeUTF8String(contribution.sender_address);
        bb.writeUTF8String(contribution.price);
        bb.writeUTF8String(contribution.url);
        bb.flip();
        return bb.toBuffer();
    }

    async dbSave(trs, dbTrans) {
        const contribution = await this.getAssetObject(trs);
        contribution.url = (contribution.url + "").toLowerCase();
        await super.dbSave(trs, dbTrans);
    }

    async attachApi(router) {
        router.put("/:orgId", async (req, res) => {
            try {
                const result = await this.putContribution(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/:orgId/list", async (req, res) => {
            try {
                const result = await this.getContributionsByOrgId(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });
    }

    async getContributionsByOrgId(req) {
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
            throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`);
        }

        const where = {
            trs_type: await this.getTransactionType()
        };
        where.received_address = org.address;
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

    async putContribution(req) {
        const orgId = req.params.orgId;
        const org = await daoUtil.getEffectiveOrgByOrgId(this._context, orgId);
        if (!org) {
            throw new Error("Org not found: " + orgId);
        }

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
                title: {
                    type: "string"
                },
                price: {
                    type: "string",
                },
                url: {
                    type: "string",
                    minLength: 1,
                    maxLength: 256
                }
            },
            required: ['secret', 'title', 'url']
        }, body);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`);
        }

        const keypair = DdnCrypto.getKeys(body.secret);

        // const senderPublicKey = keypair.publicKey.toString('hex')

        const contribution = {
            title: body.title,
            received_address: org.address || "",
            price: body.price || "0",
            url: body.url
        };

        return new Promise((resolve, reject) => {
            this.balancesSequence.add(async (cb) => {
                if (body.multisigAccountPublicKey && body.multisigAccountPublicKey != keypair.publicKey.toString('hex')) {
                    let account;
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

                    let requester;
                    try {
                        requester = await this.runtime.account.getAccountByPublicKey(keypair.publicKey);
                    } catch (e) {
                        return cb(e);
                    }

                    if (!requester || !requester.publicKey) {
                        return cb("Invalid requester");
                    }

                    if (requester.second_signature && !body.secondSecret) {
                        return cb("Invalid second passphrase");
                    }

                    if (requester.publicKey == account.publicKey) {
                        return cb("Invalid requester");
                    }

                    let second_keypair = null;
                    if (requester.second_signature) {
                        second_keypair = DdnCrypto.getKeys(body.secondSecret);
                    }

                    contribution.sender_address = account.address;

                    try {
                        let data = {
                            type: await this.getTransactionType(),
                            sender: account,
                            keypair,
                            requester: keypair,
                            second_keypair,
                        };
                        let assetJsonName = await this.getAssetJsonName();
                        data[assetJsonName] = contribution;

                        let transaction = await this.runtime.transaction.create(data);

                        let transactions = await this.runtime.transaction.receiveTransactions([transaction]);
                        cb(null, transactions);
                    } catch (e) {
                        cb(e);
                    }
                } else {
                    let account;
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
                        second_keypair = DdnCrypto.getKeys(body.secondSecret);
                    }

                    contribution.sender_address = account.address;

                    try {
                        let data = {
                            type: await this.getTransactionType(),
                            sender: account,
                            keypair,
                            second_keypair
                        }
                        let assetJsonName = await this.getAssetJsonName();
                        data[assetJsonName] = contribution;

                        let transaction = await this.runtime.transaction.create(data);

                        let transactions = await this.runtime.transaction.receiveTransactions([transaction]);
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
            });
        });
    }

}

export default Contribution;
