/*
 * @Author: Tailor
 * @Date: 2023-11-30
 * @Last Modified time: 2023-11-30
 */
import Sequelize from 'sequelize'

export default connection => {
  return connection.define(
    'energy_burning',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tid: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true
      },
      address: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      ddn: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      height: {
        type: Sequelize.BIGINT,
        allowNull: false
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
          fields: ['tid']
        },
        {
          fields: ['address']
        }
      ]
    }
  )
}
