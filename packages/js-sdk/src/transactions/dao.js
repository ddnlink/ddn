import DdnUtils from '@ddn/utils'

import crypto from '../utils/crypto'
import constants from '../constants'

import slots from '../time/slots'
import options from '../options'

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
  } else { // length <= 4
    feeBase = 999999 // not allow
  }

  if (org.state === 1) {
    feeBase = parseInt(feeBase / 10)
  }
  const transaction = {
    type: DdnUtils.assetTypes.DAO_ORG,
    nethash: options.get('nethash'),
    amount: '0',
    fee: bignum.multiply(feeBase, 100000000).toString(), // bignum update feeBase * 100000000,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - options.get('clientDriftSeconds'),
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
  const fee = constants.net.fees.org
  const transaction = {
    type: DdnUtils.assetTypes.TRANSFER,
    nethash: options.get('nethash'),
    amount, // fixme 1000000000 ????
    fee: `${fee}`,
    recipientId: address,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - options.get('clientDriftSeconds')
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

  if (typeof (confirmation) !== 'object') {
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

  if (confirmation.state !== 0 && confirmation.state !== 1) {
    throw new Error('Invalid state format')
  }

  let fee = constants.net.fees.org
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
    nethash: options.get('nethash'),
    amount: `${amount}`,
    fee: `${fee}`,
    recipientId,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - options.get('clientDriftSeconds'),
    asset: {
      daoConfirmation: confirmation
    }
  }

  transaction.signature = await crypto.sign(transaction, keys)

  if (second_secret) {
    const secondKeys = crypto.getKeys(second_secret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = crypto.getId(transaction)
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

  if (typeof (contribution) !== 'object') {
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

  const fee = constants.net.fees.org
  // contribution.sender_address = contribution.sender_address
  // contribution.received_address = contribution.received_address
  const transaction = {
    type: DdnUtils.assetTypes.DAO_CONTRIBUTION,
    nethash: options.get('nethash'),
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    // senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - options.get('clientDriftSeconds'),
    asset: {
      daoContribution: contribution
    }
  }

  transaction.signature = await crypto.sign(transaction, keys)

  if (second_secret) {
    const secondKeys = crypto.getKeys(second_secret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = crypto.getId(transaction)
  return transaction
}

export default {
  createOrg,
  createConfirmation,
  createTransfer,
  createContribution
}
