var ByteBuffer = require('bytebuffer');
var crypto = require('./crypto.js');
var constants = require('../constants.js');
var trsTypes = require('../transaction-types');
var slots = require('../time/slots.js');
var options = require('../options');

/**
 * Create org transaction
 * @param {Org} org object
 * @param {*} secret 
 * @param {*} secondSecret 
 */
function createOrg(org, secret, secondSecret) {
	var keys = crypto.getKeys(secret);
	var bytes = null;

	if (typeof org !== 'object') {
		throw new Error('The first argument should be a object!');
	}

	if (!org.orgId || org.orgId.length == 0) {
		throw new Error('Invalid orgId format');
	}

	var fee = constants.fees.org;

	var transaction = {
		type: trsTypes.ORG,
		nethash: options.get('nethash'),
		amount: 0,
		fee: fee,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			org: org
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
	createOrg: createOrg
};
