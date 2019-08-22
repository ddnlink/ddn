var { AssetTypes, Utils } = require('@ddn/ddn-utils');

var _singleton;

class MultiSignature {

    static singleton(context) {
        if (!_singleton) {
            _singleton = new MultiSignature(context);
        }
        return _singleton;
    }

    constructor(context) {
        Object.assign(this, context);
        this._context = context;
    }

    async processSignature(tx) {
        var done = async () => {
            return new Promise((resolve, reject) => {
                this.balancesSequence.add(async (cb) => {
                    var transaction = await this.runtime.transaction.getUnconfirmedTransaction(tx.transaction);
                    if (!transaction) {
                        return reject("Transaction not found");
                    }

                    transaction.signatures = transaction.signatures || [];
                    transaction.signatures.push(tx.signature);

                    setImmediate(async() => {
                        try
                        {
                            await this.runtime.peer.broadcast.broadcastNewSignature({
                                signature: tx.signature,
                                transaction: transaction.id
                            });
                        }
                        catch (err)
                        {
                            this.logger.error(`Broadcast new signature failed: ${Utils.getErrorMsg(err)}`);
                        }
                    });
              
                    cb(null, transaction);
                }, (err, transaction) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(transaction);
                    }
                });
            });
        }
        
        const transaction = await this.runtime.transaction.getUnconfirmedTransaction(tx.transaction);

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        if (transaction.type == AssetTypes.MULTISIGNATURE) {
            transaction.signatures = transaction.signatures || [];

            if (transaction.asset.multisignature.signatures || transaction.signatures.indexOf(tx.signature) != -1) {
                throw new Error("Permission to sign transaction denied");
            }

            // Find public key
            let verify = false;
            try
            {
                for (var i = 0; i < transaction.asset.multisignature.keysgroup.length && !verify; i++) {
                    var key = transaction.asset.multisignature.keysgroup[i].substring(1);
                    verify = await this.runtime.transaction.verifySignature(transaction, key, tx.signature);
                }
            }
            catch (e)
            {
                verify = false;
            }

            if (!verify) {
                throw new Error("Failed to verify signature");
            }
          
            await done();
        } else {
            var account;
            try
            {
                account = await this.runtime.account.getAccountByAddress(transaction.senderId);
            }
            catch (err)
            {
                throw new Error("Multisignature account not found: " + err);
            }

            let verify = false;
            var multisignatures = account.multisignatures;

            if (transaction.requester_public_key) {
                multisignatures.push(transaction.sender_public_key);
            }

            if (!account) {
                throw new Error("Account not found");
            }

            transaction.signatures = transaction.signatures || [];

            if (transaction.signatures.indexOf(tx.signature) >= 0) {
                throw new Error("Signature already exists");
            }

            try {
                for (let i = 0; i < multisignatures.length && !verify; i++) {
                    verify = await this.runtime.transaction.verifySignature(transaction, multisignatures[i], tx.signature);
                }
            } catch (e) {
                throw new Error("Failed to verify signature: " + e);
            }
        
            if (!verify) {
                throw new Error("Failed to verify signature");
            }
        
            setImmediate(async () => {
                try
                {
                    await this.runtime.socketio.emit('multisignatures/singature/change', {});
                }
                catch (err)
                {
                    this.logger.error("socket emit error: multisignatures/singature/change");
                }
            });
    
            await done();
        }
    }

}

module.exports = MultiSignature;