import DdnUtils from '@ddn/utils'
import crypto from '../utils/crypto'

import slots from '../time/slots'
import { config, constants } from '../config'

const { bignum } = DdnUtils

/**
 * Create org transaction
 * @param {Org} org object
 * @param {*} secret
 * @param {*} second_secret
 */
function isOrgId (dao_id) {
  if (typeof dao_id !== 'string') {
    return false
  }
  if (/^[0-9a-z_]{1,20}$/g.test(dao_id)) {
    if (dao_id.charAt(0) === '_' || dao_id.charAt(dao_id.length - 1) === '_') {
      return false // not start or end with _
    } else {
      return true
    }
  } else {
    return false
  }
}

async function createOrg (org, secret, second_secret) {
  const keys = crypto.getKeys(secret)

  const sender = crypto.generateAddress(keys.publicKey)

  if (!org.address) {
    org.address = sender
  }

  if (typeof org !== 'object') {
    throw new Error('The first argument should be a object!')
  }

  org.org_id = org.org_id.toLowerCase()
  if (!isOrgId(org.org_id) || !org.org_id || org.org_id.length === 0) {
    throw new Error('Invalid org_id format')
  }

  const olen = org.org_id.length
  let feeBase = 1
  if (olen > 10) {
    feeBase = 10
  } else if (olen === 10) {
    feeBase = 50
  } else if (olen === 9) {
    feeBase = 100
  } else if (olen === 8) {
    feeBase = 200
  } else if (olen === 7) {
    feeBase = 400
  } else if (olen === 6) {
    feeBase = 800
  } else if (olen === 5) {
    feeBase = 1600
  } else {
    // length <= 4
    feeBase = 999999 // not allow
  }

  if (org.state === 1) {
    feeBase = parseInt(feeBase / 10)
  }
  const transaction = {
    type: DdnUtils.assetTypes.DAO_ORG,
    nethash: config.nethash,
    amount: '0',
    fee: bignum.multiply(feeBase, constants.fixedPoint).toString(), // bignum update feeBase * 100000000,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - config.clientDriftSeconds,
    asset: {
      org
    }
  }

  transaction.signature = await crypto.sign(transaction, keys)

  if (second_secret) {
    const secondKeys = crypto.getKeys(second_secret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

async function createTransfer (address, amount, secret, second_secret) {
  const keys = crypto.getKeys(secret)
  const fee = bignum.multiply(constants.fees.dao_exchange, constants.fixedPoint)
  const transaction = {
    type: DdnUtils.assetTypes.TRANSFER,
    nethash: config.nethash,
    amount, // fixme 1000000000 ????
    fee: `${fee}`,
    recipientId: address,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - config.clientDriftSeconds
  }

  transaction.signature = await crypto.sign(transaction, keys)

  if (second_secret) {
    const secondKeys = crypto.getKeys(second_secret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)

  return transaction
}

async function createConfirmation (trsAmount, confirmation, secret, second_secret) {
  const keys = crypto.getKeys(secret)

  if (typeof confirmation !== 'object') {
    throw new Error('The first argument should be a object!')
  }

  if (!confirmation.sender_address || confirmation.sender_address.length === 0) {
    throw new Error('Invalid sender_address format')
  }

  if (!confirmation.received_address || confirmation.received_address.length === 0) {
    throw new Error('Invalid received_address format')
  }

  if (!confirmation.contribution_trs_id || confirmation.contribution_trs_id.length === 0) {
    throw new Error('Invalid contribution_trs_id format')
  }

  if (!confirmation.url || confirmation.url.length === 0) {
    throw new Error('Invalid url format')
  }
  confirmation.url = (confirmation.url + '').toLowerCase()
  if (confirmation.state !== 0 && confirmation.state !== 1) {
    throw new Error('Invalid state format')
  }

  let fee = bignum.multiply(constants.fees.dao_confirmation, constants.fixedPoint)
  if (confirmation.state === 0) {
    fee = '0'
  }
  let amount = '0'
  let recipientId = ''
  if (confirmation.state === 1) {
    amount = trsAmount
    recipientId = confirmation.received_address
  }

  const transaction = {
    type: DdnUtils.assetTypes.DAO_CONFIRMATION,
    nethash: config.nethash,
    amount: `${amount}`,
    fee: `${fee}`,
    recipientId,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - config.clientDriftSeconds,
    asset: {
      daoConfirmation: confirmation
    }
  }

  transaction.signature = await crypto.sign(transaction, keys)

  if (second_secret) {
    const secondKeys = crypto.getKeys(second_secret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

/**
 * create contribution transaction
 * @param {*} contribution
 * @param {*} secret
 * @param {*} second_secret
 */
async function createContribution (contribution, secret, second_secret) {
  const keys = crypto.getKeys(secret)

  if (typeof contribution !== 'object') {
    throw new Error('The first argument should be a object!')
  }

  if (!contribution.title || contribution.title.length === 0) {
    throw new Error('Invalid title format')
  }

  if (!contribution.sender_address || contribution.sender_address.length === 0) {
    throw new Error('Invalid sender_address format')
  }

  if (!contribution.received_address || contribution.received_address.length === 0) {
    throw new Error('Invalid received_address format')
  }

  if (!contribution.url || contribution.url.length === 0) {
    throw new Error('Invalid url format')
  }
  contribution.url = (contribution.url + '').toLowerCase()
  const fee = bignum.multiply(constants.fees.dao_contribution, constants.fixedPoint)
  // contribution.sender_address = contribution.sender_address
  // contribution.received_address = contribution.received_address
  const transaction = {
    type: DdnUtils.assetTypes.DAO_CONTRIBUTION,
    nethash: config.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    // senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - config.clientDriftSeconds,
    asset: {
      daoContribution: contribution
    }
  }

  transaction.signature = await crypto.sign(transaction, keys)

  if (second_secret) {
    const secondKeys = crypto.getKeys(second_secret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

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

  const fee = bignum.multiply(constants.fees.exchange, constants.fixedPoint)

  const transaction = Object.assign(
    {
      type: DdnUtils.assetTypes.DAO_EXCHANGE,
      nethash: config.nethash,
      amount: '0', // Bignum update
      fee: `${fee}`,
      recipientId: exchange.recipientId || null,
      senderPublicKey: keys.publicKey,
      // senderPublicKey: keys.publicKey,
      timestamp: slots.getTime() - config.clientDriftSeconds,
      asset: {
        daoExchange: exchange
      }
    },
    trsopt || {}
  )

  transaction.signature = await crypto.sign(transaction, keys)

  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

export default {
  createOrg,
  createConfirmation,
  createTransfer,
  createContribution,
  createExchange
}
