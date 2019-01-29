const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const async = require('async');

const privated = {};
privated.unconfirmedOutTansfers = {};
class OutTranssfer extends AssetBase {
  propsMapping() {
    return [
    {
      field: "str1",
      prop: "dapp_id",
      required: true
    },
    {
      field: "str2",
      prop: "outtransaction_id"
    },
    {
      field: "str3",
      prop: "currency"
    },
    {
      field: "str4",
      prop: "amount"
    }
    ];
  }

  create(data, trs) {
		trs.recipient_id = data.recipient_id;
		trs.amount = "0";
		trs.asset.outTransfer = {
			dapp_id: data.dapp_id,
			transaction_id: data.transaction_id,
			currency: data.currency,
			amount: data.amount + ""
		};
		return trs;
  }
  
  verify(trs, sender, cb) {
		super.verify(trs, sender, async(err, trans) => {
      if (!trs.recipient_id) {
        return setImmediate(cb, 'Invalid recipient');
      }
      const transfer = trs.asset.outTransfer;
      if (!bignum.isZero(trs.amount)) {
        return setImmediate(cb, 'Invalid transaction amount');
      }
      if (!transfer.dapp_id) {
        return setImmediate(cb, 'Invalid dapp id for out transfer');
      }
      if (!transfer.transaction_id) {
        return setImmediate(cb, 'Invalid dapp id for input transfer');
      }
      if (!transfer.currency) {
        return setImmediate(cb, 'Invalid currency for out transfer');
      }
      if (!transfer.amount) {
        return setImmediate(cb, 'Invalid amount for out transfer');
      }
      if (!trs.signatures || !trs.signatures.length) {
        return setImmediate(cb, 'Invalid signatures');
      }
      const currency = trs.asset.outTransfer.currency;
      if (currency === library.tokenSetting.tokenName) return cb();
      try{
        const where = { name: currency, trs_type: 76 };
        const orders = null;
        const returnTotal = null;
        const pageIndex = 1;
        const pageSize = 1;
        const assetData = await super.queryAsset(where, orders, returnTotal, pageIndex, pageSize);
        const assetDetail = assetData[0];
        if (!assetDetail) return cb('Asset not exists')
        if (assetDetail.writeoff) return cb('Asset already writeoff')
        if (!assetDetail.allow_whitelist && !assetDetail.allow_blacklist) return cb();
        const aclTable = assetDetail.acl == 0 ? 'acl_black' : 'acl_white';
        library.model.checkAcl(aclTable, currency, sender.address, null, (err, isInList) => {
          if (err) return cb(`Database error when query acl: ${err}`);
          if ((assetDetail.acl == 0) == isInList) return cb('Permission not allowed')
          cb();
        })
      }catch(err2){
        cb(err2);
      }
    })
  }
  
  async process(trs, sender, cb) {
    try{
      const transfer = trs.asset.outTransfer;
      const where = { id: transfer.dapp_id };
      const dappData = await super.queryAsset(where, null, null, 1, 1);
      const dapp = dappData[0];
      dapp.delegates = dapp.delegates.split(',');
      if (!dapp) {
				return cb(`DApp not found: ${transfer.dapp_id}`);
			}
			if (privated.unconfirmedOutTansfers[trs.asset.outTransfer.transaction_id]) {
				return cb(`Transaction is already processing: ${trs.asset.outTransfer.transaction_id}`);
			}
			if (dapp.delegates.indexOf(trs.sender_public_key) === -1) return cb('Sender must be dapp delegate');
			if (!trs.signatures || trs.signatures.length !== dapp.unlock_delegates) return cb('Invalid signature number');
  		let validSignatureNumber = 0;
      const bytes = library.base.transaction.getBytes(trs, true, true);
      
      try {
				for (let i in trs.signatures) {
					for (let j in dapp.delegates) {
						if (library.base.transaction.verifyBytes(bytes, dapp.delegates[j], trs.signatures[i])) {
							validSignatureNumber++;
							break;
						}
					}
					if (validSignatureNumber >= dapp.unlock_delegates) break;
				}
			} catch (e) {
				return cb(`Failed to verify signatures: ${e}`);
      }
      if (validSignatureNumber < dapp.unlock_delegates) return cb('Valid signatures not enough');
      super.queryAssetCount({ transaction_id: trs.asset.outTransfer.transaction_id }, 'OutTransfer', (err, count) => {
				if (err) {
					library.logger.error(err.toString());
					return cb(`Failed to find history outtransfer: ${err}`);
				}
				if (count) return cb('Transaction is already confirmed');
				return cb(null, trs);
      } )
    }catch(err2){
      return cb(err2);
    }
  }
  
