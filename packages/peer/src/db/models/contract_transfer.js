/*
 * @Author:
 * @Date: 2018-11-13 11:34:49
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2020-02-13 22:48:39
 */
import Sequelize from 'sequelize'

export default connection => {
  return connection.define(
    'contract_transfer',
    {
      contract_id: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: true
      },
      transaction_id: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false
      },
      block_height: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false
      },
      sender_id: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      recipient_id: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      gas: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      amount: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(22)
      }
    },
    {
      timestamps: false,
      indexes: [
        {
          fields: ['transaction_id']
        }
      ]
    }
  )
}
