import Sequelize from 'sequelize'

export default connection => {
  return connection.define('mem_round', {
    round: {
      type: Sequelize.INTEGER
    },
    block_id: {
      type: Sequelize.STRING(64)
    },
    delegate: {
      type: Sequelize.STRING(64)
    },
    address: {
      type: Sequelize.STRING(50)
    },
    amount: {
      type: Sequelize.STRING(32)
    }
  }, {
    timestamps: false,
    freezeTableName: true,
    tableName: 'mem_round'
  })
}
