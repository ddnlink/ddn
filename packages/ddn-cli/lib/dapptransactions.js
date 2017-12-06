var util = require('util');
var ByteBuffer = require('bytebuffer');
var crypto = require('./crypto.js');
var bignum = require('browserify-bignum');

var bytesTypes = {
	2: function (trs) {
		try {
			var buf = new Buffer(trs.asset.delegates.list.join(","), 'utf8');
		} catch (e) {
			throw Error(e.toString());
		}

		return buf;
	}
}

function getTransactionBytes(trs, skipSignature) {

	try {
		var bb = new ByteBuffer(1, true);
		bb.writeInt(trs.timestamp);
		bb.writeString(trs.fee)

		var senderPublicKeyBuffer = new Buffer(trs.senderPublicKey, 'hex');
		for (var i = 0; i < senderPublicKeyBuffer.length; i++) {
			bb.writeByte(senderPublicKeyBuffer[i]);
		}

		bb.writeInt(trs.type)

		for (var i = 0; i < trs.args.length; ++i) {
			bb.writeString(trs.args[i])
		}

		if (!skipSignature && trs.signature) {
			var signatureBuffer = new Buffer(trs.signature, 'hex');
			for (var i = 0; i < signatureBuffer.length; i++) {
				bb.writeByte(signatureBuffer[i]);
			}
		}

		bb.flip();
	} catch (e) {
		throw Error(e.toString());
	}
	return bb.toBuffer();
}

module.exports = {
	getTransactionBytes: getTransactionBytes
}
