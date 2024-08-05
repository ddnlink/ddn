export default {
  type: 'object',
  additionalProperties: false, // 必须是下面包含的字段，不是会提示错误
  properties: {
    title: {
      type: 'string'
    },
    sender_address: {
      type: 'string'
    },
    received_address: {
      type: 'string'
    },
    url: {
      type: 'string'
    },
    price: {
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
  }
}
