import DdnUtils from '@ddn/utils'
import assert from 'assert'

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
  const { gas = 0, error, stateChangesHash, transactionId, contractId, data } = result
  return { gas, error, stateChangesHash, transactionId, data, contractId, success: !!result.success }
}

async function attachTransactions (results) {
  const condition =
    results.length === 1 ? { id: results[0].transactionId } : { id: { $in: results.map(r => r.transactionId) } }

  const transactions = await this.dao.find('tr', condition)
  const transMap = new Map()
  transactions.forEach(t => transMap.set(t.id, t))

  results.forEach(r => (r.transaction = transMap.get(r.transactionId)))
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
   * @param {*} req { id, name, publisher, orderBy = id ASC, limit = 20, offset = 0 }
   * @returns
   */
  async get (req) {
    if (this.runtime.state !== DdnUtils.runtimeState.Ready) {
      throw new Error('Blockchain is loading')
    }

    const query = { ...req.query }
    // query.offset = Number(query.offset || 0)
    // query.limit = Number(query.limit || 100)

    console.log('=--------------------', query)

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
          publisher: {
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
    if (query.publisher) {
      where.publisher = query.publisher
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
      const sortFields = ['b.id', 'b.name', 'b.transactionId', 'b.publisher', 'b.code', 'b.vmVersion', 'b.timestamp']
      if (!sortFields.includes(sortField)) {
        throw new Error('Invalid sort field')
      }
    }

    const offset = query.offset
    const limit = query.limit
    // const attributes = ['id', 'name', 'publisher', 'transaction_id', 'gas_limit', 'timestamp', 'version', 'desc']

    const result = await this.dao.findPage('contract', { where, order: sorts, offset, limit })
    return { success: true, contracts: result.rows, totalCount: result.total }
  }

  /**
   * Get contract details
   * @param address  contract address
   * @returns contract detail { contract : { id, name, transactionId, address, owner, vmVersion,
   * desc, timestamp, metadata } }
   */
  async getGet (req) {
    const contract = await this.dao.findOne('contract', req.params.id) // 实际传的是address
    return { success: true, contract }
  }

  /**
   * Get contract metadata
   * @param address  contract address
   * @returns contract metadata
   * '/:address/metadata'
   */
  async getDetail (req) {
    const { metadata } = await this.dao.findOne('contract', req.params.address, { attributes: ['id', 'metadata'] })
    return { success: true, metadata }
  }

  /**
   * Get contract code
   * @param address  contract address
   * @returns contract code
   * '/:name/code'
   */
  async getCode (req) {
    const { code } = await this.dao.findOne('contract', req.params.address, { attributes: ['id', 'code'] })
    return { success: true, code }
  }

  /**
   * Query contract call results, query: limit={limit}&offset={offset}
   * @param address contract address
   * @param limit max items count to return, default = 20
   * @param offset return items offset, default = 0
   * @returns query result { count, results: [{ transactionId, contractId, success, gas, error, stateChangesHash, transaction }...] }
   * '/:address/results', async (
   */
  async getResults (req) {
    const { params, query } = req
    const { id } = await this.dao.findOne('contract', params.name, { attributes: ['id', 'name'] })
    const condition = { contractId: id }
    const offset = query.offset ? Math.max(0, Number.parseInt(query.offset)) : 0
    const limit = query.limit ? Math.min(100, Number.parseInt(query.limit)) : 20
    const order = query.order || 'ASC'

    const count = await this.dao.count('contract_result', condition)
    const range = { limit, offset }
    const callResults = await this.dao.find('contract_result', condition, range, { rowid: order })
    const results = await attachTransactions(callResults.map(r => convertResult(r)))

    return { success: true, count, results }
  }

  /**
   * Query single call reult by transaction id,
   * @param address contract address
   * @param transactionId transaction id
   * @returns query result { result: { transactionId, contractId, success, gas, error, stateChangesHash, transaction } }
   * '/:address/results/:transactionId', async (
   */
  async getResult (req) {
    const { transactionId, address } = req.params
    assert(!!transactionId, 'Invalid transaction id')
    const contract = await this.dao.findOne('contract', address, { attributes: ['id', 'name'] })
    const condition = { transactionId }

    const results = await this.dao.find('contract_result', condition)
    assert(results.length > 0, `Call result not found (transactionId = ${transactionId})`)
    const resultsWithTransactions = await attachTransactions(results.map(r => convertResult(r)))

    const result = resultsWithTransactions[0]
    const transaction = result.transaction
    if (transaction.type === DdnUtils.assetTypes.CONTRACT) {
      assert(address === transaction.args[1], `Invalid contract address ${address}`)
    } else {
      assert(contract && contract.id === result.contractId, `Invalid contract address ${address}`)
    }

    return { success: true, result }
  }

  /**
   * Get state of contract
   * @param address  contract address
   * @param statePath  path of state, separated by '.' , eg: 'holding.0' => contract['holding'][0]
   * @returns state value if primitive, else return count of children states
   * '/:address/states/:statePath'
   */
  async getStates (req) {
    const { address, statePath } = req.params
    if (!statePath) throw new Error(`Invalid state path '${statePath}'`)

    const result = await this.contract.queryState(address, String(statePath).split('.'))
    convertBigintMemberToString(result)
    return result
  }

  /**
   * Get state of contract
   * @param address  contract address
   * @param method  constant method address
   * @param request.body arguments of method
   * @returns constant method call result
   * '/:address/constant/:method'
   */
  async postState (req) {
    const { address, method } = req.params
    const methodArgs = req.body || []
    if (!Array.isArray(methodArgs)) {
      throw new Error('Arguments should be array')
    }

    const result = await this.contract.getConstant(address, method, ...methodArgs)
    convertBigintMemberToString(result)
    return result
  }
}

export default ContractService
