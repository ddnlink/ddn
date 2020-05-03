import crypto from '../utils/crypto';
import constants from "../constants";
import slots from "../time/slots";
import options from '../options';

function createDomain(name, address, secret, secondSecret) {
	const keys = crypto.getKeys(secret);

  if (!name || name.length == 0) {
    throw new Error('Invalid name format')
  }
  if (!address || address.length == 0) {
    throw new Error('Invalid name format')
  }
  const fee = constants.net.fees.domain;
  
	const transaction = {
		type: 18,
		nethash: options.get('nethash'),
		amount: "0",    //Bignum update
		fee: `${fee}`,
		recipientId: null,
		senderPublicKey: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			domain: {
				name,
				address
			}
		},
	};

	crypto.sign(transaction, keys)

	if (secondSecret) {
		const secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys)
	}
	// transaction.id = crypto.getId(transaction)
	return transaction
}

export default {
	createDomain
};
