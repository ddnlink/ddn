/*
 * @Author: shuai 
 * @Date: 2018-11-14 13:32:47 
 * @Last Modified by: shuai
 * @Last Modified time: 2018-11-14 14:19:42
 */

const Sequelize = require('sequelize');

module.exports = function (connection) {
	return connection.define("asset", {
		name: {
			type: Sequelize.STRING(22),
			allowNull: false
		},
		desc: {
			type: Sequelize.STRING(4096),
			allowNull: false
		},
		maximum: {
			type: Sequelize.STRING(50),
			allowNull: false
		},
		precision: {
			type: Sequelize.INTEGER,
			allowNull: false
		},
		strategy: {
			type: Sequelize.TEXT,
		},
		quantity: {
			type: Sequelize.STRING(50),
		},
		issuer_name: {
			type: Sequelize.STRING(16),
			allowNull: false
		},
		acl: {
			type: Sequelize.INTEGER,
		},
		writeoff: {
			type: Sequelize.INTEGER,
		},
		allow_writeoff: {
			type: Sequelize.INTEGER,
		},
		allow_whitelist: {
			type: Sequelize.INTEGER,
		},
		allow_blacklist: {
			type: Sequelize.INTEGER,
		},
    	transaction_id: {
      		type: Sequelize.STRING(64),
			allowNull: false
    	}
	}, {
		timestamps: false,
		indexes: [
			{
				fields: ['transaction_id']
			},
			{
				fields: ['issuer_name']
			}
		]
	});
}