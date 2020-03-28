import crypto from "./crypto.js";
import constants from "../constants.js";
import transactionTypes from "../transaction-types.js";
import slots from "../time/slots.js";
import options from '../options';

async function createDelegate(username, secret, secondSecret) {
	const keys = crypto.getKeys(secret);

	const transaction = {
		type: transactionTypes.DELEGATE,
		nethash: options.get('nethash'),
		amount: "0",
		fee: constants.fees.delegate,
		recipient_id: null,
		sender_public_key: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			delegate: {
				username,
				public_key: keys.public_key
			}
		}
	};

	await crypto.sign(transaction, keys);

	if (secondSecret) {
		const secondKeys = crypto.getKeys(secondSecret);
		await crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = await crypto.getId(transaction);
	return transaction;
}

export default {
	createDelegate
};
