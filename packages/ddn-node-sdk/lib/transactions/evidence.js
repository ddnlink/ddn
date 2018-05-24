var ByteBuffer = require('bytebuffer');
var crypto = require('./crypto.js');
var constants = require('../constants.js');
var slots = require('../time/slots.js');
var options = require('../options');

/**
 * Create evidence transaction
 * @param {Evidence} evidence object {ipid: ipid, title: title, tags: tags, hash: hash, type: type, size: size, url: url}
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
		type: 20,
		nethash: options.get('nethash'),
		amount: 0,
		fee: fee,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			evidence: {
				ipid: evidence.ipid,
				title: evidence.title,
				hash: evidence.description,
				author: evidence.author,
				size: evidence.size,
				type: evidence.type
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
	createEvidence: createEvidence
};
