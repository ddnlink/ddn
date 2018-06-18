var fs = require("fs");
var ddnJS = require('ddn-js');

var accountHelper = require("../helpers/account.js");
var cryptoLib = require("../lib/crypto.js");
var config = require("../config");

var globalOptions;

function writeFileSync(file, obj) {
	var content = (typeof obj === "string" ? obj : JSON.stringify(obj, null, 2));
	fs.writeFileSync(file, content, "utf8");
}

function appendFileSync(file, obj) {
	var content = (typeof obj === "string" ? obj : JSON.stringify(obj, null, 2));
	fs.appendFileSync(file, content, "utf8");
}

// 用于分割原始100亿
function genUsers(options) {
	var wan = 10000;
	var users = []
	// 5000万的150个，75亿
	for (var i = 1; i < 151; i++) {
		var user = accountHelper.account(cryptoLib.generateSecret());
		user.username = "team_user_" + i;
		user.amount = 5000 * wan;
		users.push(user);
	}

	// 2000万的75个, 15亿
	for (var i = 151; i < 226; i++) {
		var user = accountHelper.account(cryptoLib.generateSecret());
		user.username = "team_user_" + i;
		user.amount = 2000 * wan;
		users.push(user);
	}

	// 1000万的100个，10亿
	for (var i = 226; i < 326; i++) {
		var user = accountHelper.account(cryptoLib.generateSecret());
		user.username = "team_user_" + i;
		user.amount = 1000 * wan;
		users.push(user);
	}

	// 基金账号
	var user = accountHelper.account(cryptoLib.generateSecret());
	user.username = ddnJS.constants.nethash[config.nethash].tokenName + " Foundation";
	user.amount = 0
	users.push(user);

	var teamusers = users.map(function (i) {
		delete i.keypair;
		return i;
	});

	var liststr = "";
	var teamfile = users.map(function (i) {
		var str = i.address + "  " + i.amount + "\n"
		liststr += str;
		return liststr;
	});

	var logFile = "./teams.log";
	writeFileSync(logFile, "team account:\n");
	appendFileSync(logFile, teamusers);
	writeFileSync("./teams.txt", liststr);
	console.log('New team and related users have been created, please see the two file: ./teams.log and ./teams.txt');
}

// Used to create random Nethash
function randomNethash() {
	var nethash = randomName(8, '', 'abcdefghijklmnopqrstuvwxyz0123456789');
	console.log(nethash);
	return;
}

function randomName() {
	// Convert arguments to Array
	var array = Array.prototype.slice.apply(arguments);

	var size = 16;
	if (array.length > 2) {
		size = array.shift();
	}

	var name = array[0];
	var random = array[1];

	if (name.length > 0) {
		size = size - 1
	}

	for (var i = 0; i < size; i++) {
		name += random.charAt(Math.floor(Math.random() * random.length));
	}

	return name;
}

module.exports = function (program) {
	globalOptions = program;

	program
		.command("createUsers")
		.description("create some accounts")
		.action(genUsers);

	program
		.command("createNethash")
		.description("create nethash")
		.action(randomNethash);
}