  getBytes(trs) {
		try {
			var buf = new Buffer([]);
			const dappIdBuf = new Buffer(trs.asset.outTransfer.dapp_id, 'utf8');
			const transactionIdBuff = new Buffer(trs.asset.outTransfer.transaction_id, 'utf8');
			const currencyBuff = new Buffer(trs.asset.outTransfer.currency, 'utf8');
			const amountBuff = new Buffer(trs.asset.outTransfer.amount, 'utf8');
			buf = Buffer.concat([ buf, dappIdBuf, transactionIdBuff, currencyBuff, amountBuff ]);
		} catch (e) {
			throw Error(e.toString());
		}
		return buf;
  }
  
  apply(trs, block, sender, dbTrans, cb) {
		if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
		const transfer = trs.asset.outTransfer;
		privated.unconfirmedOutTansfers[transfer.transactionId] = false;

		if (transfer.currency !== library.tokenSetting.tokenName) {
			library.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, transfer.amount);
			async.series(
				[
					(next) => {
						library.model.updateAssetBalance(
							transfer.currency,
							`-${transfer.amount}`,
							transfer.dapp_id,
							dbTrans,
							next
						);
					},
					(next) => {
						library.model.updateAssetBalance(
							library.tokenSetting.tokenName,
							`-${trs.fee}`,
							transfer.dapp_id,
							dbTrans,
							next
						);
					},
					(next) => {
						library.model.updateAssetBalance(
							transfer.currency,
							transfer.amount,
							trs.recipient_id,   //wxm block database
							dbTrans,
							next
						);
					}
				],
				cb
			);
		} else {
			modules.accounts.setAccountAndGet({ address: trs.recipient_id }, dbTrans, (err, recipient) => { //wxm block database
				if (err) {
					return cb(err);
				}
				const amount = bignum.new(transfer.amount);    //bignum update Number(transfer.amount);
				modules.accounts.mergeAccountAndGet(
					{
						address: trs.recipient_id,   //wxm block database
						balance: amount.toString(),     //bignum update
						u_balance: amount.toString(),   //bignum update
						block_id: block.id,  //wxm block database
						round: modules.round.calc(block.height).toString()
					},
					dbTrans,
					(err) => {
            if (err) return cb(err);          
            var minusSum = bignum.minus(0, amount, trs.fee);
						library.model.updateAssetBalance(
							library.tokenSetting.tokenName,
							minusSum.toString(),
							transfer.dapp_id,
							dbTrans,
							cb
						);
					}
				);
			});
		}
  }
  
	undo(trs, block, sender, dbTrans, cb) {
		if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };

		privated.unconfirmedOutTansfers[transfer.transaction_id] = true;

		if (transfer.currency !== library.tokenSetting.tokenName) {
			library.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, transfer.amount);    //wxm block database
			async.series(
				[
					(next) => {
						library.model.updateAssetBalance(
							transfer.currency,
							transfer.amount,
							transfer.dapp_id,
							dbTrans,
							next
						);
					},
					(next) => {
						library.model.updateAssetBalance(library.tokenSetting.tokenName, trs.fee, transfer.dapp_id, dbTrans, next);
					},
					(next) => {
						library.model.updateAssetBalance(
							transfer.currency,
							`-${transfer.amount}`,
							trs.recipient_id,   //wxm block database
							dbTrans,
							next
						);
					}
				],
				cb
			);
		} else {
			modules.accounts.setAccountAndGet({ address: trs.recipient_id }, dbTrans, (err, recipient) => { //wxm block database
				if (err) {
					return cb(err);
				}
                //bignum update const amount = Number(transfer.amount);
                
                const minusAmount = bignum.minus(0, transfer.amount);
                const sum = bignum.plus(transfer.amount, trs.fee);

				modules.accounts.mergeAccountAndGet(
					{
						address: trs.recipient_id,   //wxm block database
						balance: minusAmount.toString(),
						u_balance: minusAmount.toString(),
						block_id: block.id,  //wxm block database
						round: modules.round.calc(block.height).toString()
					},
					dbTrans,
					(err) => {
						if (err) return cb(err);
						library.model.updateAssetBalance(
							library.tokenSetting.tokenName,
							sum,
							transfer.dapp_id,
							dbTrans,
							cb
						);
					}
				);
			});
		}
  }

  applyUnconfirmed(trs, sender, dbTrans, cb) {
		if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
		const transfer = trs.asset.outTransfer;
		privated.unconfirmedOutTansfers[transfer.transactionId] = true;
		const balance = library.balanceCache.getAssetBalance(transfer.dapp_id, transfer.currency) || 0;
		const fee = trs.fee;
		if (transfer.currency === library.tokenSetting.tokenName) {
      const amount = bignum.plus(transfer.amount, fee);
      if (bignum.isLessThan(balance, amount))return setImmediate(cb, 'Insufficient balance');
			library.balanceCache.addAssetBalance(transfer.dapp_id, transfer.currency, bignum.minus(0, amount).toString());//bignum update -amount
		} else {
			const ddnBalance = library.balanceCache.getAssetBalance(transfer.dapp_id, library.tokenSetting.tokenName) || 0;
      if (bignum.isLessThan(ddnBalance, fee))return setImmediate(cb, 'Insufficient balance');
      if (bignum.isLessThan(balance, transfer.amount))return setImmediate(cb, 'Insufficient asset balance');
			library.balanceCache.addAssetBalance(transfer.dapp_id, library.tokenSetting.tokenName, `-${fee}`);
			library.balanceCache.addAssetBalance(transfer.dapp_id, transfer.currency, `-${transfer.amount}`);
		}
		setImmediate(cb);
  }
  
	undoUnconfirmed(trs, sender, dbTrans, cb) {
		if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
		const transfer = trs.asset.outTransfer;
		privated.unconfirmedOutTansfers[transfer.transaction_id] = false;
		const fee = trs.fee;
		if (transfer.currency === library.tokenSetting.tokenName) {
      const amount = bignum.plus(transfer.amount, fee);
			library.balanceCache.addAssetBalance(transfer.dapp_id, transfer.currency, amount.toString());
		} else {
			library.balanceCache.addAssetBalance(transfer.dapp_id, library.tokenSetting.tokenName, fee);
		  library.balanceCache.addAssetBalance(transfer.dapp_id, transfer.currency, transfer.amount);
		}
		setImmediate(cb);
  }
  
  dbSave(trs, cb) {
		const transfer = trs.asset.outTransfer;
		const dapp_id = transfer.dapp_id;
		const currency = transfer.currency;
		const amount = transfer.amount;
		const outtransaction_id = transfer.outtransaction_id;
		const values = {
			transaction_id: trs.id,
			dapp_id,
			currency,
			amount,
			outtransaction_id
    };
    trs.asset.outTransfer = values;
    super.dbSave(trs,(err)=>{
      if (err) return cb(err);
			library.bus.message(
				transfer.dapp_id,
				{
					topic: 'withdrawalCompleted',
					message: {
						transaction_id: trs.id
					}
				},
				() => {}
			);
			return cb();
    })
	}
}
module.exports = OutTranssfer;