/*
 * @Author: shuai
 * @Date: 2018-11-14 13:32:47
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2020-02-13 22:43:51
 */

import Sequelize from 'sequelize'

export default connection => {
  return connection.define('addition', {
    json: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    transaction_id: {
      type: Sequelize.STRING(64),
      allowNull: false
    }
  }, {
    freezeTableName: true,
    tableName: 'addition',
    timestamps: false
  })
}
