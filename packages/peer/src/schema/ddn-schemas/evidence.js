export default {
  type: 'object',
  additionalProperties: false, // 必须是下面包含的字段，不是会提示错误
  properties: {
    short_hash: {
      type: 'string',
      length: 64
    },
    title: {
      type: 'string',
      length: 128
    },
    address: {
      type: 'string',
      length: 128
    },
    hash: {
      type: 'string',
      length: 128
    },
    tags: {
      type: 'string'
    },
    author: {
      type: 'string',
      length: 20
    },
    source_address: {
      type: 'string',
      length: 256
    },
    type: {
      type: 'string',
      length: 256
      // enum: ['video', 'image', 'videostram', 'voice']
    },
    size: {
      type: 'string',
      length: 64
    },
    metadata: {
      type: 'string'
    },
    time: {
      type: 'string'
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
  required: ['address', 'hash', 'author', 'type']
}
