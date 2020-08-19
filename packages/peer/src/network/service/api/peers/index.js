/* eslint-disable no-prototype-builtins */
import ip from 'ip'

/**
 * RootRouter接口
 * wangxm   2019-03-21
 */
class RootRouter {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async queryPeers (filter) {
    const sortFields = ['ip', 'port', 'state', 'os', 'version']
    let sortMethod = ''
    let sortBy = ''
    const limit = filter.limit || null
    const offset = filter.offset || null

    const where = {}
    if (filter.hasOwnProperty('state') && filter.state !== null) {
      where.state = filter.state
    }
    if (filter.hasOwnProperty('os') && filter.os !== null) {
      where.os = filter.os
    }
    if (filter.hasOwnProperty('version') && filter.version !== null) {
      where.version = filter.version
    }
    if (filter.hasOwnProperty('ip') && filter.ip !== null) {
      where.ip = filter.ip
    }
    if (filter.hasOwnProperty('port') && filter.port !== null) {
      where.port = filter.port
    }
    if (filter.hasOwnProperty('orderBy')) {
      const sort = filter.orderBy.split(':')
      sortBy = sort[0].replace(/[^\w\s]/gi, '')
      if (sort.length === 2) {
        sortMethod = sort[1] === 'desc' ? 'desc' : 'asc'
      } else {
        sortMethod = 'desc'
      }
    }

    if (sortBy) {
      if (!sortFields.includes(sortBy)) {
        throw new Error('Invalid sort field')
      }
    }

    if (limit !== null) {
      if (limit > 100) {
        throw new Error('Invalid limit. Maximum is 100')
      }
    }

    return new Promise((resolve, reject) => {
      this.dao.findPage('peer', where, limit, offset, true,
        ['ip', 'port', 'state', 'os', 'version'], sortBy ? [
          [sortBy, sortMethod]
        ] : null,
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        })
    })
  }

  async get (req) {
    const query = Object.assign({}, req.body, req.query)
    // query.limit = Number(query.limit || 10)
    // query.offset = Number(query.offset || 0)

    // if (typeof query.state !== 'undefined') {
    //   query.state = Number(query.state)
    // }

    // if (typeof query.port !== 'undefined') {
    //   query.port = Number(query.port)
    // }

    const validateErrors = await this.ddnSchema.validatePeers(query)
    if (validateErrors) {
      throw new Error(`Invalid parameters 1: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    try {
      const peers = await this.queryPeers(query)
      for (let i = 0; i < peers.rows.length; i++) {
        peers.rows[i].ip = ip.fromLong(peers.rows[i].ip)
      }

      return {
        success: true,
        peers: peers.rows,
        totalCount: peers.total
      }
    } catch (err) {
      return {
        success: false,
        error: err
      }
    }
  }

  async getGet (req) {
    const query = Object.assign({}, req.body, req.query)
    // query.port = Number(query.port)

    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        ip: {
          type: 'string',
          minLength: 1
        },
        port: {
          type: 'integer',
          minimum: 0,
          maximum: 65535
        }
      },
      required: ['ip', 'port']
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    try {
      const peers = await this.queryPeers({
        ip: query.ip,
        port: query.port
      })

      const peer = peers.rows && peers.rows.length ? peers.rows[0] : null
      if (peer) {
        peer.ip = ip.fromLong(peer.ip)
      }
      return {
        success: true,
        peer: peer || {}
      }
    } catch (err) {
      return {
        success: false,
        error: err
      }
    }
  }

  /**
     * GET /peers/version
     *
     * 该接口已经修改，原来返回值：
     * {
     *     version: this.config.version,
     *     build: this.config.buildVersion,
     *     net: this.config.net
     * }
     * @param {*} req 需要提供 nethash 参数
     */
  async getVersion (req) {
    return {
      success: true,
      version: {
        version: this.config.version,
        build: this.config.buildVersion,
        net: this.config.net
      }
    }
  }
}

export default RootRouter
