import Sequelize from 'sequelize'

export default connection => {
  return connection.define('signature', {
    transaction_id: {
      type: Sequelize.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    publicKey: {
      type: Sequelize.STRING(32),
      allowNull: false
    }
  }, {
    timestamps: false
  })
}
