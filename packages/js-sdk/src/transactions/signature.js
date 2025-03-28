import * as crypto from '../crypto'
import { bignumber, assetTypes, slots } from '../utils'
import { setup } from '../config'
const constants = setup().constants

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

  const fee = bignumber.multiply(constants.fees.signature, constants.fixedPoint)
  const transaction = {
    type: assetTypes.SIGNATURE,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
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
