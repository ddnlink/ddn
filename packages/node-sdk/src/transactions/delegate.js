import crypto from "./crypto";
import constants from "../constants";
import DdnUtils from '@ddn/utils';
import slots from "../time/slots";
import options from '../options';

async function createDelegate(username, secret, secondSecret) {
	const keys = crypto.getKeys(secret);

	const transaction = {
		type: DdnUtils.assetTypes.DELEGATE,
		nethash: options.get('nethash'),
		amount: "0",
		fee: constants.fees.delegate,
		recipientId: null,
		senderPublicKey: keys.public_key,
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

	// transaction.id = await crypto.getId(transaction);
	return transaction;
}

export default {
	createDelegate
};
