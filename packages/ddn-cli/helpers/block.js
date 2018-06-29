const crypto = require('crypto');
const fs = require('fs');
const ddnJS = require('ddn-js');
const cryptoLib = require('../lib/crypto.js');
const transactionsLib = require('../lib/transactions.js');
const accounts = require('./account.js');
const ByteBuffer = require('bytebuffer');
const config = require('../config');
const bignum = require('bignum-utils');

function getBytes(block, skipSignature) {
	// const size = 4 + 4 + 8 + 4 + 8 + 8 + 8 + 4 + 32 + 32 + 64;
	const size =
	4 + // version (int)
    4 + // timestamp (int)
    64 + // previousBlock 64
    4 + // numberOfTransactions (int)
    64 + // totalAmount (long)
    64 + // totalFee (long)
    64 + // reward (long)
    4 + // payloadLength (int)
    32 + // payloadHash
    32 + // generatorPublicKey
	64; // blockSignature or unused
	
	const bb = new ByteBuffer(size, true);
	bb.writeInt(block.version);
	bb.writeInt(block.timestamp);

	if (block.previousBlock) {
		bb.writeString(block.previousBlock)
	} else {
		bb.writeString('0')
	}

	bb.writeInt(block.numberOfTransactions);
	
	bb.writeString(bignum.new(block.totalAmount).toString());
	bb.writeString(bignum.new(block.totalFee).toString());
	bb.writeString(bignum.new(block.reward).toString());

	bb.writeInt(block.payloadLength);

	const payloadHashBuffer = new Buffer(block.payloadHash, 'hex');

	for (let i = 0; i < payloadHashBuffer.length; i++) {
		bb.writeByte(payloadHashBuffer[i]);
	}

	const generatorPublicKeyBuffer = new Buffer(block.generatorPublicKey, 'hex');
	for (let i = 0; i < generatorPublicKeyBuffer.length; i++) {
		bb.writeByte(generatorPublicKeyBuffer[i]);
	}

	if (!skipSignature && block.blockSignature) {
		const blockSignatureBuffer = new Buffer(block.blockSignature, 'hex');
		for (let i = 0; i < blockSignatureBuffer.length; i++) {
			bb.writeByte(blockSignatureBuffer[i]);
		}
	}

	bb.flip();
	const b = bb.toBuffer();

	return b;
}

