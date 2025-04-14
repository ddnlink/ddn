import bignum from './bignumber'

const amount = {
  /**
   * Validate the validity of an amount. 
   * @param {string} amount - The amount to validate, should be a string or a number.
   * @returns {Object} - An object containing validation result and message.
   *  - valid: {boolean} - Whether the validation passed.
   *  - message: {string} - Error message if validation fails.
   */
  validate (amount) {
    // Check if the amount is a string.
    if (bignum.isNaN(amount)) {
      return { valid: false, message: 'Invalid amount type' };
    }

    let bnAmount;
    try {
      // Try to convert the amount to a big number.
      bnAmount = bignum.new(amount);
    } catch (e) {
      // Return error message if conversion fails.
      return { valid: false, message: `Failed to convert: ${e.message}` };
    }
    // Check if the amount is within the valid range.
    if (bignum.isLessThan(bnAmount, 0) || bignum.isGreaterThan(bnAmount, '1e48')) {
      return { valid: false, message: 'Invalid amount range' };
    }
    // All checks passed, return validation success.
    return { valid: true, message: 'Amount is valid!' };
  },

  /**
   * Calculate the actual amount.
   * @param {string} amount - The amount to calculate, should be a string.
   * @param {number} precision - The precision, should be a non-negative integer between 0 and 8.
   * @returns {string} - The calculated actual amount as a string.
   */
  calcRealAmount (amount, precision) {
    // Check if the precision is negative or exceeds 8.
    if (precision < 0 || precision > 8) {
      throw new Error('Precision should be a non-negative integer between 0 and 8');
    }
    // Calculate the divisor, which is 10 to the power of precision.
    const divisor = bignum.new(10).pow(precision);
    // Convert the amount to a big number and divide by the divisor.
    const ba = bignum.new(amount).div(divisor);
    // Return the calculated result as a string.
    return ba.toFixed();
  }
}

export default amount
