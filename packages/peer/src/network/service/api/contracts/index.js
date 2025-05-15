import DdnUtils from '@ddn/utils'

// due to contract sandbox always return json object
function BigintToString (obj) {
  if (typeof obj !== 'object' || obj === null) return

  Object.keys(obj).forEach(key => {
    const value = obj[key]
    const type = typeof value
    if (type === 'bigint') {
      obj[key] = String(value)
    } else if (type === 'object') {
      BigintToString(value)
    }
  })
}

function processResult (result) {
  BigintToString(result)
  const { gas = 0, error, stateChangesHash, transaction_id, contract_id, contractId, data } = result
  // 使用contract_id或contractId，确保至少有一个值
  const finalContractId = contract_id || contractId
  return { gas, error, stateChangesHash, transaction_id, data, contract_id: finalContractId, success: !!result.success }
}

async function populateTrs (results, dao) {
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
    if (!this.runtime.stateMachine.isReady()) {
      throw new Error('Blockchain is loading')
    }

    const query = { ...req.query, ...req.params }
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

    const offset = query.offset || 0
    const limit = query.limit || 10
    const attributes = ['id', 'name', 'owner', 'transaction_id', 'gasLimit', 'timestamp', 'version', 'desc']

    try {
      // 首先尝试从contracts表查询，这里用单数模型的名称
      const result = await this.dao.findPage('contract', { where, order: sorts, offset, limit, attributes })

      // 如果没有数据，尝试从contract_result表查询
      if (result.total === 0) {
        // 构建查询条件
        const contractWhere = {};

        if (query.id) {
          contractWhere.contract_id = query.id;
        }
        // 注意：name和owner字段在contract_result表中可能不存在，需要根据实际情况调整
        // 这里暂时不添加这些条件

        const contractResults = await this.dao.findPage('contract_result', {
          where: contractWhere,
          order: [['transaction_id', 'desc']],
          offset,
          limit
        });

        // 从contract_result数据构建合约数据
        const rows = [];
        for (const contractResult of contractResults.rows) {
          // 获取关联的交易信息
          const tx = await this.dao.findOne('tr', {
            where: { id: contractResult.transaction_id }
          });

          if (tx && contractResult.contract_id) { // 确保有合约ID
            const contract = {
              id: contractResult.contract_id || '',
              transaction_id: tx.id,
              gas: contractResult.gas || 0,
              timestamp: tx.timestamp,
              success: contractResult.success
            };

            // 尝试从contract_transfer表获取更多信息
            try {
              const contractTransfer = await this.dao.findOne('contract_transfer', {
                where: { transaction_id: tx.id }
              });

              if (contractTransfer) {
                contract.transfer_info = {
                  sender_id: contractTransfer.sender_id,
                  recipient_id: contractTransfer.recipient_id,
                  amount: contractTransfer.amount
                };
              }
            } catch (e) {
              this.logger.error('Error fetching contract_transfer:', e);
            }

            rows.push(contract);
          }
        }

        return { success: true, rows, totalCount: rows.size }
      }

      return { success: true, rows: result.rows, totalCount: result.total }
    } catch (err) {
      this.logger.error('Error querying contracts:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Get contract details
   * @param id  contract id
   * @returns contract detail { contract : { id, name, transactionId, id, owner, vmVersion,
   * desc, timestamp, metadata } }
   */
  async getGet (req) {
    try {
      const id = req.query.id || req.params.id;

      // 首先尝试从contracts表查询
      let contract = await this.dao.findOneByPrimaryKey('contract', id);

      // 如果没有找到，尝试从contract_result表直接查询
      if (!contract) {
        // 查找合约结果
        const contractResult = await this.dao.findOne('contract_result', {
          where: { contract_id: id }
        });

        if (contractResult) {
          // 获取关联的交易信息
          const tx = await this.dao.findOne('tr', {
            where: { id: contractResult.transaction_id }
          });

          if (tx) {
            contract = {
              id: contractResult.contract_id || '',
              transaction_id: tx.id,
              gas: contractResult.gas || 0,
              timestamp: tx.timestamp,
              success: contractResult.success
            };

            // 尝试从contract_transfer表获取更多信息
            const contractTransfer = await this.dao.findOne('contract_transfer', {
              where: { transaction_id: tx.id }
            });

            if (contractTransfer) {
              contract.transfer_info = {
                sender_id: contractTransfer.sender_id,
                recipient_id: contractTransfer.recipient_id,
                amount: contractTransfer.amount
              };
            }
          }
        }
      }

      return { success: true, contract };
    } catch (err) {
      this.logger.error('Error getting contract:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get contract by ID (/:id)
   * @param req Request with contract ID in params
   * @returns Contract details
   */
  async getId (req) {
    try {
      const id = req.params.id;
      if (!id) {
        return { success: false, error: 'Contract ID is required' };
      }

      // 首先尝试从contracts表查询
      let contract = await this.dao.findOneByPrimaryKey('contract', id);

      // 如果没有找到，尝试从contract_result表直接查询
      if (!contract) {
        // 查找合约结果
        const contractResult = await this.dao.findOne('contract_result', {
          where: { contract_id: id }
        });

        if (contractResult) {
          // 获取关联的交易信息
          const tx = await this.dao.findOne('tr', {
            where: { id: contractResult.transaction_id }
          });

          if (tx) {
            contract = {
              id: contractResult.contract_id || '',
              transaction_id: tx.id,
              gas: contractResult.gas || 0,
              timestamp: tx.timestamp,
              success: contractResult.success
            };

            // 尝试从contract_transfer表获取更多信息
            const contractTransfer = await this.dao.findOne('contract_transfer', {
              where: { transaction_id: tx.id }
            });

            if (contractTransfer) {
              contract.transfer_info = {
                sender_id: contractTransfer.sender_id,
                recipient_id: contractTransfer.recipient_id,
                amount: contractTransfer.amount
              };
            }
          }
        }
      }

      if (!contract) {
        return { success: false, error: `Contract with ID ${id} not found` };
      }

      return { success: true, contract };
    } catch (err) {
      this.logger.error(`Error getting contract by ID: ${err.message}`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get contract by ID (/:id)
   * 这个方法会被映射为 GET /api/contracts/:id
   * @param req Request with contract ID in params
   * @returns Contract details
   */
  // async getId (req) {
  //   try {
  //     const id = req.params.id;
  //     if (!id) {
  //       return { success: false, error: 'Contract ID is required' };
  //     }

  //     this.logger.debug(`Getting contract by ID: ${id}`);

  //     // 首先尝试从contracts表查询
  //     let contract = await this.dao.findOneByPrimaryKey('contract', id);

  //     // 如果没有找到，尝试从contract_result表直接查询
  //     if (!contract) {
  //       this.logger.debug(`Contract not found in contract table, trying contract_result table for ID: ${id}`);
  //       // 查找合约结果
  //       const contractResult = await this.dao.findOne('contract_result', {
  //         where: { contract_id: id }
  //       });

  //       if (contractResult) {
  //         // 获取关联的交易信息
  //         const tx = await this.dao.findOne('tr', {
  //           where: { id: contractResult.transaction_id }
  //         });

  //         if (tx) {
  //           contract = {
  //             id: contractResult.contract_id || '',
  //             transaction_id: tx.id,
  //             gas: contractResult.gas || 0,
  //             timestamp: tx.timestamp,
  //             success: contractResult.success
  //           };

  //           // 尝试从contract_transfer表获取更多信息
  //           const contractTransfer = await this.dao.findOne('contract_transfer', {
  //             where: { transaction_id: tx.id }
  //           });

  //           if (contractTransfer) {
  //             contract.transfer_info = {
  //               sender_id: contractTransfer.sender_id,
  //               recipient_id: contractTransfer.recipient_id,
  //               amount: contractTransfer.amount
  //             };
  //           }
  //         }
  //       }
  //     }

  //     if (!contract) {
  //       return { success: false, error: `Contract with ID ${id} not found` };
  //     }

  //     return { success: true, contract };
  //   } catch (err) {
  //     this.logger.error(`Error getting contract by ID: ${err.message}`, err);
  //     return { success: false, error: err.message };
  //   }
  // }

  /**
   * Get contract metadata
   * @param id  contract id
   * @returns contract metadata
   * '/metadata'
   */
  async getMetadata (req) {
    try {
      const id = req.query.id || req.params.id;

      // 首先尝试从contracts表查询
      const contract = await this.dao.findOneByPrimaryKey('contract', id, {
        attributes: ['id', 'metadata']
      });

      if (contract && contract.metadata) {
        return { success: true, metadata: contract.metadata };
      }

      // 如果没有找到或没有metadata，尝试从contract_result表直接查询
      const contractResult = await this.dao.findOne('contract_result', {
        where: { contract_id: id }
      });

      if (contractResult) {
        // 尝试从contract_result获取metadata
        let metadata = '';
        if (contractResult.data) {
          try {
            metadata = contractResult.data;
          } catch (e) {
            this.logger.error('Error getting metadata:', e);
          }
        }

        return { success: true, metadata };
      }

      return { success: false, error: 'Contract metadata not found' };
    } catch (err) {
      this.logger.error('Error getting contract metadata:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get contract code
   * @param id  contract id
   * @returns contract code
   * '/code'
   */
  async getCode (req) {
    try {
      const id = req.query.id || req.params.id;

      // 首先尝试从contracts表查询
      const contract = await this.dao.findOneByPrimaryKey('contract', id, {
        attributes: ['id', 'code']
      });

      if (contract && contract.code) {
        return { success: true, code: contract.code };
      }

      // 如果没有找到或没有code，尝试从contract_result表直接查询
      const contractResult = await this.dao.findOne('contract_result', {
        where: { contract_id: id }
      });

      if (contractResult) {
        // 尝试从contract_result获取code
        let code = '';
        if (contractResult.data) {
          try {
            code = contractResult.data;
          } catch (e) {
            this.logger.error('Error getting code:', e);
          }
        }

        return { success: true, code };
      }

      return { success: false, error: 'Contract code not found' };
    } catch (err) {
      this.logger.error('Error getting contract code:', err);
      return { success: false, error: err.message };
    }
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

    const result = await this.dao.findPage('contract_result', {
      where,
      offset,
      limit,
      order: [['timestamp', 'DESC']] 
    })

    const rows = []
    for (const row of result.rows) {
      try {
        const record = processResult(row)
        const trs = await this.dao.findOne('tr', { where: { id: row.transaction_id } })
        if (trs.args) {
          const data = JSON.parse(trs.args)
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
   * Query contract result by contract id or transaction id
   * @param id contract id
   * @param transactionId transaction id (optional)
   * @returns query result { result: { transactionId, contractId, success, gas, error, stateChangesHash, transaction } }
   * '/result', async (
   */
  async getResult (req) {
    const { params, query } = req;
    const id = params.id || query.id;
    const transactionId = params.transactionId || query.transactionId;

    this.logger.debug(`Getting contract result for contract ID: ${id}, transaction ID: ${transactionId}`);

    // 参数验证
    if (!id && !transactionId) {
      return { success: false, error: 'Either contract ID or transaction ID is required' };
    }

    // 查询合约执行结果
    let result;

    try {
      // 构建查询条件，同时考虑contract_id和contractId字段
      let whereClause = {};

      if (transactionId) {
        // 如果提供了交易ID，优先使用交易ID查询
        whereClause.transaction_id = transactionId;
      }

      if (id) {
        // 使用OR条件同时查询contract_id和contractId字段
        whereClause = {
          ...whereClause,
          contract_id: id
        };
      }

      this.logger.debug(`Searching with where clause: ${JSON.stringify(whereClause)}`);

      if (transactionId) {
        // 查询单个结果
        result = await this.dao.findOne('contract_result', { where: whereClause });

        if (!result) {
          this.logger.debug(`No result found with transaction_id: ${transactionId}, trying direct SQL query`);

          // 尝试使用原始SQL查询，以便处理字段名不一致的问题
          const rawResults = await this.dao.query(
            'SELECT * FROM contract_result WHERE transaction_id = ?',
            { replacements: [transactionId], type: this.dao.QueryTypes.SELECT }
          );

          if (rawResults && rawResults.length > 0) {
            result = rawResults[0];
          }
        }

        if (!result) {
          return { success: false, error: `Contract result not found for transaction ID: ${transactionId}` };
        }
      } else {
        // 查询最新结果
        const results = await this.dao.findList('contract_result', {
          where: whereClause,
          order: [['timestamp', 'DESC']],
          limit: 1
        });

        if (!results || results.length === 0) {
          this.logger.debug(`No results found with contract_id: ${id}, trying direct SQL query`);

          // 尝试使用原始SQL查询
          const rawResults = await this.dao.query(
            'SELECT * FROM contract_result WHERE contract_id = ? OR contractId = ? ORDER BY timestamp DESC LIMIT 1',
            { replacements: [id, id], type: this.dao.QueryTypes.SELECT }
          );

          if (rawResults && rawResults.length > 0) {
            result = rawResults[0];
          } else {
            return { success: false, error: `No results found for contract ID: ${id}` };
          }
        } else {
          result = results[0];
        }
      }

      // 处理结果
      const record = processResult(result);
      const resultWithTransactions = await populateTrs([record], this.dao);
      result = resultWithTransactions[0];

      // 如果需要，可以在这里获取合约信息
      const contractId = result.contract_id || result.contractId;
      if (contractId) {
        const contract = await this.dao.findOneByPrimaryKey('contract', contractId, { attributes: ['id', 'name'] });
        if (contract) {
          result.contract_name = contract.name;
        }
      }

      return { success: true, result };
    } catch (err) {
      this.logger.error(`Error getting contract result: ${err.message}`, err);
      return { success: false, error: `Error retrieving contract result: ${err.message}` };
    }
  }

  /**
   * Get state of contract
   * @param contractName  contract name
   * @param statePath  path of state, separated by '.'
   * @returns state value if primitive, else return count of children states
   * '/api/contracts/{contractName}/states/{statePath}'
   */
  async getStates (req) {
    const { contractName, statePath } = req.params
    if (!statePath) {
      return { success: false, error: 'Invalid state path' }
    }

    try {
      const result = await this.runtime.dvm.queryState(contractName, statePath.split('.'))
      BigintToString(result)

      let response
      if (typeof result === 'object' && result !== null) {
        if (Array.isArray(result)) {
          response = result.length
        } else {
          response = Object.keys(result).length
        }
      } else {
        response = result
      }

      return { success: true, result: response }
    } catch (error) {
      this.logger.error(`Error querying contract state: ${error.message}`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get constant value of contract
   * @param contractName  contract name
   * @param methodName  constant method name
   * @returns constant method call result
   * '/api/contracts/{contractName}/constant/{methodName}'
   */
  async postConstant (req) {
    const { contractName, methodName } = req.params
    const args = req.body

    if (!Array.isArray(args)) {
      return { success: false, error: 'Arguments should be an array' }
    }

    try {
      const result = await this.runtime.dvm.getConstant(contractName, methodName, ...args)
      BigintToString(result)
      
      // Check if the result is a valid JSON and its length
      const jsonResult = JSON.stringify(result)
      if (jsonResult.length >= 32 * 1024) {
        return { success: false, error: 'Result exceeds maximum allowed length (32K)' }
      }

      return { success: true, result }
    } catch (error) {
      this.logger.error(`Error getting constant: ${error.message}`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get state of contract
   * @param id  contract id
   * @param method  constant method id
   * @param args arguments of method
   * @returns constant method call result
   * 'api/contracts/call'
   */
  async postCall (req) {
    const { id, method, args } = req.body
    const methodArgs = args || []
    if (!Array.isArray(methodArgs)) {
      throw new Error('Arguments should be array')
    }

    const result = await this.runtime.dvm.callContract(id, method, ...methodArgs)
    BigintToString(result)
    return { success: true, result }
  }
}

export default ContractService
