var ByteBuffer = require('bytebuffer')
var crypto = require("./crypto.js")
var constants = require("../constants.js")
var slots = require("../time/slots.js")
var options = require('../options')
var bignum = require('bignum-utils');

function createStorage(content, secret, secondSecret) {
	var keys = crypto.getKeys(secret)
  var bytes =  null
  try {
    bytes = crypto.toLocalBuffer(ByteBuffer.fromHex(content))
  } catch (e) {
    throw new Error('Content must be hex format')
  }
  if (!bytes || bytes.length == 0) {
    throw new Error('Invalid content format')
  }

//bignum update   var fee = (Math.floor(bytes.length / 200) + 1) * 0.1 * constants.coin
  var fee = bignum.multiply((Math.floor(bytes.length / 200) + 1), 0.1, constants.coin);
  
	var transaction = {
		type: 8,
		nethash: options.get('nethash'),
		amount: "0",    //bignum update
		fee: fee + "",
		recipientId: null,
		senderPublicKey: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			storage: {
				content: content
			}
		},
    __assetBytes__: bytes
	}

	crypto.sign(transaction, keys)

	if (secondSecret) {
		var secondKeys = crypto.getKeys(secondSecret)
		crypto.secondSign(transaction, secondKeys)
	}
  delete transaction.__assetBytes__
	transaction.id = crypto.getId(transaction)
	return transaction
}

module.exports = {
	createStorage : createStorage
}
