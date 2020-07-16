
import DdnUtils from '@ddn/utils'
import constants from '../../constants'

export default {
  daoOrg: async (asset) => {
    let feeBase = 1

    const org_id = asset.org_id
    const olen = org_id.length
    const feeLenMap = {
      10: 50,
      9: 100,
      8: 200,
      7: 400,
      6: 800,
      5: 1600
    }
    if (olen > 10) {
      feeBase = 10
    } else if (olen <= 4) {
      feeBase = 99999999 // not allow
    } else {
      feeBase = feeLenMap[`${olen}`]
    }
    if (asset.state === 1) {
      feeBase = parseInt(feeBase / 10, 10) // change info
    }
    const result = DdnUtils.bignum.multiply(feeBase, constants.fixedPoint).toString()
    console.log('daoOrg fee=', result)
    return result
  },

  daoConfirmation: async (asset) => {
    let feeBase = '1'
    if (asset.state === 0) {
      feeBase = '0' // 拒绝稿件时手续费为0
    }

    const result = DdnUtils.bignum.multiply(feeBase, constants.fixedPoint).toString()

    return result
  }
}
