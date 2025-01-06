import Sequelize from 'sequelize'

export default connection => {
  return connection.define(
    'snapshot',
    {
      id: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false
      },
      height: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      round: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      snapshot_data: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: 'snapshot',
      indexes: [
        {
          fields: ['height']
        },
        {
          fields: ['round'] 
        },
        {
          fields: ['created_at']
        }
      ]
    }
  )
} 