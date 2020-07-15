import DdnUtils from '@ddn/utils'

import crypto from '../utils/crypto'
import constants from '../constants'

import slots from '../time/slots.js'
import options from '../options'

const { bignum } = DdnUtils

async function createMultiTransfer (outputs, secret, secondSecret, cb) {
  const keys = crypto.getKeys(secret)

  if (!outputs || outputs.length === 0) {
    throw new Error('Invalid fileHash format')
  }
  const sender = crypto.generateAddress(keys.publicKey)
  const fee = constants.net.fees.multiTransfer
  let amount = bignum.new(0) // bignum update
  const recipientId = []
  for (let i = 0; i < outputs.length; i++) {
    const output = outputs[i]
    if (!output.recipientId || !output.amount) {
      return cb('output recipient or amount null')
    }

    if (!crypto.isAddress(output.recipientId)) {
      return cb('Invalid output recipient')
    }

    // bignum update
    // if (output.amount <= 0) {
    if (bignum.isLessThanOrEqualTo(output.amount, 0)) {
      return cb('Invalid output amount')
    }

    if (output.recipientId === sender) {
      return cb('Invalid output recipientId, cannot be your self')
    }

    // bignum update
    // amount += output.amount
    amount = bignum.plus(amount, output.amount)

    recipientId.push(output.recipientId)
  }

  const transaction = {
    type: DdnUtils.assetTypes.MULTITRANSFER,
    nethash: options.get('nethash'),
    amount: amount.toString(), // bignum update amount,
    fee: `${fee}`,
    recipientId: recipientId.join('|'),
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - options.get('clientDriftSeconds'),
    asset: {
      output: {
        outputs
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

export default {
  createMultiTransfer
}
