import * as DdnCrypto from '@ddn/crypto'

class Address {
  constructor (tokenPrefix) {
    this.tokenPrefix = tokenPrefix
  }

  isAddress (address) {
    return DdnCrypto.isAddress(address, this.tokenPrefix)
  }

  // fixme: 将所有 generateBase58CheckAddress -> generateAddress
  generateAddress (publicKey) {
    return DdnCrypto.generateAddress(publicKey, this.tokenPrefix)
  }

  generateBase58CheckAddress (publicKey) {
    return this.generateAddress(publicKey)
  }
}

export default Address
