const crypto = require('crypto');
const bignum = require('@ddn/bignum-utils');
const ed = require('ed25519');
const { AssetTypes } = require('@ddn/ddn-utils');

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
            throw new Error("Account not found");
        }

        if (account.delegates) {
            var delegates = await this.runtime.account.getAccountList({
                is_delegate: 1,  //wxm block database
                sort: [['vote', 'DESC'], ['public_key', 'ASC']]  //wxm block database
            }, ["username", "address", "public_key", "vote", "missedblocks", "producedblocks"]);

            var limit = query.limit || this.config.settings.delegateNumber;
            var offset = query.offset || 0;
            var orderField = query.orderBy;
    
            orderField = orderField ? orderField.split(':') : null;
            limit = limit > this.config.settings.delegateNumber ? this.config.settings.delegateNumber : limit;
    
            var orderBy = orderField ? orderField[0] : null;
            var sortMode = orderField && orderField.length == 2 ? orderField[1] : 'asc';
            var count = delegates.length;
            var length = Math.min(limit, count);
            var realLimit = Math.min(offset + limit, count);
    
            var lastBlock = this.runtime.block.getLastBlock();
            var totalSupply = this.runtime.block.getBlockStatus().calcSupply(lastBlock.height);
    
            for (let i = 0; i < delegates.length; i++) {
                delegates[i].rate = i + 1;
                delegates[i].approval = ((delegates[i].vote / totalSupply) * 100).toFixed(2);
    
                let percent = 100 - (delegates[i].missedblocks / ((delegates[i].producedblocks + delegates[i].missedblocks) / 100));
                percent = percent || 0;
                var outsider = i + 1 > this.config.settings.delegateNumber; //wxm   slots.delegates;
                delegates[i].productivity = (!outsider) ? parseFloat(Math.floor(percent * 100) / 100).toFixed(2) : 0;
            }
    
            var result = delegates.filter(delegate => account.delegates.indexOf(delegate.public_key) != -1);
            return { success: true, delegates: result };
        } else {
            return { success: true, delegates: [] };
        }
    }

    async getFee(req) {
        return {
            fee: bignum.multiply(1, this.tokenSetting.fixedPoint)
        };
    }

    async put(req) {
        var body = req.body;
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                secret: {
                    type: 'string',
                    minLength: 1
                },
                publicKey: {
                    type: 'string',
                    format: 'publicKey'
                },
                secondSecret: {
                    type: 'string',
                    minLength: 1
                }
            }
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

                    let second_keypair = null;
                    if (requester.second_signature) {
                      var secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                      second_keypair = ed.MakeKeypair(secondHash);
                    }

                    try {
                        var transaction = await this.runtime.transaction.create({
                            type: AssetTypes.VOTE,
                            votes: body.delegates,
                            sender: account,
                            keypair,
                            second_keypair,
                            requester: keypair
                        });
                        var transactions = await this.runtime.transaction.receiveTransactions([transaction]);
                        cb(null, transactions);
                    } catch (err) {
                        cb(err);
                    }
                } else {
                    var account;
                    try
                    {
                        account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey.toString('hex'));
                    }
                    catch (err)
                    {
                        return cb(err);
                    }

                    if (!account) {
                        return cb("Account not found");
                    }
              
                    if (account.second_signature && !body.secondSecret) {
                        return cb("Invalid second passphrase");
                    }

                    let second_keypair = null;
                    if (account.second_signature) {
                        var secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                        second_keypair = ed.MakeKeypair(secondHash);
                    }

                    try {
                        var transaction = await this.runtime.transaction.create({
                              type: AssetTypes.VOTE,
                              votes: body.delegates,
                              sender: account,
                              keypair,
                              second_keypair
                        });
                        var transactions = await this.runtime.transaction.receiveTransactions([transaction]);
                        cb(null, transactions);
                    } catch (e) {
                        cb(e);
                    }
                }
            }, (err, transactions) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ success: true, transaction: transactions[0] });
                }
            })
        });
    }

}

module.exports = RootRouter;