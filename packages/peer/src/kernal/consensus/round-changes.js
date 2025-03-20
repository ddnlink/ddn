/**
 * Represents a round in the consensus mechanism.
 * Author: wangxm
 * Date: 2018-01-10
 */
import { bignum } from '@ddn/utils'

class RoundChanges {
  constructor(ctx, round) {
    if (!ctx || !ctx.runtime || !ctx.constants) {
      throw new Error('Invalid ctx or runtime in RoundChanges constructor');
    }
    Object.assign(this, ctx);
    // this.runtime = ctx.runtime;
    // this.constants = ctx.constants;
    this._CLUB_BONUS_RATIO = ctx.constants.net.rewardRatio
    if (round) {
      this._roundFees = this.runtime.round._unFeesByRound[round] || [];
      this._roundRewards = this.runtime.round._unRewardsByRound[round] || [];
    }
  }

  /**
   * Get the round fees and reward distribution information at the specified index.
   * @param {number} index - The index value.
   * @returns {Object} - An object containing fees, remaining fees, rewards, and total balance.
   */
  at (index) {
    // Log debug information including club bonus ratio, round fees, round rewards at the specified index, and number of delegates.
    this.logger.debug('RoundChanges at index', index, ':', {
      _CLUB_BONUS_RATIO: this._CLUB_BONUS_RATIO,
      _roundFees: this._roundFees,
      _roundRewards: this._roundRewards[index],
      delegates: this.constants.delegates
    });

    // Check if the round fees are a valid number.
    if (bignum.isNaN(this._roundFees)) {
      // Log error information.
      this.logger.error('Invalid _roundFees value:', this._roundFees);
      // Throw an error.
      throw new Error('Invalid _roundFees value');
      // this._roundFees = '0';
    }
    // Check if the round rewards at the specified index are a valid number.
    if (bignum.isNaN(this._roundRewards[index])) {
      // Log error information.
      this.logger.error('Invalid _roundRewards value at index', index, ':', this._roundRewards[index]);
      // Throw an error.
      throw new Error('Invalid _roundRewards value');
      // this._roundRewards[index] = '0';
    }
    // Check if the number of delegates is zero.
    if (this.constants.delegates === 0) {
      // Log error information.
      this.logger.error('Number of delegates cannot be zero.');
      // Return a zero-value result.
      return {
        fees: '0',
        feesRemaining: '0',
        rewards: '0',
        balance: '0'
      };
    }

    // Calculate the distribution ratio.
    const ratio = bignum.minus(1, this._CLUB_BONUS_RATIO);
    // Calculate the total distributed fees.
    const totalDistributeFees = bignum.floor(bignum.multiply(this._roundFees, ratio));
    // Calculate the fees per delegate.
    const fees = bignum.floor(bignum.divide(totalDistributeFees, this.constants.delegates));
    // Calculate the remaining fees.
    const feesRemaining = bignum.minus(totalDistributeFees, bignum.multiply(fees, this.constants.delegates));

    // Calculate the rewards at the specified index.
    const rewards = bignum.floor(bignum.multiply(this._roundRewards[index], ratio)) || 0;

    // Log debug information including fees, remaining fees, rewards, and total balance.
    this.logger.debug('RoundChanges result at index', index, ':', {
      fees: fees,
      feesRemaining: feesRemaining,
      rewards: rewards,
      balance: bignum.plus(fees, rewards)
    });

    // Return the result object with all values converted to strings.
    return {
      fees: fees.toString(),
      feesRemaining: feesRemaining.toString(),
      rewards: rewards.toString(),
      balance: bignum.plus(fees, rewards).toString()
    };
  }

  /**
   * Get the club bonus based on round fees and rewards.
   * @returns {Object} - An object containing club bonus fees and rewards.
   */
  getClubBonus () {
    // Check if _roundFees is a valid number. If not, set it to '0'.
    if (bignum.isNaN(this._roundFees)) {
      this.logger.error('Invalid _roundFees value:', this._roundFees);
      this._roundFees = '0';
    }
    // Check each element in _roundRewards. If an element is not a valid number, set it to '0'.
    for (let i = 0; i < this._roundRewards.length; ++i) {
      if (bignum.isNaN(this._roundRewards[i])) {
        this.logger.error('Invalid _roundRewards value at index', i, ':', this._roundRewards[i]);
        this._roundRewards[i] = '0';
      }
    }

    // Calculate club bonus fees.
    const fees = bignum.minus(
      this._roundFees,
      bignum.floor(bignum.multiply(this._roundFees, bignum.minus(1, this._CLUB_BONUS_RATIO)))
    );

    // Initialize club bonus rewards to 0.
    let rewards = bignum.new(0);
    // Calculate total club bonus rewards.
    for (let i = 0; i < this._roundRewards.length; ++i) {
      rewards = bignum.plus(
        rewards,
        bignum.minus(
          this._roundRewards[i],
          bignum.floor(bignum.multiply(this._roundRewards[i], bignum.minus(1, this._CLUB_BONUS_RATIO)))
        )
      );
    }

    return {
      fees: fees.toString(),
      rewards: rewards.toString()
    };
  }
}

export default RoundChanges;
