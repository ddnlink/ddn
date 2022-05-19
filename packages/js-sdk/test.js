const DdnJS = require('./lib').default
const keyPair = DdnJS.crypto.getKeys('idea goddess air mad cruel purity peasant ocean fly mammal spare space')
const curAddress = DdnJS.crypto.generateAddress(keyPair.publicKey, 'D')
const keyStore = {
  address: curAddress,
  publicKey: keyPair.publicKey
}
console.log(keyStore, DdnJS.constants)
