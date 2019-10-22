const crypto = require('crypto');
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
            type: 'object',
            properties: {
                address: {
                    type: "string",
                    minLength: 1
                },
                limit: {
                    type: "integer",
                    minimum: 0,
                    maximum: 101
                },
                offset: {
                    type: "integer",
                    minimum: 0
                },
                orderBy: {
                    type: "string"
                }
            }
        }, query);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var result = await this.runtime.delegate.getDelegates(query);

        function compareNumber(a, b) {
            const sorta = parseFloat(a[result.orderBy]);
            const sortb = parseFloat(b[result.orderBy]);
            if (result.sortMode == 'asc') {
              return sorta - sortb;
            } else {
              return sortb - sorta;
            }
        };
      
        function compareString(a, b) {
            const sorta = a[result.orderBy];
            const sortb = b[result.orderBy];
            if (result.sortMode == 'asc') {
              return sorta.localeCompare(sortb);
            } else {
              return sortb.localeCompare(sorta);
            }
        };
      
        if (result.delegates.length > 0 && typeof result.delegates[0][result.orderBy] == 'undefined') {
            result.orderBy = 'rate';
        }
      
        if (["approval", "productivity", "rate", "vote", "missedblocks", "producedblocks", "fees", "rewards", "balance"].indexOf(result.orderBy) > - 1) {
            result.delegates = result.delegates.sort(compareNumber);
        } else {
            result.delegates = result.delegates.sort(compareString);
        }

        var delegates = result.delegates.slice(result.offset, result.limit);

        if (!query.address) {
            return { success: true, delegates, totalCount: result.count };
        }

        var voter = await this.runtime.account.getAccountByAddress(query.address);
        if (voter && voter.delegates) {
            delegates.map(item => {
                item.voted = (voter.delegates.indexOf(item.public_key) != -1);
            });
        }
        
        return { success: true, delegates, totalCount: result.count };
    }

    async getGet(req) {
        var query = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                transactionId: {
                    type: "string"
                },
                publicKey: {
                    type: "string"
                },
                username: {
                    type: "string"
                }
            }
        }, query);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var result = await this.runtime.delegate.getDelegates(query);
        var delegate = result.delegates.find(delegate => {
            if (query.publicKey) {
                return delegate.public_key == query.publicKey;
            }
            if (query.username) {
                return delegate.username == query.username;
            }
            return false;
        });

        if (delegate) {
            return { success: true, delegate };
        } else {
            throw new Error("Delegate not found");
        }
    }

    async getCount(req) {
        return new Promise((resolve, reject) => {
            this.dao.count('delegate', null, (err, count) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({success: true, count});
                }
            });
        });
    }

    async getVoters(req) {
        var query = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
            type: 'object',
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
            this.dao.findList('mem_accounts2delegate', {dependent_id: query.publicKey}, 
                [[this.dao.db_fnGroupConcat('account_id'), 'account_id']], null, null,
                async (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    var addresses = [];
                    if (rows[0] && rows[0].account_id) {
                        addresses = rows[0].account_id.split(','); //wxm block database
                    }
                    try
                    {
                        rows = await this.runtime.account.getAccountList({
                            address: {
                                "$in": addresses
                            },
                            sort: [['balance', 'ASC']]
                        }, ['address', 'balance', 'public_key', 'username']);
                    }
                    catch (e)
                    {
                        return reject(e);
                    }

                    var lastBlock = this.runtime.block.getLastBlock();
                    var totalSupply = this.runtime.block.getBlockStatus().calcSupply(lastBlock.height);
                    rows.forEach(row => {
                        row.weight = row.balance / totalSupply * 100;
                    });

                    resolve({success: true, accounts: rows});
                }
            });
        })
    }

    async getFee(req) {
        //   bignum update
        //   fee = 100 * constants.fixedPoint;
        let fee = bignum.multiply(100, this.tokenSetting.fixedPoint);
        return {fee};
    }

    async put(req) {
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
                },
                secondSecret: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100
                },
                username: {
                    type: "string"
                }
            },
            required: ["secret"]
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
            this.balancesSequence.add(async (cb) => {
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

                    if (!requester || !requester.public_key) {  //wxm block database
                        return cb("Invalid requester");
                    }
          
                    if (requester.second_signature && !body.secondSecret) {
                        return cb("Invalid second passphrase");
                    }
          
                    if (requester.public_key == account.public_key) {   //wxm block database
                        return cb("Incorrect requester");
                    }

                    let second_keypair = null;
                    if (requester.second_signature) {
                        const secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                        second_keypair = ed.MakeKeypair(secondHash);
                    }

                    try {
                        var transaction = await this.runtime.transaction.create({
                            type: AssetTypes.DELEGATE,
                            username: body.username,
                            sender: account,
                            keypair,
                            second_keypair,
                            requester: keypair
                        });
                        var transactions = await this.runtime.transaction.receiveTransactions([transaction]);
                        cb(null, transactions);
                    } catch (e) {
                        cb(e);
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
                        const secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                        second_keypair = ed.MakeKeypair(secondHash);
                    }
            
                    try {
                        var transaction = await this.runtime.transaction.create({
                            type: AssetTypes.DELEGATE,
                            username: body.username,
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
                    resolve({success: true, transaction: transactions[0]})
                }
            })
        });
    }

}

module.exports = RootRouter;