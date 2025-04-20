import { bignumber, assetTypes, slots } from '../utils'
import * as crypto from '../crypto'
import { constants } from '../config'

function signTransaction (trs, secret) {
  const keys = crypto.getKeys(secret)
  const signature = crypto.sign(trs, keys)

  return signature
}

async function createMultisignature (keysgroup, lifetime, min, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = bignumber.multiply(bignumber.plus(keysgroup.length, 1), 5, constants.fixedPoint).toFixed()

  const transaction = {
    type: assetTypes.MULTISIGNATURE, // MULTISIGNATURE
    nethash: constants.nethash,
    amount: '0', // Bignum update
    fee,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      multisignature: {
        min,
        lifetime,
        keysgroup
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
  createMultisignature,
  signTransaction
}
