/**
 * BlockStatus
 * wangxm   2018-01-09
 */
import constants from '../../constants'
import { Bignum } from '@ddn/ddn-utils'
import Delegate from '../lib/delegate'

var _singleton;

class BlockStatus {

    static singleton(context) {
        if (!_singleton) {
            _singleton = new Delegate(context);
        }
        return _singleton;
    }

    constructor(context) {
        Object.assign(this, context);
        this._context = context;

        this._milestones = constants[context.config.netVersion].milestones;
        this._distance = constants[context.config.netVersion].rewardDistance;
        this._rewardOffset = constants[context.config.netVersion].rewardOffset;
    }

    parseHeight(height) {
        if (Bignum.isNaN(height)) {
            throw new Error('Invalid block height');
        } else {
            return Bignum.abs(height);
        }
    }

    calcMilestone(height) {
        const location = Bignum.floor(Bignum.divide(this.parseHeight(Bignum.minus(height, this._rewardOffset)), this._distance));
        const lastMile = this._milestones[this._milestones.length - 1];

        if (Bignum.isGreaterThan(location, Bignum.minus(this._milestones.length, 1))) {
            return this._milestones.lastIndexOf(lastMile);
        } else {
            return location.toString();
        }
    }

    calcReward(height) {
        const heightResult = this.parseHeight(height);

        if (Bignum.isLessThan(heightResult, this._rewardOffset) || Bignum.isLessThanOrEqualTo(heightResult, 1)) {
            return "0";
        } else {
            return this._milestones[this.calcMilestone(heightResult)];
        }
    }

    calcSupply(height) {
        let heightResult = this.parseHeight(height);

        heightResult = Bignum.minus(heightResult, Bignum.modulo(heightResult, this.config.settings.delegateNumber));

        const milestone = this.calcMilestone(heightResult);

        let supply = Bignum.new(constants.totalAmount);

        const rewards   = [];

        if (Bignum.isLessThanOrEqualTo(heightResult, 0)) {
            return supply.toString();
        }

        let amount = Bignum.new(0);
        let multiplier = Bignum.new(0);

        heightResult = Bignum.plus(Bignum.minus(heightResult, this._rewardOffset), 1);

        for (var i = 0; i < this._milestones.length; i++) {
            if (milestone >= i) {
                multiplier = Bignum.new(this._milestones[i]);

                if (Bignum.isLessThanOrEqualTo(heightResult, 0)) {
                    break; // Rewards not started yet
                } else if (Bignum.isLessThan(heightResult, this._distance)) {
                    amount = Bignum.modulo(heightResult, this._distance);
                } else {
                    amount = Bignum.new(this._distance);
                }
                rewards.push([amount.toString(), multiplier.toString()]);   //Bignum update

                heightResult = Bignum.minus(heightResult, this._distance);
            } else {
                break; // Milestone out of bounds
            }
        }

        if (Bignum.isGreaterThan(heightResult, 0)) {
            rewards.push([heightResult, this._milestones[this._milestones.length - 1]]);
        }

        for (i = 0; i < rewards.length; i++) {
            const reward = rewards[i];

            supply = Bignum.plus(supply, Bignum.multiply(reward[0], reward[1]));
        }

        if (this._rewardOffset <= 1) {
            supply = Bignum.minus(supply, this._milestones[0]);
        }

        return supply.toString();
    }

}

export default BlockStatus;
