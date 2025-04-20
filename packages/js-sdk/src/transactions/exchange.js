import { bignumber, assetTypes, slots } from '../utils'
import * as crypto from '../crypto'
import { constants } from '../config'

/**
 * Create exchange transaction
 * @param {Exchange} exchange object
 * @param {*} secret
 * @param {*} secondSecret
 */
async function createExchange (trsopt, exchange, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  if (typeof exchange !== 'object') {
    throw new Error('The first argument should be a object!')
  }

  if (!exchange.org_id || exchange.org_id.length === 0) {
    throw new Error('Invalid org_id format')
  }

  const fee = bignumber.multiply(constants.fees.dao_exchange, constants.fixedPoint)

  const transaction = Object.assign(
    {
      type: assetTypes.DAO_EXCHANGE,
      nethash: constants.nethash,
      amount: '0', // Bignum update
      fee: `${fee}`,
      recipientId: null,
      senderPublicKey: keys.publicKey,
      // senderPublicKey: keys.publicKey,
      timestamp: slots.getTime() - 5,
      asset: {
        exchange
      }
    },
    trsopt || {}
  )

  transaction.signature = await crypto.sign(transaction, keys)

  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

export default {
  createExchange
}
