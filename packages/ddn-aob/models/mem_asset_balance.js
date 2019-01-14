const Sequelize = require('sequelize');

module.exports = function(connection) {
    return connection.define("mem_asset_balance", {
        address: {
            type: Sequelize.STRING(128),
            allowNull: false
        },
        balance: {
            type: Sequelize.STRING(50)
        },
        currency: {
            type: Sequelize.STRING(22)
        }
    }, {
        timestamps: false,
        indexes: [
            {
                fields: ['address']
            }
        ]
    });
}