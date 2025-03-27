import { bignum, assetTypes } from '@ddn/utils'

import crypto from '../utils/crypto'
import { constants }  from '../config'
import slots from '../time/slots'

async function createIssuerAuditorBuy (received_address, amount, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_ISSUER_AUDITOR_BUY,
    nethash: constants.nethash,
    amount,
    fee: `${fee}`,
    recipientId: received_address,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponIssuerAuditorBuy: {
        address: crypto.generateAddress(keys.publicKey)
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

async function createIssuerApply (orgName, org_id, orgOwner, orgOwnerPhone, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_ISSUER_APPLY,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponIssuerApply: {
        address: crypto.generateAddress(keys.publicKey),
        orgName,
        org_id,
        orgOwner,
        orgOwnerPhone
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

async function createIssuerUpdate (orgName, org_id, orgOwner, orgOwnerPhone, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_ISSUER_UPDATE,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponIssuerUpdate: {
        address: crypto.generateAddress(keys.publicKey),
        orgName,
        org_id,
        orgOwner,
        orgOwnerPhone
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

async function createIssuerCheck (address, orgName, org_id, orgOwner, orgOwnerPhone, state, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_ISSUER_CHECK,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponIssuerCheck: {
        address,
        orgName,
        org_id,
        orgOwner,
        orgOwnerPhone,
        state
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

async function createIssuerFreeze (address, orgName, org_id, orgOwner, orgOwnerPhone, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_ISSUER_FREEZE,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponIssuerFreeze: {
        address,
        orgName,
        org_id,
        orgOwner,
        orgOwnerPhone
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

async function createIssuerUnfreeze (address, orgName, org_id, orgOwner, orgOwnerPhone, state, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_ISSUER_UNFREEZE,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponIssuerUnfreeze: {
        address,
        orgName,
        org_id,
        orgOwner,
        orgOwnerPhone,
        state
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

async function createIssueNew (
  goodsName,
  goodsSpecs,
  goodsUnit,
  goodsNum,
  unitPrice,
  batchValue,
  issueNum,
  issueTime,
  expireTime,
  secret,
  secondSecret
) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_ISSUE_NEW,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponIssueNew: {
        address: crypto.generateAddress(keys.publicKey),
        goodsName,
        goodsSpecs,
        goodsUnit,
        goodsNum,
        unitPrice,
        batchValue,
        issueNum,
        issueTime,
        expireTime
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

async function createIssueClose (
  goodsName,
  goodsSpecs,
  goodsUnit,
  goodsNum,
  unitPrice,
  batchValue,
  issueNum,
  issueTime,
  expireTime,
  secret,
  secondSecret
) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_ISSUE_CLOSE,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponIssueClose: {
        address: crypto.generateAddress(keys.publicKey),
        goodsName,
        goodsSpecs,
        goodsUnit,
        goodsNum,
        unitPrice,
        batchValue,
        issueNum,
        issueTime,
        expireTime
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

async function createIssueReopen (
  goodsName,
  goodsSpecs,
  goodsUnit,
  goodsNum,
  unitPrice,
  batchValue,
  issueNum,
  issueTime,
  expireTime,
  secret,
  secondSecret
) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_ISSUE_REOPEN,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponIssueReopen: {
        address: crypto.generateAddress(keys.publicKey),
        goodsName,
        goodsSpecs,
        goodsUnit,
        goodsNum,
        unitPrice,
        batchValue,
        issueNum,
        issueTime,
        expireTime
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

async function createExchangeBuy (batchValue, code, received_address, price, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_EXCH_BUY,
    nethash: constants.nethash,
    amount: price,
    fee: `${fee}`,
    recipientId: received_address,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponExcBuy: {
        batchValue,
        code,
        sender_address: crypto.generateAddress(keys.publicKey),
        received_address,
        price
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

async function createExchangePay (batchValue, code, received_address, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_EXCH_PAY,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponExcPay: {
        batchValue,
        code,
        sender_address: crypto.generateAddress(keys.publicKey),
        received_address,
        price: '0'
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

async function createExchangeTransferConfirm (
  batchValue,
  code,
  received_address,
  price,
  related_trs_id,
  state,
  secret,
  secondSecret
) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_EXCH_TRANSFER_CONFIRM,
    nethash: constants.nethash,
    amount: price,
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponExcTransferConfirm: {
        batchValue,
        code,
        sender_address: crypto.generateAddress(keys.publicKey),
        received_address,
        price,
        related_trs_id,
        transferState: state
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

async function createExchangeTransferAsk (batchValue, code, received_address, price, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = bignum.multiply(constants.fees.transfer, constants.fixedPoint)

  const transaction = {
    type: assetTypes.COUPON_EXCH_TRANSFER_ASK,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - 5,
    asset: {
      couponExcTransferAsk: {
        batchValue,
        code,
        sender_address: crypto.generateAddress(keys.publicKey),
        received_address,
        price
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
  createIssuerAuditorBuy,
  createIssuerApply,
  createIssuerCheck,
  createIssuerUpdate,
  createIssuerFreeze,
  createIssuerUnfreeze,
  createIssueNew,
  createIssueClose,
  createIssueReopen,
  createExchangeBuy,
  createExchangePay,
  createExchangeTransferAsk,
  createExchangeTransferConfirm
}
