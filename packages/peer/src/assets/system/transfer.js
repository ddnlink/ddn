/**
 * 转账资产交易
 * wangxm   2018-12-28
 */
import util from "util";

import DdnUtil from "@ddn/utils"; //DdnUtil.bignum update

class Transfer {
  constructor(context) {
    Object.assign(this, context);
    this._context = context;
  }

  async create({recipient_id, amount}, trs) {
    trs.recipient_id = recipient_id; //wxm block database
    // DdnUtil.bignum update
    // trs.amount = data.amount;
    trs.amount = `${amount}`;

    return trs;
  }

  async calculateFee(trs, sender) {
    return this.tokenSetting[this.config.netVersion].fees.send;
  }

  async verify(trs, {address, lockHeight}) {
    if (!DdnUtil.address.isAddress(trs.recipient_id)) {
      throw new Error("Invalid recipient");
    }

    if (DdnUtil.bignum.isNaN(trs.amount)) {
      throw new Error("Invalid transaction amount.");
    }

    if (DdnUtil.bignum.isLessThanOrEqualTo(trs.amount, 0)) {
      throw new Error("Invalid transaction amount");
    }

    if (trs.recipient_id == address) {
      //wxm block database
      throw new Error("Invalid recipient_id, cannot be your self");
    }

    if (!this.config.settings.enableMoreLockTypes) {
      const lastBlock = this.runtime.block.getLastBlock();

      if (
        lockHeight &&
        lastBlock &&
        DdnUtil.bignum.isLessThanOrEqualTo(
          DdnUtil.bignum.plus(lastBlock.height, 1),
          lockHeight
        )
      ) {
        throw new Error("Account is locked");
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

  async apply({recipient_id, amount}, {id, height}, sender, dbTrans) {
    await this.runtime.account.setAccount(
      { address: recipient_id },
      dbTrans
    );

    await this.runtime.account.merge(
      recipient_id,
      {
        address: recipient_id, //wxm block database
        balance: amount,
        u_balance: amount,
        block_id: id, //wxm block database
        round: await this.runtime.round.calc(height)
      },
      dbTrans
    );

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

  async undo({recipient_id, amount}, {id, height}, sender, dbTrans) {
    await this.runtime.account.setAccount(
      { address: recipient_id },
      dbTrans
    );

    await this.runtime.account.merge(
      recipient_id,
      {
        address: recipient_id, //wxm block database
        balance: `-${amount}`,
        u_balance: `-${amount}`,
        block_id: id, //wxm block database
        round: await this.runtime.round.calc(height)
      },
      dbTrans
    );

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
    delete trs.block_id; //wxm block database
    return trs;
  }

  async dbRead(raw) {
    return null;
  }

  async dbSave(trs, dbTrans) {}

  async ready({signatures}, {multisignatures, multimin}) {
    if (util.isArray(multisignatures) && multisignatures.length) {
      if (!signatures) {
        return false;
      }
      return signatures.length >= multimin - 1;
    } else {
      return true;
    }
  }
}

export default Transfer;
