var ByteBuffer = require('bytebuffer');
var crypto = require('./crypto.js');
var constants = require('../constants.js');
var transactionTypes = require("../transaction-types.js")
var slots = require('../time/slots.js');
var options = require('../options');

/**
 * Create evidence transaction
 * @param {Evidence} evidence object {ipid: ipid, title: title, description: description, tags: tags, hash: hash, type: type, size: size, url: url}
 * @param {*} secret 
 * @param {*} secondSecret 
 */
function createEvidence(evidence, secret, secondSecret) {
	var keys = crypto.getKeys(secret);
	var bytes = null;

	if (typeof evidence !== 'object') {
		throw new Error('The first argument should be a object!');
	}

	if (!evidence.ipid || evidence.ipid.length == 0) {
		throw new Error('Invalid ipid format');
	}

	var fee = constants.fees.evidence;

	var transaction = {
		type: transactionTypes.EVIDENCE,
		nethash: options.get('nethash'),
		amount: "0",
		fee: fee,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			evidence: evidence
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
	createEvidence: createEvidence
};
