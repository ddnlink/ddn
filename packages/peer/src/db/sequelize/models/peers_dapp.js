import Sequelize from 'sequelize'

export default connection => {
  return connection.define('peers_dapp', {
    peer_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    dapp_id: {
      type: Sequelize.STRING(20),
      allowNull: false
    }
  }, {
    timestamps: false,
    freezeTableName: true,
    tableName: 'peers_dapp',
    indexes: [
      {
        unique: true,
        fields: ['peer_id', 'dapp_id']
      }
    ]
  })
}
