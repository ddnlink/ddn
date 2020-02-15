import crypto from '@ddn/crypto';

export default {
	account(secret, tokenPrefix) {
		if (!tokenPrefix) {
			tokenPrefix = 'D';
		}
		
		const kp = crypto.keypair(secret);
		const address = crypto.generateAddress(Buffer.from(kp.publicKey, 'hex'), tokenPrefix);

		return {
			keypair: kp,
			address,
			secret
		};
	},
	
	isValidSecret: crypto.isValidSecret
};
