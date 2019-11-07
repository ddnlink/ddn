/*---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:6:56
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const { Bignum } = require('@ddn/ddn-utils');

module.exports = {
  validate(amount) {
    if (typeof amount != 'string') return 'Invalid amount type'
    if (!/^[1-9][0-9]*$/.test(amount)) return 'Amount should be integer'

    let bnAmount;
    try {
      bnAmount = Bignum.new(amount);
    } catch (e) {
      return 'Failed to convert'
    }

    if (Bignum.isLessThan(bnAmount, 1) ||
        Bignum.isGreaterThan(bnAmount, '1e48')) {
        return 'Invalid amount range'
    }

    return null
  },

  calcRealAmount(amount, precision) {
    let ba = Bignum.new(amount);
    while (precision > 0) {
      if (precision > 8) {
        ba = Bignum.divide(ba, 10 ** 8);
      } else {
        ba = Bignum.divide(ba, 10 ** precision);
      }
      precision -= 8
    }
    return ba.toString()
  }
}
