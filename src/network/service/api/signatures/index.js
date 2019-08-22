/**
 * RootRouter接口
 * wangxm   2019-03-27
 */
const bignum = require('@ddn/bignum-utils');
const crypto = require('crypto');
const ed = require('ed25519');
const { AssetTypes } = require('@ddn/ddn-utils');

class RootRouter {

    constructor(context) {
        Object.assign(this, context);
        this._context = context;
    }

    async put(req) {
        var body = req.body;
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                secret: {
                    type: "string",
                    minLength: 1
                },
                secondSecret: {
                    type: "string",
                    minLength: 1
                },
                publicKey: {
                    type: "string",
                    format: "publicKey"
                },
                multisigAccountPublicKey: {
                    type: "string",
                    format: "publicKey"
                }
            },
            required: ["secret", "secondSecret"]
        }, body);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var hash = crypto.createHash('sha256').update(body.secret, 'utf8').digest();
        var keypair = ed.MakeKeypair(hash);

        if (body.publicKey) {
            if (keypair.publicKey.toString('hex') != body.publicKey) {
                throw new Error("Invalid passphrase");
            }
        }

        return new Promise((resolve, reject) => {
            this.balancesSequence.add(async(cb) => {
                if (body.multisigAccountPublicKey && 
                    body.multisigAccountPublicKey != keypair.publicKey.toString('hex')) {

                    var account;
                    try
                    {
                        account = await this.runtime.account.getAccountByPublicKey(body.multisigAccountPublicKey);
                    }
                    catch (err)
                    {
                        return cb(err);
                    }

                    if (!account) {
                        return cb("Multisignature account not found");
                    }
              
                    if (!account.multisignatures || !account.multisignatures) {
                        return cb("Account does not have multisignatures enabled");
                    }
              
                    if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
                        return cb("Account does not belong to multisignature group");
                    }
              
                    if (account.second_signature || account.u_second_signature) {
                        return cb("Invalid second passphrase");
                    }

                    var requester;
                    try
                    {
                        requester = await this.runtime.account.getAccountByPublicKey(keypair.publicKey);
                    }
                    catch (err)
                    {
                        return cb(err);
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

                    var secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                    var second_keypair = ed.MakeKeypair(secondHash);

                    var transactions = [];
                    try {
                        var transaction = await this.runtime.transaction.create({
                            type: AssetTypes.SIGNATURE,
                            sender: account,
                            keypair,
                            requester: keypair,
                            second_keypair,
                        });
                        transactions = await this.runtime.transaction.receiveTransactions([transaction]);
                    } catch (e) {
                        return cb(e);
                    }
                    cb(null, transactions);
                } else {
                    var account;
                    try
                    {
                        account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey.toString('hex'));
                    }
                    catch (err) {
                        return cb(err);
                    }

                    if (!account) {
                        return cb("Account not found");
                    }

                    if (account.second_signature && !body.secondSecret) {
                        return cb("Invalid second passphrase");
                    }

                    var secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                    var second_keypair = ed.MakeKeypair(secondHash);

                    var transactions = [];
                    try {
                        var transaction = await this.runtime.transaction.create({
                            type: AssetTypes.SIGNATURE,
                            sender: account,
                            keypair,
                            second_keypair
                        });
                        transactions = await this.runtime.transaction.receiveTransactions([transaction]);
                    } catch (e) {
                        return cb(e);
                    }
                    cb(null, transactions);
                }
            }, (err, transactions) => {
                if (err || !transactions || !transactions.length) {
                    return reject(err || "Create signature transactoin failed.");
                }

                resolve({success: true, transaction: transactions[0]});
            });
        })
    }

    async getFee(req) {
        //   bignum update
        //   fee = 5 * constants.fixedPoint;
        let fee = bignum.multiply(5, this.tokenSetting.fixedPoint);
        return {fee};
    }

}

module.exports = RootRouter;