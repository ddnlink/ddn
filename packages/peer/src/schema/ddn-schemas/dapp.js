export default {
  type: 'object',
  additionalProperties: false, // 必须是下面包含的字段，不是会提示错误
  properties: {
    name: {
      type: 'string'
    },
    link: {
      type: 'string'
    },
    category: {
      type: 'string'
    },
    icon: {
      type: 'string'
    },
    tags: {
      type: 'string'
    },
    delegates: {
      type: 'string'
    },
    unlock_delegates: {
      type: 'int'
    },
    type: {
      type: 'int'
    },
    description: {
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
  required: ['name', 'link', 'category', 'delegates', 'unlock_delegates']
}
