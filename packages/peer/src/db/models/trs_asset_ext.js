import Sequelize from 'sequelize'

export default connection => {
  return connection.define(
    'trs_asset_ext',
    {
      transaction_id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        allowNull: false
      },
      json_ext: {
        type: Sequelize.TEXT
      }
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: 'trs_asset_ext'
    }
  )
}
