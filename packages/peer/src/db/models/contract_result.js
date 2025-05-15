/*
 * @Author: Tailor
 * @Date: 2018-10-08 11:34:49
 * @Last Modified time: 2023-03-22 16:48:39 
 */
import Sequelize from 'sequelize'

export default connection => {
  return connection.define(
    'contract_result',
    {
      transactionId: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false
      },
      contractId: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      success: {
        type: Sequelize.INTEGER,
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
      },
      timestamp: {
        type: Sequelize.INTEGER,
        allowNull: true
      }
    },
    {
      timestamps: false,
      indexes: [
        {
          fields: ['transactionId']
        },
        {
          fields: ['contractId']
        }
      ]
    }
  )
}
