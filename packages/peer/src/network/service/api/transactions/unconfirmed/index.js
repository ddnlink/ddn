/**
 * RootRouter接口
 * wangxm   2019-03-21
 */
class RootRouter {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async get (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        senderPublicKey: {
          type: 'string',
          format: 'publicKey'
        },
        address: {
          type: 'string'
        }
      }
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const transactions = await this.runtime.transaction.getUnconfirmedTransactionList(true)
    if (query.senderPublicKey || query.address) {
      const result = []
      for (let i = 0; i < transactions.length; i++) {
        if (transactions[i].senderPublicKey === query.senderPublicKey ||
                    transactions[i].recipientId === query.address) { // wxm block database
          result.push(transactions[i])
        }
      }

      return { success: true, transactions: result }
    } else {
      return { success: true, transactions }
    }
  }

  async getGet (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        id: {
          type: 'string',
          minLength: 1,
          maxLength: 128
        }
      },
      required: ['id']
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const unconfirmedTransaction = await this.runtime.transaction.getUnconfirmedTransaction(query.id)
    if (!unconfirmedTransaction) {
      throw new Error('Transaction not found')
    }

    return { success: true, transaction: unconfirmedTransaction }
  }
}

export default RootRouter
