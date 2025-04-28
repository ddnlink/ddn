/**
 * Transaction Sync
 * 负责处理未确认交易的同步操作
 */

let _singleton

export class TransactionSync {
  static singleton(context) {
    if (!_singleton) {
      _singleton = new TransactionSync(context)
    }
    return _singleton
  }

  constructor(context) {
    Object.assign(this, context)
    this._context = context
  }

  /**
   * 从其他节点同步未确认交易
   * @returns {Promise<void>}
   */
  async syncUnconfirmedTransactions() {
    let res
    try {
      res = await this.runtime.peer.p2p.get('/tx')
    } catch (err) {
      this.logger.error(`Sync UnconfirmedTransactions has error: ${err}`)
      return
    }

    if (!res || !res.body) {
      return
    }

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          transactions: {
            type: 'array',
            uniqueItems: true
          }
        },
        required: ['transactions']
      },
      res.body
    )
    if (validateErrors) {
      this.logger.error(validateErrors[0].message)
      return
    }

    const transactions = res.body.transactions
    const validTransactions = []

    for (let i = 0; i < transactions.length; i++) {
      try {
        const normalizedTx = await this.runtime.transaction.objectNormalize(transactions[i])
        validTransactions.push(normalizedTx)
      } catch (e) {
        this.logger.warn(
          `Transaction ${transactions[i] ? transactions[i].id : 'null'} is not valid: ${e.message}`
        )
        continue
      }
    }

    if (validTransactions.length === 0) {
      this.logger.debug('No valid transactions found')
      return
    }

    const trs = []
    for (let i = 0; i < validTransactions.length; ++i) {
      try {
        const hasUnconfirmed = await this.runtime.transaction.hasUnconfirmedTransaction(validTransactions[i]);
        if (!hasUnconfirmed) {
          trs.push(validTransactions[i]);
        } else {
          this.logger.debug(`Skipping existing unconfirmed transaction: ${validTransactions[i].id}`);
        }
      } catch (err) {
        this.logger.error(`Error checking unconfirmed transaction: ${err.message}`);
        continue;
      }
    }

    return this.balancesSequence.addAsync(async () => {
      // 这里不需要跳过验证，因为从其他节点同步的交易需要验证
      await this.runtime.transaction.receiveTransactions(trs);
    });
  }

  /**
   * 启动未确认交易同步任务（轮询）
   * @param {number} interval 同步间隔，单位为秒，默认为10秒
   */
  async startSyncTask(interval = 10) {
    try {
      await this.syncUnconfirmedTransactions()
    } catch (err) {
      this.logger.warn(`The unconfirmed transactions sync task error: ${err.message || err}`)
    }

    setTimeout(() => {
      this.startSyncTask(interval)
    }, 1000 * interval)
  }
}

export default TransactionSync
