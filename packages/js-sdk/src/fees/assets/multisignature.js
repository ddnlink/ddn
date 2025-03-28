import { bignumber } from '../../utils'

export default {
  multisignature: async ({ asset }, sender) => {
    return bignumber.multiply(
      bignumber.plus(asset.multisignature.keysgroup.length, 1),
      5,
      this.constants.fixedPoint
    )
  }
}
