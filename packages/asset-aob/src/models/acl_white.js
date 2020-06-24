import Sequelize from 'sequelize'

export default connection => connection.define('acl_white', {
  currency: {
    type: Sequelize.STRING(22),
    allowNull: false
  },
  address: {
    type: Sequelize.STRING(128),
    allowNull: false
  }
}, {
  timestamps: false,
  freezeTableName: true,
  tableName: 'acl_white',
  indexes: [
    {
      fields: ['currency', 'address']
    }
  ]
})
