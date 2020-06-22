export default {

  name: 'listQuery',

  validate (obj) {
    obj.limit = 100
    return true
  }

}
