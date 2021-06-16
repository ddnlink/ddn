import DdnUtils from '@ddn/utils'

import crypto from '../utils/crypto'
import slots from '../time/slots'
import { config, constants } from '../config'

async function createVote (keyList, secret, secondSecret) {
  const keys = crypto.getKeys(secret)
  const fee = DdnUtils.bignum.multiply(constants.fees.vote, constants.fixedPoint)

  const transaction = {
    type: DdnUtils.assetTypes.VOTE,
    nethash: config.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - config.clientDriftSeconds,
    asset: {
      vote: {
        votes: keyList
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
  createVote
}
