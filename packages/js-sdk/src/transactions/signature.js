import crypto from '../utils/crypto'
import constants from '../constants'
import DdnUtils from '@ddn/utils'
import slots from '../time/slots'
import options from '../options'

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
    nethash: options.get('nethash'),
    amount: '0',
    fee: constants.net.fees.secondSignature,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - options.get('clientDriftSeconds'),
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
