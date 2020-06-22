export default {

  name: 'splitarray',

  validate (str) {
    try {
      const a = str.split(',')
      if (a.length > 0 && a.length <= 1000) {
        return true
      } else {
        return false
      }
    } catch (e) {
      return false
    }
  }

}
