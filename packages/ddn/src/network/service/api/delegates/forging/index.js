const crypto = require('crypto');
const bignum = require('@ddn/bignum-utils');
const ed = require('ed25519');

/**
 * RootRouter接口
 * wangxm   2019-03-22
 */
class RootRouter {

    constructor(context) {
        Object.assign(this, context);
        this._context = context;
    }

    async getGetForgedByAccount(req) {
        var query = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                generatorPublicKey: {
                    type: "string",
                    format: "publicKey"
                }
            },
            required: ["generatorPublicKey"]
        }, query);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var account = await this.runtime.account.getAccountByPublicKey(query.generatorPublicKey);
        if (!account) {
            throw new Error("Account not found");
        }

        return {
            fees: account.fees + "",    //bignum update
            rewards: account.rewards + "", 
            forged: bignum.plus(account.fees, account.rewards).toString()
        };
    }

    async postEnable(req) {
        var body = req.body;
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                secret: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100
                },
                publicKey: {
                    type: "string",
                    format: "publicKey"
                }
            },
            required: ["secret"]
        }, body);
        if (validateErrors) {
            return {success: false, error: validateErrors[0].message};
        }

        var ip = req.connection.remoteAddress;
        if (this.config.forging.access.whiteList.length > 0 && 
            this.config.forging.access.whiteList.indexOf(ip) < 0) {
            return {success: false, error: "Access denied"};
        }
    
        var keypair = ed.MakeKeypair(crypto.createHash('sha256').update(body.secret, 'utf8').digest());
        if (body.publicKey) {
            if (keypair.publicKey.toString('hex') != body.publicKey) {
                return {success: false, error: "Invalid passphrase"};
            }
        }
    
        var myDelegate = await this.runtime.delegate.getMyDelegateByPublicKey(keypair.publicKey.toString('hex'));
        if (myDelegate) {
            return {success: false, error: "Forging is already enabled"};
        }

        var account;
        try
        {
            account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey.toString('hex'));
        }
        catch (err)
        {
            return {success: false, error: err.toString()};
        }

        if (account && account.is_delegate) {  //wxm block database
            
            await this.runtime.delegate.enableForged(keypair);
            this.logger.info(`Forging enabled on account: ${account.address}`);
            return {success: true, address: account.address};
        } else {
            return {success: false, error: "Delegate not found"};
        }
    }

    async postDisable(req) {
        var body = req.body;
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                secret: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100
                },
                publicKey: {
                    type: "string",
                    format: "publicKey"
                }
            },
            required: ["secret"]
        }, body);
        if (validateErrors) {
            return {success: false, error: validateErrors[0].message}
        }

        var ip = req.connection.remoteAddress;
        if (this.config.forging.access.whiteList.length > 0 && 
            this.config.forging.access.whiteList.indexOf(ip) < 0) {
            return {success: false, error: "Access denied"};
        }

        var keypair = ed.MakeKeypair(crypto.createHash('sha256').update(body.secret, 'utf8').digest());
        if (body.publicKey) {
            if (keypair.publicKey.toString('hex') != body.publicKey) {
                return {success: false, error: "Invalid passphrase"};
            }
        }
      
        var myDelegate = await this.runtime.delegate.getMyDelegateByPublicKey(keypair.publicKey.toString('hex'));
        if (!myDelegate) {
            return {success: false, error: "Delegate not found"};
        }

        var account;
        try
        {
            account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey.toString('hex'));
        }
        catch (err)
        {
            return {success: false, error: err.toString()};
        }

        if (account && account.is_delegate) {  //wxm block database
            await this.runtime.delegate.disableForgedByPublicKey(keypair.publicKey.toString('hex'));
            this.logger.info(`Forging disabled on account: ${account.address}`);
            return {success: true, address: account.address};
        } else {
            return {success: false, error: "Delegate not found"};
        }
    }

    async getStatus(req) {
        var query = req.query;
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                publicKey: {
                    type: "string",
                    format: "publicKey"
                }
            },
            required: ["publicKey"]
        }, query);
        if (validateErrors) {
            return {success: false, error: validateErrors[0].message};
        }

        var delegate = await this.runtime.delegate.getMyDelegateByPublicKey(query.publicKey);
        return {success: true, enabled: !!delegate};
    }

}

module.exports = RootRouter;