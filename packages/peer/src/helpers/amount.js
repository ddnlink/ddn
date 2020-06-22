/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:6:56
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import DdnUtils from '@ddn/utils'

export default {
  validate (amount) {
    if (typeof amount !== 'string') return 'Invalid amount type'
    if (!/^[1-9][0-9]*$/.test(amount)) return 'Amount should be integer'

    let bnAmount
    try {
      bnAmount = DdnUtils.bignum.new(amount)
    } catch (e) {
      return 'Failed to convert'
    }

    if (DdnUtils.bignum.isLessThan(bnAmount, 1) ||
        DdnUtils.bignum.isGreaterThan(bnAmount, '1e48')) {
      return 'Invalid amount range'
    }

    return null
  },

  calcRealAmount (amount, precision) {
    let ba = DdnUtils.bignum.new(amount)
    while (precision > 0) {
      if (precision > 8) {
        ba = DdnUtils.bignum.divide(ba, 10 ** 8)
      } else {
        ba = DdnUtils.bignum.divide(ba, 10 ** precision)
      }
      precision -= 8
    }
    return ba.toString()
  }
}
