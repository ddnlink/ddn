/**
 * Round
 * wangxm   2018-01-10
 */
const bignum = require('@ddn/bignum-utils');
const slot = require('./slot');
const constants = require('../../constants');

class RoundChanges {

    constructor(context, round, back) {
        Object.assign(this, context);
        this._context = context;

        if (!back) {
            //bignum update var roundFees = parseInt(privated.feesByRound[round]) || 0;
            this._roundFees = this.runtime.round._feesByRound[round] || 0;
            this._roundRewards = (this.runtime.round._rewardsByRound[round] || []);
        } else {
            //bignum update var roundFees = parseInt(privated.unFeesByRound[round]) || 0;
            this._roundFees = this.runtime.round._unFeesByRound[round] || 0;
            this._roundRewards = (this.runtime.round._unRewardsByRound[round] || []);
        }

        this._CLUB_BONUS_RATIO = constants[this.config.netVersion].rewardRatio;
    }

    at(index) {
        //bignum update const ratio = (1 - CLUB_BONUS_RATIO);
        const ratio = bignum.minus(1, this._CLUB_BONUS_RATIO);
    
        // bignum update
        // const totalDistributeFees = Math.floor(roundFees * ratio);
        // const fees = Math.floor(totalDistributeFees / slots.delegates);
        // const feesRemaining = totalDistributeFees - (fees * slots.delegates);
    
        const totalDistributeFees = bignum.floor(bignum.multiply(this._roundFees, ratio));
        const fees = bignum.floor(bignum.divide(totalDistributeFees, this.config.settings.delegateNumber));
        const feesRemaining = bignum.minus(totalDistributeFees, bignum.multiply(fees, this.config.settings.delegateNumber));
    
        //bignum update const rewards = Math.floor(parseInt(roundRewards[index]) * ratio) || 0;
        const rewards = bignum.floor(bignum.multiply(this._roundRewards[index], ratio)) || 0;
    
        return {
            fees: fees.toString(),
            feesRemaining: feesRemaining.toString(),
            rewards: rewards.toString(),
            balance: bignum.plus(fees, rewards).toString() //bignum update fees + rewards
        };
    }
    
    getClubBonus() {
        //bignum update
        // const fees = roundFees - Math.floor(roundFees * (1 - CLUB_BONUS_RATIO));
        const fees = bignum.minus(this._roundFees, bignum.floor(bignum.multiply(this._roundFees, bignum.minus(1, this._CLUB_BONUS_RATIO))));
    
        // bignum update
        // let rewards = 0;
        // for (let i = 0; i < roundRewards.length; ++i) {
        //   let reward = parseInt(roundRewards[i])
        //   rewards += (reward - Math.floor(reward * (1 - CLUB_BONUS_RATIO)))
        // }
        let rewards = bignum.new(0);
        for (let i = 0; i < this._roundRewards.length; ++i) {
            rewards = bignum.plus(rewards, bignum.minus(this._roundRewards[i], bignum.floor(bignum.multiply(this._roundRewards[i], bignum.minus(1, this._CLUB_BONUS_RATIO)))));
        }
    
        return {
            fees: fees.toString(),
            rewards: rewards.toString()
        }
    }
}

module.exports = RoundChanges;