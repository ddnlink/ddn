class Socketio {
  constructor (context, httpio, httpsio) {
    Object.assign(this, context)
    this._context = context

    this._http_io = httpio
    this._https_io = httpsio
  }

  async emit (event, params) {
    let result = await this.httpsEmit(event, params)
    if (!result) {
      result = await this.httpEmit(event, params)
    }

    return result
  }

  async httpEmit (event, params) {
    if (this._http_io && this._http_io.sockets) {
      this._http_io.sockets.emit(event, params)
      return true
    }
    return false
  }

  async httpsEmit (event, params) {
    if (this._https_io && this._https_io.sockets) {
      this._https_io.sockets.emit(event, params)
      return true
    }
    return false
  }
}

export default Socketio
