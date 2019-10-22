/*
 * @Author: shuai 
 * @Date: 2018-11-14 13:32:47 
 * @Last Modified by: shuai
 * @Last Modified time: 2018-11-14 14:31:57
 */

const Sequelize = require('sequelize');

module.exports = function (connection) {
	return connection.define("addition", {
		json: {
			type: Sequelize.TEXT,
			allowNull: false
		},
		transaction_id: {
			type: Sequelize.STRING(64),
			allowNull: false
		},
	}, {
        freezeTableName: true,
        tableName: 'addition',
		timestamps: false,
	});
}