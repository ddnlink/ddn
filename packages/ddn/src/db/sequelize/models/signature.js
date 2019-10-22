const Sequelize = require('sequelize');

module.exports = function(connection) {
    return connection.define("signature", {
        transaction_id: {
            type: Sequelize.STRING(64),
            primaryKey: true,
            allowNull: false
        },
        public_key: {
            type: Sequelize.STRING(32),
            allowNull: false
        }
    }, {
        timestamps: false
    });
}