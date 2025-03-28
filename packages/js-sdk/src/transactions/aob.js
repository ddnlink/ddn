import { bignumber, assetTypes, slots } from '../utils'
import * as DdnCrypto from '../crypto'
import { setup } from '../config'
const constants = setup().constants

function getClientFixedTime () {
  return slots.getTime() - 5
}

async function createTransaction (asset, fee, type, recipientId, message, secret, secondSecret) {
  const keys = DdnCrypto.getKeys(secret)

  const transaction = {
    type,
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: recipientId,
    senderPublicKey: keys.publicKey,
    timestamp: getClientFixedTime(),
    message,
    asset
  }

  transaction.signature = await DdnCrypto.sign(transaction, keys)
  if (secondSecret) {
    const secondKeys = DdnCrypto.getKeys(secondSecret)
    transaction.sign_signature = await DdnCrypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await DdnCrypto.getId(transaction)

  return transaction
}

export default {
  async createIssuer (name, desc, secret, secondSecret) {
    const keys = DdnCrypto.getKeys(secret)
    const issuer_id = DdnCrypto.generateAddress(keys.publicKey, constants.tokenPrefix)
    const asset = {
      aobIssuer: {
        name,
        desc,
        issuer_id
      }
    }
    const fee = bignumber.multiply(constants.fees.aob_issuer, constants.fixedPoint)
    const trs = await createTransaction(asset, fee, assetTypes.AOB_ISSUER, null, null, secret, secondSecret)

    return trs
  },

  async createAsset (
    name,
    desc,
    maximum,
    precision,
    strategy,
    allowWriteoff,
    allowWhitelist,
    allowBlacklist,
    secret,
    secondSecret
  ) {
    const nameParts = name.split('.')
    const asset = {
      aobAsset: {
        issuer_name: nameParts[0],
        name,
        desc,
        maximum,
        precision,
        quantity: '0',
        strategy,
        allow_blacklist: `${allowBlacklist}`,
        allow_whitelist: `${allowWhitelist}`,
        allow_writeoff: `${allowWriteoff}`
      }
    }
    // var fee = (500 + (Math.floor(bytes.length / 200) + 1) * 0.1) * constants.fixedPoint
    const fee = bignumber.multiply(constants.fees.aob_asset, constants.fixedPoint)
    return await createTransaction(asset, fee, assetTypes.AOB_ASSET, null, null, secret, secondSecret)
  },

  async createFlags (currency, flagType, flag, secret, secondSecret) {
    const asset = {
      aobFlags: {
        currency,
        flag_type: flagType,
        flag
      }
    }
    const fee = bignumber.multiply(constants.fees.aob_flag, constants.fixedPoint)
    return await createTransaction(asset, fee, assetTypes.AOB_FLAG, null, null, secret, secondSecret)
  },

  async createAcl (currency, operator, flag, list, secret, secondSecret) {
    const asset = {
      aobAcl: {
        currency,
        operator,
        flag,
        list
      }
    }
    const fee = bignumber.multiply(constants.fees.aob_acl, constants.fixedPoint)
    return await createTransaction(asset, fee, assetTypes.AOB_ACL, null, null, secret, secondSecret)
  },

  async createIssue (currency, amount, secret, secondSecret) {
    const asset = {
      aobIssue: {
        currency,
        amount: `${amount}`
      }
    }
    const fee = bignumber.multiply(constants.fees.aob_issue, constants.fixedPoint)
    const trs = await createTransaction(asset, fee, assetTypes.AOB_ISSUE, null, null, secret, secondSecret)

    return trs
  },

  async createTransfer (currency, amount, recipientId, message, content, secret, secondSecret) {
    const asset = {
      aobTransfer: {
        currency,
        amount: `${amount}`,
        content
      }
    }
    const fee = bignumber.multiply(constants.fees.aob_transfer, constants.fixedPoint)

    return await createTransaction(
      asset,
      fee,
      assetTypes.AOB_TRANSFER,
      recipientId,
      message,
      secret,
      secondSecret
    )
  }
}
