import Sequelize from 'sequelize'

export default function (connection) {
  return connection.define('mem_org', {
    transaction_id: {
      type: Sequelize.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    org_id: {
      type: Sequelize.STRING(20),
      allowNull: false
    },
    name: {
      type: Sequelize.STRING(64)
    },
    address: {
      type: Sequelize.STRING(128)
    },
    tags: {
      type: Sequelize.STRING(40),
      allowNull: false
    },
    url: {
      type: Sequelize.STRING(256)
    },
    state: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    timestamp: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: false,
    freezeTableName: true,
    tableName: 'mem_org',
    indexes: [
      {
        unique: true,
        fields: ['org_id']
      },
      {
        fields: ['address']
      },
      {
        fields: ['state']
      }
    ]
  })
}
