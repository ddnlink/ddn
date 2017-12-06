var crypto = require('../lib/crypto.js');

module.exports = {
	account: function (secret) {
		var kp = crypto.keypair(secret);
		var address = crypto.getAddress(new Buffer(kp.publicKey, 'hex'));

		return {
			keypair: kp,
			address: address,
			secret : secret
		}
	},
	
	isValidSecret: crypto.isValidSecret
}
