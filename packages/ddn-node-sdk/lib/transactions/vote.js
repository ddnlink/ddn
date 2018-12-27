var crypto = require("./crypto.js")
var constants = require("../constants.js")
var transactionTypes = require("../transaction-types.js")
var slots = require("../time/slots.js")
var options = require('../options')

function createVote(keyList, secret, secondSecret) {
	var keys = crypto.getKeys(secret);

	var transaction = {
		type: transactionTypes.VOTE,
		nethash: options.get('nethash'),
		amount: "0",    //bignum update
		fee: constants.fees.vote,
		recipientId: null,
		sender_public_key: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			vote: {
				votes: keyList
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
	createVote: createVote
}
