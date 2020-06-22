import Sequelize from 'sequelize'

export default connection => {
  return connection.define('transfer', {
    transaction_id: {
      type: Sequelize.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    currency: {
      type: Sequelize.STRING(22),
      allowNull: false
    },
    amount: {
      type: Sequelize.STRING(50),
      allowNull: false
    }
  }, {
    timestamps: false
  })
}
