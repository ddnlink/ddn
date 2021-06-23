import assert from 'assert'
import DdnUtils from '@ddn/utils'

// due to contract sandbox always return json object
function convertBigintMemberToString (obj) {
  if (typeof obj !== 'object' || obj === null) return

  Object.keys(obj).forEach(key => {
    const value = obj[key]
    const type = typeof value
    if (type === 'bigint') {
      obj[key] = String(value)
    } else if (type === 'object') {
      convertBigintMemberToString(value)
    }
  })
}

function convertResult (result) {
  convertBigintMemberToString(result)
  const { gas = 0, error, stateChangesHash, transaction_id, contract_id, data } = result
  return { gas, error, stateChangesHash, transaction_id, data, contract_id, success: !!result.success }
}

async function attachTransactions (results, dao) {
  const where = results.length === 1 ? { id: results[0].transaction_id } : { id: { $in: results.map(r => r.transaction_id) } }

  const transactions = await dao.findList('tr', { where })
  const transMap = new Map()
  transactions.forEach(t => transMap.set(t.id, t))

  results.forEach(r => (r.transaction = transMap.get(r.transaction_id)))
  return results
}

/**
 * ContractService smart contract interface
 *
 */
class ContractService {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  /**
   *
   * @param {*} req { id, name, owner, orderBy = id ASC, limit = 20, offset = 0 }
   * @returns
   */
  async get (req) {
    if (this.runtime.state !== DdnUtils.runtimeState.Ready) {
      throw new Error('Blockchain is loading')
    }

    const query = { ...req.query }
    // query.offset = Number(query.offset || 0)
    // query.limit = Number(query.limit || 100)

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 0,
            maximum: 100
          },
          offset: {
            type: 'integer',
            minimum: 0
          },
          orderBy: {
            type: 'string'
          },
          id: {
            type: 'string'
          },
          name: {
            type: 'string'
          },
          owner: {
            type: 'string'
          }
        }
      },
      query
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const where = {}
    if (query.id) {
      where.id = query.id
    }
    if (query.name) {
      where.name = query.name
    }
    if (query.owner) {
      where.owner = query.owner
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
      const sortFields = ['b.id', 'b.name', 'b.transactionId', 'b.owner', 'b.code', 'b.vmVersion', 'b.timestamp']
      if (!sortFields.includes(sortField)) {
        throw new Error('Invalid sort field')
      }
    }

    const offset = query.offset
    const limit = query.limit
    // const attributes = ['id', 'name', 'owner', 'transaction_id', 'gas_limit', 'timestamp', 'version', 'desc']

    const result = await this.dao.findPage('contract', { where, order: sorts, offset, limit })
    return { success: true, rows: result.rows, totalCount: result.total }
  }

  /**
   * Get contract details
   * @param id  contract id
   * @returns contract detail { contract : { id, name, transactionId, id, owner, vmVersion,
   * desc, timestamp, metadata } }
   */
  async getGet (req) {
    const contract = await this.dao.findOneByPrimaryKey('contract', req.params.id)
    return { success: true, contract }
  }

  /**
   * Get contract metadata
   * @param id  contract id
   * @returns contract metadata
   * '/metadata'
   */
  async getMetadata (req) {
    const { metadata } = await this.dao.findOneByPrimaryKey('contract', req.params.id, { attributes: ['id', 'metadata'] })
    return { success: true, metadata }
  }

  /**
   * Get contract code
   * @param id  contract id
   * @returns contract code
   * '/code'
   */
  async getCode (req) {
    const { code } = await this.dao.findOneByPrimaryKey('contract', req.params.id, { attributes: ['id', 'code'] })
    return { success: true, code }
  }

  /**
   * Query contract tansfer record, query: limit={limit}&offset={offset}
   * @param id contract id
   * @param limit max items count to return, default = 20
   * @param offset return items offset, default = 0
   * @returns query result { count, transfer: [{ transactionId, contractId, success, gas, error, stateChangesHash, transaction }...] }
   * '/results'
   */
  async getTransfers (req) {
    const { params, query } = req
    const senderId = query.senderId || params.senderId
    const recipientId = query.recipientId || params.recipientId
    const where = {}
    if (senderId && recipientId) {
      where.$or = [{ sender_id: senderId }, { recipient_id: recipientId }]
    } else if (senderId) {
      where.sender_id = senderId
    } else if (senderId) {
      where.recipient_id = recipientId
    }
    const offset = query.offset ? Math.max(0, Number.parseInt(query.offset)) : 0
    const limit = query.limit ? Math.min(100, Number.parseInt(query.limit)) : 20
    // const order = query.order || 'ASC'

    const result = await this.dao.findPage('contract_transfer', { where, offset, limit })

    return { success: true, count: result.total, rows: result.rows }
  }

  /**
   * Query contract execute results, query: limit={limit}&offset={offset}
   * @param id contract id
   * @param limit max items count to return, default = 20
   * @param offset return items offset, default = 0
   * @returns query result
   *
   */
  async getResults (req) {
    const { params, query } = req
    // const { id } = await this.dao.findOne('contract', { where: { name: params.name}, attributes: ['id', 'name'] })
    const where = { contract_id: params.id || query.id }
    const offset = query.offset ? Math.max(0, Number.parseInt(query.offset)) : 0
    const limit = query.limit ? Math.min(100, Number.parseInt(query.limit)) : 20
    // const order = query.order || 'ASC'

    const result = await this.dao.findPage('contract_result', { where, offset, limit })

    const rows = []
    for (const row of result.rows) {
      try {
        const record = convertResult(row)
        const trs = await this.dao.findOne('tr', { where: { id: row.transaction_id } })
        if (trs.args) {
          const args = JSON.parse(trs.args)
          const data = args && args[0]
          const method = data.method
          const param = data.args
          record.interface = `${method}(${param})`
        }
        const trfs = await this.dao.findList('contract_transfer', { where: { transaction_id: row.transaction_id } })
        if (trfs && trfs.length) {
          for (const trf of trfs) {
            rows.push({
              ...record,
              sender_id: trf.sender_id,
              recipient_id: trf.recipient_id,
              amount: trf.amount,
              currency: trf.currency,
              block_height: trf.block_height
            })
          }
        } else {
          rows.push(record)
        }
      } catch (err) {
        console.error(err)
      }
    }

    return { success: true, count: result.total, rows: rows }
  }

  /**
   * Query single send reult by transaction id,
   * @param id contract id
   * @param transactionId transaction id
   * @returns query result { result: { transactionId, contractId, success, gas, error, stateChangesHash, transaction } }
   * '/result', async (
   */
  async getResult (req) {
    const { transactionId, id } = req.params
    assert(!!transactionId, 'Invalid transaction id')
    const contract = await this.dao.findOneByPrimaryKey('contract', id, { attributes: ['id', 'name'] })

    const results = await this.dao.findOne('contract_result', { where: { transactionId } })
    assert(results.length > 0, `send result not found (transactionId = ${transactionId})`)
    const resultsWithTransactions = await attachTransactions(
      results.map(r => convertResult(r)),
      this.dao
    )

    const result = resultsWithTransactions[0]
    const transaction = result.transaction
    if (transaction.type === DdnUtils.assetTypes.CONTRACT) {
      assert(transaction.args && transaction.args[0] && id === transaction.args[0].id, `Invalid contract id ${id}`)
    } else {
      assert(contract && contract.id === result.contractId, `Invalid contract id ${id}`)
    }

    return { success: true, result }
  }

  /**
   * Get state of contract
   * @param id  contract id
   * @param statePath  path of state, separated by '.' , eg: 'holding.0' => contract['holding'][0]
   * @returns state value if primitive, else return count of children states
   * '/states'
   */
  async getStates (req) {
    const { id, statePath } = req.query
    if (!statePath) throw new Error(`Invalid state path '${statePath}'`)

    const states = await this.runtime.dvm.queryState(id, String(statePath).split('.'))
    convertBigintMemberToString(states)
    return { success: true, states }
  }

  /**
   * Get state of contract
   * @param id  contract id
   * @param method  constant method id
   * @param args arguments of method
   * @returns constant method call result
   * '/call'
   */
  async postCall (req) {
    const { id, method, args } = req.body
    const methodArgs = args || []
    if (!Array.isArray(methodArgs)) {
      throw new Error('Arguments should be array')
    }

    const result = await this.runtime.dvm.callReadonly(id, method, ...methodArgs)
    convertBigintMemberToString(result)
    return { success: true, result }
  }
}

export default ContractService
