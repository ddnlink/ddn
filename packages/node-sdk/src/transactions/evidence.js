import crypto from './crypto';
import constants from '../constants';
// import transactionTypes from "../transaction-types";
import slots from '../time/slots';
import options from '../options';

/**
 * Create evidence transaction
 * @param {Evidence} evidence object {ipid: ipid, title: title, description: description, tags: tags, hash: hash, type: type, size: size, url: url}
 * @param {*} secret 
 * @param {*} secondSecret 
 */
function createEvidence(evidence, secret, secondSecret) {
	const keys = crypto.getKeys(secret);
	const bytes = null;

	if (typeof evidence !== 'object') {
		throw new Error('The first argument should be a object!');
	}

	if (!evidence.ipid || evidence.ipid.length == 0) {
		throw new Error('Invalid ipid format');
	}

	const fee = constants.fees.evidence;

	const transaction = {
		type: 10,   //transactionTypes.EVIDENCE,
		nethash: options.get('nethash'),
		amount: "0",   
		fee,
		recipientId: null,
		sender_public_key: keys.public_key,
		// sender_public_key: keys.publicKey,
		// senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			evidence
		}
	};

	crypto.sign(transaction, keys);

	if (secondSecret) {
		const secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = crypto.getId(transaction);
	return transaction;
}

export default {
	createEvidence
};
