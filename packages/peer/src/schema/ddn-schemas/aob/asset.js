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
    maximum: {
      type: 'string'
    },
    quantity: {
      type: 'string'
    },
    issuer_name: {
      type: 'string'
    },
    strategy: {
      type: 'string'
    },
    precision: {
      type: 'integer'
    },
    acl: {
      type: 'integer'
    },
    writeoff: {
      type: 'integer'
    },
    allow_writeoff: {
      type: 'string'
    },
    allow_whitelist: {
      type: 'string'
    },
    allow_blacklist: {
      type: 'string'
    },
    // 默认存储数据时会添加这些字段，所以要加上下面字段
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
  required: ['issuer_name', 'name', 'desc']
}
