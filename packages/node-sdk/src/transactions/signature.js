import crypto from '../utils/crypto'

import DdnUtils from '@ddn/utils'
import slots from '../time/slots'
import { config, constants } from '../config'

function signSignature (secondSecret) {
  const keys = crypto.getKeys(secondSecret)

  const signature = {
    publicKey: keys.publicKey
  }

  return signature
}

async function createSignature (secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const signature = signSignature(secondSecret)

  const transaction = {
    type: DdnUtils.assetTypes.SIGNATURE,
    nethash: config.nethash,
    amount: '0',
    fee: constants.net.fees.secondSignature,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - config.clientDriftSeconds,
    asset: {
      signature
    }
  }

  transaction.signature = await crypto.sign(transaction, keys)
  transaction.id = await crypto.getId(transaction)

  return transaction
}

export default {
  createSignature
}
