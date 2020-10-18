/**
 * PeerBlockService 接口
 * wangxm   2019-01-16
 */
import ip from 'ip'

class PeerBlockService {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async post ({ headers, connection, body }) {
    const peerIp = headers['x-forwarded-for'] || connection.remoteAddress
    const peerStr = peerIp
      ? `${peerIp}:${isNaN(parseInt(headers.port)) ? 'unkwnown' : parseInt(headers.port)}`
      : 'unknown'
    if (typeof body.block === 'string') {
      body.block = this.protobuf.decodeBlock(Buffer.from(body.block, 'base64'))
    }
    if (typeof body.votes === 'string') {
      body.votes = this.protobuf.decodeBlockVotes(Buffer.from(body.votes, 'base64'))
    }
    let block
    let votes
    try {
      block = await this.runtime.block.objectNormalize(body.block)
      votes = await this.runtime.consensus.normalizeVotes(body.votes)
    } catch (e) {
      this.logger.error(`normalize block or votes object error: ${e.toString()}`)
      this.logger.error(`Block ${block ? block.id : 'null'} is not valid, ban 60 min`, peerStr)

      if (peerIp && headers.port > 0 && headers.port < 65536) {
        await this.runtime.peer.changeState(ip.toLong(peerIp), parseInt(headers.port), 0, 3600)
      }

      return { success: false, error: e }
    }

    setImmediate(async () => {
      try {
        await this.runtime.block.receiveNewBlock(block, votes)
      } catch (err) {
        this.logger.error(`Process received new block failed: ${err}`)
      }
    })

    return { success: true }
  }
  async get ({ query }) {
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          lastBlockId: {
            type: 'string'
          }
        }
      },
      query
    )
    if (validateErrors) {
      return {
        success: false,
        error: `Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    let limit = 200
    if (query.limit) {
      limit = Math.min(limit, Number(query.limit))
    }

    return new Promise((resolve, reject) => {
      this.sequence.add(async (cb) => {
        try {
          const row = await this.dao.findOne('block', {
            id: query.lastBlockId || null
          }, ['height']);
          const where = {}
          if (query.id) {
            where.id = query.id
          }
          if (query.lastBlockId) {
            where.height = {
              $gt: row ? row.height : '0' // fixme 2020.8.13 height >= 1
            }
					}
				} catch (e) {
          reject(e)
        }
      }, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
			})
    })
  }

  async getCommon (req) {
    const query = req.query

    // query.max = Number(query.max)
    // query.min = Number(query.min)

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          max: {
            type: 'integer'
          },
          min: {
            type: 'integer'
          },
          ids: {
            type: 'string',
            format: 'splitarray'
          }
        },
        required: ['max', 'min', 'ids']
      },
      query
    )
    if (validateErrors) {
      return {
        success: false,
        error: `Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    const max = query.max
    const min = query.min
    const ids = query.ids ? query.ids.split(',') : []
    const escapedIds = ids.map(id => `'${id}'`)

    if (!escapedIds.length) {
      req.headers.port = Number(req.headers.port)
      const validateErrors = await this.ddnSchema.validate(
        {
          type: 'object',
          properties: {
            port: {
              type: 'integer',
              minimum: 1,
              maximum: 65535
            },
            nethash: {
              type: 'string',
              maxLength: 8
            }
          },
          required: ['port', 'nethash']
        },
        req.headers
      )

      const peerIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const peerPort = parseInt(req.headers.port)
      const peerStr = peerIp ? `${peerIp}:${isNaN(peerPort) ? 'unkwnown' : peerPort}` : 'unknown'

      if (!validateErrors && peerIp && !isNaN(peerPort)) {
        this.logger.log('Invalid common block request, ban 60 min', peerStr)
        await this.runtime.peer.changeState(ip.toLong(peerIp), peerPort, 0, 3600)
      }

      return { success: false, error: 'Invalid block id sequence' }
    }

    return new Promise((resolve, reject) => {
      // shuai 2018-12-01
      this.dao.findList(
        'block',
        {
          id: { $in: ids },
          height: { $gte: min, $lte: max }
        },
        ['id', 'timestamp', 'previous_block', 'height'],
        [['height', 'DESC']],
        (err, rows) => {
          if (err) {
            resolve({ success: false, error: 'Database error' })
          }

          const commonBlock = rows.length ? rows[0] : null
          resolve({ success: true, common: commonBlock })
        }
      )
    })
  }
}

export default PeerBlockService
