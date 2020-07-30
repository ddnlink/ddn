import crypto from '../utils/crypto'
import { bignum, assetTypes } from '@ddn/utils'

import slots from '../time/slots'
import { config, constants } from '../config'

async function createDelegate (username, secret, secondSecret) {
  const keys = crypto.getKeys(secret)
  const fee = bignum.multiply(constants.net.fees.delegate, constants.fixedPoint)

  const transaction = {
    type: assetTypes.DELEGATE,
    nethash: config.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - config.clientDriftSeconds,
    asset: {
      delegate: {
        username,
        publicKey: keys.publicKey
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
  createDelegate
}
