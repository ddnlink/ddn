const Sequelize = require('sequelize');

module.exports = function (connection) {
	return connection.define("acl_black", {
		currency: {
			type: Sequelize.STRING(22),
			allowNull: false
		},
		address: {
			type: Sequelize.STRING(128),
			allowNull: false
		},
	}, {
		timestamps: false,
        freezeTableName: true,
        tableName: 'acl_black',
		indexes: [
			{
				fields: ['currency', 'address']
			}
		]
	});
}