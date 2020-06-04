import _ from "lodash";
import DdnUtils from '@ddn/utils';

import crypto from '../utils/crypto'; // TODO: @ddn/crypto
import constants from "../constants";
import slots from "../time/slots";
import options from '../options';

function calculateFee(amount) {
    const min = constants.net.fees.send;
    
    const fee = DdnUtils.bignum.multiply(amount, 0.0001).toFixed(0);

    if (DdnUtils.bignum.isLessThan(fee, min)) {
        return min;
    } else {
        return `${fee}`;
    }
}

async function createTransaction(recipientId, amount, message, secret, second_secret) {
	const transaction = {
		type: DdnUtils.assetTypes.TRANSFER,
		nethash: options.get('nethash'),
		amount: `${amount}`,
		fee: constants.net.fees.send,
		recipientId: recipientId,
		message,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {}
	};

	const keys = crypto.getKeys(secret);
	transaction.senderPublicKey = keys.publicKey;

	transaction.signature = await crypto.sign(transaction, keys);

	if (second_secret) {
		const secondKeys = crypto.getKeys(second_secret);
		transaction.sign_signature = await crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = await crypto.getId(transaction);
	return transaction;
}

async function createLock(height, secret, second_secret) {
	const transaction = {
		type: 100, // TODO: update to string lock
		amount: "0",    
		nethash: options.get('nethash'),
		fee: "10000000",    
		recipientId: null,
		args: [ String(height) ],
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {}
	};

	const keys = crypto.getKeys(secret);
	transaction.senderPublicKey = keys.publicKey;

	transaction.signature = await crypto.sign(transaction, keys);

	if (second_secret) {
		const secondKeys = crypto.getKeys(second_secret);
		transaction.sign_signature =await crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = await crypto.getId(transaction);
	return transaction;
}

export default {
	createTransaction,
	calculateFee,
	createLock
};