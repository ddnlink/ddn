export default {
  type: 'object',
  additionalProperties: false, // 必须是下面的字段，不是会提示错误
  properties: {
    type: {
      type: 'integer'
    },
    timestamp: {
      type: 'integer'
    },
    senderPublicKey: {
      type: 'string',
      format: 'publicKey'
    },
    requester_public_key: {
      type: 'string',
      format: 'publicKey'
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
    signature: {
      type: 'string',
      format: 'signature'
    },
    sign_signature: {
      type: 'string',
      format: 'signature'
    },
    asset: {
      type: 'object'
    },
    args: {
      type: 'array'
    },
    message: {
      type: 'string',
      maxLength: 256
    },
    nethash: {
      type: 'string'
    },
    signatures: {
      type: 'array'
    },
    id: {
      type: 'string'
    },
    block_id: {
      type: 'string'
    },
    block_height: {
      type: 'string'
    }
  },
  required: ['type', 'timestamp', 'senderPublicKey', 'signature']
}
