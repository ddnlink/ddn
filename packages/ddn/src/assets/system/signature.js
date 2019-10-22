/**
 * Signatures
 * wangxm   2019-03-25
 */
const util = require('util');
const bignum = require('@ddn/bignum-utils');
const ByteBuffer = require('bytebuffer');

class Signatures {

	constructor(context) {
        Object.assign(this, context);
        this._context = context;
	}

    async create(data, trs) {
		trs.recipient_id = null;
		trs.amount = "0";   //bignum update
		trs.asset.signature = {
			public_key: data.second_keypair.publicKey.toString('hex')
		};
		return trs;
    }

    async calculateFee(trs, sender) {
        return bignum.multiply(5, this.tokenSetting.fixedPoint);
    }

	async verify(trs, sender, cb) {
		if (!trs.asset.signature) {
            throw new Error('Invalid transaction asset');
		}

		//bignum update if (trs.amount != 0) {
        if (!bignum.isZero(trs.amount)) {
            throw new Error('Invalid transaction amount')
		}

		try {
			if (!trs.asset.signature.public_key || new Buffer(trs.asset.signature.public_key, 'hex').length != 32) {
                throw new Error('Invalid signature length');
			}
		} catch (e) {
            throw new Error('Invalid signature hex');
		}

        return trs;
	}

	async process(trs, sender) {
        return trs;
	}

	async getBytes(trs) {
		try {
			var bb = new ByteBuffer(32, true);
			const publicKeyBuffer = new Buffer(trs.asset.signature.public_key, 'hex');

			for (let i = 0; i < publicKeyBuffer.length; i++) {
				bb.writeByte(publicKeyBuffer[i]);
			}

			bb.flip();
		} catch (e) {
			throw Error(e.toString());
		}
		return bb.toBuffer();
    }

    async isSupportLock() {
        return false;
    }
    
	async apply(trs, block, sender, dbTrans) {
        var data = {
            address: sender.address,
            second_signature: 1,
            u_second_signature: 0,
            second_public_key: trs.asset.signature.public_key
        };
        await this.runtime.account.setAccount(data, dbTrans);

        return await this.runtime.account.getAccountByAddress(sender.address);
	}

	async undo(trs, block, sender, dbTrans) {
        var data = {
            address: sender.address,
            second_signature: 0,
            u_second_signature: 1,
            second_public_key: null
        };
        await this.runtime.account.setAccount(data, dbTrans);

        return await this.runtime.account.getAccountByAddress(sender.address);
	}

	async applyUnconfirmed(trs, sender, dbTrans) {
		// if (sender.second_signature) {
        //     throw new Error('Double set second signature');
        // }
        
		const key = `${sender.address}:${trs.type}`;
		if (this.oneoff.has(key)) {
            throw new Error('Double submit second signature');
        }
        
		this.oneoff.set(key, true);
	}

	async undoUnconfirmed(trs, sender, dbTrans) {
        const key = `${sender.address}:${trs.type}`;
        this.oneoff.delete(key);

        var data = { address: sender.address, u_second_signature: 0 };
        await this.runtime.account.setAccount(data, dbTrans);

        return await this.runtime.account.getAccountByAddress(sender.address);
	}

	async objectNormalize(trs) {
        var validateErros = await this.ddnSchema.validate({
            type: 'object',
            properties: {
                public_key: {
                    type: 'string',
                    format: 'publicKey'
                }
            },
            required: [ 'public_key' ]
        }, trs.asset.signature);
        if (validateErros) {
            throw new Error(validateErros[0].message);
        }

		return trs;
	}

	async dbRead(raw) {
		if (!raw.s_publicKey) {
			return null;
		} else {
			const signature = {
				transaction_id: raw.t_id,
				public_key: raw.s_publicKey
			};

			return { signature };
		}
	}

	async dbSave(trs, dbTrans) {
		// var public_key = new Buffer(trs.asset.signature.public_key, 'hex');
		var obj = {
			transaction_id: trs.id,
			public_key: trs.asset.signature.public_key
        }
        
        return new Promise((resolve, reject) => {
            this.dao.insert('signature', obj, dbTrans, 
            (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
	}

	ready(trs, sender) {
		if (util.isArray(sender.multisignatures) && sender.multisignatures.length) {
			if (!trs.signatures) {
				return false;
			}
			return trs.signatures.length >= sender.multimin - 1;
		} else {
			return true;
		}
    }
    
}

module.exports = Signatures;