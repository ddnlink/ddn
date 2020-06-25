import DdnUtils from '@ddn/utils'
import crypto from '../utils/crypto'
import constants from '../constants'
import slots from '../time/slots'
import options from '../options'

/**
 * Create exchange transaction
 * @param {Exchange} exchange object
 * @param {*} secret
 * @param {*} secondSecret
 */
async function createExchange (trsopt, exchange, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  if (typeof exchange !== 'object') {
    throw new Error('The first argument should be a object!')
  }

  if (!exchange.org_id || exchange.org_id.length === 0) {
    throw new Error('Invalid org_id format')
  }

  const fee = constants.net.fees.exchange

  const transaction = Object.assign({
    type: DdnUtils.assetTypes.DAO_EXCHANGE,
    nethash: options.get('nethash'),
    amount: '0', // Bignum update
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    // senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - options.get('clientDriftSeconds'),
    asset: {
      exchange
    }
  }, trsopt || {})

  transaction.signature = await crypto.sign(transaction, keys)

  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

export default {
  createExchange
}
