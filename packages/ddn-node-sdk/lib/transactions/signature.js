var crypto = require("./crypto.js")
var constants = require("../constants.js")
var transactionTypes = require("../transaction-types.js")
var slots = require("../time/slots.js")
var options = require('../options')

function newSignature(secondSecret) {
	var keys = crypto.getKeys(secondSecret);

	var signature = {
		publicKey: keys.publicKey
	};

	return signature;
}

function createSignature(secret, secondSecret) {
	var keys = crypto.getKeys(secret);

	var signature = newSignature(secondSecret);
	var transaction = {
		type: transactionTypes.SIGNATURE,
		nethash: options.get('nethash'),
		amount: "0",    //bignum update
		fee: constants.fees.secondsignature,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			signature: signature
		}
	};

	crypto.sign(transaction, keys);
	transaction.id = crypto.getId(transaction);

	return transaction;
}

module.exports = {
	createSignature: createSignature
}
