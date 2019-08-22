/**
 * Signatures
 * wangxm   2019-03-25
 */
const util = require('util');
const bignum = require('@ddn/bignum-utils');
const ByteBuffer = require('bytebuffer');
const Diff = require('../../lib/diff');

class Multisignature {

    constructor(context) {
        Object.assign(this, context);
        this._context = context;

        this._unconfirmedSignatures = {};
	}

    async create(data, trs) {
		trs.recipient_id = null; //wxm block database
		trs.amount = "0";   //bignum update
		trs.asset.multisignature = {
			min: data.min,
			keysgroup: data.keysgroup,
			lifetime: data.lifetime
		};
		return trs;
    }

    async calculateFee(trs, sender) {
		return bignum.multiply(
			bignum.plus(trs.asset.multisignature.keysgroup.length, 1),
			5, this.tokenSetting.fixedPoint);
    }

    async verify(trs, sender) {
		if (!trs.asset.multisignature) {
            throw new Error(`Invalid transaction asset: ${trs.id}`);
		}

		if (!util.isArray(trs.asset.multisignature.keysgroup)) {
            throw new Error(`Invalid transaction asset: ${trs.id}`);
		}

		if (trs.asset.multisignature.keysgroup.length == 0) {
            throw new Error('Multisignature group must contain at least one member');
		}

		if (trs.asset.multisignature.min <= 1 || trs.asset.multisignature.min > 16) {
            throw new Error(`Invalid transaction asset: ${trs.id}`);
		}

		if (trs.asset.multisignature.min > trs.asset.multisignature.keysgroup.length + 1) {
            throw new Error('Invalid multisignature min');
		}
        
		if (trs.asset.multisignature.lifetime < 1 || trs.asset.multisignature.lifetime > 24) {
            throw new Error(`Invalid multisignature lifetime: ${trs.id}`);
		}

		// If it's ready
		if (await this.ready(trs, sender)) {
			try {
				for (let s = 0; s < trs.asset.multisignature.keysgroup.length; s++) {
                    let verify = false;
					if (trs.signatures) {
						for (let d = 0; d < trs.signatures.length && !verify; d++) {
							if (trs.asset.multisignature.keysgroup[s][0] != '-' &&
								trs.asset.multisignature.keysgroup[s][0] != '+') {
								verify = false;
							} else {
								verify = await this.runtime.transaction.verifySignature(
									trs,
									trs.asset.multisignature.keysgroup[s].substring(1),
									trs.signatures[d]
								);
							}
						}
					}

					if (!verify) {
                        throw new Error(`Failed to verify multisignature: ${trs.id}`);
					}
				}
			} catch (e) {
                throw new Error(`Failed to verify multisignature: ${trs.id}`);
			}
		}

        if (trs.asset.multisignature.keysgroup.indexOf(`+${sender.public_key}`) != -1) {    //wxm block database
            throw new Error('Unable to sign transaction using own public key');
		}

        var keysgroup = trs.asset.multisignature.keysgroup;
        for (var i = 0; i < keysgroup.length; i++) {
            var key = keysgroup[i];

            var math = key[0];
            var publicKey = key.slice(1);

            if (math != '+') {
                throw new Error('Invalid math operator');
            }

            try {
                var b = new Buffer(publicKey, 'hex');
                if (b.length != 32) {
                    throw new Error('Invalid public key');
                }
            } catch (e) {
                throw new Error('Invalid public key');
            }
        }

        var keysgroup = trs.asset.multisignature.keysgroup.reduce((p, c) => {
            if (p.indexOf(c) < 0) p.push(c);
            return p;
        }, []);

        if (keysgroup.length != trs.asset.multisignature.keysgroup.length) {
            throw new Error('Multisignature group contains non-unique public keys');
        }

        return trs;
    }

    async process(trs, sender) {
        return trs;
	}

    async getBytes(trs) {
		var keysgroupBuffer = new Buffer(trs.asset.multisignature.keysgroup.join(''), 'utf8');
		var bb = new ByteBuffer(1 + 1 + keysgroupBuffer.length, true);
		bb.writeByte(trs.asset.multisignature.min);
		bb.writeByte(trs.asset.multisignature.lifetime);
		for (let i = 0; i < keysgroupBuffer.length; i++) {
			bb.writeByte(keysgroupBuffer[i]);
		}
		bb.flip();
		return bb.toBuffer();
    }

