var ByteBuffer = require('bytebuffer')
var crypto = require("./crypto.js")
var constants = require("../constants.js")
var slots = require("../time/slots.js")
var options = require('../options')

function createDomain(name, address, secret, secondSecret) {
	var keys = crypto.getKeys(secret)
  var bytes =  null

  if (!name || name.length == 0) {
    throw new Error('Invalid name format')
  }
  if (!address || address.length == 0) {
    throw new Error('Invalid name format')
  }
  var fee = constants.fees.domain
  
	var transaction = {
		type: 18,
		nethash: options.get('nethash'),
		amount: 0,
		fee: fee,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			domain: {
				name: name,
				address: address
			}
		},
	}

	crypto.sign(transaction, keys)

	if (secondSecret) {
		var secondKeys = crypto.getKeys(secondSecret)
		crypto.secondSign(transaction, secondKeys)
	}
	transaction.id = crypto.getId(transaction)
	return transaction
}

module.exports = {
	createDomain : createDomain
}
