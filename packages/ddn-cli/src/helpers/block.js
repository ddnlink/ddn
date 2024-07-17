import fs from 'fs'
import * as DdnCrypto from '@ddn/crypto'
import { bignum, assetTypes, randomNethash } from '@ddn/utils'
import accounts from './account.js'

export default {
  getBytes: DdnCrypto.getBytes,
  async new ({ address, keypair }, nethash, tokenName, tokenPrefix, dapp, accountsFile, message, count, amount) {
    let payloadLength = 0
    // let payloadBytes = new ByteBuffer(1, true);
    let payloadHash = null
    let transactions = []
    let totalAmount = '0'
    const delegates = []

    if (!nethash) {
      nethash = randomNethash()
    }

    if (!tokenName) {
      tokenName = 'DDN'
    }

    if (!tokenPrefix) {
      tokenPrefix = 'D'
    }

    if (!amount) {
      amount = 1 * 10 ** 16 // 默认 1 亿
    }

    const sender = accounts.account(DdnCrypto.generateSecret(), tokenPrefix)

    // fund recipient account
    if (accountsFile && fs.existsSync(accountsFile)) {
      const lines = fs.readFileSync(accountsFile, 'utf8').split('\n')
      for (const i in lines) {
        const parts = lines[i].split(', ')

        if (parts.length !== 2) {
          console.error(`Invalid recipient balance format ${lines[i]}`)
          break
        }
        const trs = {
          type: assetTypes.TRANSFER,
          nethash,
          amount: bignum.multiply(parts[1], 100000000).toString(),
          fee: '0',
          timestamp: 0,
          recipientId: parts[0], // wxm block database
          senderId: sender.address, // wxm block database
          senderPublicKey: sender.keypair.publicKey // wxm block database
        }
        if (i === 0) {
          trs.message = 'Powered by DDN Blockchain, https://ddn.net'
        }
        if (message && i === 1) {
          trs.message = message
        }

        totalAmount = bignum.plus(totalAmount, trs.amount).toString()

        trs.signature = await DdnCrypto.sign(trs, sender.keypair)
        trs.id = await DdnCrypto.getId(trs)

        transactions.push(trs)
      }
    } else {
      const balanceTransaction = {
        type: assetTypes.TRANSFER,
        nethash,
        amount,
        fee: '0',
        timestamp: 0,
        recipientId: address, // wxm   block database
        senderId: sender.address, // wxm block database
        senderPublicKey: sender.keypair.publicKey // wxm block database
      }

      totalAmount = bignum.plus(totalAmount, balanceTransaction.amount).toString()

      balanceTransaction.signature = await DdnCrypto.sign(balanceTransaction, sender.keypair)
      balanceTransaction.id = await DdnCrypto.getId(balanceTransaction)
      transactions.push(balanceTransaction)
    }

    // make delegates
    for (let i = 0; i < count; i++) {
      const delegate = accounts.account(DdnCrypto.generateSecret(), tokenPrefix)
      delegates.push(delegate)

      const username = `${tokenName}_${i + 1}`

      const transaction = {
        type: assetTypes.DELEGATE,
        nethash,
        amount: '0',
        fee: '0',
        timestamp: 0,
        recipientId: null, // wxm block database
        senderId: delegate.address, // wxm block database
        senderPublicKey: delegate.keypair.publicKey, // wxm block database
        asset: {
          delegate: {
            username
          }
        }
      }
      if (i === 0) {
        transaction.message = 'Powered by DDN Blockchain, https://ddn.net'
      }
      if (message && i === 1) {
        transaction.message = message
      }
      transaction.signature = await DdnCrypto.sign(transaction, sender.keypair)
      transaction.id = await DdnCrypto.getId(transaction)

      transactions.push(transaction)
    }
    // make votes
    const votes = delegates.map(({ keypair }) => `+${keypair.publicKey}`)

    const voteTransaction = {
      type: assetTypes.VOTE,
      nethash,
      amount: '0',
      fee: '0',
      timestamp: 0,
      recipientId: null, // wxm block database
      senderId: address, // wxm block database
      senderPublicKey: keypair.publicKey, // wxm block database
      asset: {
        vote: {
          votes
        }
      }
    }

    voteTransaction.signature = await DdnCrypto.sign(voteTransaction, sender.keypair)
    // console.log('voteTransaction.signature 132', voteTransaction.signature)
    voteTransaction.id = await DdnCrypto.getId(voteTransaction)

    transactions.push(voteTransaction)

    let dappTransaction = null
    if (dapp) {
      dappTransaction = {
        type: assetTypes.DAPP,
        amount: '0',
        fee: '0',
        timestamp: 0,
        recipientId: null, // wxm block database
        senderId: address, // wxm block database
        senderPublicKey: keypair.publicKey, // wxm block database
        asset: {
          dapp
        }
      }

      dappTransaction.signature = await DdnCrypto.sign(dappTransaction, sender.keypair)
      dappTransaction.id = await DdnCrypto.getId(dappTransaction)
      console.log('dappTransaction.signature 132', dappTransaction.signature)
      transactions.push(dappTransaction)
    }

    transactions = transactions.sort(function compare (a, b) {
      if (a.type !== b.type) {
        if (a.type === 1) {
          return 1
        }
        if (b.type === 1) {
          return -1
        }
        return a.type - b.type
      }
      if (!bignum.isEqualTo(a.amount, b.amount)) {
        return bignum.minus(a.amount, b.amount)
      }
      return a.id.localeCompare(b.id)
    })

    let payloadBytes = ''
    for (const tx of transactions) {
      const bytes = DdnCrypto.getBytes(tx)
      // let bytes = transactionsLib.getTransactionBytes(tx);
      payloadBytes += bytes
      payloadLength += bytes.length
    }
    payloadHash = DdnCrypto.createHash(Buffer.from(payloadBytes)) // payloadHash.digest();

    const block = {
      version: assetTypes.TRANSFER,
      total_amount: totalAmount, // wxm block database
      total_fee: '0', // wxm block database
      reward: '0',
      payload_hash: payloadHash.toString('hex'), // wxm block database
      timestamp: 0,
      number_of_transactions: transactions.length, // wxm block database
      payload_length: payloadLength, // wxm block database
      previous_block: null, // wxm block database
      generator_public_key: sender.keypair.publicKey, // wxm block database
      transactions,
      height: '1'
    }

    block.block_signature = await DdnCrypto.sign(block, sender.keypair) // wxm block database
    block.id = await DdnCrypto.getId(block)
    return {
      block,
      dapp: dappTransaction,
      delegates,
      nethash
    }
  },

  async from (genesisBlock, { address, keypair }, dapp) {
    for (const i in genesisBlock.transactions) {
      const tx = genesisBlock.transactions[i]

      if (tx.type === assetTypes.DAPP) {
        if (tx.asset.dapp.name === dapp.name) {
          throw new Error(`DApp with name '${dapp.name}' already exists in genesis block`)
        }

        if (tx.asset.dapp.git === dapp.git) {
          throw new Error(`DApp with git '${dapp.git}' already exists in genesis block`)
        }

        if (tx.asset.dapp.link === dapp.link) {
          throw new Error(`DApp with link '${dapp.link}' already exists in genesis block`)
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
    }

    // let bytes = transactionsLib.getTransactionBytes(dappTransaction);
    dappTransaction.signature = await DdnCrypto.sign(dappTransaction, keypair)
    dappTransaction.id = await DdnCrypto.getId(dappTransaction)
    // let bytes = transactionsLib.getTransactionBytes(dappTransaction)
    let bytes = DdnCrypto.getBytes(dappTransaction)

    genesisBlock.payloadLength += bytes.length
    bytes.writeByte(Buffer.from(genesisBlock.payloadHash, 'hex'))
    const payloadHash = DdnCrypto.createHash(bytes)
    genesisBlock.payloadHash = payloadHash.toString('hex')

    genesisBlock.transactions.push(dappTransaction)
    genesisBlock.numberOfTransactions += 1
    genesisBlock.generatorPublicKey = keypair.publicKey

    bytes = DdnCrypto.getBytes(genesisBlock)
    genesisBlock.blockSignature = await DdnCrypto.sign(genesisBlock, keypair) // fixme...
    bytes = DdnCrypto.getBytes(genesisBlock)
    genesisBlock.id = DdnCrypto.getId(genesisBlock) // getId(bytes)

    return {
      block: genesisBlock,
      dapp: dappTransaction
    }
  }
}
