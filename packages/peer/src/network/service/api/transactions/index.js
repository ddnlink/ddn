
import * as DdnCrypto from '@ddn/crypto'
import DdnUtils, { bignum, LimitCache, checkAndReport, superviseTrs } from '@ddn/utils'
import { validateTransaction, validateContractTransaction } from '../../../../utils'

// 实现一个健壮的错误处理函数
function getErrorMsg(err) {
  if (!err) return 'Unknown error';
  if (err.message) return err.message;
  if (typeof err === 'string') return err;
  if (err.toString && typeof err.toString === 'function' && err.toString() !== '[object Object]') return err.toString();
  try {
    return JSON.stringify(err);
  } catch (e) {
    return 'Error object cannot be stringified';
  }
}

/**
 * TransactionService 接口
 * wangxm   2019-03-21
 */
class TransactionService {
  constructor(context) {
    Object.assign(this, context)
    this._context = context

    this._invalidTrsCache = new LimitCache()
  }

  // 这个是所有交易的入口，获得的是交易体
  async post({ body }) {

    // 确保响应始终为JSON格式
    const jsonResponse = (success, data = {}, error = null) => {
      const response = { success };
      if (success) {
        Object.assign(response, data);
      } else {
        response.error = error || 'Unknown error';
      }
      return response;
    };


    // 检查区块链是否准备好接收交易
    try {
      const lastBlock = await this.runtime.block.getLastBlock();
      const lastSlot = this.runtime.slot.getSlotNumber(lastBlock.timestamp);

      if (this.runtime.slot.getNextSlot() - lastSlot >= 12) {
        this.logger.error('Blockchain is not ready', {
          getNextSlot: this.runtime.slot.getNextSlot(),
          lastSlot,
          lastBlockHeight: lastBlock.height
        });
        return jsonResponse(false, null, 'Blockchain is not ready');
      }
    } catch (blockchainErr) {
      this.logger.error('Error checking blockchain readiness', {
        error: blockchainErr.message,
        stack: blockchainErr.stack
      });
      return jsonResponse(false, null, 'Error checking blockchain readiness');
    }

    // 处理不同格式的输入
    // 如果传入的是直接的交易对象，将其包装在 transaction 字段中
    if (!body.transaction && body.type !== undefined) {
      body = { transaction: body };
    }

    // 如果没有交易数据，返回错误
    if (!body.transaction) {
      return jsonResponse(false, null, 'Missing transaction data');
    }

    // 基本验证也会在 objectNormalize 中进行，这里删除吧，不要重复
    // 验证基本字段
    // const validateErrors = await this.ddnSchema.validate(
   
    // 尝试规范化交易对象
    let transaction;
    try {
      transaction = await this.runtime.transaction.objectNormalize(body.transaction);
      transaction.asset = transaction.asset || {};
    } catch (normalizeErr) {
      this.logger.error('Transaction normalization error', {
        error: normalizeErr.message,
        transaction: JSON.stringify(body.transaction)
      });
      return jsonResponse(false, null, `Transaction normalization error: ${normalizeErr.message}`);
    }

    // 确保交易有ID
    if (!transaction.id) {
      try {
        transaction.id = await DdnCrypto.getId(transaction);
      } catch (idErr) {
        this.logger.error('Failed to generate transaction ID', {
          error: idErr.message,
          transaction: JSON.stringify(transaction)
        });
        return jsonResponse(false, null, `Failed to generate transaction ID: ${idErr.message}`);
      }
    }

    // 对缓存的非法交易直接返回
    if (this._invalidTrsCache.has(transaction.id)) {
      this.logger.debug(`The transaction ${transaction.id} is invalid, don't commit it again.`);
      return jsonResponse(false, null, `The transaction ${transaction.id} is invalid, don't commit it again.`);
    }

    // 创建验证上下文
    const validationContext = {
      runtime: this.runtime,
      logger: this.logger,
      dao: this.dao,
      constants: this.constants
    };

    // 根据交易类型选择不同的验证方法
    let isValid = false;
    try {
      if (transaction.type === DdnUtils.assetTypes.CONTRACT) { // 合约交易
        isValid = await validateContractTransaction(transaction, validationContext);
      } else {
        isValid = await validateTransaction(transaction, validationContext);
      }
    } catch (validationErr) {
      // 记录详细的错误信息
      this.logger.error(`Transaction validation error: ${validationErr.message}`, {
        transaction: transaction.id,
        type: transaction.type,
        error: validationErr.stack
      });

      // 返回JSON格式的错误信息
      return jsonResponse(false, null, `Transaction validation failed: ${validationErr.message}`);
    }

    // 如果验证失败，返回错误
    if (!isValid) {
      this._invalidTrsCache.set(transaction.id, true);
      this.logger.warn(`Invalid transaction rejected: ${transaction.id}`);
      return jsonResponse(false, null, 'Transaction validation failed');
    }

    // 处理交易
    try {
      // 检查交易是否已经在未确认交易池中
      if (await this.runtime.transaction.hasUnconfirmedTransaction(transaction)) {
        return jsonResponse(false, null, `The transaction ${transaction.id} is in process already..`);
      }

      // 接收交易，不跳过验证
      const transactions = await this.runtime.transaction.receiveTransactions([transaction]);

      if (transactions && transactions.length > 0) {
        // 记录交易处理成功
        this.logger.info(`Transaction accepted: ${transaction.id}, type: ${transaction.type}`);
        return jsonResponse(true, { transactionId: transactions[0].id });
      } else {
        // 交易被接受但未返回有效交易列表
        this.logger.warn(`Transaction ${transaction.id} was processed but not returned as valid`);

        // 获取发送者账户
        let sender;
        try {
          sender = await this.runtime.account.getAccountByPublicKey(transaction.senderPublicKey);
        } catch (err) {
          // 如果无法获取发送者账户，使用一般性错误消息
          return jsonResponse(false, null, 'Transaction validation failed: Unable to verify sender account');
        }

        // 检查常见的验证错误
        let errorMessage = 'Transaction validation failed';

        // 检查发送者ID
        if (transaction.senderId && sender && transaction.senderId !== sender.address) {
          errorMessage = `Transaction validation failed: Invalid sender ID (expected ${sender.address}, got ${transaction.senderId})`;
        }

        // 检查余额
        const amount = bignum.plus(transaction.amount, transaction.fee);
        if (sender && bignum.isLessThan(sender.balance, amount)) {
          errorMessage = `Transaction validation failed: Insufficient balance (${sender.balance} < ${amount})`;
        }

        return jsonResponse(false, null, errorMessage);
      }
    } catch (processErr) {
      // 记录错误并缓存无效交易
      this._invalidTrsCache.set(transaction.id, true);
      this.logger.debug(`Transaction error details: ${JSON.stringify(processErr, Object.getOwnPropertyNames(processErr))}`);
      const errorMessage = getErrorMsg(processErr);
      this.logger.warn(`Receive invalid transaction, transaction is ${JSON.stringify(transaction)}, error: ${errorMessage}`);
      return jsonResponse(false, null, errorMessage);
    }

  }

