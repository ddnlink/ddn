var ByteBuffer = require('bytebuffer');
var crypto = require('./crypto.js');
var constants = require('../constants.js');
var trsTypes = require('../transaction-types');
var slots = require('../time/slots.js');
var options = require('../options');

/**
 * Create exchange transaction
 * @param {Exchange} exchange object
 * @param {*} secret 
 * @param {*} secondSecret 
 */
function createExchange(trsopt, exchange, secret, secondSecret) {
	var keys = crypto.getKeys(secret);
	var bytes = null;

	if (typeof exchange !== 'object') {
		throw new Error('The first argument should be a object!');
	}

	if (!exchange.org_id || exchange.org_id.length == 0) {
		throw new Error('Invalid orgId format');
	}

	var fee = constants.fees.exchange;

	var transaction = Object.assign({
		type: trsTypes.EXCHANGE,
		nethash: options.get('nethash'),
		amount: "0",    //bignum update
		fee: fee + "",
		recipientId: null,
		sender_public_key: keys.public_key,
		// senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			exchange: exchange
		}
	}, trsopt||{});

	crypto.sign(transaction, keys);

	if (secondSecret) {
		var secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = crypto.getId(transaction);
	return transaction;
}

module.exports = {
	createExchange: createExchange
};
