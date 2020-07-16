import DdnUtils from '@ddn/utils'
import constants from '../constants'
import assetGetFees from './assets'
import { getAsset } from '../utils/asset-util'

async function getFee (transaction) {
  switch (transaction.type) {
    case DdnUtils.assetTypes.TRANSFER: // Normal
      return DdnUtils.bignum.multiply(0.1, constants.fixedPoint)
    case DdnUtils.assetTypes.SIGNATURE: // Signature
      return DdnUtils.bignum.multiply(100, constants.fixedPoint)
    case DdnUtils.assetTypes.DELEGATE: // Delegate
      return DdnUtils.bignum.multiply(10000, constants.fixedPoint)
    case DdnUtils.assetTypes.VOTE: // Vote
      return DdnUtils.bignum.new(constants.fixedPoint)
    case DdnUtils.assetTypes.AOB_ISSUER: // Issuer
      return DdnUtils.bignum.multiply(100, constants.fixedPoint)
    case DdnUtils.assetTypes.AOB_ASSET: // Issuer
      return DdnUtils.bignum.multiply(500, constants.fixedPoint)
    default: {
      const fee = await getAssetFee(transaction)
      console.log('getFee: ', fee)
      return fee
    }
  }
}

async function getAssetFee (transaction) {
  let fee = constants.net.fees.send
  const { trsName, asset } = await getAsset(transaction)
  if (asset && (typeof assetGetFees[trsName] === 'function')) {
    fee = await assetGetFees[trsName](asset)
  }
  return fee
}

export {
  getFee
}
