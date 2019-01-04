const bignum = require('bignum-utils');
const amount = {
  validate(amount) {
    if (typeof amount != 'string') return 'Invalid amount type'
    if (!/^[1-9][0-9]*$/.test(amount)) return 'Amount should be integer'

    let bnAmount;
    try {
      bnAmount = bignum.new(amount);
    } catch (e) {
      return 'Failed to convert'
    }
    
    if (bignum.isLessThan(bnAmount, 1) || 
        bignum.isGreaterThan(bnAmount, '1e48')) {
        return 'Invalid amount range'
    }

    return null
  }
}

module.exports = amount;