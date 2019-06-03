const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');
const ByteBuffer = require('bytebuffer');
const { isUri } = require('valid-url');
const crypto = require('crypto');
const ed = require('ed25519');
const daoUtil = require('./daoUtil.js');

// 10 秒内不允许重复处理
// let processOrgIdList = {};

// this.bus.on('newBlock', () => {
//   // console.log("library.bus.on('newBlock'--------------processOrgIdList--------------------")
//   processOrgIdList = {};
// });

class Org extends AssetBase {
    /**
      * Org 自治组织中的组织
      * 自治组织可以包含媒体号、企业号等组织形态，为未来更多扩展留有余地。
      *
      * 规则：
      * 1、[a-zA-Z0-9_]，不分大小写，英文字符+数字+_ 加上‘M’等类别后缀；
      * 2、前期申请 >= 5个字符，5位以下逐年开放；
      * 3、必须英文开头；
      */
    // eslint-disable-next-line class-methods-use-this
    async propsMapping() {
        return [{
            field: 'str1',
            prop: 'org_id',
            required: true,
        },
        {
            field: 'str2',
            prop: 'name',
        },
        {
            field: 'str4',
            prop: 'address',
        },
        {
            field: 'str3',
            prop: 'tags',
            required: true,
        },
        {
            field: 'str6',
            prop: 'url',
        },
        {
            field: 'int1',
            prop: 'state',
            required: true,
        },
        ];
    }

    /**
     * 创建组织号
     * data.asset.org 字段 6 个：
     * @org_id 自治组织号（比如：媒体号） 5-20，5位以下逐年开放注册；媒体号 midiumId 是自治组织的一种，可以以M为后缀，其他的以此类推，必须；
     * @name 组织名称，支持汉字，可修改（需要花费fee, **修改的字段信息同步存储在trs交易表的冗余字段args里**)，允许空；
     * @address 绑定的钱包地址（用于接收投稿、转账等），允许空；
     * @url 自治组织主页、媒体号主页地址等，允许空；
     * @tags 类别标签，逗号或者空格分隔，必须；
     * @state 0-首次申请，1-转移，必须；
     *
     * @transaction_id 交易id
     * @fee 交易费用
     * - updated_count 修改次数，虚拟字段，是通过修改次数计算出来的信息
     *
     * @param {object} data 传回来的数据
     * @param {object} trs 交易
     */
    // eslint-disable-next-line class-methods-use-this
    async create(data, trs) {
        const trans = trs;
        trans.recipient_id = null;
        trans.amount = '0';

        const assetJsonName = await this.getAssetJsonName(trs.type);
        trans.asset[assetJsonName] = data[assetJsonName];

        return trans;
    }

    // eslint-disable-next-line class-methods-use-this
    async calculateFee(trs) {
        // register orgId fee x 100000000
        let feeBase = 1;
        const assetObj = await this.getAssetObject(trs);
        const orgId = assetObj.org_id;
        const olen = orgId.length;
        const feeLenMap = {
            10: 50,
            9: 100,
            8: 200,
            7: 400,
            6: 800,
            5: 1600,
        };
        if (olen > 10) {
            feeBase = 10;
        } else if (olen <= 4) {
            feeBase = 99999999; // not allow
        } else {
            feeBase = feeLenMap[`${olen}`];
        }
        if (assetObj.state === 1) {
            feeBase = parseInt(feeBase / 10, 10); // change info
        }
        // bignum update
        // return feeBase * 100000000;
        const result = bignum.multiply(feeBase, 100000000).toString();
        return result;
    }

