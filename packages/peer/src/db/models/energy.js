/*
 * @Author: Tailor
 * @Date: 2023-11-30
 * @Last Modified time: 2023-11-30
 */
import Sequelize from 'sequelize'

export default connection => {
  return connection.define(
    'energy',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      address: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      lastUpdateHeight: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      createTime: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      updateTime: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    },
    {
      timestamps: false,
      indexes: [
        {
          fields: ['address']
        }
      ]
    }
  )
}
