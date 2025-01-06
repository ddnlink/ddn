/**
 * Round
 * wangxm   2018-01-10
 */
import { bignum } from '@ddn/utils'

class RoundChanges {
  constructor (context, round) {
    Object.assign(this, context)
    this.runtime = context.runtime
    this._CLUB_BONUS_RATIO = context.constants.net.rewardRatio

    if (round) {
      this._roundFees = this.runtime.round._unFeesByRound[round] || 0
      this._roundRewards = this.runtime.round._unRewardsByRound[round] || []
    }
  }

  at (index) {
    const ratio = bignum.minus(1, this._CLUB_BONUS_RATIO)

    const totalDistributeFees = bignum.floor(bignum.multiply(this._roundFees, ratio))
    const fees = bignum.floor(bignum.divide(totalDistributeFees, this.constants.delegates))
    const feesRemaining = bignum.minus(totalDistributeFees, bignum.multiply(fees, this.constants.delegates))

    const rewards = bignum.floor(bignum.multiply(this._roundRewards[index], ratio)) || 0

    return {
      fees: fees.toString(),
      feesRemaining: feesRemaining.toString(),
      rewards: rewards.toString(),
      balance: bignum.plus(fees, rewards).toString()
    }
  }

  getClubBonus () {
    const fees = bignum.minus(
      this._roundFees,
      bignum.floor(bignum.multiply(this._roundFees, bignum.minus(1, this._CLUB_BONUS_RATIO)))
    )

    let rewards = bignum.new(0)
    for (let i = 0; i < this._roundRewards.length; ++i) {
      rewards = bignum.plus(
        rewards,
        bignum.minus(
          this._roundRewards[i],
          bignum.floor(bignum.multiply(this._roundRewards[i], bignum.minus(1, this._CLUB_BONUS_RATIO)))
        )
      )
    }

    return {
      fees: fees.toString(),
      rewards: rewards.toString()
    }
  }
}

export default RoundChanges
