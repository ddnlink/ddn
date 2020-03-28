import crypto from './crypto';
import constants from '../constants';
import trsTypes from '../transaction-types';
import slots from '../time/slots';
import options from '../options';

/**
 * Create exchange transaction
 * @param {Exchange} exchange object
 * @param {*} secret 
 * @param {*} secondSecret 
 */
function createExchange(trsopt, exchange, secret, secondSecret) {
	const keys = crypto.getKeys(secret);
	const bytes = null;

	if (typeof exchange !== 'object') {
		throw new Error('The first argument should be a object!');
	}

	if (!exchange.org_id || exchange.org_id.length == 0) {
		throw new Error('Invalid orgId format');
	}

	const fee = constants.fees.exchange;

	const transaction = Object.assign({
		type: trsTypes.EXCHANGE,
		nethash: options.get('nethash'),
		amount: "0",    //Bignum update
		fee: `${fee}`,
		recipientId: null,
		sender_public_key: keys.public_key,
		// senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			exchange
		}
	}, trsopt||{});

	crypto.sign(transaction, keys);

	if (secondSecret) {
		const secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = crypto.getId(transaction);
	return transaction;
}

export default {
	createExchange
};
