export default {
  name: 'signature',

  validate (str) {
    console.log('signature validate...........', str )
    // 允许空
    if (str.length === 0) {
      return true
    }

    try {
      const signature = Buffer.from(str, 'hex')
      console.log('signature.length...........', signature.length, 'signature', signature.toString('hex') )
      return signature.length === 64
    } catch (e) {
      return false
    }
  }
}
