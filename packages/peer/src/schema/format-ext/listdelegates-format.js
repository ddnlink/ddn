export default {

  name: 'listDelegates',

  validate (obj) {
    obj.limit = 101
    return true
  }

}
