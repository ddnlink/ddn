import Sequelize from 'sequelize'

export default connection => connection.define('block', {
  id: {
    type: Sequelize.STRING(64),
    primaryKey: true,
    allowNull: false
  },
  height: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  previous_block: {
    type: Sequelize.STRING(64)
  },
  number_of_transactions: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  total_amount: {
    type: Sequelize.STRING(32),
    allowNull: false
  },
  total_fee: {
    type: Sequelize.STRING(32),
    allowNull: false
  },
  reward: {
    type: Sequelize.STRING(32),
    allowNull: false
  },
  payload_hash: {
    type: Sequelize.STRING(64),
    allowNull: false
  },
  payload_length: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  generator_public_key: {
    type: Sequelize.STRING(64),
    allowNull: false
  },
  block_signature: {
    type: Sequelize.STRING(128),
    allowNull: false
  },
  timestamp: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  version: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['height']
    },
    {
      unique: true,
      fields: ['previous_block']
    },
    {
      fields: ['generator_public_key']
    }
  ]
})
