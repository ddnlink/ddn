import { bignumber, assetTypes, slots } from '../utils'
import * as crypto from '../crypto'

import { setup } from '../config'
const constants = setup().constants

// console.log('crypto: ', crypto);

function calculateFee (amount) {
  const min = constants.fees.transfer

  const fee = bignumber.multiply(amount, 0.0001).toFixed(0)

  if (bignumber.isLessThan(fee, min)) {
    return min
  } else {
    return `${fee}`
  }
}

async function createTransaction (recipientId, amount, message, secret, second_secret) {
  const fee = bignumber.multiply(constants.fees.transfer, constants.fixedPoint)
  const amount2 = bignumber.multiply(amount, constants.fixedPoint).toString() // 传来的 amount 原本就该是含精度的值
  const transaction = {
    type: assetTypes.TRANSFER,
    nethash: constants.nethash,
    amount: `${amount2}`,
    fee: `${fee}`,
    recipientId: recipientId,
    message,
    timestamp: slots.getTime() - 5,
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
  const fee = bignumber.multiply(constants.fees.lock, constants.fixedPoint)
  const transaction = {
    type: 100, // TODO: update to string lock
    amount: '0',
    nethash: constants.nethash,
    fee: `${fee}`,
    recipientId: null,
    args: [String(height)],
    timestamp: slots.getTime() - 5,
    asset: {}
  }
  console.log('crypto: ', crypto);
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
