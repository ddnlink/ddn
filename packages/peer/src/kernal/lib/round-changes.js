/**
 * Round
 * wangxm   2018-01-10
 */
const { Bignum } = require('@ddn/utils');
const slot = require('./slot');
const constants = require('../../constants');

class RoundChanges {

    constructor(context, round, back) {
        Object.assign(this, context);
        this._context = context;

        if (!back) {
            //Bignum update var roundFees = parseInt(privated.feesByRound[round]) || 0;
            this._roundFees = this.runtime.round._feesByRound[round] || 0;
            this._roundRewards = (this.runtime.round._rewardsByRound[round] || []);
        } else {
            //Bignum update var roundFees = parseInt(privated.unFeesByRound[round]) || 0;
            this._roundFees = this.runtime.round._unFeesByRound[round] || 0;
            this._roundRewards = (this.runtime.round._unRewardsByRound[round] || []);
        }

        this._CLUB_BONUS_RATIO = constants[this.config.netVersion].rewardRatio;
    }

    at(index) {
        //Bignum update const ratio = (1 - CLUB_BONUS_RATIO);
        const ratio = Bignum.minus(1, this._CLUB_BONUS_RATIO);

        // Bignum update
        // const totalDistributeFees = Math.floor(roundFees * ratio);
        // const fees = Math.floor(totalDistributeFees / slots.delegates);
        // const feesRemaining = totalDistributeFees - (fees * slots.delegates);

        const totalDistributeFees = Bignum.floor(Bignum.multiply(this._roundFees, ratio));
        const fees = Bignum.floor(Bignum.divide(totalDistributeFees, this.config.settings.delegateNumber));
        const feesRemaining = Bignum.minus(totalDistributeFees, Bignum.multiply(fees, this.config.settings.delegateNumber));

        //Bignum update const rewards = Math.floor(parseInt(roundRewards[index]) * ratio) || 0;
        const rewards = Bignum.floor(Bignum.multiply(this._roundRewards[index], ratio)) || 0;

        return {
            fees: fees.toString(),
            feesRemaining: feesRemaining.toString(),
            rewards: rewards.toString(),
            balance: Bignum.plus(fees, rewards).toString() //Bignum update fees + rewards
        };
    }

    getClubBonus() {
        //Bignum update
        // const fees = roundFees - Math.floor(roundFees * (1 - CLUB_BONUS_RATIO));
        const fees = Bignum.minus(this._roundFees, Bignum.floor(Bignum.multiply(this._roundFees, Bignum.minus(1, this._CLUB_BONUS_RATIO))));

        // Bignum update
        // let rewards = 0;
        // for (let i = 0; i < roundRewards.length; ++i) {
        //   let reward = parseInt(roundRewards[i])
        //   rewards += (reward - Math.floor(reward * (1 - CLUB_BONUS_RATIO)))
        // }
        let rewards = Bignum.new(0);
        for (let i = 0; i < this._roundRewards.length; ++i) {
            rewards = Bignum.plus(rewards, Bignum.minus(this._roundRewards[i], Bignum.floor(Bignum.multiply(this._roundRewards[i], Bignum.minus(1, this._CLUB_BONUS_RATIO)))));
        }

        return {
            fees: fees.toString(),
            rewards: rewards.toString()
        }
    }
}

module.exports = RoundChanges;
