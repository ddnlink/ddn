var nacl_factory = require('js-nacl');
var crypto = require('crypto-browserify');
var bignum = require('browserify-bignum');
var Mnemonic = require('bitcore-mnemonic');
var nacl = nacl_factory.instantiate();
var EbookcoinJS = require('ebookcoin-js')

var randomString = function (max) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%^&*@";

	for (var i = 0; i < max; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return text;
}

var keypair = function (secret) {
	var hash = crypto.createHash('sha256').update(secret, 'utf8').digest();
	var kp = nacl.crypto_sign_keypair_from_seed(hash);

	var keypair = {
		publicKey: new Buffer(kp.signPk).toString('hex'),
		privateKey: new Buffer(kp.signSk).toString('hex')
	}

	return keypair;
}

var sign = function (keypair, data) {
	var hash = crypto.createHash('sha256').update(data).digest();
	var signature = nacl.crypto_sign_detached(hash, new Buffer(keypair.privateKey, 'hex'));
	return new Buffer(signature).toString('hex');
}

var getId = function (data) {
	var hash = crypto.createHash('sha256').update(data).digest();
	return hash.toString('hex');
}

function generateSecret() {
  return new Mnemonic(Mnemonic.Words.ENGLISH).toString();
}

function isValidSecret(secret) {
	return Mnemonic.isValid(secret);
}

function getAddress(publicKey) {
	return EbookcoinJS.crypto.getAddress(publicKey)
}

module.exports = {
	keypair: keypair,
	sign: sign,
	getId: getId,
	randomString: randomString,
	generateSecret: generateSecret,
	isValidSecret: isValidSecret,
	getAddress: getAddress
}
