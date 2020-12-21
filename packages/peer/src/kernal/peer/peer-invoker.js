/**
 * PeerInvoker
 * wangxm   2019-01-14
 */
import ip from 'ip'
import os from 'os'
import http from 'http'
import request from 'request'
import extend from 'extend'

let _singleton

class PeerInvoker {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new PeerInvoker(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context

    this._headers = {
      os: os.platform() + os.release(),
      version: this.config.version,
      port: this.config.port,
      nethash: this.config.nethash
    }
  }

  async invoke (args, dappId, allowSelf) {
    let peer = args.peer
    if (!peer) {
      peer = await this.runtime.peer.getRandomPeer(dappId, allowSelf)
    }
    // 本地节点？
    if (!peer) {
      return false
    }

    let url
    if (args.api) {
      url = `/peer${args.api}`
    } else if (args.path) {
      url = `${args.path}`
    } else {
      url = args.url
    }
    if (peer.address) {
      url = `http://${peer.address}${url}`
    } else if (peer.host) {
      url = `http://${peer.host}:${peer.port}${url}`
    } else {
      url = `http://${ip.fromLong(peer.ip)}:${peer.port}${url}`
    }

    const req = {
      url,
      method: args.method || 'GET',
      json: true,
      headers: extend({}, this._headers, args.headers),
      timeout: this.config.peers.options.timeout,
      forever: true,
      agent: new http.Agent({ keepAlive: true })
    }
    if ((args.data !== null && typeof args.data === 'object') || Array.isArray(args.data)) {
      req.json = args.data
    } else {
      req.body = args.data
    }

    return new Promise((resolve, reject) => {
      request(req, async (err, res, body) => {
        if (err || res.statusCode !== 200) {
          this.logger.debug('Request', {
            url: req.url,
            statusCode: res ? res.statusCode : 'unknown',
            err: err || res.body.error
          })

          if (err && (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT' || err.code === 'ECONNREFUSED')) {
            await this.runtime.peer.remove(peer.ip, peer.port)
            this.logger.info(`Removing peer ${req.method} ${req.url}`)
          } else {
            if (!args.not_ban) {
              await this.runtime.peer.changeState(peer.ip, peer.port, 0, 600)
              this.logger.info(`Ban 10 min ${req.method} ${req.url}`)
            }
          }

          reject(err || `Request peer api failed: ${url}`)
        } else {
          res.headers.port = parseInt(res.headers.port)
          const validateErrors = await this.ddnSchema.validate(
            {
              type: 'object',
              properties: {
                os: {
                  type: 'string',
                  maxLength: 64
                },
                port: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 65535
                },
                nethash: {
                  type: 'string',
                  maxLength: 8
                },
                version: {
                  type: 'string',
                  maxLength: 11
                }
              },
              required: ['port', 'nethash', 'version']
            },
            res.headers
          )
          if (validateErrors) {
            reject(
              err || `Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message} url: ${url}`
            )
          }

          const port = res.headers.port
          const version = res.headers.version

          if (port > 0 && port <= 65535 && version === this.config.version) {
            await this.runtime.peer.update({
              ip: peer.ip,
              port,
              state: 2,
              os: res.headers.os,
              version
            })
          } else if (!this.runtime.peer.isCompatible(version)) {
            this.logger.debug(`Remove uncompatible peer ${peer.ip}`, version)
            await this.runtime.peer.remove(peer.ip, port)
          }

          resolve({ body, peer })
        }
      })
    })
  }
}

export default PeerInvoker