    async apply(trs, block, sender, dbTrans) {
        this._unconfirmedSignatures[sender.address] = false;
        
        await this.runtime.account.merge(sender.address, {
            multisignatures: trs.asset.multisignature.keysgroup,
            multimin: trs.asset.multisignature.min,
            multilifetime: trs.asset.multisignature.lifetime,
            block_id: block.id,  //wxm block database
            round: await this.runtime.round.calc(block.height)
        }, dbTrans);

        var keysgroup = trs.asset.multisignature.keysgroup;
        for (var i = 0; i < keysgroup.length; i++) {
            var item = keysgroup[i];

            var key = item.substring(1);
            var address = this.runtime.account.generateAddressByPublicKey(key);

            await this.runtime.account.setAccount({
                address,
                public_key: key,  //wxm block database
                block_id: block.id  //wxm 这里要直接将block_id更新进去，否则的话，如果不进行转账操作，将出现block_id为空，导致重启失败的问题
            }, dbTrans);
        }
    }

    async undo(trs, block, sender, dbTrans) {
		var multiInvert = Diff.reverse(trs.asset.multisignature.keysgroup);

        this._unconfirmedSignatures[sender.address] = true;
        
        await this.runtime.account.merge(sender.address, {
            multisignatures: multiInvert,
            multimin: -trs.asset.multisignature.min,
            multilifetime: -trs.asset.multisignature.lifetime,
            block_id: block.id,  //wxm block database
            round: await this.runtime.round.calc(block.height)
        }, dbTrans);
    }

    async applyUnconfirmed(trs, sender, dbTrans) {
		if (this._unconfirmedSignatures[sender.address]) {
            throw new Error('Signature on this account is pending confirmation');
		}

		if (sender.multisignatures.length) {
            throw new Error('Account already has multisignatures enabled');
		}

		this._unconfirmedSignatures[sender.address] = true;

        await this.runtime.account.merge(sender.address, {
            u_multisignatures: trs.asset.multisignature.keysgroup,
            u_multimin: trs.asset.multisignature.min,
            u_multilifetime: trs.asset.multisignature.lifetime
        }, dbTrans);
    }

    async undoUnconfirmed(trs, sender, dbTrans) {
		var multiInvert = Diff.reverse(trs.asset.multisignature.keysgroup);

        this._unconfirmedSignatures[sender.address] = false;
        
        await this.runtime.account.merge(sender.address, {
            u_multisignatures: multiInvert,
            u_multimin: -trs.asset.multisignature.min,
            u_multilifetime: -trs.asset.multisignature.lifetime
        }, dbTrans);
    }

    async objectNormalize(trs) {
        var validateErros = await this.ddnSchema.validate({
            type: 'object',
            properties: {
                min: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 15
                },
                keysgroup: {
                    type: 'array',
                    minLength: 1,
                    maxLength: 16
                },
                lifetime: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 24
                }
            },
            required: ['min', 'keysgroup', 'lifetime']
        }, trs.asset.multisignature);
        if (validateErros) {
            throw new Error(`Invalid multisignature parameters: ${validateErros[0].message}`);
        }
        return trs;
    }

    async dbRead(raw) {
		if (!raw.m_keysgroup) {
			return null;
		} else {
			var multisignature = {
				min: raw.m_min,
				lifetime: raw.m_lifetime,
				keysgroup: raw.m_keysgroup.split(',')
			};

			return { multisignature };
		}
    }

    async dbSave(trs, dbTrans) {
        return new Promise((resolve, reject) => {
            this.dao.insert("multisignature", {
                min: trs.asset.multisignature.min,
                lifetime: trs.asset.multisignature.lifetime,
                keysgroup: trs.asset.multisignature.keysgroup.join(','),
                transaction_id: trs.id
            }, dbTrans, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    setImmediate(async() => {
                        try
                        {
                            await this.runtime.socketio.emit('multisignatures/change', {});
                        }
                        catch (err2)
                        {
                            this.logger.warn("socket emit error: multisignatures/change");
                        }
                    })

                    resolve(result);
                }
            });
        })
    }

    async ready(trs, sender) {
		if (!trs.signatures) {
            this.logger.warn("The multisignature is waiting for other account signatures.");
			return false;
		}

		if (util.isArray(sender.multisignatures) && !sender.multisignatures.length) {
            var ready = trs.signatures.length == trs.asset.multisignature.keysgroup.length;
            if (!ready) {
                this.logger.warn("The number of multisignature signatures is less than " + trs.asset.multisignature.keysgroup.length);
            }
			return ready;
		} else {
			return trs.signatures.length >= sender.multimin - 1;
		}
    }

}

module.exports = Multisignature;