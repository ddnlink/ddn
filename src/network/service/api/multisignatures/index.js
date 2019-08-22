/**
 * RootRouter接口
 * wangxm   2019-03-27
 */
const crypto = require('crypto');
const ed = require('ed25519');
const { AssetTypes } = require('@ddn/ddn-utils');

class RootRouter {

    constructor(context) {
        Object.assign(this, context);
        this._context = context;
    }

    async put(req) {
        var body = Object.assign({}, req.body, req.query);
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
                },
                secondSecret: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100
                },
                min: {
                    type: "integer",
                    minimum: 2,
                    maximum: 16
                },
                lifetime: {
                    type: "integer",
                    minimum: 1,
                    maximum: 24
                },
                keysgroup: {
                    type: "array",
                    minLength: 1,
                    maxLength: 10
                }
            },
            required: ['min', 'lifetime', 'keysgroup', 'secret']
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

                account.public_key = keypair.publicKey.toString('hex');

                if (account.second_signature && !body.secondSecret) {
                    return cb("Invalid second passphrase");
                }
            
                let second_keypair = null;
                if (account.second_signature) {
                    var secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                    second_keypair = ed.MakeKeypair(secondHash);
                }
        
                try {
                    let transaction = await this.runtime.transaction.create({
                        type: AssetTypes.MULTISIGNATURE,
                        sender: account,
                        keypair,
                        second_keypair,
                        min: body.min,
                        keysgroup: body.keysgroup,
                        lifetime: body.lifetime
                    });
    
                    var transactions = await this.runtime.transaction.receiveTransactions([transaction]);
                    cb(null, transactions);
                } catch (e) {
                    return cb(e);
                }
            }, (err, transactions) => {
                if (err) {
                    return reject(err);
                } else {
                    setImmediate(async()=> {
                        try
                        {
                            await this.runtime.socketio.emit('multisignatures/change', {});
                        }
                        catch (err2)
                        {
                            this.logger.error("socket emit error: multisignatures/change");
                        }
                    });

                    resolve({ success: true, transactionId: transactions[0].id });
                }
            })
        });
    }

    async postSign(req) {
        var body = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
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
                publicKey: {
                    type: "string",
                    format: "publicKey"
                },
                transactionId: {
                    type: "string"
                }
            },
            required: ['transactionId', 'secret']
        }, body);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var transaction = await this.runtime.transaction.getUnconfirmedTransaction(body.transactionId);
        if (!transaction) {
            throw new Error("Transaction not found");
        }

        if (body.publicKey) {
            if (keypair.publicKey.toString('hex') != body.publicKey) {
                throw new Error("Invalid passphrase");
            }
        }
        
        var hash = crypto.createHash('sha256').update(body.secret, 'utf8').digest();
        var keypair = ed.MakeKeypair(hash);

        var sign = await this.runtime.transaction.multisign(keypair, transaction);

        if (transaction.type == AssetTypes.MULTISIGNATURE) {
            if ((transaction.asset.multisignature.keysgroup.indexOf(`+${keypair.publicKey.toString('hex')}`) == -1) || 
                (transaction.signatures && transaction.signatures.indexOf(sign.toString('hex')) != -1)) {
                throw new Error("Permission to sign transaction denied");
            }
          
            setImmediate(async() => {
                try
                {
                    await this.runtime.socketio.emit('multisignatures/singature/change', {});
                }
                catch (err)
                {
                    this.logger.error("socket emit error: multisignatures/singature/change");
                }
            });
        } else {
            var account = await this.runtime.account.getAccountByAddress(transaction.sender_id);
            if (!account) {
                throw new Error("Account not found");
            }

            if (!transaction.requester_public_key) {    //wxm block database
                if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
                    throw new Error("Permission to sign transaction denied");
                }
            } else {
                if (account.public_key != keypair.publicKey.toString('hex') || 
                    transaction.sender_public_key != keypair.publicKey.toString('hex')) {   //wxm block database
                    throw new Error("Permission to sign transaction denied");
                }
            }
        
            if (transaction.signatures && transaction.signatures.indexOf(sign) != -1) {
                throw new Error("Permission to sign transaction denied");
            }

            setImmediate(async() => {
                try
                {
                    await this.runtime.socketio.emit('multisignatures/singature/change', {});
                }
                catch (err)
                {
                    this.logger.error("socket emit error: multisignatures/singature/change");
                }
            })
        }

        return new Promise((resolve, reject) => {
            this.balancesSequence.add(async(cb) => {
                var transaction = await this.runtime.transaction.getUnconfirmedTransaction(body.transactionId);
                if (!transaction) {
                    return cb("Transaction not found");
                }

                transaction.signatures = transaction.signatures || [];
                transaction.signatures.push(sign);

                setImmediate(async() => {
                    try
                    {
                        await this.runtime.peer.broadcast.broadcastNewSignature( {
                            signature: sign,
                            transaction: transaction.id
                        });
                    }
                    catch (err)
                    {
                        this.logger.error(`Broadcast new signature failed: ${utils.getErrorMsg(err)}`);
                    }
                });

                cb();
            }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ success: true, transactionId: transaction.id });
                }
            })
        });
    }

    async getPending(req) {
        var query = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                publicKey: {
                    type: "string",
                    format: "publicKey"
                }
            },
            required: ['publicKey']
        }, query);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        let transactions = await this.runtime.transaction.getUnconfirmedTransactionList();
        //wxm TODO 此处不应该用TransactionTypes.OUT_TRANSFER，或者单独一个接口道aob包里
        if (query.isOutTransfer) {
            transactions = transactions.filter(item => item.type == TransactionTypes.OUT_TRANSFER);
        }
      
        var pendings = [];
        for (var i = 0; i < transactions.length; i++) {
            var item = transactions[i];

            let signed = false;
            let verify = false;

            if (!verify && item.signatures && item.signatures.length > 0) {
                for (const i in item.signatures) {
                    let signature = item.signatures[i];
            
                    try {
                        verify = await this.runtime.transaction.verifySignature(item, query.publicKey, signature);
                    } catch (e) {
                        this.logger.error('/multisignatures/pending verify fail, error is ', e.stack)
                        verify = false;
                    }
            
                    if (verify) {
                        break;
                    }
                }
            
                if (verify) {
                    signed = true;
                }
            }

            if (!signed && item.sender_public_key == query.publicKey) { //wxm block database
                signed = true;
            }

            try
            {
                var sender = await this.runtime.account.getAccountByPublicKey(item.sender_public_key);
                if (!sender) {
                    break;
                }

                if ((sender.public_key == query.publicKey && sender.u_multisignatures.length > 0) || 
                    sender.u_multisignatures.indexOf(query.publicKey) >= 0 || 
                    sender.multisignatures.indexOf(query.publicKey) >= 0) {
                    var min = sender.u_multimin || sender.multimin;
                    var lifetime = sender.u_multilifetime || sender.multilifetime;
                    var signatures = sender.u_multisignatures.length;
            
                    pendings.push({
                        max: signatures.length,
                        min,
                        lifetime,
                        signed,
                        transaction: item
                    });
                }
            }
            catch (err)
            {
                break;
            }
        }

        return {
            success: true,
            transactions: pendings
        };
    }

    async getAccounts(req) {
        var query = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                publicKey: {
                    type: "string",
                    format: "publicKey"
                }
            },
            required: ['publicKey']
        }, query);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        return new Promise((resolve, reject) => {
            this.dao.findList('mem_accounts2multisignature', {
                dependent_id: query.publicKey    //wxm block database
            }, null, null, false, false, 
            [[this.dao.db_fnGroupConcat('account_id'), 'account_id']], //wxm block database   library.dao.db_fn('group_concat', library.dao.db_col('accountId'))
            null, async (err, rows) => {
                if (err) {
                    this.logger.error(err.toString());
                    return reject("Database error");
                }

                var addresses = rows[0].account_id.split(','); //wxm block database

                try
                {
                    var rows = await this.runtime.account.getAccountList({
                        address: {
                            "$in": addresses
                        },
                        sort: [['balance', 'ASC']]  //wxm block database
                    }, ['address', 'balance', 'multisignatures', 'multilifetime', 'multimin']);

                    for (var i = 0; i < rows.length; i++) {
                        var account = rows[i];

                        var addresses = [];
                        for (let j = 0; j < account.multisignatures.length; j++) {
                            addresses.push(this.runtime.account.generateAddressByPublicKey(account.multisignatures[j]));
                        }

                        var multisigaccounts = await this.runtime.account.getAccountList({
                            address: { 
                                "$in": addresses 
                            }
                        }, ['address', 'publicKey', 'balance']);
                        account.multisigaccounts = multisigaccounts;
                    }

                    resolve({
                        accounts: rows
                    });
                }
                catch (e)
                {
                    this.logger.error(e);
                    return reject(e);
                }
            });
        });
    }

}

module.exports = RootRouter;