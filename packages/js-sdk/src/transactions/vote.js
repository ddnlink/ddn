import { bignumber, assetTypes, slots } from '../utils'

import * as crypto from '../crypto'
import { constants } from '../config'

async function createVote (keyList, secret, secondSecret) {
  const keys = crypto.getKeys(secret)
  const fee = bignumber.multiply(constants.fees.vote, constants.fixedPoint)

  const transaction = {
    type: assetTypes.VOTE,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
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
