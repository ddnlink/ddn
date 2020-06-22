import Sequelize from 'sequelize'

export default connection => connection.define('forks_stat', {
  delegate_public_key: {
    type: Sequelize.STRING(32), // 原类型:BINARY,size:32
    allowNull: false
  },
  block_timestamp: {
    type: Sequelize.INTEGER, // 原类型： INT
    allowNull: false
  },
  block_id: {
    type: Sequelize.STRING(64), // 原类型:VARCHAR,size:64
    allowNull: false
  },
  block_height: {
    type: Sequelize.INTEGER, // 原类型:INT
    allowNull: false
  },
  previous_block: {
    type: Sequelize.STRING(64), // 原类型:VARCHAR,size:64
    allowNull: false
  },
  cause: {
    type: Sequelize.INTEGER, // 原类型:INT
    allowNull: false
  }
}, {
  timestamps: false,
  freezeTableName: true,
  tableName: 'forks_stat'
})