module.exports = {
	getBytes,
	new(genesisAccount, nethash, tokenName, tokenPrefix, dapp, accountsFile) {
        let payloadLength = 0;
        let payloadHash = crypto.createHash('sha256');
        let transactions = [];
        let totalAmount = '0';
        const delegates = [];

        if (!nethash) {
			nethash = cryptoLib.randomNethash();
		}

        if (!tokenName) {
			tokenName = 'DDN';
		}

        if (!tokenPrefix) {
			tokenPrefix = 'D';
		}

        const sender = accounts.account(cryptoLib.generateSecret(), tokenPrefix);

        // fund recipient account
        if (accountsFile && fs.existsSync(accountsFile)) {
			const lines = fs.readFileSync(accountsFile, 'utf8').split('\n');
			for (let i in lines) {
				const parts = lines[i].split('  ');

				if (parts.length != 2) {
					console.error('Invalid recipient balance format');
					break;
				}
				const trs = {
					type: 0,
					nethash,
					amount: bignum.multiply(bignum.new(parts[1]), 100000000),
					fee: '0',
					timestamp: 0,
					recipientId: parts[0],
					senderId: sender.address,
					senderPublicKey: sender.keypair.publicKey
				};
				totalAmount = bignum.plus(totalAmount, trs.amount);

				var bytes = transactionsLib.getTransactionBytes(trs);
				trs.signature = cryptoLib.sign(sender.keypair, bytes);
				bytes = transactionsLib.getTransactionBytes(trs);
				trs.id = cryptoLib.getId(bytes);

				transactions.push(trs);
			}
		} else {
			const balanceTransaction = {
				type: 0,
				nethash,
				amount: config.totalAmount,
				fee: '0',
				timestamp: 0,
				recipientId: genesisAccount.address,
				senderId: sender.address,
				senderPublicKey: sender.keypair.publicKey
			};

			totalAmount = bignum.plus(totalAmount, balanceTransaction.amount);

			var bytes = transactionsLib.getTransactionBytes(balanceTransaction);
			balanceTransaction.signature = cryptoLib.sign(sender.keypair, bytes);
			bytes = transactionsLib.getTransactionBytes(balanceTransaction);
			balanceTransaction.id = cryptoLib.getId(bytes);

			transactions.push(balanceTransaction);
		}

        // make delegates
        for (var i = 0; i < 101; i++) {
			const delegate = accounts.account(cryptoLib.generateSecret(), tokenPrefix);
			delegates.push(delegate);

			const username = `${tokenName}_${i + 1}`;

			const transaction = {
				type: 2,
				nethash,
				amount: '0',
				fee: '0',
				timestamp: 0,
				recipientId: null,
				senderId: delegate.address,
				senderPublicKey: delegate.keypair.publicKey,
				asset: {
					delegate: {
						username
					}
				}
			};

			bytes = transactionsLib.getTransactionBytes(transaction);
			transaction.signature = cryptoLib.sign(sender.keypair, bytes);
			bytes = transactionsLib.getTransactionBytes(transaction);
			transaction.id = cryptoLib.getId(bytes);

			transactions.push(transaction);
		}

        // make votes
        const votes = delegates.map(delegate => `+${delegate.keypair.publicKey}`);

        const voteTransaction = {
			type: 3,
			nethash,
			amount: '0',
			fee: '0',
			timestamp: 0,
			recipientId: null,
			senderId: genesisAccount.address,
			senderPublicKey: genesisAccount.keypair.publicKey,
			asset: {
				vote: {
					votes
				}
			}
		};

        bytes = transactionsLib.getTransactionBytes(voteTransaction);
        voteTransaction.signature = cryptoLib.sign(genesisAccount.keypair, bytes);
        bytes = transactionsLib.getTransactionBytes(voteTransaction);
        voteTransaction.id = cryptoLib.getId(bytes);

        transactions.push(voteTransaction);

        let dappTransaction = null;
        if (dapp) {
			dappTransaction = {
				type: 5,
				amount: '0',
				fee: '0',
				timestamp: 0,
				recipientId: null,
				senderId: genesisAccount.address,
				senderPublicKey: genesisAccount.keypair.publicKey,
				asset: {
					dapp
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
			if (!bignum.isEqualTo(a.amount, b.amount)) {
				return bignum.minus(a.amount, b.amount);
			}
			return a.id.localeCompare(b.id);
		});

        transactions.forEach(tx => {
			bytes = transactionsLib.getTransactionBytes(tx);
			payloadLength += bytes.length;
			payloadHash.update(bytes);
		});

        payloadHash = payloadHash.digest();

        const block = {
			version: 0,
			totalAmount,
			totalFee: '0',
			reward: '0',
			payloadHash: payloadHash.toString('hex'),
			timestamp: 0,
			numberOfTransactions: transactions.length,
			payloadLength,
			previousBlock: null,
			generatorPublicKey: sender.keypair.publicKey,
			transactions,
			height: '1'
		};

        bytes = getBytes(block);
        block.blockSignature = cryptoLib.sign(sender.keypair, bytes);
        bytes = getBytes(block);
        block.id = cryptoLib.getId(bytes);

        return {
			block,
			dapp: dappTransaction,
			delegates,
			nethash
		};
    },

	from(genesisBlock, genesisAccount, dapp) {
		for (const i in genesisBlock.transactions) {
			const tx = genesisBlock.transactions[i];

			if (tx.type == 5) {
				if (tx.asset.dapp.name == dapp.name) {
					throw new Error(`DApp with name '${dapp.name}' already exists in genesis block`);
				}

				if (tx.asset.dapp.git == dapp.git) {
					throw new Error(`DApp with git '${dapp.git}' already exists in genesis block`);
				}

				if (tx.asset.dapp.link == dapp.link) {
					throw new Error(`DApp with link '${dapp.link}' already exists in genesis block`);
				}
			}
		}

		const dappTransaction = {
			type: 5,
			amount: '0',
			fee: '0',
			timestamp: 0,
			recipientId: null,
			senderId: genesisAccount.address,
			senderPublicKey: genesisAccount.keypair.publicKey,
			asset: {
				dapp
			}
		};

		let bytes = transactionsLib.getTransactionBytes(dappTransaction);
		dappTransaction.signature = cryptoLib.sign(genesisAccount.keypair, bytes);
		bytes = transactionsLib.getTransactionBytes(dappTransaction);
		dappTransaction.id = cryptoLib.getId(bytes);

		genesisBlock.payloadLength += bytes.length;
		const payloadHash = crypto.createHash('sha256').update(new Buffer(genesisBlock.payloadHash, 'hex'));
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