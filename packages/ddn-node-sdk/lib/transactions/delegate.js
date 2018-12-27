var crypto = require("./crypto.js")
var constants = require("../constants.js")
var transactionTypes = require("../transaction-types.js")
var slots = require("../time/slots.js")
var options = require('../options')

function createDelegate(username, secret, secondSecret) {
	var keys = crypto.getKeys(secret);

	var transaction = {
		type: transactionTypes.DELEGATE,
		nethash: options.get('nethash'),
		amount: "0",
		fee: constants.fees.delegate,
		recipientId: null,
		sender_public_key: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			delegate: {
				username: username,
				public_key: keys.public_key
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
	createDelegate : createDelegate
}
