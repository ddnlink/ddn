export default {
  type: 'object',
  additionalProperties: false, // 必须是下面包含的字段，不是会提示错误
  properties: {
    dapp_id: {
      type: 'string'
    },
    currency: {
      type: 'string'
    },
    amount: {
      type: 'string'
    },
    deposit_sequence: {
      type: 'string'
    },
    transaction_id: {
      type: 'string'
    },
    transaction_type: {
      type: 'integer'
    },
    timestamp: {
      type: 'integer'
    }
  },
  required: ['dapp_id', 'currency']
}
