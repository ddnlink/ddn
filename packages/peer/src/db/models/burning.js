import Sequelize from 'sequelize'

export default connection =>
  connection.define('net_energy_used', {
    tid: {
      type: Sequelize.STRING(64),
      allowNull: false,
      primaryKey: true
    },
    energy: {
      type: Sequelize.BIGINT,
      defaultValue: 0
    },
    ddn: {
      type: Sequelize.BIGINT,
      defaultValue: 0
    },
    height: {
      type: Sequelize.BIGINT,
      allowNull: false
    },
    address: {
      type: Sequelize.STRING(50),
      allowNull: false
    }
  })
