import Sequelize from 'sequelize'

export default connection => connection.define('mem_accounts2multisignature', {
  account_id: {
    type: Sequelize.STRING(50), // 原类型:varchar,size:50
    allowNull: false
  },
  dependent_id: {
    type: Sequelize.STRING(64), // 原类型:varchar,size:64
    allowNull: false
  }
}, {
  timestamps: false
})
