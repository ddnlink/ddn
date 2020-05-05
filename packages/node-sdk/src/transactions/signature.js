import crypto from '../utils/crypto';
import constants from "../constants";
import DdnUtils from '@ddn/utils';
import slots from "../time/slots";
import options from '../options';

function newSignature(secondSecret) {
	const keys = crypto.getKeys(secondSecret);

	const signature = {
		publicKey: keys.publicKey
	};

	return signature;
}

async function createSignature(secret, secondSecret, oldSecondSecret) {
    const keys = crypto.getKeys(secret);

    const signature = newSignature(secondSecret);

	const transaction = {
		type: DdnUtils.assetTypes.SIGNATURE,
		nethash: options.get('nethash'),
		amount: "0",    //Bignum update
		fee: constants.net.fees.secondSignature,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			signature
		}
    };

    await crypto.sign(transaction, keys);

    // FIXME: 这里的逻辑是要修改二次密码？不该使用old* 
	if (oldSecondSecret) {
	// if (secondSecret) {
        const secondKeys = crypto.getKeys(oldSecondSecret); 
        // const secondKeys = crypto.getKeys(secondSecret); 
		await crypto.secondSign(transaction, secondKeys); 
    }
    
    // transaction.id = await crypto.getId(transaction);

	return transaction;
}

export default {
	createSignature
};
