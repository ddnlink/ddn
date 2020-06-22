import Sequelize from 'sequelize'

export default connection => connection.define('mem_account', {
  username: {
    type: Sequelize.STRING(20) // 原类型:varchar,size:20
  },
  is_delegate: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  u_isdelegate: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  second_signature: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  u_second_signature: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  u_username: {
    type: Sequelize.STRING(20) // 原类型:varchar,size:20
  },
  address: {
    type: Sequelize.STRING(50), // 原类型:varchar,size:50
    primaryKey: true,
    allowNull: false
  },
  publicKey: {
    type: Sequelize.STRING(64) // 原类型:binary,size:32
  },
  second_public_key: {
    type: Sequelize.STRING(32) // 原类型:binary,size:32
  },
  balance: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  u_balance: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  vote: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  rate: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  delegates: {
    type: Sequelize.TEXT // 原类型:text
  },
  u_delegates: {
    type: Sequelize.TEXT // 原类型:text
  },
  multisignatures: {
    type: Sequelize.TEXT // 原类型:text
  },
  u_multisignatures: {
    type: Sequelize.TEXT // 原类型:text
  },
  multimin: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  u_multimin: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  multilifetime: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  u_multilifetime: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  block_id: {
    type: Sequelize.STRING(64) // 原类型:varchar,size:64
  },
  nameexist: {
    type: Sequelize.INTEGER, // 原类型:tinyint,size:1
    defaultValue: 0
  },
  u_nameexist: {
    type: Sequelize.INTEGER, // 原类型:tinyint,size:1
    defaultValue: 0
  },
  producedblocks: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  missedblocks: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  fees: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  rewards: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  },
  lock_height: {
    type: Sequelize.BIGINT, // 原类型:bigint
    defaultValue: 0
  }
}, {
  timestamps: false,
  indexes: [{
    fields: ['balance']
  }]
})
