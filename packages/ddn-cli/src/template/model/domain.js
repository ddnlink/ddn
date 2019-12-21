module.exports = {
  name: 'domains',
  fields: [
    {
      name: 'address',
      type: 'String',
      length: 256,
      not_null: true,
      index: true
    },
    {
      name: 'ip',
      type: 'String',
      length: 15
    },
    {
      name: 'owner',
      type: 'String',
      length: 50,
      not_null: true,
    },
    {
      name: 'suffix',
      type: 'String',
      length: 10,
      not_null: true,
      index: true
    }
  ]
}