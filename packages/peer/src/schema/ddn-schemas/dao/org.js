export default {
  type: 'object',
  additionalProperties: false, // 必须是下面包含的字段，不是会提示错误
  properties: {
    org_id: {
      type: 'string'
    },
    name: {
      type: 'string'
    },
    address: {
      type: 'string'
    },
    tags: {
      type: 'string'
    },
    url: {
      type: 'string'
    },
    state: {
      type: 'integer'
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
  required: ['tags', 'state', 'org_id']
}
