import crypto from "./crypto";
import constants from "../constants";
import transactionTypes from "../transaction-types";
import slots from "../time/slots";
import options from '../options';

function signTransaction(trs, secret) {
	const keys = crypto.getKeys(secret);
	const signature = crypto.sign(trs, keys);

	return signature;
}

function createMultisignature(keysgroup, lifetime, min, secret, secondSecret) {
	const keys = crypto.getKeys(secret);

	const transaction = {
		type: transactionTypes.MULTITRANSFER,
		nethash: options.get('nethash'),
		amount: "0",    //Bignum update
		fee: constants.fees.multisignature,
		recipientId: null,
		senderPublicKey: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			multisignature: {
				min,
				lifetime,
				keysgroup
			}
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
	createMultisignature,
	signTransaction
};
