import Sequelize from 'sequelize'

export default connection => connection.define('supervise', {
  transaction_id: { // 交易id
    type: Sequelize.STRING(22),
    primaryKey: true,
    allowNull: false
  },
  op: { // destroy（过滤整个内容）、harmless(从滤敏感词转标记为无害)
    type: Sequelize.STRING(128),
    allowNull: false
  },
  txHash: { // 需要屏蔽交易的id
    type: Sequelize.STRING(128),
    allowNull: false
  }
}, {
  timestamps: false,
  freezeTableName: true,
  tableName: 'supervise',
  indexes: [
    {
      fields: ['txHash', 'transaction_id']
    }
  ]
})
