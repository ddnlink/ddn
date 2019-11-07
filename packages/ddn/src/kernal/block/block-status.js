/**
 * BlockStatus
 * wangxm   2018-01-09
 */
const constants = require('../../constants');
const { Bignum } = require('@ddn/ddn-utils');

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
        //Bignum update height = parseInt(height);

        // if (isNaN(height)) {
        if (Bignum.isNaN(height)) {
            throw new Error('Invalid block height');
        } else {
          //Bignum update   return Math.abs(height);
            return Bignum.abs(height);
        }
    }

    calcMilestone(height) {
        //Bignum update const location = Math.floor(parseHeight(height - rewardOffset) / distance), lastMile = milestones[milestones.length - 1];
        const location = Bignum.floor(Bignum.divide(this.parseHeight(Bignum.minus(height, this._rewardOffset)), this._distance));
        const lastMile = this._milestones[this._milestones.length - 1];

        //Bignum update if (location > (milestones.length - 1)) {
        if (Bignum.isGreaterThan(location, Bignum.minus(this._milestones.length, 1))) {
            return this._milestones.lastIndexOf(lastMile);
        } else {
            return location.toString();
        }
    }

    calcReward(height) {
        var height = this.parseHeight(height);

        //Bignum update if (height < rewardOffset || height <= 1) {
        if (Bignum.isLessThan(height, this._rewardOffset) || Bignum.isLessThanOrEqualTo(height, 1)) {
            return "0";
        } else {
            return this._milestones[this.calcMilestone(height)];
        }
    }

    calcSupply(height) {
        var height = this.parseHeight(height);

        //Bignum update height -= height % 101;
        height = Bignum.minus(height, Bignum.modulo(height, this.config.settings.delegateNumber));

        const milestone = this.calcMilestone(height);

        // Bignum update
        // let supply = constants.totalAmount;
        let supply = Bignum.new(constants.totalAmount);

        const rewards   = [];

        //Bignum update if (height <= 0) {
        if (Bignum.isLessThanOrEqualTo(height, 0)) {
            //     Bignum update
            //   return supply;
            return supply.toString();
        }

        // Bignum update
        // let amount = 0, multiplier = 0;
        let amount = Bignum.new(0);
        let multiplier = Bignum.new(0);

        //Bignum update height = height - rewardOffset + 1;
        height = Bignum.plus(Bignum.minus(height, this._rewardOffset), 1);

        for (var i = 0; i < this._milestones.length; i++) {
            if (milestone >= i) {
                // Bignum update
                // multiplier = milestones[i];
                multiplier = Bignum.new(this._milestones[i]);

                //Bignum update if (height <= 0) {
                if (Bignum.isLessThanOrEqualTo(height, 0)) {
                    break; // Rewards not started yet
                //Bignum update } else if (height < distance) {
                } else if (Bignum.isLessThan(height, this._distance)) {
                //   Bignum update
                //   amount = height % distance; // Measure distance thus far
                    amount = Bignum.modulo(height, this._distance);
                } else {
                    //   Bignum update
                    //   amount = distance; // Assign completed milestone
                    amount = Bignum.new(this._distance);
                }
                rewards.push([amount.toString(), multiplier.toString()]);   //Bignum update

                //Bignum update height -= distance; // Deduct from total height
                height = Bignum.minus(height, this._distance);
            } else {
                break; // Milestone out of bounds
            }
        }

        //Bignum update if (height > 0) {
        if (Bignum.isGreaterThan(height, 0)) {
            rewards.push([height, this._milestones[this._milestones.length - 1]]);
        }

        for (i = 0; i < rewards.length; i++) {
            const reward = rewards[i];

            //   Bignum update
            //   supply += reward[0] * reward[1];

            supply = Bignum.plus(supply, Bignum.multiply(reward[0], reward[1]));
        }

        if (this._rewardOffset <= 1) {
            //     Bignum update
            //   supply -= milestones[0];
            supply = Bignum.minus(supply, this._milestones[0]);
        }

        // Bignum update
        // return supply;
        return supply.toString();
    }

}

module.exports = BlockStatus;
