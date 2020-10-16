/**
 * BlockStatus
 * wangxm   2018-01-09
 */
import { bignum } from '@ddn/utils'

// fixme: bug 2020.8.2
// import Delegate from '../consensus/delegate'

let _singleton

class BlockStatus {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new BlockStatus(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context

    this._milestones = context.constants.net.milestones
    this._distance = context.constants.net.rewardDistance
    this._rewardOffset = context.constants.net.rewardOffset
  }

  parseHeight (height) {
    if (bignum.isNaN(height)) {
      throw new Error('Invalid block height')
    } else {
      return bignum.abs(height)
    }
  }

  calcMilestone (height) {
    const location = bignum.floor(
      bignum.divide(this.parseHeight(bignum.minus(height, this._rewardOffset)), this._distance)
    )
    const lastMile = this._milestones[this._milestones.length - 1]

    if (bignum.isGreaterThan(location, bignum.minus(this._milestones.length, 1))) {
      return this._milestones.lastIndexOf(lastMile)
    } else {
      return location.toString()
    }
  }

  calcReward (height) {
    const heightResult = this.parseHeight(height)

    if (bignum.isLessThan(heightResult, this._rewardOffset) || bignum.isLessThanOrEqualTo(heightResult, 1)) {
      return '0'
    } else {
      return this._milestones[this.calcMilestone(heightResult)]
    }
  }

  calcSupply (height) {
    let heightResult = this.parseHeight(height)

    heightResult = bignum.minus(heightResult, bignum.modulo(heightResult, this.constants.delegates))

    const milestone = this.calcMilestone(heightResult)

    let supply = bignum.new(this.constants.totalAmount)

    const rewards = []

    if (bignum.isLessThanOrEqualTo(heightResult, 0)) {
      return supply.toString()
    }

    let amount = bignum.new(0)
    let multiplier = bignum.new(0)

    heightResult = bignum.minus(heightResult, this._rewardOffset).plus(1)

    for (var i = 0; i < this._milestones.length; i++) {
      if (milestone >= i) {
        multiplier = bignum.new(this._milestones[i])

        if (bignum.isLessThanOrEqualTo(heightResult, 0)) {
          break // Rewards not started yet
        } else if (bignum.isLessThan(heightResult, this._distance)) {
          amount = bignum.modulo(heightResult, this._distance)
        } else {
          amount = bignum.new(this._distance)
        }
        rewards.push([amount.toString(), multiplier.toString()]) // bignum update

        heightResult = bignum.minus(heightResult, this._distance)
      } else {
        break // Milestone out of bounds
      }
    }

    if (bignum.isGreaterThan(heightResult, 0)) {
      rewards.push([heightResult, this._milestones[this._milestones.length - 1]])
    }

    for (i = 0; i < rewards.length; i++) {
      const reward = rewards[i]

      supply = bignum.plus(supply, bignum.multiply(reward[0], reward[1]))
    }

    if (this._rewardOffset <= 1) {
      supply = bignum.minus(supply, this._milestones[0])
    }

    return supply.toString()
  }
}

export default BlockStatus
