/**
 * Round
 * wangxm   2018-01-10
 */
import DdnUtils from '@ddn/utils'

import constants from '../../constants'

class RoundChanges {
  constructor (context, round, back) {
    Object.assign(this, context)
    this._context = context

    if (!back) {
      // DdnUtils.bignum update var roundFees = parseInt(privated.feesByRound[round]) || 0;
      this._roundFees = this.runtime.round._feesByRound[round] || 0
      this._roundRewards = (this.runtime.round._rewardsByRound[round] || [])
    } else {
      // DdnUtils.bignum update var roundFees = parseInt(privated.unFeesByRound[round]) || 0;
      this._roundFees = this.runtime.round._unFeesByRound[round] || 0
      this._roundRewards = (this.runtime.round._unRewardsByRound[round] || [])
    }

    this._CLUB_BONUS_RATIO = constants[this.config.net].rewardRatio
  }

  at (index) {
    // DdnUtils.bignum update const ratio = (1 - CLUB_BONUS_RATIO);
    const ratio = DdnUtils.bignum.minus(1, this._CLUB_BONUS_RATIO)

    // DdnUtils.bignum update
    // const totalDistributeFees = Math.floor(roundFees * ratio);
    // const fees = Math.floor(totalDistributeFees / slots.delegates);
    // const feesRemaining = totalDistributeFees - (fees * slots.delegates);

    const totalDistributeFees = DdnUtils.bignum.floor(DdnUtils.bignum.multiply(this._roundFees, ratio))
    const fees = DdnUtils.bignum.floor(DdnUtils.bignum.divide(totalDistributeFees, this.config.settings.delegateNumber))
    const feesRemaining = DdnUtils.bignum.minus(totalDistributeFees, DdnUtils.bignum.multiply(fees, this.config.settings.delegateNumber))

    // DdnUtils.bignum update const rewards = Math.floor(parseInt(roundRewards[index]) * ratio) || 0;
    const rewards = DdnUtils.bignum.floor(DdnUtils.bignum.multiply(this._roundRewards[index], ratio)) || 0

    return {
      fees: fees.toString(),
      feesRemaining: feesRemaining.toString(),
      rewards: rewards.toString(),
      balance: DdnUtils.bignum.plus(fees, rewards).toString() // DdnUtils.bignum update fees + rewards
    }
  }

  getClubBonus () {
    // DdnUtils.bignum update
    // const fees = roundFees - Math.floor(roundFees * (1 - CLUB_BONUS_RATIO));
    const fees = DdnUtils.bignum.minus(this._roundFees, DdnUtils.bignum.floor(DdnUtils.bignum.multiply(this._roundFees, DdnUtils.bignum.minus(1, this._CLUB_BONUS_RATIO))))

    // DdnUtils.bignum update
    // let rewards = 0;
    // for (let i = 0; i < roundRewards.length; ++i) {
    //   let reward = parseInt(roundRewards[i])
    //   rewards += (reward - Math.floor(reward * (1 - CLUB_BONUS_RATIO)))
    // }
    let rewards = DdnUtils.bignum.new(0)
    for (let i = 0; i < this._roundRewards.length; ++i) {
      rewards = DdnUtils.bignum.plus(rewards, DdnUtils.bignum.minus(this._roundRewards[i], DdnUtils.bignum.floor(DdnUtils.bignum.multiply(this._roundRewards[i], DdnUtils.bignum.minus(1, this._CLUB_BONUS_RATIO)))))
    }

    return {
      fees: fees.toString(),
      rewards: rewards.toString()
    }
  }
}

export default RoundChanges
