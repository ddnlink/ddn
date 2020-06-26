import request from 'request'
import config from '../config'

function resultHandler (cb) {
  return (err, res, body) => {
    if (err) {
      cb(`Request error: ${err}`)
    } else if (res.statusCode !== 200) {
      let msg = `Unexpected status code: ${res.statusCode}`
      if (body.error) {
        msg += ', '
        msg += body.error
      }
      cb(msg)
    } else {
      if (!body.success) {
        cb(`Server error: ${body.error || body.message}`)
      } else {
        cb(null, body)
      }
    }
  }
}

class Api {
  constructor (options) {
    this.options = options || {}
    this.mainnet = this.options.mainnet
    this.host = this.options.host || '127.0.0.1'
    this.port = this.options.port || (this.mainnet ? 8000 : 8001)
    this.baseUrl = `http://${this.host}:${this.port}`
    this.nethash = config.nethash
  }

  get (path, params, cb) {
    let qs = null
    if (typeof params === 'function') {
      cb = params
    } else {
      qs = params
    }
    request({
      method: 'GET',
      url: this.baseUrl + path,
      json: true,
      qs
    }, resultHandler(cb))
  }

  put (path, data, cb) {
    request({
      method: 'PUT',
      url: this.baseUrl + path,
      json: data
    }, resultHandler(cb))
  }

  post (path, data, cb) {
    request({
      method: 'POST',
      url: this.baseUrl + path,
      json: data
    }, resultHandler(cb))
  }

  broadcastTransaction (trs, cb) {
    request({
      method: 'POST',
      url: `${this.baseUrl}/peer/transactions`,
      headers: {
        nethash: this.nethash,
        version: ''
      },
      json: {
        transaction: trs
      }
    }, resultHandler(cb))
  }
}

export default Api
