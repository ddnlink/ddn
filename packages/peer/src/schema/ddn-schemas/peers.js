export default {
  type: 'object',
  properties: {
    state: {
      type: 'integer',
      minimum: 0,
      maximum: 3
    },
    os: {
      type: 'string'
    },
    version: {
      type: 'string'
    },
    limit: {
      type: 'integer',
      minimum: 0,
      maximum: 100
    },
    orderBy: {
      type: 'string'
    },
    offset: {
      type: 'integer',
      minimum: 0
    },
    port: {
      type: 'integer',
      minimum: 1,
      maximum: 65535
    }
  }
}
