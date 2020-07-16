import DdnUtils from '@ddn/utils'

export default {
  multisignature: async ({ asset }, sender) => {
    return DdnUtils.bignum.multiply(
      DdnUtils.bignum.plus(asset.multisignature.keysgroup.length, 1),
      5, this.constants.fixedPoint)
  }
}
