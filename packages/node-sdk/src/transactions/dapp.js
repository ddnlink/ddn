import ByteBuffer from 'bytebuffer'
import DdnUtils from '@ddn/utils'

import crypto from '../utils/crypto'
import constants from '../constants'
import slots from '../time/slots'
import globalOptions from '../options'

async function createDApp (options, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const transaction = {
    nethash: globalOptions.get('nethash'),
    type: DdnUtils.assetTypes.DAPP,
    amount: '0',
    fee: constants.net.fees.dapp,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - globalOptions.get('clientDriftSeconds'),
    asset: {
      dapp: {
        category: options.category,
        name: options.name,
        description: options.description,
        tags: options.tags,
        type: options.type,
        link: options.link,
        icon: options.icon,
        delegates: options.delegates,
        unlock_delegates: options.unlock_delegates
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

function getDAppTransactionBytes (trs, skipSignature) {
  const bb = new ByteBuffer(1, true)
  bb.writeInt(trs.timestamp)
  bb.writeString(trs.fee)

  const senderPublicKeyBuffer = Buffer.from(trs.senderPublicKey, 'hex')
  for (let i = 0; i < senderPublicKeyBuffer.length; i++) {
    bb.writeByte(senderPublicKeyBuffer[i])
  }

  bb.writeInt(trs.type)

  if (trs.args) bb.writeString(trs.args)

  if (!skipSignature && trs.signature) {
    const signatureBuffer = Buffer.from(trs.signature, 'hex')
    for (let i = 0; i < signatureBuffer.length; i++) {
      bb.writeByte(signatureBuffer[i])
    }
  }
  bb.flip()
  return bb.toBuffer()
}

function createInnerTransaction (options, secret) {
  const keys = crypto.getKeys(secret)
  let args = options.args
  if (args instanceof Array) args = JSON.stringify(args)
  const trs = {
    nethash: globalOptions.get('nethash'),
    fee: options.fee,
    timestamp: slots.getTime() - globalOptions.get('clientDriftSeconds'),
    senderPublicKey: keys.publicKey,
    type: options.type,
    args
  }
  trs.signature = crypto.signBytes(getDAppTransactionBytes(trs), keys) // .sign?
  return trs
}

export default {
  createDApp,
  createInnerTransaction
}
