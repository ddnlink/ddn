import DdnUtils from '@ddn/utils'

import crypto from '../utils/crypto'
import constants from '../constants'
import slots from '../time/slots'
import options from '../options'

function signTransaction (trs, secret) {
  const keys = crypto.getKeys(secret)
  const signature = crypto.sign(trs, keys)

  return signature
}

async function createMultisignature (keysgroup, lifetime, min, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const transaction = {
    type: DdnUtils.assetTypes.MULTISIGNATURE, // MULTISIGNATURE
    nethash: options.get('nethash'),
    amount: '0', // Bignum update
    fee: constants.net.fees.multiSignature,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - options.get('clientDriftSeconds'),
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
