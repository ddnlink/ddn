/*
 * @Author:
 * @Date: 2018-11-13 11:34:49
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2020-02-13 22:48:39
 */
import Sequelize from 'sequelize'

export default connection => {
  return connection.define(
    'contract_result',
    {
      transaction_id: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false
      },
      contract_id: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      success: {
        type: Sequelize.INTEGER, // 原来是 BINARY(32)
        allowNull: false
      },
      error: {
        type: Sequelize.STRING(128)
      },
      gas: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      stateChangesHash: {
        type: Sequelize.STRING(64)
      },
      data: {
        type: Sequelize.TEXT
      }
    },
    {
      timestamps: false,
      indexes: [
        {
          fields: ['transaction_id']
        },
        {
          fields: ['contract_id']
        }
      ]
    }
  )
}
