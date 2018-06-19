var crypto = require('../lib/crypto.js');

module.exports = {
	account: function (secret, tokenPrefix) {
		if (!tokenPrefix) {
			tokenPrefix = 'D';
		}
		
		var kp = crypto.keypair(secret);
		var address = crypto.getAddress(new Buffer(kp.publicKey, 'hex'), tokenPrefix);

		return {
			keypair: kp,
			address: address,
			secret : secret
		}
	},
	
	isValidSecret: crypto.isValidSecret
}
