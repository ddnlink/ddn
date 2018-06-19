var sha256 = require('fast-sha256');
var RIPEMD160 = require('ripemd160');
var nacl_factory = require('js-nacl');
var crypto = require('crypto-browserify');
var bignum = require('browserify-bignum');
var Mnemonic = require('bitcore-mnemonic');
var nacl = nacl_factory.instantiate();
var base58check = require('./base58check')

function randomName() {
	// Convert arguments to Array
	var array = Array.prototype.slice.apply(arguments);

	var size = 16;
	if (array.length > 2) {
		size = array.shift();
	}

	var name = array[0];
	var random = array[1];

	if (name.length > 0) {
		size = size - 1
	}

	for (var i = 0; i < size; i++) {
		name += random.charAt(Math.floor(Math.random() * random.length));
	}

	return name;
}

var randomNethash = function() {
	return randomName(8, '', 'abcdefghijklmnopqrstuvwxyz0123456789');
}

var randomString = function (max) {
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%^&*@";
	return randomName(max, '', possible);
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

function getAddress(publicKey, tokenPrefix) {
    if (typeof publicKey === 'string') {
      publicKey = Buffer.from(publicKey, 'hex')
    }
    var h1 = sha256.hash(publicKey)
    var h2 = new RIPEMD160().update(Buffer.from(h1)).digest()
    return tokenPrefix + base58check.encode(h2)
}

module.exports = {
	keypair: keypair,
	sign: sign,
	getId: getId,
	randomString: randomString,
	randomNethash: randomNethash,
	generateSecret: generateSecret,
	isValidSecret: isValidSecret,
	getAddress: getAddress
}
