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
		recipient_id: null,
		sender_public_key: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			inTransfer: {
				dapp_id: dappId,
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
		recipient_id: recipientId,
		sender_public_key: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			outTransfer: {
				dapp_id: dappId,
				transaction_id: transactionId,
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

async function signOutTransfer(transaction, secret) {
	var keys = crypto.getKeys(secret);
	var signature = await crypto.sign(transaction, keys);

	return signature;
}

module.exports = {
	createInTransfer: createInTransfer,
	createOutTransfer: createOutTransfer,
	signOutTransfer: signOutTransfer
}