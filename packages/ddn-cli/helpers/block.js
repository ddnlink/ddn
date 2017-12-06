var crypto = require('crypto');
var fs = require('fs');
var cryptoLib = require('../lib/crypto.js');
var transactionsLib = require('../lib/transactions.js');
var accounts = require('./account.js');
var ByteBuffer = require('bytebuffer');

var sender = accounts.account(cryptoLib.generateSecret());

function getBytes(block, skipSignature) {
	var size = 4 + 4 + 8 + 4 + 8 + 8 + 8 + 4 + 32 + 32 + 64;

	var bb = new ByteBuffer(size, true);
	bb.writeInt(block.version);
	bb.writeInt(block.timestamp);

	if (block.previousBlock) {
		bb.writeString(block.previousBlock)
	} else {
		bb.writeString('0')
	}

	bb.writeInt(block.numberOfTransactions);
	bb.writeLong(block.totalAmount);
	bb.writeLong(block.totalFee);
	bb.writeLong(block.reward);

	bb.writeInt(block.payloadLength);

	var payloadHashBuffer = new Buffer(block.payloadHash, 'hex');
	for (var i = 0; i < payloadHashBuffer.length; i++) {
		bb.writeByte(payloadHashBuffer[i]);
	}

	var generatorPublicKeyBuffer = new Buffer(block.generatorPublicKey, 'hex');
	for (var i = 0; i < generatorPublicKeyBuffer.length; i++) {
		bb.writeByte(generatorPublicKeyBuffer[i]);
	}

	if (!skipSignature && block.blockSignature) {
		var blockSignatureBuffer = new Buffer(block.blockSignature, 'hex');
		for (var i = 0; i < blockSignatureBuffer.length; i++) {
			bb.writeByte(blockSignatureBuffer[i]);
		}
	}

	bb.flip();
	var b = bb.toBuffer();

	return b;
}

