const crypto = require('@ddn/ddn-crypto');

module.exports = {
	account: function (secret, tokenPrefix) {
		if (!tokenPrefix) {
			tokenPrefix = 'D';
		}
		
		const kp = crypto.keypair(secret);
		const address = crypto.generateAddress(Buffer.from(kp.publicKey, 'hex'), tokenPrefix);

		return {
			keypair: kp,
			address: address,
			secret : secret
		}
	},
	
	isValidSecret: crypto.isValidSecret
}