    async verify(trs, sender) {
        const org = await this.getAssetObject(trs);
        if (trs.recipient_id) {
            throw new Error('Invalid recipient');
        }
        if (org.state === 0) {
            if (!org.name || !org.url) {
                throw new Error('Invalid asset data');
            }
        } else if (org.state === 1) {
            if (!org.name && !org.url && !org.tags) {
                throw new Error(`Invalid asset update no param${JSON.stringify(org)}`);
            }
        } else {
            throw new Error(`Invalid asset state type: ${org.state}`);
        }
        if (!ddnUtils.Address.isAddress(sender.address)) {
            throw new Error('Invalid address');
        }
        // bignum update if (trs.amount != 0) {
        if (!bignum.isZero(trs.amount)) {
            throw new Error('Invalid transaction amount');
        }
        if (!trs.asset || !org) {
            throw new Error('Expect asset org, got invalid transaction asset');
        }
        // check org id
        // org.org_id = org.org_id.toLowerCase();
        if (!daoUtil.isOrgId(org.org_id)) {
            throw new Error('exchange org id not allow');
        }
        if (org.name && org.name.lenght > 64) {
            throw new Error('Name is too long，don`t more than 64 bit.');
        }
        if (!ddnUtils.Address.isAddress(org.address)) {
            throw new Error('Invalid org address');
        }
        if (org.address != sender.address) {
            throw new Error("Org'address must be same with sender'address");
        }
        if (org.url && !isUri(org.url)) {
            throw new Error('Invalid org url');
        }
        if (org.url && org.url.lenght > 256) {
            throw new Error('Url is undefined or too long，don`t more than 256 bit.');
        }
        if (org.tags && org.tags.length > 40) {
            throw new Error('Org tags is too long. Maximum is 40 characters');
        }
        if (org.tags) {
            let tags = org.tags.split(',');
            tags = tags.map(tag => tag.trim()).sort();
            for (let i = 0; i < tags.length - 1; i += 1) {
                if (tags[i + 1] === tags[i]) {
                    throw new Error(`Encountered duplicate tags: ${tags[i]}`);
                }
            }
        }
        // orgId length open by year
        const olen = org.org_id.length;
        const yyyyNum = parseInt(new Date().getFullYear(), 10);
        if (olen <= 4) {
            throw new Error('Org id with 4 length not open in this year');
        } if (olen === 5) {
            if (yyyyNum < 2019) {
                throw new Error('Org id with 5 length will open in year 2019');
            }
        }

        const memOrg = await daoUtil.getEffectiveOrgByOrgId(this._context, org.org_id);
        if (org.state === 0) {
            if (memOrg) {
                throw new Error(`Org ${org.org_id} already exists`);
            }
        } else if (org.state === 1) {
            if (!memOrg) {
                throw new Error(`Org ${org.org_id} not exists`);
            }
            if (sender.address !== memOrg.address) {
                throw new Error(`Org ${org.org_id} not belong to you`);
            }
        }
        return trs;
    }

    // eslint-disable-next-line class-methods-use-this
    // async process(trs, sender) {
    //     const { org } = trs.asset;
    //     if (!org.address) {
    //         org.address = sender.address;
    //     }
    //     if (org.org_id) {
    //         org.org_id = org.org_id.toLowerCase();
    //     }
    //     // process cache
    //     // const oldOrg = processOrgIdList[org.org_id];
    //     // if (oldOrg) {
    //     //   const error = `Org ${org.org_id} being process for ${oldOrg.state ? 'change' : 'apply'}`;
    //     //   throw new Error(error);
    //     // }
    //     // processOrgIdList[org.org_id] = org;
    //     return trs;
    // }

    async applyUnconfirmed(trs, sender, dbTrans) {
        const assetObj = await this.getAssetObject(trs);
        const key = `${sender.address}:${trs.type}:${assetObj.org_id}:${assetObj.state}`;
        if (assetObj.state == 0 && this.oneoff.has(key)) {
            throw new Error(`The org ${assetObj.org_id} is in process already.`);
        }

        await super.applyUnconfirmed(trs, sender, dbTrans);

        if (assetObj.state == 0) {
            this.oneoff.set(key, true);
        }
    }

    async undoUnconfirmed(trs, sender, dbTrans) {
        const assetObj = await this.getAssetObject(trs);
        if (assetObj.state == 0) {
            const key = `${sender.address}:${trs.type}:${assetObj.org_id}:${assetObj.state}`;
            this.oneoff.delete(key);
        }

        var result = await super.undoUnconfirmed(trs, sender, dbTrans);
        return result;
    }

    // eslint-disable-next-line class-methods-use-this
    async getBytes(trs) {
        const org = await this.getAssetObject(trs);
        const bb = new ByteBuffer();
        if (!org) {
            return null;
        }
        try {
            bb.writeUTF8String(org.org_id.toLowerCase());
            bb.writeUTF8String(org.name ? org.name : '');
            bb.writeUTF8String(org.address ? org.address : '');
            bb.writeUTF8String(org.url ? org.url : '');
            bb.writeUTF8String(org.tags ? org.tags : '');
            bb.writeInt8(org.state);
            bb.flip();
        } catch (e) {
            throw Error(e.toString());
        }
        return bb.toBuffer();
    }

    async dbSave(trs, dbTrans) {
        const org = await this.getAssetObject(trs);
        org.transaction_id = trs.id;
        org.timestamp = trs.timestamp;
        if (org.org_id) {
            org.org_id = org.org_id.toLowerCase();
        }

        await super.dbSave(trs, dbTrans);
        await daoUtil.updateOrg(this._context, org, dbTrans);
    }

