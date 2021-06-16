import crypto from '../utils/crypto'

import { bignum, assetTypes } from '@ddn/utils'
import slots from '../time/slots'
import { config, constants } from '../config'

const nethash = config.nethash

async function createInTransfer (dappId, currency, amount, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.dapp_in, constants.fixedPoint)
  const transaction = {
    type: assetTypes.DAPP_IN,
    nethash,
    amount: '0', // Bignum update
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - config.clientDriftSeconds,
    asset: {
      dappIn: {
        dapp_id: dappId,
        currency
      }
    }
  }
  if (currency === constants.tokenName) {
    transaction.amount = amount // Bignum update Number(amount)
  } else {
    transaction.asset.dappIn.amount = String(amount)
  }

  transaction.signature = await crypto.sign(transaction, keys)

  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

async function createOutTransfer (secret, recipientId, dappId, transactionId, currency, amount, withdrawal_sequence) {
  const keys = crypto.getKeys(secret)
  const fee = bignum.multiply(constants.fees.dapp_out, constants.fixedPoint)

  const transaction = {
    nethash,
    type: assetTypes.DAPP_OUT,
    amount: '0', // Bignum update
    fee: `${fee}`,
    recipientId: recipientId,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - config.clientDriftSeconds,
    asset: {
      dappOut: {
        dapp_id: dappId,
        outtransaction_id: transactionId,
        currency,
        amount,
        withdrawal_sequence: String(withdrawal_sequence)
      }
    }
  }

  transaction.signature = await crypto.sign(transaction, keys)

  // if (secondSecret) {
  //   const secondKeys = crypto.getKeys(secondSecret)
  //   transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  // }

  transaction.id = await crypto.getId(transaction)
  return transaction
}
// async function createOutTransfer (recipientId, dappId, transactionId, currency, amount, secret, secondSecret) {
//   const keys = crypto.getKeys(secret)

//   const fee = bignum.multiply(constants.fees.dapp_out, constants.fixedPoint)

//   const transaction = {
//     nethash,
//     type: assetTypes.DAPP_OUT,
//     amount: '0', // Bignum update
//     fee: `${fee}`,
//     recipientId: recipientId,
//     senderPublicKey: keys.publicKey,
//     timestamp: slots.getTime() - config.clientDriftSeconds,
//     asset: {
//       outTransfer: {
//         dapp_id: dappId,
//         transaction_id: transactionId,
//         currency,
//         amount
//       }
//     }
//   }

//   transaction.signature = await crypto.sign(transaction, keys)

//   if (secondSecret) {
//     const secondKeys = crypto.getKeys(secondSecret)
//     transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
//   }

//   transaction.id = await crypto.getId(transaction)
//   return transaction
// }

async function signOutTransfer (transaction, secret) {
  const keys = crypto.getKeys(secret)
  const signature = await crypto.sign(transaction, keys)
  return signature
}

export default {
  createInTransfer,
  createOutTransfer,
  signOutTransfer
}
