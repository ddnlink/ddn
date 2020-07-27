import DdnUtils from '@ddn/utils'
import DdnCrypto from '../utils/crypto'
import slots from '../time/slots'

import { config, constants } from '../config'

const { bignum } = DdnUtils

function getClientFixedTime () {
  return slots.getTime() - config.clientDriftSeconds
}

async function createTransaction (
  asset,
  fee,
  type,
  recipientId,
  message,
  secret,
  secondSecret
) {
  const keys = DdnCrypto.getKeys(secret)

  const transaction = {
    type,
    nethash: config.nethash,
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

  // transaction.id = await DdnCrypto.getId(transaction)

  return transaction
}

export default {
  async createIssuer (name, desc, secret, secondSecret) {
    const asset = {
      aobIssuer: {
        name,
        desc
      }
    }
    const fee = bignum.multiply(100, constants.fixedPoint)
    const trs = await createTransaction(
      asset,
      fee,
      DdnUtils.assetTypes.AOB_ISSUER,
      null,
      null,
      secret,
      secondSecret
    )

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
    const asset = {
      aobAsset: {
        name,
        desc,
        maximum,
        precision,
        strategy,
        allow_blacklist: `${allowBlacklist}`,
        allow_whitelist: `${allowWhitelist}`,
        allow_writeoff: `${allowWriteoff}`
      }
    }
    // var fee = (500 + (Math.floor(bytes.length / 200) + 1) * 0.1) * constants.fixedPoint
    const fee = bignum.multiply(500, constants.fixedPoint)
    return await createTransaction(
      asset,
      fee,
      DdnUtils.assetTypes.AOB_ASSET,
      null,
      null,
      secret,
      secondSecret
    )
  },

  async createFlags (currency, flagType, flag, secret, secondSecret) {
    const asset = {
      aobFlags: {
        currency,
        flag_type: flagType,
        flag
      }
    }
    const fee = bignum.multiply(0.1, constants.fixedPoint)
    return await createTransaction(
      asset,
      fee,
      DdnUtils.assetTypes.AOB_FLAG,
      null,
      null,
      secret,
      secondSecret
    )
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
    const fee = bignum.multiply(0.1, constants.fixedPoint)
    return await createTransaction(
      asset,
      fee,
      DdnUtils.assetTypes.AOB_ACL,
      null,
      null,
      secret,
      secondSecret
    )
  },

  async createIssue (currency, amount, secret, secondSecret) {
    const asset = {
      aobIssue: {
        currency,
        amount: `${amount}`
      }
    }
    const fee = bignum.multiply(0.1, constants.fixedPoint)
    const trs = await createTransaction(
      asset,
      fee,
      DdnUtils.assetTypes.AOB_ISSUE,
      null,
      null,
      secret,
      secondSecret
    )

    return trs
  },

  async createTransfer (
    currency,
    amount,
    recipientId,
    message,
    secret,
    secondSecret
  ) {
    const asset = {
      aobTransfer: {
        currency,
        amount: `${amount}`
      }
    }
    const fee = bignum.multiply(0.1, constants.fixedPoint)
    return await createTransaction(
      asset,
      fee,
      DdnUtils.assetTypes.AOB_TRANSFER,
      recipientId,
      message,
      secret,
      secondSecret
    )
  }
}
