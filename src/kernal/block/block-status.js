/**
 * BlockStatus
 * wangxm   2018-01-09
 */
const constants = require('../../constants');
const bignum = require('@ddn/bignum-utils');

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
        //bignum update height = parseInt(height);

        // if (isNaN(height)) {
        if (bignum.isNaN(height)) {
            throw new Error('Invalid block height');
        } else {
          //bignum update   return Math.abs(height);
            return bignum.abs(height);
        }
    }

    calcMilestone(height) {
        //bignum update const location = Math.floor(parseHeight(height - rewardOffset) / distance), lastMile = milestones[milestones.length - 1];
        const location = bignum.floor(bignum.divide(this.parseHeight(bignum.minus(height, this._rewardOffset)), this._distance));
        const lastMile = this._milestones[this._milestones.length - 1];

        //bignum update if (location > (milestones.length - 1)) {
        if (bignum.isGreaterThan(location, bignum.minus(this._milestones.length, 1))) {
            return this._milestones.lastIndexOf(lastMile);
        } else {
            return location.toString();
        }
    }

    calcReward(height) {
        var height = this.parseHeight(height);

        //bignum update if (height < rewardOffset || height <= 1) {
        if (bignum.isLessThan(height, this._rewardOffset) || bignum.isLessThanOrEqualTo(height, 1)) {
            return "0";
        } else {
            return this._milestones[this.calcMilestone(height)];
        }
    }

    calcSupply(height) {
        var height = this.parseHeight(height);

        //bignum update height -= height % 101;
        height = bignum.minus(height, bignum.modulo(height, this.config.settings.delegateNumber));
    
        const milestone = this.calcMilestone(height);
        
        // bignum update
        // let supply = constants.totalAmount; 
        let supply = bignum.new(constants.totalAmount); 
    
        const rewards   = [];
    
        //bignum update if (height <= 0) {
        if (bignum.isLessThanOrEqualTo(height, 0)) {
            //     bignum update
            //   return supply;
            return supply.toString();
        }
        
        // bignum update
        // let amount = 0, multiplier = 0;
        let amount = bignum.new(0);
        let multiplier = bignum.new(0);
    
        //bignum update height = height - rewardOffset + 1;
        height = bignum.plus(bignum.minus(height, this._rewardOffset), 1);
    
        for (var i = 0; i < this._milestones.length; i++) {
            if (milestone >= i) {
                // bignum update
                // multiplier = milestones[i];
                multiplier = bignum.new(this._milestones[i]);
    
                //bignum update if (height <= 0) {
                if (bignum.isLessThanOrEqualTo(height, 0)) {
                    break; // Rewards not started yet
                //bignum update } else if (height < distance) {
                } else if (bignum.isLessThan(height, this._distance)) {
                //   bignum update
                //   amount = height % distance; // Measure distance thus far
                    amount = bignum.modulo(height, this._distance);
                } else {
                    //   bignum update
                    //   amount = distance; // Assign completed milestone
                    amount = bignum.new(this._distance);
                }
                rewards.push([amount.toString(), multiplier.toString()]);   //bignum update
    
                //bignum update height -= distance; // Deduct from total height
                height = bignum.minus(height, this._distance);
            } else {
                break; // Milestone out of bounds
            }
        }

        //bignum update if (height > 0) {
        if (bignum.isGreaterThan(height, 0)) {
            rewards.push([height, this._milestones[this._milestones.length - 1]]);
        }
    
        for (i = 0; i < rewards.length; i++) {
            const reward = rewards[i];
    
            //   bignum update
            //   supply += reward[0] * reward[1];
    
            supply = bignum.plus(supply, bignum.multiply(reward[0], reward[1]));
        }
    
        if (this._rewardOffset <= 1) {
            //     bignum update
            //   supply -= milestones[0];
            supply = bignum.minus(supply, this._milestones[0]);
        }
    
        // bignum update
        // return supply;
        return supply.toString();
    }

}

module.exports = BlockStatus;