var ByteBuffer = require('bytebuffer')
var crypto = require("./crypto.js")
var constants = require("../constants.js")
var slots = require("../time/slots.js")
var options = require('../options')
var trsTypes = require('../transaction-types');
var bignum = require('bignum-utils');

function getClientFixedTime() {
  return slots.getTime() - options.get('clientDriftSeconds')
}

function createTransaction(asset, fee, type, recipientId, message, secret, secondSecret) {
  var keys = crypto.getKeys(secret)

  var transaction = {
    type: type,
    nethash: options.get('nethash'),
    amount: "0",
    fee: fee + "",
    recipient_id: recipientId,
    sender_public_key: keys.public_key,
    timestamp: getClientFixedTime(),
    message: message,
    asset: asset
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
  createIssuer: function (name, desc, secret, secondSecret) {
    var asset = {
      aobIssuer: {
        name: name,
        desc: desc
      }
    }
    //var fee = (100 + (Math.floor(bytes.length / 200) + 1) * 0.1) * constants.coin
    var fee = bignum.multiply(100, constants.coin);
    return createTransaction(asset, fee, trsTypes.AOB_ISSUER, null, null, secret, secondSecret)
  },

  createAsset: function (name, desc, maximum, precision, strategy, allowWriteoff, allowWhitelist, allowBlacklist, secret, secondSecret) {
    var asset = {
      aobAsset: {
        name: name,
        desc: desc,
        maximum: maximum,
        precision: precision,
        strategy: strategy,
        allow_blacklist: allowBlacklist,
        allow_whitelist: allowWhitelist,
        allow_writeoff: allowWriteoff
      }
    }
    // var fee = (500 + (Math.floor(bytes.length / 200) + 1) * 0.1) * constants.coin
    var fee = bignum.multiply(500, constants.coin);
    return createTransaction(asset, fee, trsTypes.AOB_ASSET, null, null, secret, secondSecret)
  },

  createFlags: function (currency, flagType, flag, secret, secondSecret) {
    var asset = {
      aobFlags: {
        currency: currency,
        flag_type: flagType,
        flag: flag
      }
    }
    var fee = bignum.multiply(0.1, constants.coin);
    return createTransaction(asset, fee, trsTypes.AOB_FLAGS, null, null, secret, secondSecret)
  },

  createAcl: function (currency, operator, flag, list, secret, secondSecret) {
    var asset = {
      aobAcl: {
        currency: currency,
        operator: operator,
        flag: flag,
        list: list
      }
    }
    var fee = bignum.multiply(0.2, constants.coin);
    return createTransaction(asset, fee, trsTypes.AOB_ACL, null, null, secret, secondSecret)
  },

  createIssue: function (currency, amount, secret, secondSecret) {
    var asset = {
      aobIssue: {
        currency: currency,
        amount: amount  + ""
      }
    }
    var fee = bignum.multiply(0.1, constants.coin);
    return createTransaction(asset, fee, trsTypes.AOB_ISSUE, null, null, secret, secondSecret)
  },

  createTransfer: function (currency, amount, recipientId, message, secret, secondSecret) {
    var asset = {
      aobTransfer: {
        currency: currency,
        amount: amount + ""
      }
    }
    var fee = bignum.multiply(0.1, constants.coin);
    return createTransaction(asset, fee, trsTypes.AOB_TRANSFER, recipientId, message, secret, secondSecret)
  },
}
