/*
 * @Author: shuai
 * @Date: 2018-11-13 11:34:49 
 * @Last Modified by: shuai
 * @Last Modified time: 2018-11-14 14:24:01
 */
const Sequelize = require('sequelize');

module.exports = function (connection) {
	return connection.define("tr", {
		id: {
			type: Sequelize.STRING(64),
			primaryKey: true,
			allowNull: false
        },
		block_id: {
			type: Sequelize.STRING(64),
			allowNull: false
        },
        block_height: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
		type: {
			type: Sequelize.INTEGER,
			allowNull: false
		},
		timestamp: {
			type: Sequelize.INTEGER,  // 原来是 INT
			allowNull: false
		},
		sender_public_key: {
			type: Sequelize.STRING(64),  // 原来是 BINARY(32)
			allowNull: false
		},
		sender_id: {
			type: Sequelize.STRING(50),   // 类型上不存在 VARCHAR
			allowNull: false
		},
		recipient_id: {
			type: Sequelize.STRING(1024),   // 类型上不存在 VARCHAR
		},
		amount: {
			type: Sequelize.BIGINT,
			allowNull: false
		},
		fee: {
			type: Sequelize.BIGINT,
			allowNull: false
		},
		signature: {
			type: Sequelize.STRING(128),  // 原来是 BINARY(64)
			allowNull: false
		},
		sign_signature: {
			type: Sequelize.STRING(64),  // 原来是 BINARY(64)
		},
		requester_public_key: {
			type: Sequelize.STRING(32),  // 原来是 BINARY(32)
		},
		signatures: {
			type: Sequelize.TEXT,
		},
		args: {
			type: Sequelize.STRING(4098),   // 类型上不存在 VARCHAR
		},
		message: {
			type: Sequelize.STRING(256),   // 类型上不存在 VARCHAR
		},
	}, {
		timestamps: false,
		indexes: [
			{
				fields: ['block_id']
			},
			{
				fields: ['sender_id']
			},
			{
				fields: ['recipient_id']
			},
			{
				fields: ['sender_public_key']
			},
			{
				fields: ['type']
			},
			{
				fields: ['timestamp']
			}
		]
	});
}