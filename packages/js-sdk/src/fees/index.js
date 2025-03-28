import { bignumber, assetTypes } from '../utils'
import assetGetFees from './assets'
import { getAsset } from '../utils/asset-util'
import { setup } from '../config'
const constants = setup().constants

async function getFee (transaction) {
  switch (transaction.type) {
    case assetTypes.TRANSFER: // Normal
      return bignumber.multiply(constants.fees.transfer, constants.fixedPoint)
    case assetTypes.SIGNATURE: // Signature
      return bignumber.multiply(constants.fees.signature, constants.fixedPoint)
    case assetTypes.DELEGATE: // Delegate
      return bignumber.multiply(constants.fees.delegate, constants.fixedPoint)
    case assetTypes.VOTE: // Vote
      return bignumber.multiply(constants.fees.vote, constants.fixedPoint)
    case assetTypes.AOB_TRANSFER: // Vote
      return bignumber.multiply(constants.fees.aob_transfer, constants.fixedPoint)
    default: {
      const fee = await getAssetFee(transaction)
      // console.log('getFee: ', fee)
      return fee
    }
  }
}

async function getAssetFee (transaction) {
  let fee = bignumber.multiply(constants.fees.transfer, constants.fixedPoint)
  const { trsName, asset } = await getAsset(transaction)
  if (asset && typeof assetGetFees[trsName] === 'function') {
    fee = await assetGetFees[trsName](asset)
  }
  return fee
}

export { getFee }
