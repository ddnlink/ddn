import { bignumber, assetTypes, slots } from '../utils'

import * as crypto from '../crypto'
import { setup } from '../config'
const constants = setup().constants

/**
 * Create evidence transaction
 * @param {Evidence} evidence object {ipid: ipid, title: title, description: description, tags: tags, hash: hash, type: type, size: size, url: url}
 * @param {*} secret
 * @param {*} secondSecret
 */
async function createEvidence (evidence, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  if (typeof evidence !== 'object') {
    throw new Error('The first argument should be a object!')
  }

  if (!evidence.author) {
    throw new Error('Invalid author format')
  }
  if (!evidence.hash) {
    throw new Error('Invalid hash format')
  }
  if (!evidence.type) {
    throw new Error('Invalid type format')
  }

  const fee = bignumber.multiply(constants.fees.evidence, constants.fixedPoint)

  const transaction = {
    type: assetTypes.EVIDENCE, // 10 -> 20
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      evidence
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
  createEvidence
}
