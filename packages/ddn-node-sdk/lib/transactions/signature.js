var crypto = require("./crypto.js")
var constants = require("../constants.js")
var transactionTypes = require("../transaction-types.js")
var slots = require("../time/slots.js")
var options = require('../options')

function newSignature(secondSecret) {
	var keys = crypto.getKeys(secondSecret);

	var signature = {
		public_key: keys.public_key
	};

	return signature;
}

async function createSignature(secret, secondSecret, oldSecondSecret) {
	var keys = crypto.getKeys(secret);

    var signature = newSignature(secondSecret);

	var transaction = {
		type: transactionTypes.SIGNATURE,
		nethash: options.get('nethash'),
		amount: "0",    //bignum update
		fee: constants.fees.secondsignature,
		recipient_id: null,
		sender_public_key: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			signature: signature
		}
    };

    await crypto.sign(transaction, keys);

	if (oldSecondSecret) {
        var secondKeys = crypto.getKeys(oldSecondSecret);
		await crypto.secondSign(transaction, secondKeys);
    }
    
    transaction.id = await crypto.getId(transaction);

	return transaction;
}

module.exports = {
	createSignature: createSignature
}
