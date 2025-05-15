/**
 * 序列模型 - 用于存储自增ID序列
 */
import Sequelize from 'sequelize'

export default connection => {
  return connection.define('sequence', {
    key: {
      type: Sequelize.STRING(255),
      primaryKey: true,
      allowNull: false
    },
    value: {
      type: Sequelize.TEXT,
      allowNull: false
    }
  }, {
    timestamps: false,
    tableName: 'sequences'
  })
}