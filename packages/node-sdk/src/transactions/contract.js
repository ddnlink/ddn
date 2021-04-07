import DdnUtils from '@ddn/utils'

import crypto from '../utils/crypto'

import slots from '../time/slots'
import { config, constants } from '../config'

async function createContract (options, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = DdnUtils.bignum.multiply(constants.net.fees.contract, constants.fixedPoint)

  const timestamp = slots.getTime() - config.clientDriftSeconds

  const contract = {
    name: options.name,
    gas_limit: `${options.gasLimit}`,
    publisher: await crypto.generateAddress(keys.publicKey, constants.tokenPrefix),
    desc: options.desc,
    version: options.version,
    code: options.code,
    timestamp
  }

  contract.id = await crypto.generateAddress(`${timestamp}_${keys.publicKey}`, constants.tokenPrefix)
  // contract.code = options.code,

  const transaction = {
    nethash: config.nethash,
    type: DdnUtils.assetTypes.CONTRACT,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp,
    asset: {
      contract
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

async function executeContract (options, secret, secondSecret) {
  const keys = crypto.getKeys(secret)
  let args = options.args
  if (args instanceof Array) args = JSON.stringify(args)

  const fee = DdnUtils.bignum.multiply(constants.net.fees.contract, constants.fixedPoint)

  const timestamp = slots.getTime() - config.clientDriftSeconds
  const exe = {
    public_key: keys.publicKey,
    gas_limit: `${options.gasLimit}`,
    address: options.address,
    method: options.method,
    args,
    timestamp
  }
  const trs = {
    nethash: config.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    timestamp,
    senderPublicKey: keys.publicKey,
    type: DdnUtils.assetTypes.CONTRACT_EXECUTE,
    args: null,
    asset: {
      execute: exe
    }
  }
  // console.log(trs)
  trs.signature = await crypto.sign(trs, keys)
  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    trs.sign_signature = await crypto.secondSign(trs, secondKeys)
  }
  trs.id = await crypto.getId(trs)
  return trs
}

async function transferContract (options, secret, secondSecret) {
  const keys = crypto.getKeys(secret)
  let args = options.args
  if (args instanceof Array) args = JSON.stringify(args)

  const fee = DdnUtils.bignum.multiply(constants.net.fees.contract, constants.fixedPoint)

  const timestamp = slots.getTime() - config.clientDriftSeconds
  const trans = {
    gas_limit: `${options.gasLimit}`,
    address: options.address,
    amount: options.amount,
    currency: options.currency,
    method: options.method,
    args,
    timestamp
  }
  const trs = {
    nethash: config.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    timestamp,
    senderPublicKey: keys.publicKey,
    type: DdnUtils.assetTypes.CONTRACT_TRANSFER,
    args: null,
    asset: {
      transfer: trans
    }
  }
  // console.log(trs)
  trs.signature = await crypto.sign(trs, keys)
  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    trs.sign_signature = await crypto.secondSign(trs, secondKeys)
  }
  trs.id = await crypto.getId(trs)
  return trs
}

export default {
  createContract,
  executeContract,
  transferContract
}
