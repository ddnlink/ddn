import DdnUtils from '@ddn/utils'

import crypto from '../utils/crypto'

import slots from '../time/slots'
import { config, constants } from '../config'

async function deploy (options, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = DdnUtils.bignum.multiply(constants.fees.contract, constants.fixedPoint)

  const timestamp = slots.getTime() - config.clientDriftSeconds
  // const compiler = new Compiler()
  // const { metadata } = compiler.compile(options.code)

  // console.log(metadata.toJSONObject())

  const contract = {
    name: options.name,
    gas_limit: +options.gasLimit || constants.maxGasLimit,
    owner: await crypto.generateAddress(keys.publicKey, constants.tokenPrefix),
    desc: options.desc,
    version: options.version,
    code: options.code
    // metadata: metadata.toJSONObject(),
  }

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

  // console.log(transaction)

  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

async function send (options, secret, secondSecret) {
  const keys = crypto.getKeys(secret)
  let args = options.args
  if (args instanceof Array) args = JSON.stringify(args)

  const fee = DdnUtils.bignum.multiply(constants.fees.contract_transfer, constants.fixedPoint)

  const timestamp = slots.getTime() - config.clientDriftSeconds
  const opts = {
    id: options.id,
    gas_limit: `${options.gasLimit || constants.maxGasLimit}`,
    method: options.method,
    args
  }
  const trs = {
    nethash: config.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    timestamp,
    senderPublicKey: keys.publicKey,
    type: DdnUtils.assetTypes.CONTRACT_TRANSFER,
    args: JSON.stringify(opts)
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

async function pay (options, secret, secondSecret) {
  const keys = crypto.getKeys(secret)
  let args = options.args
  if (args instanceof Array) args = JSON.stringify(args)

  const fee = DdnUtils.bignum.multiply(constants.fees.contract_transfer, constants.fixedPoint)

  const timestamp = slots.getTime() - config.clientDriftSeconds
  const opts = {
    id: options.id,
    gas_limit: `${options.gasLimit || constants.maxGasLimit}`,
    amount: options.amount,
    currency: options.currency,
    method: options.method,
    args
  }
  const trs = {
    nethash: config.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    timestamp,
    senderPublicKey: keys.publicKey,
    type: DdnUtils.assetTypes.CONTRACT_TRANSFER,
    args: JSON.stringify(opts)
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
  deploy,
  send,
  pay
}
