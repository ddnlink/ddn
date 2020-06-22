/**
 * BlockStatus
 * wangxm   2018-01-09
 */
import DdnUtils from '@ddn/utils'

import constants from '../../constants'
import Delegate from '../lib/delegate'

var _singleton

class BlockStatus {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new Delegate(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context

    // TODO: constants 使用 global ？
    this._milestones = constants[context.config.net].milestones
    this._distance = constants[context.config.net].rewardDistance
    this._rewardOffset = constants[context.config.net].rewardOffset
  }

  parseHeight (height) {
    if (DdnUtils.bignum.isNaN(height)) {
      throw new Error('Invalid block height')
    } else {
      return DdnUtils.bignum.abs(height)
    }
  }

  calcMilestone (height) {
    const location = DdnUtils.bignum.floor(DdnUtils.bignum.divide(this.parseHeight(DdnUtils.bignum.minus(height, this._rewardOffset)), this._distance))
    const lastMile = this._milestones[this._milestones.length - 1]

    if (DdnUtils.bignum.isGreaterThan(location, DdnUtils.bignum.minus(this._milestones.length, 1))) {
      return this._milestones.lastIndexOf(lastMile)
    } else {
      return location.toString()
    }
  }

  calcReward (height) {
    const heightResult = this.parseHeight(height)

    if (DdnUtils.bignum.isLessThan(heightResult, this._rewardOffset) || DdnUtils.bignum.isLessThanOrEqualTo(heightResult, 1)) {
      return '0'
    } else {
      return this._milestones[this.calcMilestone(heightResult)]
    }
  }

  calcSupply (height) {
    let heightResult = this.parseHeight(height)

    heightResult = DdnUtils.bignum.minus(heightResult, DdnUtils.bignum.modulo(heightResult, this.config.settings.delegateNumber))

    const milestone = this.calcMilestone(heightResult)

    let supply = DdnUtils.bignum.new(constants.totalAmount)

    const rewards = []

    if (DdnUtils.bignum.isLessThanOrEqualTo(heightResult, 0)) {
      return supply.toString()
    }

    let amount = DdnUtils.bignum.new(0)
    let multiplier = DdnUtils.bignum.new(0)

    heightResult = DdnUtils.bignum.plus(DdnUtils.bignum.minus(heightResult, this._rewardOffset), 1)

    for (var i = 0; i < this._milestones.length; i++) {
      if (milestone >= i) {
        multiplier = DdnUtils.bignum.new(this._milestones[i])

        if (DdnUtils.bignum.isLessThanOrEqualTo(heightResult, 0)) {
          break // Rewards not started yet
        } else if (DdnUtils.bignum.isLessThan(heightResult, this._distance)) {
          amount = DdnUtils.bignum.modulo(heightResult, this._distance)
        } else {
          amount = DdnUtils.bignum.new(this._distance)
        }
        rewards.push([amount.toString(), multiplier.toString()]) // DdnUtils.bignum update

        heightResult = DdnUtils.bignum.minus(heightResult, this._distance)
      } else {
        break // Milestone out of bounds
      }
    }

    if (DdnUtils.bignum.isGreaterThan(heightResult, 0)) {
      rewards.push([heightResult, this._milestones[this._milestones.length - 1]])
    }

    for (i = 0; i < rewards.length; i++) {
      const reward = rewards[i]

      supply = DdnUtils.bignum.plus(supply, DdnUtils.bignum.multiply(reward[0], reward[1]))
    }

    if (this._rewardOffset <= 1) {
      supply = DdnUtils.bignum.minus(supply, this._milestones[0])
    }

    return supply.toString()
  }
}

export default BlockStatus
