var request = require('request');
var config = require('../config')

function resultHandler(cb) {
  return function (err, resp, body) {
    if (err) {
      cb("Request error: " + err);
    } else if (resp.statusCode != 200) {
      var msg = "Unexpected status code: " + resp.statusCode;
      if (body.error) {
        msg += ", ";
        msg += body.error;
      }
      cb(msg);
    } else {
      if (!body.success) {
        cb("Server error: " + (body.error || body.message));
      } else {
        cb(null, body);
      }
    }
  }
}

function Api(options) {
  this.options = options || {};
  this.mainnet = this.options.mainnet;
  this.host = this.options.host || "127.0.0.1";
  this.port = this.options.port || (this.mainnet ? 8000 : 8001);
  this.baseUrl = "http://" + this.host + ":" + this.port;
  this.nethash = config.nethash;
}

Api.prototype.get = function (path, params, cb) {
  var qs = null;
  if (typeof params === 'function') {
    cb = params;
  } else {
    qs = params;
  }
  request({
    method: "GET",
    url: this.baseUrl + path,
    json: true,
    qs: qs
  }, resultHandler(cb));
}

Api.prototype.put = function (path, data, cb) {
  request({
    method: "PUT",
    url: this.baseUrl + path,
    json: data
  }, resultHandler(cb));
}

Api.prototype.post = function (path, data, cb) {
  request({
    method: "POST",
    url: this.baseUrl + path,
    json: data
  }, resultHandler(cb));
}

Api.prototype.broadcastTransaction = function (trs, cb) {
  request({
    method: "POST",
    url: this.baseUrl + "/peer/transactions",
    headers: {
      nethash: this.nethash,
      version: ""
    },
    json: {
      transaction: trs
    }
  }, resultHandler(cb));
}

module.exports = Api;
