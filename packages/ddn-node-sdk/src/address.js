var sha256 = require('fast-sha256')
var RIPEMD160 = require('ripemd160')
var base58check = require('./base58check')
var options = require('./options');
var constants = require('./constants');

module.exports = {
  isAddress: function (address) {
    const NORMAL_PREFIX = constants.nethash[options.get('nethash')].tokenPrefix // D
    if (typeof address !== 'string') {
      return false
    }
    if (!/^[0-9]{1,20}$/g.test(address)) {
      if (!base58check.decodeUnsafe(address.slice(1))) {
        return false
      }
      if ([NORMAL_PREFIX].indexOf(address[0]) == -1) {
        return false
      }
    }
    return true
  },

  isBase58CheckAddress: function (address) {
    const NORMAL_PREFIX = constants.nethash[options.get('nethash')].tokenPrefix // D
    if (typeof address !== 'string') {
      return false
    }
    if (!base58check.decodeUnsafe(address.slice(1))) {
      return false
    }
    if ([NORMAL_PREFIX].indexOf(address[0]) == -1) {
      return false
    }
    return true
  },

  generateBase58CheckAddress: function (publicKey) {
    const NORMAL_PREFIX = constants.nethash[options.get('nethash')].tokenPrefix // D
    if (typeof publicKey === 'string') {
      publicKey = Buffer.from(publicKey, 'hex')
    }
    var h1 = sha256.hash(publicKey)
    var h2 = new RIPEMD160().update(Buffer.from(h1)).digest()
    return NORMAL_PREFIX + base58check.encode(h2)
  },
}