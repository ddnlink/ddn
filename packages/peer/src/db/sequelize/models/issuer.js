const Sequelize = require('sequelize');

module.exports = (connection) => {
  return connection.define('issuer', {
    name: {
      type: Sequelize.STRING(16), // 原类型:VARCHAR,size:16
      primaryKey: true,
      allowNull: false,
    },
    desc: {
      type: Sequelize.STRING(4096), // 原类型:VARCHAR,size:22
      allowNull: false,
    },
    issuer_id: {
      type: Sequelize.STRING(50), // 原类型:VARCHAR,size:50
    },
    transaction_id: {
      type: Sequelize.STRING(64), // 原类型:VARCHAR,size:64
      allowNull: false,
    },
  }, {
    timestamps: false,
    indexes: [{
        unique: true,
        fields: ['transaction_id']
      },
      {
        fields: ['issuer_id']
      }
    ]
  });
}