  async get(req) {
    const query = Object.assign({}, req.body, req.query)
    // query.offset = Number(query.offset || 0)
    // query.limit = Number(query.limit || 100)
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          blockId: {
            type: 'string'
          },
          limit: {
            type: 'integer',
            minimum: 0,
            maximum: 100
          },
          type: {
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
          senderPublicKey: {
            type: 'string',
            format: 'publicKey'
          },
          ownerPublicKey: {
            type: 'string',
            format: 'publicKey'
          },
          ownerAddress: {
            type: 'string'
          },
          senderId: {
            type: 'string'
          },
          recipientId: {
            type: 'string'
          },
          amount: {
            type: 'string'
          },
          fee: {
            type: 'string'
          },
          aob: {
            type: 'integer',
            minimum: 0,
            maximum: 1
          },
          currency: {
            type: 'string',
            minimum: 1,
            maximum: 22
          },
          and: {
            type: 'integer',
            minimum: 0,
            maximum: 1
          }
        }
      },
      query
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const where = {}
    const andWheres = []
    if (query.blockId) {
      andWheres.push({
        block_id: query.blockId
      })
    }
    if (query.senderPublicKey) {
      andWheres.push({
        senderPublicKey: query.senderPublicKey
      })
    }
    if (query.senderId && query.recipientId) {
      andWheres.push({
        $or: [
          {
            senderId: query.senderId
          },
          {
            recipientId: query.recipientId
          }
        ]
      })
    } else {
      if (query.senderId) {
        andWheres.push({
          senderId: query.senderId
        })
      }
      if (query.recipientId) {
        andWheres.push({
          recipientId: {
            $like: query.recipientId
          }
        })
      }
    }

