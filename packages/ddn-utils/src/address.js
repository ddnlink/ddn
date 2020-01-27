const ddnCrypto = require('@ddn/ddn-crypto');
const constants = require('./constants');

const address = {
  isAddress: (address) => {
    return ddnCrypto.isAddress(address, constants.tokenPrefix)
  },

  generateBase58CheckAddress(publicKey) {
    return ddnCrypto.getAddress(publicKey, constants.tokenPrefix)
  },
}

module.exports = address;