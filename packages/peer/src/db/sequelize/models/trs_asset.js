import Sequelize from 'sequelize'

export default connection => {
  return connection.define('trs_asset', {
    transaction_id: {
      type: Sequelize.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    transaction_type: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    str1: {
      type: Sequelize.STRING(32)
    },
    str2: {
      type: Sequelize.STRING(64)
    },
    str3: {
      type: Sequelize.STRING(64)
    },
    str4: {
      type: Sequelize.STRING(128)
    },
    str5: {
      type: Sequelize.STRING(128)
    },
    str6: {
      type: Sequelize.STRING(256)
    },
    str7: {
      type: Sequelize.STRING(256)
    },
    str8: {
      type: Sequelize.STRING(512)
    },
    str9: {
      type: Sequelize.STRING(512)
    },
    str10: {
      type: Sequelize.STRING(1024)
    },
    int1: {
      type: Sequelize.INTEGER
    },
    int2: {
      type: Sequelize.INTEGER
    },
    int3: {
      type: Sequelize.INTEGER
    },
    timestamp1: {
      type: Sequelize.DATE
    },
    timestamp2: {
      type: Sequelize.DATE
    },
    timestamp: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: false,
    freezeTableName: true,
    tableName: 'trs_asset',
    indexes: [
      {
        fields: ['str1']
      },
      {
        fields: ['str2']
      },
      {
        fields: ['str3']
      },
      {
        fields: ['str4']
      },
      {
        fields: ['int1']
      },
      {
        fields: ['int2']
      },
      {
        fields: ['timestamp1']
      }
    ]
  })
}