    if (query.ownerAddress && query.ownerPublicKey) {
      andWheres.push({
        $or: [
          {
            senderPublicKey: query.ownerPublicKey
          },
          {
            recipientId: query.ownerAddress
          }
        ]
      })
    } else if (query.ownerAddress) {
      andWheres.push({
        $or: [
          {
            senderId: query.ownerAddress
          },
          {
            recipientId: query.ownerAddress
          }
        ]
      })
    }
    if (query.type >= 0) {
      andWheres.push({
        type: query.type
      })
    }
    if (query.message) {
      andWheres.push({
        message: query.message
      })
    }
    if (andWheres.length > 0) {
      where.$and = andWheres
    }

    const limit = query.limit || 100
    const offset = query.offset || 0

    const sortFields = [
      't_id',
      't_block_id',
      't_amount',
      't_fee',
      't_type',
      't_timestamp',
      't_senderPublicKey',
      't_senderId',
      't_recipientId',
      't_confirmations',
      'b_height'
    ]

    let sort
    let sortBy
    let sortMethod
    if (query.orderBy) {
      sort = query.orderBy.split(':')

      sortBy = sort[0]
      if (sort.length === 2) {
        sortMethod = sort[1] === 'desc' ? 'desc' : 'asc'
      } else {
        sortMethod = 'desc' // default desc
      }
    }

    if (sortBy) {
      if (sortFields.indexOf(sortBy) < 0) {
        throw new Error('Invalid sort field')
      }
    }

    // sequelize, order: [[Sequelize.literal('booth.boothname'), 'ASC']]
    // https://github.com/sequelize/sequelize/issues/7897
    const orders = sortBy ? [[this.dao.db_str(sortBy), sortMethod]] : null
    const data = await this.runtime.dataquery.queryFullTransactionData(where, limit, offset, orders, true)

