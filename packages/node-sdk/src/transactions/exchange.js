import DdnUtils from '@ddn/utils';
import crypto from '../utils/crypto';
import constants from '../constants';
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

	if (typeof exchange !== 'object') {
		throw new Error('The first argument should be a object!');
	}

	if (!exchange.org_id || exchange.org_id.length == 0) {
		throw new Error('Invalid orgId format');
	}

	const fee = constants.net.fees.exchange;

	const transaction = Object.assign({
		type: DdnUtils.assetTypes.DAO_EXCHANGE,
		nethash: options.get('nethash'),
		amount: "0",    //Bignum update
		fee: `${fee}`,
		recipientId: null,
		senderPublicKey: keys.public_key,
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

	// transaction.id = crypto.getId(transaction);
	return transaction;
}

export default {
	createExchange
};
