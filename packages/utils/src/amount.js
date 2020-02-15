import DdnUtil from '@ddn/utils';

const amount = {
  validate(amount) {
    if (typeof amount != 'string') return 'Invalid amount type'
    if (!/^[1-9][0-9]*$/.test(amount)) return 'Amount should be integer'
    let bnAmount;
    try {
      bnAmount = DdnUtil.bignum.new(amount);
    } catch (e) {
      return 'Failed to convert'
    }
    if (DdnUtil.bignum.isLessThan(bnAmount, 1) || 
        DdnUtil.bignum.isGreaterThan(bnAmount, '1e48')) {
        return 'Invalid amount range'
    }
    return null
  },
  calcRealAmount(amount, precision) {
    let ba = DdnUtil.bignum.new(amount);
    while (precision > 0) {
      if (precision > 8) {
        ba = DdnUtil.bignum.divide(ba, 10 ** 8);
      } else {
        ba = DdnUtil.bignum.divide(ba, 10 ** precision);
      }
      precision -= 8;
    }
    return ba.toString();
  }
}

export default amount;