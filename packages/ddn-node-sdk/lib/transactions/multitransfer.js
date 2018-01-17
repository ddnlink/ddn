var ByteBuffer = require('bytebuffer')
var crypto = require("./crypto.js")
var constants = require("../constants.js")
var slots = require("../time/slots.js")
var options = require('../options')
var addressHelper = require('../address.js')

function createMultiTransfer(outputs, secret, secondSecret) {
	var keys = crypto.getKeys(secret)
  var bytes =  null

  if (!outputs || outputs.length == 0) {
    throw new Error('Invalid fileHash format')
  }
  var fee = constants.fees.multitransfer
  var amount = 0
  var recipientId = []    
  for(var i = 0; i < outputs.length; i++) {
	var output = outputs[i]
	if (!output.recipientId || !output.amount) {
	  return cb("output recipient or amount null");        
	}

	if (!addressHelper.isAddress(output.recipientId)) {
	  return cb("Invalid output recipient");
	}

	if (output.amount <= 0) {
	  return cb("Invalid output amount");
	}

	if (output.recipientId == sender.address) {
	  return cb("Invalid output recipientId, cannot be your self");
	}

	amount += output.amount
	recipientId.push(output.recipientId)      
  }  

	var transaction = {
		type: 16,
		nethash: options.get('nethash'),
		amount: amount,
		fee: fee,
		recipientId: recipientId.join('|'),
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			output: {
				outputs: outputs
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
	createMultiTransfer : createMultiTransfer
}
