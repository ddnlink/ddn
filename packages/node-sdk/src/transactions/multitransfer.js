import crypto from "./crypto.js";
import constants from "../constants.js";
import trsTypes from '../transaction-types';
import slots from "../time/slots.js";
import options from '../options';
import addressHelper from '../address.js';
import DdnUtils from '@ddn/utils';

const { bignum } = DdnUtils;

function createMultiTransfer(outputs, secret, secondSecret, cb) {
	const keys = crypto.getKeys(secret);

	if (!outputs || outputs.length == 0) {
		throw new Error('Invalid fileHash format')
	}
	const sender = addressHelper.generateBase58CheckAddress(keys.public_key);
	const fee = constants.fees.multitransfer;
	let amount = bignum.new(0);   //bignum update
	const recipientId = [];
	for (let i = 0; i < outputs.length; i++) {
		const output = outputs[i];
		if (!output.recipientId || !output.amount) {
			return cb("output recipient or amount null");
		}

		if (!addressHelper.isAddress(output.recipientId)) {
			return cb("Invalid output recipient");
		}

        // bignum update
		// if (output.amount <= 0) {
        if (bignum.isLessThanOrEqualTo(output.amount, 0)) {
			return cb("Invalid output amount");
		}

		if (output.recipientId == sender) {
			return cb("Invalid output recipientId, cannot be your self");
		}

        // bignum update
        // amount += output.amount
        amount = bignum.plus(amount, output.amount);
        
		recipientId.push(output.recipientId)
	}

	const transaction = {
		type: trsTypes.MULTITRANSFER,
		nethash: options.get('nethash'),
		amount: amount.toString(),  //bignum update amount,
		fee: `${fee}`,
		recipientId: recipientId.join('|'),
		senderPublicKey: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			output: {
				outputs
			}
		},
	};

	crypto.sign(transaction, keys)

	if (secondSecret) {
		const secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys)
	}
	transaction.id = crypto.getId(transaction)
	return transaction
}

export default {
	createMultiTransfer
};