export default {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      length: 64
    },
    height: {
      type: 'integer',
      minimum: 0
    },
    round: {
      type: 'integer', 
      minimum: 0
    },
    snapshot_data: {
      type: 'object',
      properties: {
        height: {
          type: 'integer'
        },
        round: {
          type: 'integer'
        },
        delegates: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        blocks: {
          type: 'array',
          items: {
            type: 'object'
          }
        },
        timestamp: {
          type: 'integer'
        }
      },
      required: ['height', 'round', 'delegates', 'blocks', 'timestamp']
    },
    created_at: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'height', 'round', 'snapshot_data', 'created_at']
} 