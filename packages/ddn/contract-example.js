
let self = null
// eslint-disable-next-line no-unused-vars
let library = null
let modules = null

class ExampleContract {
  constructor (cb, _library) {
    self = this
    library = _library
    cb(null, self)
  }

  create (data, trs) {
    return trs
  }

  calculateFee (trs) {
    return 0
  }

  verify (trs, sender, cb, scope) {
    setImmediate(cb, null, trs)
  }

  getBytes (trs) {
    return null
  }

  apply (trs, sender, cb, scope) {
    setImmediate(cb)
  }

  undo (trs, sender, cb, scope) {
    setImmediate(cb)
  }

  applyUnconfirmed (trs, sender, cb, scope) {
    setImmediate(cb)
  }

  undoUnconfirmed (trs, sender, cb, scope) {
    setImmediate(cb)
  }

  ready (trs, sender, cb, scope) {
    setImmediate(cb)
  }

  // todo: delete it 
  save (trs, cb) {
    setImmediate(cb)
  }

  dbRead (row) {
    return null
  }

  // todo: delete it 
  normalize (asset, cb) {
    setImmediate(cb)
  }
}

export default ExampleContract
