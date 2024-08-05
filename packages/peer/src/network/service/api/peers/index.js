/* eslint-disable no-prototype-builtins */

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
    return this._context.runtime.peer.p2p.inventory.getAllPeers()
  }

  async get (req) {
    try {
      const peers = this._context.runtime.peer.p2p.inventory.getAllPeers()

      return {
        success: true,
        peers: peers,
        totalCount: peers.length
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

    const validateErrors = await this.ddnSchema.validate(
      {
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
      },
      query
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    try {
      const peers = this._context.runtime.peer.p2p.inventory.getAllPeers()

      const peer = peers.find(item => item.ip === query.ip && item.port === query.port)

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
