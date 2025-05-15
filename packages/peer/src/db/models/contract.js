/*
 * @Author: Tailor
 * @Date: 2018-10-08 11:34:49
 * @Last Modified time: 2023-03-22 16:48:39 
 */
import Sequelize from 'sequelize'

export default connection => {
  return connection.define(
    'contract',
    {
      id: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      transactionId: { // tid
        type: Sequelize.STRING(64),
        allowNull: false
      },
      address: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      ownerId: { // owner
        type: Sequelize.STRING(64),
        allowNull: false
      },
      consumeOwnerEnergy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0
      },
      // gasLimit: {
      //   type: Sequelize.INTEGER,
      //   allowNull: false
      // },
      desc: {
        type: Sequelize.STRING(256),
        allowNull: false
      },
      version: {
        type: Sequelize.STRING(128), 
        allowNull: false
      },
      vmVersion: {
        type: Sequelize.STRING(128), 
        allowNull: false
      },
      state: {
        type: Sequelize.STRING(32)
      },
      code: {
        type: Sequelize.TEXT
      },
      metadata: {
        type: Sequelize.STRING(256) 
      },
      timestamp: {
        type: Sequelize.INTEGER, 
        allowNull: false
      }
    },
    {
      timestamps: false,
      indexes: [
        {
          fields: ['transactionId']
        },
        {
          fields: ['ownerId']
        }
      ]
    }
  )
}
