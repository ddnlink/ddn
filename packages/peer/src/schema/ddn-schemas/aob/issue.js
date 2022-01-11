// export default {
//   type: 'object',
//   additionalProperties: false, // 必须是下面包含的字段，不是会提示错误
//   properties: {
//     currency: {
//       type: 'string'
//     },
//     amount: {
//       type: 'sring'
//     }

//   },
// }
export default {
  type: 'object',
  additionalProperties: false, // 必须是下面包含的字段，不是会提示错误
  properties: {
    currency: {
      type: 'string'
    },
    amount: {
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
  required: ['currency', 'amount']
}
