const crypto = require('crypto');
const ed = require('ed25519');
const Mnemonic = require('bitcore-mnemonic');

/**
 * RootRouter接口
 * wangxm   2019-03-22
 */
class RootRouter {

    constructor(context) {
        Object.assign(this, context);
        this._context = context;
    }

    async get(req) {
        var query = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                address: {
                    type: "string",
                    minLength: 1
                }
            },
            required: ["address"]
        }, query);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var account = await this.runtime.account.getAccountByAddress(query.address);
        if (!account) {
            account = {
                address: query.address,
                u_balance: 0,
                balance: 0,
                public_key: '',
                u_second_signature: '',
                second_signature: '',
                second_public_key: '',
                multisignatures: '',
                u_multisignatures: '',
                lock_height: "0",
                username: ''
            };
        }

        var lastBlock = this.runtime.block.getLastBlock();
        return {
            success: true,
            account: {
                address: account.address,
                unconfirmed_balance: account.u_balance,
                balance: account.balance,
                public_key: account.public_key,
                username: account.username,
                unconfirmed_signature: account.u_second_signature,
                second_signature: account.second_signature,
                second_public_key: account.second_public_key,
                multisignatures: account.multisignatures,
                u_multisignatures: account.u_multisignatures,
                lock_height: account.lock_height + ""
            },
            latestBlock: {
                height: lastBlock.height + "",
                timestamp: lastBlock.timestamp
            },
            version: await this.runtime.peer.getVersion()
        };
    }

    async getGetBalance(req) {
        var query = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                address: {
                    type: "string",
                    minLength: 1,
                    maxLength: 50
                }
            },
            required: ["address"]
        }, query);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        if (!this.runtime.account.isAddress(query.address)) {
            throw new Error("Invalid address");
        }

        var account = await this.runtime.account.getAccountByAddress(query.address);
        var balance = account ? account.balance : 0;
        var unconfirmedBalance = account ? account.u_balance : 0;
        return { success: true, balance, unconfirmedBalance };
    }

    async getGetPublicKey(req) {
        var query = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                address: {
                    type: "string",
                    minLength: 1
                }
            },
            required: ["address"]
        }, query);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var account = await this.runtime.account.getAccountByAddress(query.address);
        if (!account || !account.public_key) {
            throw new Error("Account does not have a public key");
        }
        return { success: true, publicKey: account.public_key };
    }

    async postGeneratePublicKey(req) {
        var body = req.body;
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                secret: {
                    type: "string",
                    minLength: 1
                }
            },
            required: ["secret"]
        }, body);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var hash = crypto.createHash('sha256').update(body.secret, 'utf8').digest();
        var keypair = ed.MakeKeypair(hash);
        var public_key = keypair.publicKey.toString('hex')
        var address = this.runtime.account.generateAddressByPublicKey(public_key);
        var account = await this.runtime.account.getAccountByAddress(address);
        if (!account) {
            account = {
                address,
                u_balance: 0,
                balance: 0,
                public_key,
                u_second_public_key: '',
                second_signature: '',
                second_public_key: '',
                multisignatures: '',
                u_multisignatures: ''
            };
        }

        return {
            success: true,
            publicKey: account ? account.public_key : null
        }
    }

    async getNew(req) {
        var query = Object.assign({}, req.body, req.query);
        let ent = Number(query.ent);
        if ([128, 256, 384].indexOf(ent) === -1) {
            ent = 128
        }

        var secret = new Mnemonic(ent).toString();
        var keypair = ed.MakeKeypair(crypto.createHash('sha256').update(secret, 'utf8').digest());
        var address = this.runtime.account.generateAddressByPublicKey(keypair.publicKey);

        return {
            secret,
            publicKey: keypair.publicKey.toString('hex'),
            privateKey: keypair.privateKey.toString('hex'),
            address
        };
    }

    async getTop(req) {
        var query = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                limit: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100
                },
                offset: {
                    type: "integer",
                    minimum: 0
                }
            }
        }, query);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        if (!query.limit) {
            query.limit = 100;
        }
        
        var queryResult = await this.runtime.account.getAccountList({
            sort: [['balance', 'DESC']],    //wxm block database
            offset: query.offset,
            limit: query.limit
        });
        var accounts = queryResult.map(fullAccount => ({
            address: fullAccount.address,
            balance: fullAccount.balance,
            public_key: fullAccount.public_key
        }));
        return {success: true, accounts};
    }

    async getCount(req) {
        var count = await new Promise((resolve, reject) => {
            this.dao.count('mem_account', null,
                (err, count) => {
                if (err) {
                    reject(err || "Database error");
                } else {
                    resolve(count);
                }
            });
        });
        return {success: true, count};
    }

    async postOpen(req) {
        var body = req.body;
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                secret: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100
                }
            },
            required: ["secret"]
        }, body);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var hash = crypto.createHash('sha256').update(body.secret, 'utf8').digest();
        var keypair = ed.MakeKeypair(hash);
        var public_key = keypair.publicKey.toString('hex');
        var address = this.runtime.account.generateAddressByPublicKey(public_key);
        var account = await this.runtime.account.getAccountByAddress(address);
        if (!account) {
            account = {
                address,
                u_balance: 0,
                balance: 0,
                public_key,
                u_second_signature: '',
                second_signature: '',
                second_public_key: '',
                multisignatures: '',
                u_multisignatures: ''
            }
        }

        return {
            success: true,
            account: {
                address: account.address,
                unconfirmed_balance: account.u_balance,
                balance: account.balance,
                public_key: account.public_key,
                unconfirmed_signature: account.u_second_signature,
                second_signature: account.second_signature,
                second_public_key: account.second_public_key,
                multisignatures: account.multisignatures,
                u_multisignatures: account.u_multisignatures,
                lock_height: account.lock_height || 0
            }
        }
    }

    async postOpen2(req) {
        var body = req.body;
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                publicKey: {
                    type: "string",
                    format: 'publicKey'
                }
            },
            required: ["publicKey"]
        }, body);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var address = this.runtime.account.generateAddressByPublicKey(body.publicKey);
        var account = await this.runtime.account.getAccountByAddress(address);
        if (!account) {
            account = {
                address,
                u_balance: 0,
                balance: 0,
                public_key: body.publicKey,
                u_second_signature: '',
                second_signature: '',
                second_public_key: '',
                multisignatures: '',
                u_multisignatures: ''
            };
        }

        var accountData = {
            address: account.address,
            unconfirmed_balance: account.u_balance,
            balance: account.balance,
            public_key: account.public_key,
            unconfirmed_signature: account.u_second_signature,
            second_signature: account.second_signature,
            second_public_key: account.second_public_key,
            multisignatures: account.multisignatures,
            u_multisignatures: account.u_multisignatures,
            lock_height: account.lock_height || 0
        };

        var lastBlock = this.runtime.block.getLastBlock();

        return {
            success: true,
            account: accountData,
            latestBlock: {
              height: lastBlock.height + "",
              timestamp: lastBlock.timestamp
            },
            version: await this.runtime.peer.getVersion()
        };
    }

}

module.exports = RootRouter;