    /**
     * 自定义资产Api
     */
    async attachApi(router) {
        router.put("/", async(req, res) => {
            try {
                const result = await this.putOrg(req, res);
                res.json(result);
            } catch (err) {
                res.json({success: false, error: err.message || err.toString()});
            }
        });

        router.get("/orgid/:orgId", async(req, res) => {
            try {
                const result = await this.getOrgByOrgId(req, res);
                res.json(result);
            } catch (err) {
                res.json({success: false, error: err.message || err.toString()});
            }
        });

        router.get("/getlist", async(req, res) => {
            try {
                const result = await this.getOrgList(req, res);
                res.json(result);
            } catch (err) {
                res.json({success: false, error: err.message || err.toString()});
            }
        });

        router.get("/address/:address", async(req, res) => {
            try {
                const result = await daoUtil.getEffectiveOrgByAddress(this._context, req.params.address)
                res.json({success: true, data: {org: result}});
            } catch (err) {
                res.json({success: false, error: err.message || err.toString()});
            }
        });
    }

    /**
     * 注册组织号
     * @param {*} req 
     * @param {*} res 
     */
    async putOrg(req, res) {
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
                orgId: {
                    type: "string",
                    minLength: 1,
                    maxLength: 20
                },
                name: {
                    type: "string",
                    minLength: 1,
                    maxLength: 64
                },
                address: {
                    type: "string",
                    minLength: 1,
                    maxLength: 128
                },
                tags: {
                    type: "string",
                    minLength: 1,
                    maxLength: 40
                },
                url: {
                    type: "string",
                    minLength: 1,
                    maxLength: 256
                },
                state: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 1,
                }
            },
            required: ['secret', 'orgId', 'state']
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

        const address = this.runtime.account.generateAddressByPublicKey(keypair.publicKey);
        const org = {
            org_id: body.orgId.toLowerCase().trim(),
            name: body.name,
            url: body.url,
            tags: body.tags,
            state: body.state,
            address: body.address || address
        };

        if (body.state == 1) {
            const currOrg = await daoUtil.getEffectiveOrgByOrgId(this._context, body.orgId);
            if (currOrg) {
                org.name = org.name || currOrg.name;
                org.url = org.url || currOrg.url;
                org.tags = org.tags || currOrg.tags;
                org.address = org.address || currOrg.address;
            }
        }

        return new Promise((resolve, reject) => {
            this.balancesSequence.add(async(cb) => {
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

                    try {
                        var data = {
                            type: await this.getTransactionType(),
                            sender: account,
                            keypair,
                            requester: keypair,
                            second_keypair,
                        };
                        var assetJsonName = await this.getAssetJsonName();
                        data[assetJsonName] = org;

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

                    try {
                        var data = {
                            type: await this.getTransactionType(),
                            sender: account,
                            keypair,
                            second_keypair
                        }
                        var assetJsonName = await this.getAssetJsonName();
                        data[assetJsonName] = org;

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

    /**
     * 根据OrgId获取Org信息
     * @param {*} req 
     * @param {*} res 
     */
    async getOrgByOrgId(req, res) {
        const orgInfo = await daoUtil.getEffectiveOrgByOrgId(this._context, req.params.orgId);
        return {success: true, data: {org: orgInfo}};
    }

    /**
     * 查询Org列表
     * @param {*} req 
     * @param {*} res 
     */
    async getOrgList(req, res) {
        const query = req.query || req.body;

        const validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                pageindex: {
                    type: 'integer',
                    minimum: 1
                },
                pagesize: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
                },
                orgId: {
                    type: "string",
                    minLength: 1,
                    maxLength: 20
                },
                name: {
                    type: "string",
                    minLength: 1,
                    maxLength: 64
                },
                address: {
                    type: "string",
                    minLength: 1,
                    maxLength: 128
                },
                tags: {
                    type: "string",
                    minLength: 1,
                    maxLength: 40
                },
                url: {
                    type: "string",
                    minLength: 1,
                    maxLength: 256
                },
                state: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 1,
                }
            },
            required: []
        }, query);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        const where = {
            org_id: query.orgId,
            name: query.name,
            address: query.address,
            url: query.url,
            tags: query.tags,
            state: query.state
        };
        for (var p in where) {
            if (!where[p]) {
                delete where[p];
            }
        }

        const orders = [];

        const pageIndex = req.query.pageindex || 1;
        const pageSize = req.query.pagesize || 50;

        const limit = pageSize;
        const offset = (pageIndex - 1) * pageSize;

        return new Promise((resolve, reject) => {
            this.dao.findPage("mem_org", where, limit, offset, true, [
                'transaction_id', 'org_id', 'name', 'address', 'tags', 
                'url', 'state', 'timestamp'], orders, null, (err, result) => {
                if (err) {
                    return reject(err);
                }

                resolve({success: true, data: result});
            });
        });
    }

}
module.exports = Org;
