import crypto from '../utils/crypto'
import constants from '../constants'
import DdnUtils from '@ddn/utils'
import slots from '../time/slots'
import options from '../options'

const nethash = options.get('nethash')

async function createInTransfer (dappId, currency, amount, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const transaction = {
    type: DdnUtils.assetTypes.DAPP_IN,
    nethash,
    amount: '0', // Bignum update
    fee: constants.net.fees.send,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - options.get('clientDriftSeconds'),
    asset: {
      in: {
        dapp_id: dappId,
        currency
      }
    }
  }

  if (currency === constants.nethash[nethash].tokenName) {
    transaction.amount = amount // Bignum update Number(amount)
  } else {
    transaction.asset.in.amount = String(amount)
  }

  transaction.signature = await crypto.sign(transaction, keys)

  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

async function createOutTransfer (recipientId, dappId, transactionId, currency, amount, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const transaction = {
    nethash,
    type: DdnUtils.assetTypes.DAPP_OUT,
    amount: '0', // Bignum update
    fee: constants.net.fees.send,
    recipientId: recipientId,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - options.get('clientDriftSeconds'),
    asset: {
      outTransfer: {
        dapp_id: dappId,
        transaction_id: transactionId,
        currency,
        amount
      }
    }
  }

  transaction.signature = await crypto.sign(transaction, keys)

  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

async function signOutTransfer (transaction, secret) {
  const keys = crypto.getKeys(secret)
  const signature = await crypto.sign(transaction, keys)

  return signature
}

export default {
  createInTransfer,
  createOutTransfer,
  signOutTransfer
}