    let transactions = []
    for (let i = 0; i < data.transactions.length; i++) {
      const row = data.transactions[i]
      const trs = await this.runtime.transaction.serializeDbData2Transaction(row)
      transactions.push(trs)
    }
    // 屏蔽违规交易
    if (global.assets && global.assets.transTypeNames[90]) {
      transactions = await superviseTrs({ trs: transactions, context: this._context })
    }
    return {
      success: true,
      transactions,
      count: data.count
    }
  }

  async getGet(req) {
    const query = Object.assign({}, req.body, req.query)

    // 记录请求参数
    this.logger.debug(`Transaction getGet request with query:`, query);

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            minLength: 1
          }
        },
        required: ['id']
      },
      query
    )
    if (validateErrors) {
      this.logger.error(`Invalid transaction query parameters:`, validateErrors);
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    try {
      // 先检查未确认交易池
      this.logger.debug(`Checking unconfirmed transaction pool for ID: ${query.id}`);
      const unconfirmedTrs = await this.runtime.transaction.getUnconfirmedTransaction(query.id);
      if (unconfirmedTrs) {
        this.logger.debug(`Found transaction in unconfirmed pool: ${query.id}`);
        return {
          success: true,
          transaction: unconfirmedTrs,
          unconfirmed: true
        };
      }

      // 查询数据库中的交易
      this.logger.debug(`Querying database for transaction ID: ${query.id}`);
      const rows = await this.runtime.dataquery.queryFullTransactionData(
        {
          id: query.id
        },
        1,
        0,
        null
      )

      if (rows && rows.length) {
        this.logger.debug(`Found transaction in database: ${query.id}`);
        const result = []
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          try {
            const trs = await this.runtime.transaction.serializeDbData2Transaction(row)
            result.push(trs)
          } catch (serializeErr) {
            this.logger.error(`Error serializing transaction data:`, {
              error: serializeErr.message,
              stack: serializeErr.stack,
              transactionId: query.id,
              rowData: JSON.stringify(row)
            });
            throw new Error(`Error processing transaction data: ${serializeErr.message}`);
          }
        }

        if (result.length > 0) {
          let transaction = result[0];

          // 应用监管过滤（如果需要）
          if (global.assets && global.assets.transTypeNames[90]) {
            try {
              transaction = await superviseTrs({ context: this._context, trs: transaction });
            } catch (superviseErr) {
              this.logger.error(`Error applying transaction supervision:`, {
                error: superviseErr.message,
                transactionId: query.id
              });
            }
          }

          return {
            success: true,
            transaction: transaction
          }
        } else {
          this.logger.warn(`Transaction data found but serialization returned empty result: ${query.id}`);
          throw new Error('Transaction data could not be processed');
        }
      } else {
        this.logger.warn(`Transaction not found in database: ${query.id}`);

        // 检查交易是否存在但查询方式有问题
        const rawCount = await this.dao.count('tr', { where: { id: query.id } });
        if (rawCount > 0) {
          this.logger.error(`Transaction exists in tr table but full query failed: ${query.id}, count: ${rawCount}`);
          throw new Error('Transaction found but data retrieval failed');
        }

        throw new Error('Transaction not found');
      }
    } catch (err) {
      this.logger.error(`Error in getGet method:`, {
        error: err.message,
        stack: err.stack,
        transactionId: query.id
      });
      throw err;
    }
  }

  async put(req) {
    const body = req.body
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          secret: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          },
          amount: {
            type: 'string'
          },
          recipientId: {
            type: 'string',
            minLength: 1
          },
          publicKey: {
            type: 'string',
            format: 'publicKey'
          },
          secondSecret: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          },
          multisigAccountPublicKey: {
            type: 'string',
            format: 'publicKey'
          },
          message: {
            type: 'string',
            maxLength: 256
          }
        },
        required: ['secret', 'amount', 'recipientId']
      },
      body
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    if (!/^[0-9]+$/.test(body.amount)) {
      throw new Error('Invalid transaction amount')
    }

    const keypair = DdnCrypto.getKeys(body.secret)
    if (body.publicKey) {
      if (keypair.publicKey.toString('hex') !== body.publicKey) {
        throw new Error('Invalid passphrase')
      }
    }

    try {
      const transactions = await this.balancesSequence.addAsync(async () => {
        let recipient
        try {
          recipient = await this.runtime.account.getAccountByAddress(body.recipientId)
        } catch (err) {
          throw err
        }

        const recipientId = recipient ? recipient.address : body.recipientId
        if (!recipientId) {
          throw new Error('Recipient not found')
        }

        if (body.multisigAccountPublicKey && body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')) {
          let account
          try {
            account = await this.runtime.account.getAccountByPublicKey(body.multisigAccountPublicKey)
          } catch (err) {
            throw err
          }

          if (!account) {
            throw new Error('Multisignature account not found')
          }

          if (!account.multisignatures) {
            throw new Error('Account does not have multisignatures enabled')
          }

          if (!account.multisignatures.includes(keypair.publicKey.toString('hex'))) {
            throw new Error('Account does not belong to multisignature group')
          }

          let requester
          try {
            requester = await this.runtime.account.getAccountByPublicKey(keypair.publicKey)
          } catch (err) {
            throw err
          }

          if (!requester || !requester.publicKey) {
            throw new Error('Invalid requester')
          }

          if (
            requester.second_signature &&
            !DdnUtils.bignum.isEqualTo(requester.second_signature, 0) &&
            !body.secondSecret
          ) {
            throw new Error('Invalid second passphrase')
          }

          if (requester.publicKey === account.publicKey) {
            throw new Error('Invalid requester')
          }

          let second_keypair = null
          if (requester.second_signature && !DdnUtils.bignum.isEqualTo(requester.second_signature, 0)) {
            second_keypair = DdnCrypto.getKeys(body.secondSecret)
          }

          try {
            const transaction = await this.runtime.transaction.create({
              type: DdnUtils.assetTypes.TRANSFER,
              amount: body.amount,
              sender: account,
              recipientId: recipientId,
              keypair,
              requester: keypair,
              second_keypair,
              message: body.message
            })

            // 创建验证上下文
            const validationContext = {
              runtime: this.runtime,
              logger: this.logger,
              dao: this.dao,
              constants: this.constants
            }

            // 验证交易
            const isValid = await validateTransaction(transaction, validationContext)
            if (!isValid) {
              throw new Error('Transaction validation failed')
            }

            if (
              global.assets &&
              global.assets.transTypeNames[90] &&
              this.constants.net.superviseIp === this.config.publicIp
            ) {
              await checkAndReport(transaction, this, this.constants.net.superviseBaseUrl)
            }
            return await this.runtime.transaction.receiveTransactions([transaction], true)
          } catch (err) {
            throw err
          }
        } else {
          this.logger.debug('publicKey is: ', keypair.publicKey.toString('hex'))

          let account
          try {
            account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey.toString('hex'))
          } catch (err) {
            throw err
          }
          if (!account) {
            throw new Error('Account not found')
          }

          if (account.second_signature && !body.secondSecret) {
            throw new Error('Invalid second passphrase')
          }

          let second_keypair = null
          if (account.second_signature) {
            second_keypair = DdnCrypto.getKeys(body.secondSecret)
          }

          try {
            const transaction = await this.runtime.transaction.create({
              type: DdnUtils.assetTypes.TRANSFER,
              amount: body.amount,
              sender: account,
              recipientId: recipientId,
              keypair,
              second_keypair,
              message: body.message
            })

            // 创建验证上下文
            const validationContext = {
              runtime: this.runtime,
              logger: this.logger,
              dao: this.dao,
              constants: this.constants
            }

            // 验证交易
            const isValid = await validateTransaction(transaction, validationContext)
            if (!isValid) {
              throw new Error('Transaction validation failed')
            }

            if (
              global.assets &&
              global.assets.transTypeNames[90] &&
              this.constants.net.superviseIp === this.config.publicIp
            ) {
              await checkAndReport(transaction, this, this.constants.net.superviseBaseUrl)
            }
            return await this.runtime.transaction.receiveTransactions([transaction], true)
          } catch (err) {
            throw err
          }
        }
      })

      return {
        success: true,
        transactionId: transactions[0].id
      }
    } catch (err) {
      throw err
    }
  }

  /**
   * 功能:得到一定时间段内的每天的交易量
   * 参数:
   *      startTime:2019-6-4;默认为七天前
   *      endTime:2019-6-4;默认为当前时间
   * 返回值:{ "success": true,"data": [{ "time": "2019-6-4", "count": 0 }]}
   */
  async getSpell(req) {
    const query = req.query
    // 将时间换算成对应格式
    const formatDate = date => {
      const y = date.getFullYear()
      let m = date.getMonth() + 1
      m = m < 10 ? `0${m}` : m
      let d = date.getDate()
      d = d < 10 ? `0${d}` : d
      return `${y}-${m}-${d}`
    }
    if (!query.startTime) {
      query.startTime = formatDate(new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7))
    }
    if (!query.endTime) {
      query.endTime = formatDate(new Date())
    }
    // 根据日期字符串得到对应日期的0点的毫秒数
    const getDate = str => {
      str = str.toString()
      const strArr = str.split('-')
      const date = new Date(strArr[0], strArr[1] - 1, strArr[2])
      return date
    }
    // 获取入参字符串形式日期的Date型日期
    const d1 = getDate(query.startTime)
    const d2 = getDate(query.endTime)
    // 定义一天的毫秒数
    const dayMilliSeconds = 1000 * 60 * 60 * 24
    // 获取输入日期的毫秒数
    let d1Ms = d1.getTime()
    const d2Ms = d2.getTime()
    // 定义转换格式的方法
    const getYMD = date => {
      let retDate = `${date.getFullYear()}-` // 获取年份。
      retDate += `${date.getMonth() + 1}-` // 获取月份。
      retDate += date.getDate() // 获取日。
      return retDate // 返回日期。
    }
    // 定义返回值
    let time
    const dataArr = []
    // 对日期毫秒数进行循环比较，直到d1Ms 大于等于 d2Ms 时退出循环
    // 每次循环结束，给d1Ms 增加一天
    for (d1Ms; d1Ms <= d2Ms; d1Ms += dayMilliSeconds) {
      // 将给的毫秒数转换为Date日期
      const day = new Date(d1Ms)
      // 获取其年月日形式的字符串
      time = getYMD(day)
      // 查询当日交易量
      const count = await this.dao.count('tr', {
        where: {
          timestamp: {
            $gte: Number(this.runtime.slot.getTime(d1Ms)),
            $lt: Number(this.runtime.slot.getTime(d1Ms + dayMilliSeconds - 1))
          }
        }
      })
      const obj = {
        time,
        count
      }
      dataArr.push(obj)
    }
    return {
      success: true,
      result: dataArr
    }
  }
}

export default TransactionService
