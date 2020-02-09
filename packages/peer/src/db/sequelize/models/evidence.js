/*
 * @Author: shuai 
 * @Date: 2018-11-14 13:32:47 
 * @Last Modified by: shuai
 * @Last Modified time: 2018-11-14 14:33:35
 */

const Sequelize = require('sequelize');

module.exports = function (connection) {
	return connection.define("evidence", {
		ipid: {
			type: Sequelize.STRING(64),
			allowNull: false
		},
		title: {
			type: Sequelize.STRING(128),
			allowNull: false
		},
		description: {
			type: Sequelize.STRING(160),
		},
		hash: {
			type: Sequelize.STRING(128),
			allowNull: false
		},
		tags: {
			type: Sequelize.STRING(40),
			allowNull: false
		},
		author: {
			type: Sequelize.STRING(20),
			allowNull: false
		},
		url: {
			type: Sequelize.STRING(256),
			allowNull: false
		},
		size: {
			type: Sequelize.STRING(10),
		},
		type: {
			type: Sequelize.STRING(16),
			allowNull: false
		},
    timestamp: {
			type: Sequelize.INTEGER,
			allowNull: false
		},
    transaction_id: {
			type: Sequelize.STRING(64),
			allowNull: false
		},
	}, {
        timestamps: false,
        freezeTableName: true,
        tableName: 'evidence',
        indexes: [
			{
				fields: ['transaction_id']
			}
		]
	});
}