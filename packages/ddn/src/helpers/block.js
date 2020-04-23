import crypto from 'crypto';
import fs from 'fs';
import cryptoLib from '@ddn/crypto';
import DdnUtils from '@ddn/utils';
import ByteBuffer from 'bytebuffer';
import config from '../config';
import transactionsLib from '../transactions';
import accounts from './account.js';
const { bignum, assetTypes } = DdnUtils;

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

	if (block.previous_block) {  //wxm block database
		bb.writeString(block.previous_block)    //wxm block database
	} else {
		bb.writeString('0')
	}

	bb.writeInt(block.number_of_transactions);    //wxm block database
	
	bb.writeString(bignum.new(block.total_amount).toString());   //wxm block database
	bb.writeString(bignum.new(block.total_fee).toString());  //wxm block database
	bb.writeString(bignum.new(block.reward).toString());

	bb.writeInt(block.payload_length);   //wxm block database

	const payloadHashBuffer = Buffer.from(block.payload_hash, 'hex'); //wxm block database

	for (let i = 0; i < payloadHashBuffer.length; i++) {
		bb.writeByte(payloadHashBuffer[i]);
	}

	const generatorPublicKeyBuffer = Buffer.from(block.generator_public_key, 'hex');   //wxm block database
	for (let i = 0; i < generatorPublicKeyBuffer.length; i++) {
		bb.writeByte(generatorPublicKeyBuffer[i]);
	}

	if (!skipSignature && block.block_signature) {   //wxm block database
		const blockSignatureBuffer = Buffer.from(block.block_signature, 'hex');
		for (let i = 0; i < blockSignatureBuffer.length; i++) {
			bb.writeByte(blockSignatureBuffer[i]);
		}
	}

	bb.flip();
	const b = bb.toBuffer();

	return b;
}

export default {
	getBytes,
	new({address, keypair}, nethash, tokenName, tokenPrefix, dapp, accountsFile) {
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
					type: assetTypes.TRANSFER,
					nethash,
					amount: bignum.multiply(bignum.new(parts[1]), 100000000),
					fee: '0',
					timestamp: 0,
					recipientId: parts[0],  //wxm block database
					senderId: sender.address,   //wxm block database
					senderPublicKey: sender.keypair.publicKey   //wxm block database
				};
				totalAmount = bignum.plus(totalAmount, trs.amount);

				// let bytes = transactionsLib.getTransactionBytes(trs);
				trs.signature = cryptoLib.sign(sender.keypair, bytes);
				let bytes = transactionsLib.getTransactionBytes(trs);
				trs.id = cryptoLib.getId(bytes);

				transactions.push(trs);
			}
		} else {
			const balanceTransaction = {
				type: assetTypes.TRANSFER,
				nethash,
				amount: config.totalAmount,
				fee: '0',
				timestamp: 0,
				recipientId: address,    //wxm   block database
				senderId: sender.address,   //wxm block database
				senderPublicKey: sender.keypair.publicKey   //wxm block database
			};

			totalAmount = bignum.plus(totalAmount, balanceTransaction.amount);

			let bytes = transactionsLib.getTransactionBytes(balanceTransaction);
			balanceTransaction.signature = cryptoLib.sign(sender.keypair, bytes);
			bytes = transactionsLib.getTransactionBytes(balanceTransaction);
			balanceTransaction.id = cryptoLib.getId(bytes);

			transactions.push(balanceTransaction);
		}

        // make delegates
        for (let i = 0; i < 101; i++) {
			const delegate = accounts.account(cryptoLib.generateSecret(), tokenPrefix);
			delegates.push(delegate);

			const username = `${tokenName}_${i + 1}`;

			const transaction = {
				type: assetTypes.DELEGATE,
				nethash,
				amount: '0',
				fee: '0',
				timestamp: 0,
				recipientId: null,  //wxm block database
				senderId: delegate.address, //wxm block database
				senderPublicKey: delegate.keypair.publicKey,    //wxm block database
				asset: {
					delegate: {
						username
					}
				}
			};

			let bytes = transactionsLib.getTransactionBytes(transaction);
			transaction.signature = cryptoLib.sign(sender.keypair, bytes);
			bytes = transactionsLib.getTransactionBytes(transaction);
			transaction.id = cryptoLib.getId(bytes);

			transactions.push(transaction);
		}

        // make votes
        const votes = delegates.map(({keypair}) => `+${keypair.publicKey}`);

        const voteTransaction = {
			type: assetTypes.VOTE,
			nethash,
			amount: '0',
			fee: '0',
			timestamp: 0,
			recipientId: null,  //wxm block database
			senderId: address,   //wxm block database
			senderPublicKey: keypair.publicKey,  //wxm block database
			asset: {
				vote: {
					votes
				}
			}
		};

        let bytes = transactionsLib.getTransactionBytes(voteTransaction);
        voteTransaction.signature = cryptoLib.sign(keypair, bytes);
        bytes = transactionsLib.getTransactionBytes(voteTransaction);
        voteTransaction.id = cryptoLib.getId(bytes);

        transactions.push(voteTransaction);

        let dappTransaction = null;
        if (dapp) {
			dappTransaction = {
				type: assetTypes.DAPP,
				amount: '0',
				fee: '0',
				timestamp: 0,
				recipientId: null,  //wxm block database
				senderId: address,   //wxm block database
				senderPublicKey: keypair.publicKey,  //wxm block database
				asset: {
					dapp
				}
			};

			let bytes = transactionsLib.getTransactionBytes(dappTransaction);
			dappTransaction.signature = cryptoLib.sign(keypair, bytes);
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
			version: assetTypes.TRANSFER,
			total_amount: totalAmount,  //wxm block database
			total_fee: '0', //wxm block database
			reward: '0',
			payload_hash: payloadHash.toString('hex'),  //wxm block database
			timestamp: 0,
			number_of_transactions: transactions.length,    //wxm block database
			payload_length: payloadLength,    //wxm block database
			previous_block: null,   //wxm block database
			generator_public_key: sender.keypair.publicKey, //wxm block database
			transactions,
			height: '1'
		};

        bytes = getBytes(block);
        block.block_signature = cryptoLib.sign(sender.keypair, bytes);  //wxm block database
        bytes = getBytes(block);
        block.id = cryptoLib.getId(bytes);

        return {
			block,
			dapp: dappTransaction,
			delegates,
			nethash
		};
    },

	from(genesisBlock, {address, keypair}, dapp) {
		for (const i in genesisBlock.transactions) {
			const tx = genesisBlock.transactions[i];

			if (tx.type == assetTypes.DAPP) {
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
			type: assetTypes.DAPP,
			amount: '0',
			fee: '0',
			timestamp: 0,
			recipientId: null,
			senderId: address,
			senderPublicKey: keypair.publicKey,
			asset: {
				dapp
			}
		};

		let bytes = transactionsLib.getTransactionBytes(dappTransaction);
		dappTransaction.signature = cryptoLib.sign(keypair, bytes);
		bytes = transactionsLib.getTransactionBytes(dappTransaction);
		dappTransaction.id = cryptoLib.getId(bytes);

		genesisBlock.payloadLength += bytes.length;
		const payloadHash = crypto.createHash('sha256').update(Buffer.from(genesisBlock.payloadHash, 'hex'));
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
};