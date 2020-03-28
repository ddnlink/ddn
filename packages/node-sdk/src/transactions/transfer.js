import crypto from "./crypto";
import constants from "../constants";
import transactionTypes from "../transaction-types.js";
import slots from "../time/slots";
import options from '../options';

const nethash = options.get('nethash');

function createInTransfer(dappId, currency, amount, secret, secondSecret) {
	const keys = crypto.getKeys(secret);

	const transaction = {
		type: transactionTypes.IN_TRANSFER,
		nethash,
		amount: "0",    //Bignum update
		fee: constants.fees.send,
		recipient_id: null,
		sender_public_key: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			in: {
				dapp_id: dappId,
				currency
			}
		}
	};

	if (currency === constants.nethash[nethash].tokenName) {
		transaction.amount = amount;    //Bignum update Number(amount)
	} else {
		transaction.asset.in.amount = String(amount)
	}

	crypto.sign(transaction, keys);

	if (secondSecret) {
		const secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = crypto.getId(transaction);
	return transaction;
}

function createOutTransfer(recipientId, dappId, transactionId, currency, amount, secret, secondSecret) {
	const keys = crypto.getKeys(secret);

	const transaction = {
    nethash,
		type: transactionTypes.OUT_TRANSFER,
		amount: "0",    //Bignum update
		fee: constants.fees.send,
		recipient_id: recipientId,
		sender_public_key: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			outTransfer: {
				dapp_id: dappId,
				transaction_id: transactionId,
				currency,
				amount
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

async function signOutTransfer(transaction, secret) {
	const keys = crypto.getKeys(secret);
	const signature = await crypto.sign(transaction, keys);

	return signature;
}

export default {
	createInTransfer,
	createOutTransfer,
	signOutTransfer
};