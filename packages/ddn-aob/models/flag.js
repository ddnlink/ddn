const Sequelize = require('sequelize');

module.exports = (connection) => {
  return connection.define('flag', {
    currency: {
      type: Sequelize.STRING(22),
      allowNull: false,
    },
    flag: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    flag_type: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    transaction_id: {
      type: Sequelize.STRING(64),
      allowNull: false,
      primaryKey: true,
    },
  }, {
    timestamps: false,
  });
}