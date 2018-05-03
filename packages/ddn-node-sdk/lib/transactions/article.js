var ByteBuffer = require('bytebuffer')
var crypto = require("./crypto.js")
var constants = require("../constants.js")
var slots = require("../time/slots.js")
var options = require('../options')

function createArticle(fileHash, fileName, title, description, secret, secondSecret) {
  var keys = crypto.getKeys(secret)
  var bytes =  null

  if (!fileHash || fileHash.length == 0) {
    throw new Error('Invalid fileHash format')
  }
  var fee = constants.fees.article
  
	var transaction = {
		type: 15,
		nethash: options.get('nethash'),
		amount: 0,
		fee: fee,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			article: {
				fileHash: fileHash,
				title: title,
				description: description,
				fileName: fileName,
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
	createArticle : createArticle
}
