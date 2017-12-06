var util = require('util');
var ByteBuffer = require('bytebuffer');
var crypto = require('./crypto.js');
var bignum = require('browserify-bignum');

var bytesTypes = {
	2: function (trs) {
		try {
			var buf = new Buffer(trs.asset.delegate.username, 'utf8');
		} catch (e) {
			throw Error(e.toString());
		}

		return buf;
	},

	3: function (trs) {
		try {
			var buf = trs.asset.vote.votes ? new Buffer(trs.asset.vote.votes.join(''), 'utf8') : null;
		} catch (e) {
			throw Error(e.toString());
		}

		return buf;
	},

	5: function (trs) {
		try {
			var buf = new Buffer([]);
			var nameBuf = new Buffer(trs.asset.dapp.name, 'utf8');
			buf = Buffer.concat([buf, nameBuf]);

			if (trs.asset.dapp.description) {
				var descriptionBuf = new Buffer(trs.asset.dapp.description, 'utf8');
				buf = Buffer.concat([buf, descriptionBuf]);
			}

			if (trs.asset.dapp.git) {
				buf = Buffer.concat([buf, new Buffer(trs.asset.dapp.git, 'utf8')]);
			}

			var bb = new ByteBuffer(4 + 4, true);
			bb.writeInt(trs.asset.dapp.type);
			bb.writeInt(trs.asset.dapp.category);
			bb.flip();

			buf = Buffer.concat([buf, bb.toBuffer()]);
		} catch (e) {
			throw Error(e.toString());
		}

		return buf;
	}
}

function getTransactionBytes(trs, skipSignature) {
	var assetBytes, assetSize;

	if (trs.type > 0) {
		assetBytes = bytesTypes[trs.type](trs);
		assetSize = assetBytes ? assetBytes.length : 0;
	} else {
		assetSize = 0;
	}

	var bb = new ByteBuffer(1 + 4 + 32 + 32 + 8 + 8 + 64 + 64 + assetSize, true);
	bb.writeByte(trs.type);
	bb.writeInt(trs.timestamp);

	var senderPublicKeyBuffer = new Buffer(trs.senderPublicKey, 'hex');
	for (var i = 0; i < senderPublicKeyBuffer.length; i++) {
		bb.writeByte(senderPublicKeyBuffer[i]);
	}

	if (trs.recipientId) {
		if (/^[0-9]{1,20}$/g.test(trs.recipientId)) {
			var recipient = bignum(trs.recipientId).toBuffer({ size: 8 });
			for (var i = 0; i < 8; i++) {
				bb.writeByte(recipient[i] || 0);
			}
		} else {
			bb.writeString(trs.recipientId);
		}
	} else {
		for (var i = 0; i < 8; i++) {
			bb.writeByte(0);
		}
	}

	bb.writeLong(trs.amount);

	if (assetSize > 0) {
		for (var i = 0; i < assetSize; i++) {
			bb.writeByte(assetBytes[i]);
		}
	}

	if (!skipSignature && trs.signature) {
		var signatureBuffer = new Buffer(trs.signature, 'hex');
		for (var i = 0; i < signatureBuffer.length; i++) {
			bb.writeByte(signatureBuffer[i]);
		}
	}

	bb.flip();

	return bb.toBuffer();
}

module.exports = {
	getTransactionBytes: getTransactionBytes
}
