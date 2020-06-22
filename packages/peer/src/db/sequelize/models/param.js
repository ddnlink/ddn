import Sequelize from 'sequelize'

export default connection => {
  return connection.define('param', {
    name: {
      type: Sequelize.STRING(32),
      primaryKey: true,
      allowNull: false
    },
    value: {
      type: Sequelize.STRING(128)
    }
  }, {
    timestamps: false
  })
}
