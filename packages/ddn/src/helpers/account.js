import DdnCrypto from '@ddn/crypto'

export default {
  account (secret, tokenPrefix) {
    if (!tokenPrefix) {
      tokenPrefix = 'D'
    }

    const kp = DdnCrypto.getKeys(secret)
    const address = DdnCrypto.generateAddress(Buffer.from(kp.publicKey, 'hex'), tokenPrefix)

    return {
      keypair: kp,
      address,
      secret
    }
  },

  isValidSecret: DdnCrypto.isValidSecret
}
