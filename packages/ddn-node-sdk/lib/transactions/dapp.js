var ByteBuffer = require('bytebuffer')
var crypto = require("./crypto.js")
var constants = require("../constants.js")
var slots = require("../time/slots.js")
var globalOptions = require('../options.js')

function createDApp(options, secret, secondSecret) {
	var keys = crypto.getKeys(secret);

	var transaction = {
		type: 5,
		amount: 0,
		fee: constants.fees.dapp,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - globalOptions.get('clientDriftSeconds'),
		asset: {
			dapp: {
				category: options.category,
				name: options.name,
				description: options.description,
				tags: options.tags,
				type: options.type,
				link: options.link,
				icon: options.icon,
				delegates: options.delegates,
				unlockDelegates: options.unlockDelegates
			}
		}
	};

	crypto.sign(transaction, keys);

	if (secondSecret) {
		var secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = crypto.getId(transaction);
	return transaction;
}

function getDAppTransactionBytes(trs, skipSignature) {
	var bb = new ByteBuffer(1, true);
	bb.writeInt(trs.timestamp);
	bb.writeString(trs.fee)

	var senderPublicKeyBuffer = new Buffer(trs.senderPublicKey, 'hex');
	for (var i = 0; i < senderPublicKeyBuffer.length; i++) {
		bb.writeByte(senderPublicKeyBuffer[i]);
	}

	bb.writeInt(trs.type)

	if (trs.args) bb.writeString(trs.args)

	if (!skipSignature && trs.signature) {
		var signatureBuffer = new Buffer(trs.signature, 'hex');
		for (var i = 0; i < signatureBuffer.length; i++) {
			bb.writeByte(signatureBuffer[i]);
		}
	}
	bb.flip();
	return bb.toBuffer()
}

function createInnerTransaction(options, secret) {
	var keys = crypto.getKeys(secret)
	var args = options.args
	if (args instanceof Array) args = JSON.stringify(args)
	var trs = {
		fee: options.fee,
		timestamp: slots.getTime() - globalOptions.get('clientDriftSeconds'),
		senderPublicKey: keys.publicKey,
		type: options.type,
		args: args
	}
	trs.signature = crypto.signBytes(getDAppTransactionBytes(trs), keys)
	return trs
}

module.exports = {
	createDApp: createDApp,
	createInnerTransaction: createInnerTransaction
}
