import { bignum, assetTypes } from '@ddn/utils'
import { constants } from '../config'
import assetGetFees from './assets'
import { getAsset } from '../utils/asset-util'

async function getFee (transaction) {
  switch (transaction.type) {
    case assetTypes.TRANSFER: // Normal
      return bignum.multiply(constants.net.fees.transfer, constants.fixedPoint)
    case assetTypes.SIGNATURE: // Signature
      return bignum.multiply(constants.net.fees.signature, constants.fixedPoint)
    case assetTypes.DELEGATE: // Delegate
      return bignum.multiply(constants.net.fees.delegate, constants.fixedPoint)
    case assetTypes.VOTE: // Vote
      return bignum.multiply(constants.net.fees.vote, constants.fixedPoint)
    case assetTypes.AOB_TRANSFER: // Vote
      return bignum.multiply(constants.net.fees.aob_transfer, constants.fixedPoint)
    default: {
      const fee = await getAssetFee(transaction)
      // console.log('getFee: ', fee)
      return fee
    }
  }
}

async function getAssetFee (transaction) {
  let fee = bignum.multiply(constants.net.fees.transfer, constants.fixedPoint)
  const { trsName, asset } = await getAsset(transaction)
  if (asset && (typeof assetGetFees[trsName] === 'function')) {
    fee = await assetGetFees[trsName](asset)
  }
  return fee
}

export {
  getFee
}
