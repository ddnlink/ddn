export default {
  name: 'publicKey',

  validate (str) {
    // 允许空
    if (str.length === 0) {
      return true
    }

    try {
      const publicKey = Buffer.from(str, 'hex')
      return publicKey.length === 32 || publicKey.length === 65 // 32为氯化钠，65为国密sm2
    } catch (e) {
      return false
    }
  }
}
