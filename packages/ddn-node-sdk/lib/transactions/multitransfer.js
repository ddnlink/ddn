var ByteBuffer = require('bytebuffer')
var crypto = require("./crypto.js")
var constants = require("../constants.js")
var trsTypes = require('../transaction-types');
var slots = require("../time/slots.js")
var options = require('../options')
var addressHelper = require('../address.js')
var bignum = require('bignum-utils');

function createMultiTransfer(outputs, secret, secondSecret) {
	var keys = crypto.getKeys(secret)
	var bytes = null

	if (!outputs || outputs.length == 0) {
		throw new Error('Invalid fileHash format')
	}
	var sender = addressHelper.generateBase58CheckAddress(keys.public_key)
	var fee = constants.fees.multitransfer
	var amount = bignum.new(0);   //bignum update
	var recipientId = []
	for (var i = 0; i < outputs.length; i++) {
		var output = outputs[i]
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

	var transaction = {
		type: trsTypes.MULTITRANSFER,
		nethash: options.get('nethash'),
		amount: amount.toString(),  //bignum update amount,
		fee: fee + "",
		recipientId: recipientId.join('|'),
		senderPublicKey: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			output: {
				outputs: outputs
			}
		},
	}

	crypto.sign(transaction, keys)

	if (secondSecret) {
		var secondKeys = crypto.getKeys(secondSecret)
		crypto.secondSign(transaction, secondKeys)
	}
	transaction.id = crypto.getId(transaction)
	return transaction
}

module.exports = {
	createMultiTransfer: createMultiTransfer
}