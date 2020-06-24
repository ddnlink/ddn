/**
 * 节点数据库
 */
import Sequelize from 'sequelize'

export default connection => connection.define('vote', {
  votes: {
    type: Sequelize.TEXT // 原类型:TEXT
  },
  transaction_id: {
    type: Sequelize.STRING(64), // 原类型:VARCHAR,size:64
    primaryKey: true,
    allowNull: false
  }
}, {
  timestamps: false
})
