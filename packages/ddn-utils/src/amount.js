const Bignum = require('bignumber.js');
const amount = {
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
      precision -= 8;
    }
    return ba.toString();
  }
}

module.exports = amount;