/*
 * @Author:
 * @Date: 2018-11-13 11:34:49
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2020-02-13 22:48:39
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
      transaction_id: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      owner: {
        type: Sequelize.STRING(64), // 原来是 BINARY(32)
        allowNull: false
      },
      gas_limit: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      desc: {
        type: Sequelize.STRING(256),
        allowNull: false
      },
      version: {
        type: Sequelize.STRING(128), // 原来是 BINARY(64)
        allowNull: false
      },
      state: {
        type: Sequelize.STRING(32) // 原来是 BINARY(32)
      },
      code: {
        type: Sequelize.TEXT
      },
      metadata: {
        type: Sequelize.STRING(256) // 类型上不存在 VARCHAR
      },
      timestamp: {
        type: Sequelize.INTEGER, // 原来是 INT
        allowNull: false
      }
    },
    {
      timestamps: false,
      indexes: [
        {
          fields: ['transaction_id']
        },
        {
          fields: ['owner']
        }
      ]
    }
  )
}
