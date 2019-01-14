const Sequelize = require('sequelize');

module.exports = function (connection) {
	return connection.define("acl", {
		currency: {
			type: Sequelize.STRING(22),
			allowNull: false
		},
		flag: {
			type: Sequelize.INTEGER,
			allowNull: false
		}, 
		operator: {
			type: Sequelize.CHAR(1),
			allowNull: false
		},
		list: {
			type: Sequelize.TEXT,
			allowNull: false
		},
		transaction_id: {
			type: Sequelize.STRING(64),
			allowNull: false
		},
	}, {
		timestamps: false,
		indexes: [
			{
				fields: ['transaction_id']
			}
		]
	});
}