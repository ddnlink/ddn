import DdnUtils from '@ddn/utils'

/**
 * BlockService 接口
 * wangxm   2019-03-15
 */
class BlockService {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async get (req) {
    if (this.runtime.state !== DdnUtils.runtimeState.Ready) {
      throw new Error('Blockchain is loading')
    }

    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          minimum: 0,
          maximum: 100
        },
        orderBy: {
          type: 'string'
        },
        offset: {
          type: 'integer',
          minimum: 0
        },
        generatorPublicKey: {
          type: 'string',
          format: 'publicKey'
        },
        totalAmount: {
          type: 'string'
        },
        totalFee: {
          type: 'string'
        },
        reward: {
          type: 'string'
        },
        previousBlock: {
          type: 'string'
        },
        height: {
          type: 'string'
        }
      }
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const where = {}
    if (query.generatorPublicKey) {
      where.generator_public_key = query.generatorPublicKey
    }
    if (query.numberOfTransactions) {
      where.number_of_transactions = query.numberOfTransactions
    }
    if (query.previousBlock) {
      where.previous_block = query.previousBlock
    }
    if (DdnUtils.bignum.isGreaterThanOrEqualTo(query.height, 0)) {
      where.height = query.height
    }
    if (DdnUtils.bignum.isGreaterThanOrEqualTo(query.totalAmount, 0)) {
      where.total_amount = query.totalAmount
    }
    if (DdnUtils.bignum.isGreaterThanOrEqualTo(query.totalFee, 0)) {
      where.total_fee = query.totalFee
    }
    if (DdnUtils.bignum.isGreaterThanOrEqualTo(query.reward, 0)) {
      where.reward = query.reward
    }

    let sorts = null
    if (query.orderBy) {
      sorts = [[]]

      const sortItems = query.orderBy.split(':')

      let sortField = sortItems[0].replace(/[^\w\s]/gi, '')
      sorts[0].push(sortField)

      let sortMethod = 'desc'
      if (sortItems.length === 2) {
        sortMethod = sortItems[1] === 'desc' ? 'desc' : 'asc'
      }
      sorts[0].push(sortMethod)

      sortField = `b.${sortField}`
      const sortFields = ['b.id', 'b.timestamp', 'b.height', 'b.previousBlock', 'b.totalAmount', 'b.totalFee', 'b.reward', 'b.numberOfTransactions', 'b.generatorPublicKey']
      if (!sortFields.includes(sortField)) {
        throw new Error('Invalid sort field')
      }
    }

    const offset = query.offset
    const limit = query.limit

    return new Promise((resolve, reject) => {
      this.dbSequence.add(async (cb) => {
        try {
          const result = await this.runtime.block.queryBlockData(where, sorts, offset, limit, true)
          cb(null, result)
        } catch (e) {
          cb(e)
        }
      }, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(Object.assign({ success: true }, result))
        }
      })
    })
  }

  async getGet (req) {
    if (this.runtime.state !== DdnUtils.runtimeState.Ready) {
      throw new Error('Blockchain is loading')
    }

    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        id: {
          type: 'string',
          minLength: 1
        },
        height: {
          type: 'string',
          minLength: 1
        },
        hash: {
          type: 'string',
          minLength: 1
        }
      }
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const block = await this.runtime.block.querySimpleBlockData(query)

    return {
      success: true,
      block
    }
  }

  async getFull (req) {
    if (this.runtime.state !== DdnUtils.runtimeState.Ready) {
      throw new Error('Blockchain is loading')
    }

    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        id: {
          type: 'string',
          minLength: 1
        },
        height: {
          type: 'string',
          minimum: 1
        }
      }
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const blocksData = await this.runtime.dataquery.queryFullBlockData(query, 1, 0, null)
    if (blocksData && blocksData.length) {
      const blocks = await this.runtime.block._parseObjectFromFullBlocksData(blocksData)
      return {
        success: true,
        block: blocks[0]
      }
    } else {
      throw new Error('Block not found')
    }
  }

  async getGetFee (req) {
    if (this.runtime.state !== DdnUtils.runtimeState.Ready) {
      throw new Error('Blockchain is loading')
    }

    const fee = await this.runtime.block.calculateFee()
    return { success: true, fee }
  }

  async getGetMilestone (req) {
    if (this.runtime.state !== DdnUtils.runtimeState.Ready) {
      throw new Error('Blockchain is loading')
    }

    const height = this.runtime.block.getLastBlock().height
    const milestone = this.runtime.block.getBlockStatus().calcMilestone(height)
    return { success: true, milestone }
  }

  async getGetReward (req) {
    if (this.runtime.state !== DdnUtils.runtimeState.Ready) {
      throw new Error('Blockchain is loading')
    }

    const height = this.runtime.block.getLastBlock().height
    const reward = this.runtime.block.getBlockStatus().calcReward(height)
    return { success: true, reward }
  }

  async getGetSupply (req) {
    if (this.runtime.state !== DdnUtils.runtimeState.Ready) {
      throw new Error('Blockchain is loading')
    }

    const height = this.runtime.block.getLastBlock().height
    const supply = this.runtime.block.getBlockStatus().calcSupply(height)
    return { success: true, supply }
  }

  async getGetHeight (req) {
    if (this.runtime.state !== DdnUtils.runtimeState.Ready) {
      throw new Error('Blockchain is loading')
    }

    const lastBlock = this.runtime.block.getLastBlock()
    return {
      success: true,
      height: lastBlock && lastBlock.height ? lastBlock.height : 0
    }
  }

  async getGetStatus (req) {
    if (this.runtime.state !== DdnUtils.runtimeState.Ready) {
      throw new Error('Blockchain is loading')
    }

    const lastBlock = this.runtime.block.getLastBlock()
    const height = lastBlock.height

    return {
      success: true,
      height, // DdnUtils.bignum update
      fee: await this.runtime.block.calculateFee(),
      milestone: this.runtime.block.getBlockStatus().calcMilestone(height),
      reward: `${this.runtime.block.getBlockStatus().calcReward(height)}`, // DdnUtils.bignum update
      supply: this.runtime.block.getBlockStatus().calcSupply(height)
    }
  }
}

export default BlockService
