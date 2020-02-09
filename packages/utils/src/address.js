import ddnCrypto from '@ddn/crypto';
import constants from './constants';

const address = {
  isAddress: (address) => {
    return ddnCrypto.isAddress(address, constants.tokenPrefix)
  },

  generateBase58CheckAddress(publicKey) {
    return ddnCrypto.generateAddress(publicKey, constants.tokenPrefix)
  },
}

export default address;