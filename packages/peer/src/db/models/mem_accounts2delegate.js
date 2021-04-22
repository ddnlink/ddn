import Sequelize from 'sequelize'

export default connection =>
  connection.define(
    'mem_accounts2delegate',
    {
      account_id: {
        type: Sequelize.STRING(255), // 原类型:varchar,size:255
        allowNull: false
      },
      dependent_id: {
        type: Sequelize.STRING(255), // 原类型:varchar,size:255
        allowNull: false
      }
    },
    {
      timestamps: false
    }
  )