module.exports = {
	getBytes: getBytes,
	new: function (genesisAccount, dapp, accountsFile) {
		var payloadLength = 0,
			payloadHash = crypto.createHash('sha256'),
			transactions = [],
			totalAmount = 0,
			delegates = [];

		// fund recipient account
		if (accountsFile && fs.existsSync(accountsFile)) {
			var lines = fs.readFileSync(accountsFile, 'utf8').split('\n');
			for (var i in lines) {
				var parts = lines[i].split('  ');
				if (parts.length != 2) {
					console.error('Invalid recipient balance format');
					process.exit(1);
				}
				var trs = {
					type: 0,
					amount: Number(parts[1]) * 100000000,
					fee: 0,
					timestamp: 0,
					recipientId: parts[0],
					senderId: sender.address,
					senderPublicKey: sender.keypair.publicKey
				};
				totalAmount += trs.amount;

				var bytes = transactionsLib.getTransactionBytes(trs);
				trs.signature = cryptoLib.sign(sender.keypair, bytes);
				bytes = transactionsLib.getTransactionBytes(trs);
				trs.id = cryptoLib.getId(bytes);

				transactions.push(trs);
			}
		} else {
			var balanceTransaction = {
				type: 0,
				amount: 10000000000000000,
				fee: 0,
				timestamp: 0,
				recipientId: genesisAccount.address,
				senderId: sender.address,
				senderPublicKey: sender.keypair.publicKey
			};

			totalAmount += balanceTransaction.amount;

			var bytes = transactionsLib.getTransactionBytes(balanceTransaction);
			balanceTransaction.signature = cryptoLib.sign(sender.keypair, bytes);
			bytes = transactionsLib.getTransactionBytes(balanceTransaction);
			balanceTransaction.id = cryptoLib.getId(bytes);

			transactions.push(balanceTransaction);
		}

		// make delegates
		for (var i = 0; i < 101; i++) {
			var delegate = accounts.account(cryptoLib.generateSecret());
			delegates.push(delegate);

			var username = "ebooker_" + (i + 1);

			var transaction = {
				type: 2,
				amount: 0,
				fee: 0,
				timestamp: 0,
				recipientId: null,
				senderId: delegate.address,
				senderPublicKey: delegate.keypair.publicKey,
				asset: {
					delegate: {
						username: username
					}
				}
			}

			bytes = transactionsLib.getTransactionBytes(transaction);
			transaction.signature = cryptoLib.sign(sender.keypair, bytes);
			bytes = transactionsLib.getTransactionBytes(transaction);
			transaction.id = cryptoLib.getId(bytes);

			transactions.push(transaction);
		}

		// make votes
		var votes = delegates.map(function (delegate) {
			return "+" + delegate.keypair.publicKey;
		});

		var voteTransaction = {
			type: 3,
			amount: 0,
			fee: 0,
			timestamp: 0,
			recipientId: null,
			senderId: genesisAccount.address,
			senderPublicKey: genesisAccount.keypair.publicKey,
			asset: {
				vote: {
					votes: votes
				}
			}
		}

		bytes = transactionsLib.getTransactionBytes(voteTransaction);
		voteTransaction.signature = cryptoLib.sign(genesisAccount.keypair, bytes);
		bytes = transactionsLib.getTransactionBytes(voteTransaction);
		voteTransaction.id = cryptoLib.getId(bytes);

		transactions.push(voteTransaction);

		var dappTransaction = null;
		if (dapp) {
			dappTransaction = {
				type: 5,
				amount: 0,
				fee: 0,
				timestamp: 0,
				recipientId: null,
				senderId: genesisAccount.address,
				senderPublicKey: genesisAccount.keypair.publicKey,
				asset: {
					dapp: dapp
				}
			};

			bytes = transactionsLib.getTransactionBytes(dappTransaction);
			dappTransaction.signature = cryptoLib.sign(genesisAccount.keypair, bytes);
			bytes = transactionsLib.getTransactionBytes(dappTransaction);
			dappTransaction.id = cryptoLib.getId(bytes);

			transactions.push(dappTransaction);
		}

		transactions = transactions.sort(function compare(a, b) {
			if (a.type != b.type) {
        if (a.type == 1) {
          return 1;
        }
        if (b.type == 1) {
          return -1;
        }
        return a.type - b.type;
      }
      if (a.amount != b.amount) {
        return a.amount - b.amount;
      }
      return a.id.localeCompare(b.id);
		});

		transactions.forEach(function (tx) {
			bytes = transactionsLib.getTransactionBytes(tx);
			payloadLength += bytes.length;
			payloadHash.update(bytes);
		});

		payloadHash = payloadHash.digest();

		var block = {
			version: 0,
			totalAmount: totalAmount,
			totalFee: 0,
			reward: 0,
			payloadHash: payloadHash.toString('hex'),
			timestamp: 0,
			numberOfTransactions: transactions.length,
			payloadLength: payloadLength,
			previousBlock: null,
			generatorPublicKey: sender.keypair.publicKey,
			transactions: transactions,
			height: 1
		};

		bytes = getBytes(block);
		block.blockSignature = cryptoLib.sign(sender.keypair, bytes);
		bytes = getBytes(block);
		block.id = cryptoLib.getId(bytes);

		return {
			block: block,
			dapp: dappTransaction,
			delegates: delegates
		};
	},

	from: function (genesisBlock, genesisAccount, dapp) {
		for (var i in genesisBlock.transactions) {
			var tx = genesisBlock.transactions[i];

			if (tx.type == 5) {
				if (tx.asset.dapp.name == dapp.name) {
					throw new Error("DApp with name '" + dapp.name + "' already exists in genesis block");
				}

				if (tx.asset.dapp.git == dapp.git) {
					throw new Error("DApp with git '" + dapp.git + "' already exists in genesis block");
				}

				if (tx.asset.dapp.link == dapp.link) {
					throw new Error("DApp with link '" + dapp.link + "' already exists in genesis block");
				}
			}
		}

		var dappTransaction = {
			type: 5,
			amount: 0,
			fee: 0,
			timestamp: 0,
			recipientId: null,
			senderId: genesisAccount.address,
			senderPublicKey: genesisAccount.keypair.publicKey,
			asset: {
				dapp: dapp
			}
		};

		var bytes = transactionsLib.getTransactionBytes(dappTransaction);
		dappTransaction.signature = cryptoLib.sign(genesisAccount.keypair, bytes);
		bytes = transactionsLib.getTransactionBytes(dappTransaction);
		dappTransaction.id = cryptoLib.getId(bytes);

		genesisBlock.payloadLength += bytes.length;
		var payloadHash = crypto.createHash('sha256').update(new Buffer(genesisBlock.payloadHash, 'hex'));
		payloadHash.update(bytes);
		genesisBlock.payloadHash = payloadHash.digest().toString('hex');

		genesisBlock.transactions.push(dappTransaction);
		genesisBlock.numberOfTransactions += 1;
		genesisBlock.generatorPublicKey = sender.keypair.publicKey;

		bytes = getBytes(genesisBlock);
		genesisBlock.blockSignature = cryptoLib.sign(sender.keypair, bytes);
		bytes = getBytes(genesisBlock);
		genesisBlock.id = cryptoLib.getId(bytes);

		return {
			block: genesisBlock,
			dapp: dappTransaction
		};
	}
}
