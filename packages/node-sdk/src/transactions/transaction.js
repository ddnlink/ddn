import DdnUtils, { bignum } from '@ddn/utils'
import { config, constants } from '../config'

import crypto from '../utils/crypto' // TODO: @ddn/crypto
import slots from '../time/slots'

async function createTransaction (recipientId, amount, message, secret, second_secret) {
  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint).toString()
  const amount2 = bignum.multiply(amount, constants.fixedPoint).toString()
  const transaction = {
    type: DdnUtils.assetTypes.TRANSFER,
    nethash: config.nethash, // <- config.nethash,
    amount: `${amount2}`,
    fee: `${fee}`,
    recipientId: recipientId,
    message,
    timestamp: slots.getTime() - config.clientDriftSeconds,
    asset: {}
  }

  const keys = crypto.getKeys(secret)
  transaction.senderPublicKey = keys.publicKey

  transaction.signature = await crypto.sign(transaction, keys)

  if (second_secret) {
    const secondKeys = crypto.getKeys(second_secret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

async function createLock (height, secret, second_secret) {
  const fee = bignum.multiply(constants.fees.lock, constants.fixedPoint).toString()
  const transaction = {
    type: 100, // TODO: update to string lock
    amount: '0',
    nethash: config.nethash, // <- config.nethash,
    fee: `${fee}`,
    recipientId: null,
    args: [String(height)],
    timestamp: slots.getTime() - config.clientDriftSeconds,
    asset: {}
  }

  const keys = crypto.getKeys(secret)
  transaction.senderPublicKey = keys.publicKey

  transaction.signature = await crypto.sign(transaction, keys)

  if (second_secret) {
    const secondKeys = crypto.getKeys(second_secret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

export default {
  createTransaction,
  createLock
}
