var crypto = require("./crypto");
var constants = require("../constants");
var transactionTypes = require("../transaction-types.js")
var slots = require("../time/slots");
var options = require('../options');

var nethash = options.get('nethash');

function createInTransfer(dappId, currency, amount, secret, secondSecret) {
	var keys = crypto.getKeys(secret);

	var transaction = {
		type: transactionTypes.IN_TRANSFER,
		nethash: nethash,
		amount: "0",    //bignum update
		fee: constants.fees.send,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			inTransfer: {
				dappId: dappId,
				currency: currency
			}
		}
	};

	if (currency === constants.nethash[nethash].tokenName) {
		transaction.amount = amount;    //bignum update Number(amount)
	} else {
		transaction.asset.inTransfer.amount = String(amount)
	}

	crypto.sign(transaction, keys);

	if (secondSecret) {
		var secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = crypto.getId(transaction);
	return transaction;
}

function createOutTransfer(recipientId, dappId, transactionId, currency, amount, secret, secondSecret) {
	var keys = crypto.getKeys(secret);

	var transaction = {
        nethash: nethash,
		type: transactionTypes.OUT_TRANSFER,
		amount: "0",    //bignum update
		fee: constants.fees.send,
		recipientId: recipientId,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			outTransfer: {
				dappId: dappId,
				transactionId: transactionId,
				currency: currency,
				amount: amount
			}
		}
	};

	crypto.sign(transaction, keys);

	if (secondSecret) {
		var secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = crypto.getId(transaction);
	return transaction;
}

function signOutTransfer(transaction, secret) {
	var keys = crypto.getKeys(secret);
	var signature = crypto.sign(transaction, keys);

	return signature;
}

module.exports = {
	createInTransfer: createInTransfer,
	createOutTransfer: createOutTransfer,
	signOutTransfer: signOutTransfer
}