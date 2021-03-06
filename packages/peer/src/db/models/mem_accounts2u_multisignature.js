import Sequelize from 'sequelize'

export default connection =>
  connection.define(
    'mem_accounts2u_multisignature',
    {
      account_id: {
        type: Sequelize.STRING(255), // 原类型:varchar,size:50
        allowNull: false
      },
      dependent_id: {
        type: Sequelize.STRING(255), // 原类型:varchar,size:64
        allowNull: false
      }
    },
    {
      timestamps: false
    }
  )
