/**
 * 受托人资产交易
 * wangxm   2018-12-28
 */
const util = require('util');
const ByteBuffer = require('bytebuffer');
const addressUtil = require('../../lib/address.js');
const bignum = require('@ddn/bignum-utils');

class Delegate {

	constructor(context) {
        Object.assign(this, context);
        this._context = context;
	}

	async create(data, trs) {
		trs.recipient_id = null;    //wxm block database
		trs.amount = "0";   //bignum update
		trs.asset.delegate = {
			username: data.username,
			public_key: data.sender.public_key   //wxm block database
		};

		if (trs.asset.delegate.username) {
			trs.asset.delegate.username = trs.asset.delegate.username.toLowerCase().trim();
		}

		return trs;
	}

	async calculateFee(trs, sender) {
		// bignum update
		// return 100 * constants.fixedPoint;
		return bignum.multiply(100, this.tokenSetting.fixedPoint);
	}

	async verify(trs, sender) {
		if (trs.recipient_id) {
            throw new Error('Invalid recipient');
		}

		//bignum update if (trs.amount != 0) {
		if (!bignum.isZero(trs.amount)) {
            throw new Error('Invalid transaction amount');
		}

        if (sender.is_delegate) {    //wxm block database
            throw new Error('Account is already a delegate');
		}

		if (!trs.asset || !trs.asset.delegate) {
            throw new Error('Invalid transaction asset');
		}

		if (!trs.asset.delegate.username) {
            throw new Error('Username is undefined');
		}

		const allowSymbols = /^[a-z0-9!@$&_.]+$/g;

		const username = String(trs.asset.delegate.username).toLowerCase().trim();

		if (username == '') {
            throw new Error('Empty username');
		}

		if (username.length > 20) {
            throw new Error('Username is too long. Maximum is 20 characters');
		}

		if (addressUtil.isAddress(username)) {
            throw new Error('Username can not be a potential address');
		}

		if (!allowSymbols.test(username)) {
            throw new Error('Username can only contain alphanumeric characters with the exception of !@$&_.');
		}

        var account = await this.runtime.account.getAccount({username});
        if (account) {
            throw new Error('Username already exists');
        }

        return trs;
	}

	async process(trs, sender) {
		return trs;
	}

	async getBytes(trs) {
		if (!trs.asset.delegate.username) {
			return null;
        }

        var bb = new ByteBuffer();
        bb.writeUTF8String(trs.asset.delegate.username);
        bb.flip();
		return bb.toBuffer();
	}

    async isSupportLock() {
        return false;
    }

	async apply(trs, block, sender, dbTrans) {
		const data = {
			address: sender.address,
			u_is_delegate: 0,    //wxm block database
			is_delegate: 1,  //wxm block database
			vote: 0
		};

		if (trs.asset.delegate.username) {
			data.u_username = null;
			data.username = trs.asset.delegate.username;
		}

        await this.runtime.account.setAccount(data, dbTrans);

        return await this.runtime.account.getAccountByAddress(sender.address);
	}

	async undo(trs, block, sender, dbTrans) {
		const data = {
			address: sender.address,
			u_is_delegate: 1,    //wxm block database
			is_delegate: 0,  //wxm block database
			vote: 0
		};

		if (!sender.nameexist && trs.asset.delegate.username) {
			data.username = null;
			data.u_username = trs.asset.delegate.username;
		}

        await this.runtime.account.setAccount(data, dbTrans);

        return await this.runtime.account.getAccountByAddress(sender.address);
	}

	async applyUnconfirmed(trs, sender, dbTrans) {
		if (sender.isDelegate) {
            throw new Error("Account is already a delegate");
		}

		const nameKey = `${trs.asset.delegate.username}:${trs.type}`;
		const idKey = `${sender.address}:${trs.type}`;
		if (this.oneoff.has(nameKey) || this.oneoff.has(idKey)) {
            throw new Error("Double submit");
        }
        
		this.oneoff.set(nameKey, true);
        this.oneoff.set(idKey, true);
	}

	async undoUnconfirmed(trs, sender, dbTrans) {
		const nameKey = `${trs.asset.delegate.name}:${trs.type}`;
		const idKey = `${sender.address}:${trs.type}`;
		this.oneoff.delete(nameKey);
		this.oneoff.delete(idKey);
		return;
	}

	async objectNormalize(trs) {
        var validateErrors = await this.ddnSchema.validate({
            type: 'object',
            properties: {
                public_key: {
                    type: 'string',
                    format: 'publicKey'
                }
            },
            required: ['public_key']
        }, trs.asset.delegate);
        if (validateErrors) {
            throw new Error(`Can't verify delegate transaction, incorrect parameters: ${validateErrors[0].message}`);
        }

		return trs;
	}

	async dbRead(raw) {
		if (!raw.d_username) {
			return null;
		} else {
			const delegate = {
				username: raw.d_username,
				public_key: raw.t_senderPublicKey,   //wxm block database
				address: raw.t_senderId
			};

			return { delegate };
		}
	}

	// 替换dbSave方法 ---wly
	/**
	 * 功能:新增一条delegate数据
	*/
	async dbSave(trs, dbTrans) {
        return new Promise((resolve, reject) => {
            this.dao.insert('delegate', {
                username: trs.asset.delegate.username,
                transaction_id: trs.id
            }, dbTrans, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        })
	}

	async ready(trs, sender) {
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

module.exports = Delegate;
