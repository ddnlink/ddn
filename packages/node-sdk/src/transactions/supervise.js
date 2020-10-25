import { bignum, assetTypes } from '@ddn/utils'

import crypto from '../utils/crypto'

import slots from '../time/slots'
import { config, constants } from '../config'

/**
 * Create evidence transaction
 * @param {Evidence} evidence object {ipid: ipid, title: title, description: description, tags: tags, hash: hash, type: type, size: size, url: url}
 * @param {*} secret
 * @param {*} secondSecret
 */
async function createSupervise (supervise, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  if (typeof supervise !== 'object') {
    throw new Error('The first argument should be a object!')
  }

//   if (!supervise.ipid || supervise.ipid.length === 0) {
//     throw new Error('Invalid ipid format')
//   }

  const fee = bignum.multiply(0.1, constants.fixedPoint)

  const transaction = {
    type: assetTypes.SUPERVISE, // 10 -> 20
    nethash: config.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - config.clientDriftSeconds,
    asset: {
      supervise
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

export default {
  createSupervise
}
