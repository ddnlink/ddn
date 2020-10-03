import { bignum, assetTypes } from '@ddn/utils'

import crypto from '../utils/crypto' // TODO: @ddn/crypto
import slots from '../time/slots'
import { config, constants } from '../config'

function calculateFee (amount) {
  const min = constants.net.fees.transfer

  const fee = bignum.multiply(amount, 0.0001).toFixed(0)

  if (bignum.isLessThan(fee, min)) {
    return min
  } else {
    return `${fee}`
  }
}

async function createTransaction (recipientId, amount, message, secret, second_secret) {
  const fee = bignum.multiply(constants.net.fees.transfer, constants.fixedPoint)
  const amount2 = bignum.multiply(amount, constants.fixedPoint).toString() // 传来的 amount 原本就该是含精度的值
  const transaction = {
    type: assetTypes.TRANSFER,
    nethash: config.nethash,
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
  const fee = bignum.multiply(constants.net.fees.lock, constants.fixedPoint)
  const transaction = {
    type: 100, // TODO: update to string lock
    amount: '0',
    nethash: config.nethash,
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
  calculateFee,
  createLock
}
