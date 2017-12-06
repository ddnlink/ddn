var crypto = require("./crypto.js")
var constants = require("../constants.js")
var slots = require("../time/slots.js")
var options = require('../options')

function createInTransfer(dappId, currency, amount, secret, secondSecret) {
	var keys = crypto.getKeys(secret);

	var transaction = {
		type: 6,
		amount: 0,
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

	if (currency === 'XAS') {
		transaction.amount = Number(amount)
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
		type: 7,
		amount: 0,
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