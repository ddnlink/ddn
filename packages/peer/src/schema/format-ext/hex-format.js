export default {

  name: 'hex',

  validate (str) {
    let b = null
    try {
      b = Buffer.from(str, 'hex')
    } catch (e) {
      return false
    }

    return b && b.length > 0
  }

}
