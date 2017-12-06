var cryptoLib = require('../lib/crypto.js');
var ByteBuffer = require('bytebuffer');
var bignum = require('browserify-bignum');
var crypto = require('crypto');
var dappTransactionsLib = require('../lib/dapptransactions.js');
var accounts = require('./account.js');

function getBytes(block, skipSignature) {
	var size = 8 + 4 + 4 + 4 + 32 + 32 + 8 + 4 + 4 + 64;

	var bb = new ByteBuffer(size, true);

	bb.writeString(block.prevBlockId || '0')

	bb.writeLong(block.height);
	bb.writeInt(block.timestamp);
	bb.writeInt(block.payloadLength);

	var ph = new Buffer(block.payloadHash, 'hex');
	for (var i = 0; i < ph.length; i++) {
		bb.writeByte(ph[i]);
	}

	var pb = new Buffer(block.delegate, 'hex');
	for (var i = 0; i < pb.length; i++) {
		bb.writeByte(pb[i]);
	}

	bb.writeString(block.pointId || '0')

	bb.writeLong(block.pointHeight || 0);

	bb.writeInt(block.count);

	if (!skipSignature && block.signature) {
		var pb = new Buffer(block.signature, 'hex');
		for (var i = 0; i < pb.length; i++) {
			bb.writeByte(pb[i]);
		}
	}

	bb.flip();
	var b = bb.toBuffer();

	return b;
}

module.exports = {
	new: function (genesisAccount, publicKeys, assetInfo) {
		var sender = accounts.account(cryptoLib.generateSecret());

		var block = {
			delegate: genesisAccount.keypair.publicKey,
			height: 1,
			pointId: null,
			pointHeight: null,
			transactions: [],
			timestamp: 0,
			payloadLength: 0,
			payloadHash: crypto.createHash('sha256')
		}

		if (assetInfo) {
			var assetTrs = {
				fee: '0',
				timestamp: 0,
				senderPublicKey: sender.keypair.publicKey,
				type: 3,
				args: JSON.stringify([
					assetInfo.name,
					String(Number(assetInfo.amount) * Math.pow(10, assetInfo.precision)),
					genesisAccount.address
				])
			}
			bytes = dappTransactionsLib.getTransactionBytes(assetTrs);
			assetTrs.signature = cryptoLib.sign(sender.keypair, bytes);
			block.payloadLength += bytes.length;
			block.payloadHash.update(bytes);

			bytes = dappTransactionsLib.getTransactionBytes(assetTrs);
			assetTrs.id = cryptoLib.getId(bytes);
			block.transactions.push(assetTrs);
		}
		block.count = block.transactions.length;

		block.payloadHash = block.payloadHash.digest().toString('hex');
		bytes = getBytes(block);
		block.signature = cryptoLib.sign(genesisAccount.keypair, bytes);
		bytes = getBytes(block);
		block.id = cryptoLib.getId(bytes);

		return block;
	}
}
