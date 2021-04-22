import Sequelize from 'sequelize'

export default connection =>
  connection.define(
    'delegate',
    {
      username: {
        type: Sequelize.STRING(20), // 原类型:VARCHAR,size:20
        allowNull: false
      },
      transaction_id: {
        type: Sequelize.STRING(255), // 原类型:VARCHAR,size:255
        allowNull: false,
        primaryKey: true
      }
    },
    {
      timestamps: false
    }
  )
