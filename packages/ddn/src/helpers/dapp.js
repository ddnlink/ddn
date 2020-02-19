import cryptoLib from '@ddn/crypto';
import ByteBuffer from 'bytebuffer';
import crypto from 'crypto';
import dappTransactionsLib from '../dapptransactions.js';
import accounts from './account.js';

function getBytes(block, skipSignature) {
	const size = 8 + 4 + 4 + 4 + 32 + 32 + 8 + 4 + 4 + 64;

	const bb = new ByteBuffer(size, true);

	bb.writeString(block.prevBlockId || '0')

    //bignum update bb.writeLong(block.height);
    bb.writeString(`${block.height}`);
	bb.writeInt(block.timestamp);
	bb.writeInt(block.payloadLength);

	const ph = Buffer.from(block.payloadHash, 'hex');
	for (var i = 0; i < ph.length; i++) {
		bb.writeByte(ph[i]);
	}

	var pb = Buffer.from(block.delegate, 'hex');
	for (let i = 0; i < pb.length; i++) {
		bb.writeByte(pb[i]);
	}

	bb.writeString(block.pointId || '0')

    //bignum update bb.writeLong(block.pointHeight || 0);
    bb.writeString((`${block.pointHeight}`) || "0");

	bb.writeInt(block.count);

	if (!skipSignature && block.signature) {
		var pb = Buffer.from(block.signature, 'hex');
		for (var i = 0; i < pb.length; i++) {
			bb.writeByte(pb[i]);
		}
	}

	bb.flip();
	const b = bb.toBuffer();

	return b;
}

export default {
	new({keypair, address}, publicKeys, assetInfo) {
		const sender = accounts.account(cryptoLib.generateSecret());

		const block = {
			delegate: keypair.publicKey,
			height: "1",
			pointId: null,
			pointHeight: null,
			transactions: [],
			timestamp: 0,
			payloadLength: 0,
			payloadHash: crypto.createHash('sha256')
		};

		if (assetInfo) {
			const assetTrs = {
				fee: '0',
				timestamp: 0,
				senderPublicKey: sender.keypair.publicKey,
				type: 3,
				args: JSON.stringify([
					assetInfo.name,
					String(Number(assetInfo.amount) * (10 ** assetInfo.precision)),
					address
				])
			};
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
		block.signature = cryptoLib.sign(keypair, bytes);
		bytes = getBytes(block);
		block.id = cryptoLib.getId(bytes);

		return block;
	}
};
