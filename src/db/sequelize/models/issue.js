/**
 * 节点数据库
 */
const Sequelize = require('sequelize');

module.exports = (connection) => {
  return connection.define('issue', {
    currency: {
      type: Sequelize.STRING(22), // 原类型:VARCHAR,size:22
      allowNull: false,
    },
    amount: {
      type: Sequelize.STRING(50), // 原类型:VARCHAR,size:50
      allowNull: false,
    },
    transaction_id: {
      type: Sequelize.STRING(64), // 原类型:VARCHAR,size:64
      allowNull: false,
      primaryKey: true,
    },
  }, {
    timestamps: false
  });
}