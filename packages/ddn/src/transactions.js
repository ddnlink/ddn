import ByteBuffer from 'bytebuffer';
import DdnUtils from '@ddn/utils';

const { bignum } = DdnUtils;

const bytesTypes = {
	2: function({asset}) {
		try {
			var buf = Buffer.from(asset.delegate.username, 'utf8');
		} catch (e) {
			throw Error(e.toString());
		}

		return buf;
	},

	3: function({asset}) {
		try {
			var buf = asset.vote.votes ? Buffer.from(asset.vote.votes.join(''), 'utf8') : null;
		} catch (e) {
			throw Error(e.toString());
		}

		return buf;
	},

	5: function({asset}) {
		try {
			var buf = Buffer.from([]);
			const nameBuf = Buffer.from(asset.dapp.name, 'utf8');
			buf = Buffer.concat([buf, nameBuf]);

			if (asset.dapp.description) {
				const descriptionBuf = Buffer.from(asset.dapp.description, 'utf8');
				buf = Buffer.concat([buf, descriptionBuf]);
			}

			if (asset.dapp.git) {
				buf = Buffer.concat([buf, Buffer.from(asset.dapp.git, 'utf8')]);
			}

			const bb = new ByteBuffer(4 + 4, true);
			bb.writeInt(asset.dapp.type);
			bb.writeInt(asset.dapp.category);
			bb.flip();

			buf = Buffer.concat([buf, bb.toBuffer()]);
		} catch (e) {
			throw Error(e.toString());
		}

		return buf;
	}
};

function getTransactionBytes(trs, skipSignature) {
    let assetBytes;
    let assetSize;

    if (trs.type > 0) {
		assetBytes = bytesTypes[trs.type](trs);
		assetSize = assetBytes ? assetBytes.length : 0;
	} else {
		assetSize = 0;
	}

    const bb = new ByteBuffer(1 + 4 + 8 + 32 + 32 + 8 + 8 + 64 + 64 + assetSize, true);
    bb.writeByte(trs.type);
    bb.writeInt(trs.timestamp);
    bb.writeString(trs.nethash);

    const senderPublicKeyBuffer = Buffer.from(trs.senderPublicKey, 'hex'); //wxm block database
    for (var i = 0; i < senderPublicKeyBuffer.length; i++) {
		bb.writeByte(senderPublicKeyBuffer[i]);
	}

    if (trs.recipientId) {  //wxm block database
		if (/^[0-9]{1,20}$/g.test(trs.recipientId)) {   //wxm block database
			const recipient = bignum.toBuffer(trs.recipientId, { size: 8 }).toString();   //wxm block database
			for (var i = 0; i < 8; i++) {
				bb.writeByte(recipient[i] || 0);
			}
		} else {
			bb.writeString(trs.recipientId);    //wxm block database
		}
	} else {
		for (var i = 0; i < 8; i++) {
			bb.writeByte(0);
		}
	}

    bb.writeString(bignum.new(trs.amount).toString());

    if (assetSize > 0) {
		for (var i = 0; i < assetSize; i++) {
			bb.writeByte(assetBytes[i]);
		}
	}

    if (!skipSignature && trs.signature) {
		const signatureBuffer = Buffer.from(trs.signature, 'hex');
		for (var i = 0; i < signatureBuffer.length; i++) {
			bb.writeByte(signatureBuffer[i]);
		}
	}

    bb.flip();

    return bb.toBuffer();
}

export default {
	getTransactionBytes
};
