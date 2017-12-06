var inquirer = require("inquirer");
var cryptoLib = require("../lib/crypto.js");
var accountHelper = require("../helpers/account.js");

async function genPubkey() {
	let result = await inquirer.prompt([
		{
			type: "password",
			name: "secret",
			message: "Enter secret of your testnet account"
		}
	]);
	var account = accountHelper.account(result.secret.trim());
	console.log("Public key: " + account.keypair.publicKey);
	console.log("Address: " + account.address);
}

async function genAccount() {
	let result = await inquirer.prompt([
		{
			type: "input",
			name: "amount",
			message: "Enter number of accounts to generate"
		}
	]);
	var n = parseInt(result.amount);
	var accounts = [];

	for (var i = 0; i < n; i++) {
		var a = accountHelper.account(cryptoLib.generateSecret());
		accounts.push({
			address: a.address,
			secret: a.secret,
			publicKey: a.keypair.publicKey
		});
	}
	console.log(accounts);
	console.log("Done");
}

module.exports = function (program) {
  program
		.command("crypto")
		.description("crypto operations")
		.option("-p, --pubkey", "generate public key from secret")
		.option("-g, --generate", "generate random accounts")
		.action(function (options) {
			(async function () {
				try {
					if (options.pubkey) {
						genPubkey();
					} else if (options.generate) {
						genAccount();
					} else {
						console.log("'node crypto -h' to get help");
					}
				} catch (e) {
					console.log(e)
				}
			})()
		});
}