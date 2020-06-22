/**
 * 节点数据库
 */
import Sequelize from 'sequelize'

export default connection => connection.define('peer', {
  ip: {
    type: Sequelize.INTEGER, // 原类型:INTEGER
    allowNull: false,
    unique: 'peer_ip+port'
  },
  port: {
    type: Sequelize.INTEGER, // 原类型:TINYINT
    allowNull: false,
    unique: 'peer_ip+port'
  },
  state: {
    type: Sequelize.INTEGER, // 原类型:TINYINT
    allowNull: false
  },
  os: {
    type: Sequelize.STRING(64) // 原类型:VARCHAR,size:64
  },
  version: {
    type: Sequelize.STRING(11) // 原类型:VARCHAR,size:11
  },
  clock: {
    type: Sequelize.INTEGER // 原类型:INT
  }
}, {
  timestamps: false,
  indexes: [
    {
      unique: true,
      name: 'peer_index',
      fields: ['ip', 'port']
    }
  ]
})
