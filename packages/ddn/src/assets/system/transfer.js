/**
 * 转账资产交易
 * wangxm   2018-12-28
 */
const util = require('util');
const addressUtil = require('../../lib/address.js');
const bignum = require('@ddn/bignum-utils');  //bignum update

class Transfer {
	constructor(context) {
        Object.assign(this, context);
        this._context = context;
	}

	async create(data, trs) {
        trs.recipient_id = data.recipient_id;   //wxm block database
        // bignum update
        // trs.amount = data.amount;
        trs.amount = data.amount + "";

		return trs;
	}

	async calculateFee(trs, sender) {
        return this.tokenSetting[this.config.netVersion].fees.send;
	}

	async verify(trs, sender) {
		if (!addressUtil.isAddress(trs.recipient_id)) {
			throw new Error('Invalid recipient');
		}

        if (bignum.isNaN(trs.amount)) {
            throw new Error('Invalid transaction amount.');
        }

		//bignum update if (trs.amount <= 0) {
        if (bignum.isLessThanOrEqualTo(trs.amount, 0)) {
			throw new Error('Invalid transaction amount');
		}

		if (trs.recipient_id == sender.address) {   //wxm block database
			throw new Error('Invalid recipient_id, cannot be your self');
		}

		if (!this.config.settings.enableMoreLockTypes) {
            const lastBlock = this.runtime.block.getLastBlock();
            
			//bignum update if (sender.lockHeight && lastBlock && lastBlock.height + 1 <= sender.lockHeight) {
            if (sender.lockHeight && lastBlock && bignum.isLessThanOrEqualTo(bignum.plus(lastBlock.height, 1), sender.lockHeight)) {
				throw new Error('Account is locked');
			}
		}

        return trs;
	}

	async process(trs, sender) {
        // setImmediate(cb, null, trs);
        return trs;
	}

	async getBytes(trs) {
		return null;
	}

    async isSupportLock() {
        return true;
    }

	async apply(trs, block, sender, dbTrans) {
        await this.runtime.account.setAccount({ address: trs.recipient_id }, dbTrans);

        await this.runtime.account.merge(trs.recipient_id, {
            address: trs.recipient_id,   //wxm block database
            balance: trs.amount,
            u_balance: trs.amount,
            block_id: block.id,  //wxm block database
            round: await this.runtime.round.calc(block.height)
        }, dbTrans);

		// self.modules.accounts.setAccountAndGet({ address: trs.recipient_id }, dbTrans, (err, recipient) => { //wxm block database
		// 	if (err) {
		// 		return cb(err);
		// 	}

		// 	self.modules.accounts.mergeAccountAndGet(
		// 		{
		// 			address: trs.recipient_id,   //wxm block database
		// 			balance: trs.amount,
		// 			u_balance: trs.amount,
		// 			block_id: block.id,  //wxm block database
		// 			round: self.modules.round.calc(block.height).toString()
		// 		},
		// 		dbTrans,
		// 		(err) => {
		// 			cb(err);
		// 		}
		// 	);
		// });
	}

	async undo(trs, block, sender, dbTrans) {
        await this.runtime.account.setAccount({ address: trs.recipient_id }, dbTrans);

        await this.runtime.account.merge(trs.recipient_id, {
            address: trs.recipient_id,   //wxm block database
            balance: `-${trs.amount}`,
            u_balance: `-${trs.amount}`,
            block_id: block.id,  //wxm block database
            round: await this.runtime.round.calc(block.height)
        }, dbTrans);

		// if (typeof dbTrans === 'function') {
		// 	cb = dbTrans;
		// 	dbTrans = null
		// }
		// self.modules.accounts.setAccountAndGet({ address: trs.recipient_id }, dbTrans, (err, recipient) => { //wxm block database
		// 	if (err) {
		// 		return cb(err);
		// 	}

		// 	self.modules.accounts.mergeAccountAndGet(
		// 		{
		// 			address: trs.recipient_id,   //wxm block database
		// 			balance: `-${trs.amount}`,
		// 			u_balance: `-${trs.amount}`,
		// 			block_id: block.id,  //wxm block database
		// 			round: self.modules.round.calc(block.height).toString()
		// 		},
		// 		dbTrans,
		// 		(err) => {
		// 			cb(err);
		// 		}
		// 	);
		// });
	}

	async applyUnconfirmed(trs, sender, dbTrans) {
        return;
	}

	async undoUnconfirmed(trs, sender, dbTrans) {
        return;
	}

	async objectNormalize(trs) {
		delete trs.block_id;    //wxm block database
		return trs;
	}

	async dbRead(raw) {
		return null;
	}

	async dbSave(trs, dbTrans) {
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

module.exports = Transfer;
