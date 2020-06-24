import Sequelize from 'sequelize'

export default connection => {
  return connection.define('multisignature', {
    transaction_id: {
      type: Sequelize.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    min: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    lifetime: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    keysgroup: {
      type: Sequelize.TEXT,
      allowNull: false
    }
  }, {
    timestamps: false
  })
}
