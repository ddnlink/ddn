var crypto = require("./crypto.js")
var constants = require("../constants.js")
var slots = require("../time/slots.js")
var options = require('../options')

function signTransaction(trs, secret) {
	var keys = crypto.getKeys(secret);
	var signature = crypto.sign(trs, keys);

	return signature;
}

function createMultisignature(keysgroup, lifetime, min, secret, secondSecret) {
	var keys = crypto.getKeys(secret);

	var transaction = {
		type: 4,
		amount: 0,
		fee: constants.fees.multisignature,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			multisignature: {
				min: min,
				lifetime: lifetime,
				keysgroup: keysgroup
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

module.exports = {
	createMultisignature : createMultisignature,
	signTransaction: signTransaction
}
