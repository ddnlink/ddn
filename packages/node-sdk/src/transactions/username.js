import crypto from '../utils/crypto'

import DdnUtils from '@ddn/utils'
import slots from '../time/slots'
import { config, constants } from '../config'

async function createUsername (name, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  if (!name || name.length === 0) {
    throw new Error('Invalid name format')
  }
  const fee = constants.net.fees.username

  const transaction = {
    type: DdnUtils.assetTypes.USERINFO,
    nethash: config.nethash,
    amount: '0', // Bignum update
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - config.clientDriftSeconds,
    asset: {
      userinfo: {
        username: name
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
  createUsername
}
