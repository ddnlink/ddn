/*
 * @Author: Tailor
 * @Date: 2018-10-08 11:34:49
 * @Last Modified time: 2023-03-22 16:48:39 
 */
import Sequelize from 'sequelize'

export default connection => {
  return connection.define(
    'contract_transfer',
    {
      id: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: true
      },
      // contract_id: {
      //   type: Sequelize.STRING(64),
      //   allowNull: true
      // },
      transactionId: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      height: { // block_height
        type: Sequelize.STRING(64),
        allowNull: false
      },
      senderId: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      recipientId: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      // gas: {
      //   type: Sequelize.INTEGER,
      //   allowNull: true
      // },
      amount: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(22)
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
          fields: ['id']
        },
        {
          fields: ['transactionId']
        }
      ]
    }
  )
}
