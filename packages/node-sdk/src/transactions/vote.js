import crypto from "./crypto";
import constants from "../constants";
import transactionTypes from "../transaction-types";
import slots from "../time/slots";
import options from '../options';

async function createVote(keyList, secret, secondSecret) {
	const keys = crypto.getKeys(secret);

	const transaction = {
		type: transactionTypes.VOTE,
		nethash: options.get('nethash'),
		amount: "0", 
		fee: constants.fees.vote,
		recipient_id: null,
		sender_public_key: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			vote: {
				votes: keyList
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
	createVote
};
