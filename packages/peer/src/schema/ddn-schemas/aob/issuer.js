export default {
  type: 'object',
  additionalProperties: false, // 必须是下面包含的字段，不是会提示错误
  properties: {
    name: {
      type: 'string'
    },
    desc: {
      type: 'string'
    },
    issuer_id: {
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
  required: ['name', 'issuer_id', 'desc']
}
