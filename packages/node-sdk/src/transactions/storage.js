import DdnUtils from '@ddn/utils';
import ByteBuffer from 'bytebuffer';
import crypto from "./crypto.js";
import constants from "../constants.js";
import slots from "../time/slots.js";
import options from '../options';

function createStorage(content, secret, secondSecret) {
	const keys = crypto.getKeys(secret);
  let bytes =  null;
  try {
    bytes = crypto.toLocalBuffer(ByteBuffer.fromHex(content))
  } catch (e) {
    throw new Error('Content must be hex format')
  }
  if (!bytes || bytes.length == 0) {
    throw new Error('Invalid content format')
  }

//bignum update   var fee = (Math.floor(bytes.length / 200) + 1) * 0.1 * constants.coin
  const fee = DdnUtils.bignum.multiply((Math.floor(bytes.length / 200) + 1), 0.1, constants.coin);
  
	const transaction = {
		type: 8,
		nethash: options.get('nethash'),
		amount: "0",    //bignum update
		fee: `${fee}`,
		recipientId: null,
		senderPublicKey: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			storage: {
				content
			}
		},
    __assetBytes__: bytes
	};

	crypto.sign(transaction, keys)

	if (secondSecret) {
		const secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys)
	}
  delete transaction.__assetBytes__
	transaction.id = crypto.getId(transaction)
	return transaction
}

export default {
	createStorage
};
