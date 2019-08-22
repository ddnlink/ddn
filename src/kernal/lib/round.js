/**
 * Round
 * wangxm   2018-01-07
 */
const bignum = require('@ddn/bignum-utils');
const slot = require('./slot');
const constants = require('../../constants');
const RoundChanges = require('./round-changes');

var _singleton;

class Round {

    static singleton(context) {
        if (!_singleton) {
            _singleton = new Round(context);
        }
        return _singleton;
    }

    constructor(context) {
        Object.assign(this, context);
        this._context = context;

        this._feesByRound = {};
        this._rewardsByRound = {};
        this._delegatesByRound = {};
        this._unDelegatesByRound = {};
    }

    async prepare() {
        const round = await this.calc(this.runtime.block.getLastBlock().height);
        const roundStr = round.toString();

        await new Promise((resolve, reject) => {
            this.dao.findOne("block", {
                [roundStr]: this.dao.db_str('(select (cast(block.height / ' + this.config.settings.delegateNumber + ' as integer) + (case when block.height % ' + this.config.settings.delegateNumber + ' > 0 then 1 else 0 end))) = ' + roundStr)
            }, [
                [this.dao.db_fnSum(''), 'fees'],   //wxm block database    library.dao.db_fn('sum', library.dao.db_col('totalFee'))
                [this.dao.db_fnGroupConcat('reward'), 'rewards'], //wxm block database   library.dao.db_fn('group_concat', library.dao.db_col('reward'))
                [this.dao.db_fnGroupConcat('generator_public_key'), 'delegates']   //wxm block database   library.dao.db_fn('group_concat', library.dao.db_col('generatorPublicKey'))
            ], (err, row) => {
                if (!row) {
                    row = {
                        fees: '',
                        rewards: [],
                        delegates: []
                    }
                }

                this._feesByRound[round] = row.fees;
                this._rewardsByRound[round] = row.rewards.length > 0 ? row.rewards.split(',') : [];
                this._delegatesByRound[round] = row.delegates.length ? row.delegates.split(',') : [];

                resolve();
            });
        });
    }

    async calc(height) {
        var value = 0;
        if (bignum.isGreaterThan(bignum.modulo(height, this.config.settings.delegateNumber), 0)) {
          value = 1;
        }
        return bignum.plus(bignum.floor(bignum.divide(height, this.config.settings.delegateNumber)), value);
    }

    async getVotes(round, dbTrans) {
        // shuai 2018-11-24
        return new Promise((resolve, reject) => {
            try {
                this.dao.findListByGroup('mem_round', { round: round.toString() }, {
                    group: ['delegate', 'round'],
                    attributes: ['delegate', 'round', [this.dao.db_fnSum('amount'), 'amount']] //wxm block database library.dao.db_fn('sum', library.dao.db_col('amount'))
                }, dbTrans, (err, data) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(data)
                    }
                })
            } catch (e) {
                reject(e)
            }
        })
    }

    async flush(round, dbTrans) {
        return new Promise((resolve, reject) => {
            // shuai 2018-11-21
            this.dao.remove('mem_round', { round: round.toString() }, dbTrans, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
            // library.dbLite.query("delete from mem_round where round = $round", { round }, cb);
        });
    }

    async directionSwap(direction, lastBlock) {
        //wxm TODO
    }

    async tick(block, dbTrans) {
        await this.runtime.account.merge(null, {
            public_key: block.generator_public_key,  //wxm block database
            producedblocks: 1,
            block_id: block.id,  //wxm block database
            round: await this.calc(block.height)
        }, dbTrans);

        const round = await this.calc(block.height);

        this._feesByRound[round] = (this._feesByRound[round] || 0);

        // bignum update
        // privated.feesByRound[round] += block.totalFee;
        this._feesByRound[round] = bignum.plus(this._feesByRound[round], block.total_fee); //wxm block database
    
        this._rewardsByRound[round] = (this._rewardsByRound[round] || []);
        this._rewardsByRound[round].push(block.reward);

        this._delegatesByRound[round] = this._delegatesByRound[round] || [];
        this._delegatesByRound[round].push(block.generator_public_key);

        const nextRound = await this.calc(bignum.plus(block.height, 1));

        //bignum update if (round === nextRound && block.height !== 1) {
        if (bignum.isEqualTo(round, nextRound) && !bignum.isEqualTo(block.height, 1)) {
            this.logger.debug("Round tick completed", {
                height: block.height
            });
            return;
        }

        //bignum update if (privated.delegatesByRound[round].length !== slots.delegates && block.height !== 1 && block.height !== 101) {
        if (this._delegatesByRound[round].length !== this.config.settings.delegateNumber && 
            !bignum.isEqualTo(block.height, 1) && !bignum.isEqualTo(block.height, this.config.settings.delegateNumber)) {
            this.logger.debug("Round tick completed", {
                height: block.height
            });
            return;
        }

        const outsiders = [];

        //bignum update if (block.height === 1) {
        if (!bignum.isEqualTo(block.height, 1)) {
            var roundDelegates = await this.runtime.delegate.getDisorderDelegatePublicKeys(block.height);

            for (let i = 0; i < roundDelegates.length; i++) {
                if (this._delegatesByRound[round].indexOf(roundDelegates[i]) == -1) {
                    outsiders.push(this.runtime.account.generateAddressByPublicKey(roundDelegates[i]));
                }
            }
        }

        if (outsiders.length) {
            const escaped = outsiders.map(item => `'${item}'`); 
            await this.runtime.account.updateAccount({
                missedblocks: this.dao.db_str('missedblocks + 1')
            }, { address: escaped.join(',') }, dbTrans);
        }

        const roundChanges = new RoundChanges(this._context, round);
        for (var index = 0; index < this._delegatesByRound[round].length; index++) {
            var delegate = this._delegatesByRound[round][i];

            const changes = roundChanges.at(index);
            let changeBalance = changes.balance;
            let changeFees = changes.fees;
            const changeRewards = changes.rewards;
            if (index === this._delegatesByRound[round].length - 1) {
                // bignum update
                // changeBalance += changes.feesRemaining;
                // changeFees += changes.feesRemaining;
                changeBalance = bignum.plus(changeBalance, changes.feesRemaining);
                changeFees = bignum.plus(changeFees, changes.feesRemaining);
            }
  
            await this.runtime.account.merge(null, {
                public_key: delegate,   //wxm block database
                balance: changeBalance.toString(),
                u_balance: changeBalance.toString(),
                block_id: block.id,  //wxm block database
                round: await this.calc(block.height),
                fees: changeFees.toString(),
                rewards: changeRewards.toString()
            }, dbTrans);
        }

        // distribute club bonus
        const bonus = new RoundChanges(this._context, round).getClubBonus();
        const fees = bonus.fees;
        const rewards = bonus.rewards;
        
        const BONUS_CURRENCY = constants.tokenName
        this.logger.info(`DDN witness club get new bonus: ${bonus}`)

        await this.runtime.account.merge(constants.foundAddress, {
            address: constants.foundAddress,
            balance: bignum.plus(fees, rewards).toString(),     //bignum update (fees + rewards),
            u_balance: bignum.plus(fees, rewards).toString(),      //bignum update (fees + rewards),
            fees: fees.toString(),
            rewards: rewards.toString(),
            block_id: block.id,    //wxm block database
            round: await this.calc(block.height),
        }, dbTrans);

        var votes = await this.getVotes(round, dbTrans);
        for (var i = 0; i < votes.length; i++) {
            var vote = votes[i];
            let address = this.runtime.account.generateAddressByPublicKey(vote.delegate);
            await this.runtime.account.updateAccount({
                vote: this.dao.db_str('vote + ' + vote.amount),
            }, { address }, dbTrans);
        }

        if (this.runtime.socketio) {
            setImmediate(async () => {
                try
                {
                    await this.runtime.socketio.emit('rounds/change', {number: round});
                }
                catch (err)
                {
                    this.logger.error("The socket emit error: rounds/change. " + err);
                }
            });
        }

        await this.flush(round, dbTrans)

        delete this._feesByRound[round];
        delete this._rewardsByRound[round];
        delete this._delegatesByRound[round];

        this.logger.debug("Round tick completed", {
            height: block.height
        });
    }

    async backwardTick(block, previousBlock, dbTrans) {
        var done = (err) => {
            if (err) {
                this.logger.error(`Round backward tick failed: ${err}`);
            } else {
                this.logger.debug("Round backward tick completed", {
                    block,
                    previousBlock
                });
            }
        }

        await this.runtime.account.merge(null, {
            public_key: block.generator_public_key,    //wxm block database
            producedblocks: -1,
            block_id: block.id,  //wxm block database
            round: await this.calc(block.height)
        }, dbTrans);

        var round = await this.calc(block.height);
        var prevRound = await this.calc(previousBlock.b_height);

        this._feesByRound[round] = (this._feesByRound[round] || 0);

        // bignum update
        // privated.feesByRound[round] -= block.totalFee;
        this._feesByRound[round] = bignum.minus(this._feesByRound[round], block.totalFee);
    
        this._rewardsByRound[round] = (this._rewardsByRound[round] || []);
        this._rewardsByRound[round].pop();

        this._delegatesByRound[round] = this._delegatesByRound[round] || [];
        this._delegatesByRound[round].pop();

        //bignum update if (prevRound === round && previousBlock.height !== 1) {
        if (prevRound === round && !bignum.isEqualTo(previousBlock.b_height, 1)) {
            return done();
        }

        //wxm TODO 这块还有问题，也就是_unDelegatesByRound没有任何地方有赋值操作，所以length不会存在，这里待改，暂时改成下面
        this._unDelegatesByRound[round] = this._unDelegatesByRound[round] || [];
        this._unDelegatesByRound[round].pop();

        //bignum update if (privated.unDelegatesByRound[round].length !== slots.delegates && previousBlock.height !== 1) {
        if (this._unDelegatesByRound[round].length !== this.config.settings.delegateNumber && !bignum.isEqualTo(previousBlock.b_height, 1)) {
            return done();
        }

        this.logger.warn('Unexpected roll back cross round', {
            round,
            prevRound,
            block,
            previousBlock
        });
        process.exit(1);

        //wxm TODO 下面的代码本来没有注释，但上面直接exit了，不会走到这里，所以整个方法的逻辑还需要梳理
    // FIXME process the cross round rollback
    // const outsiders = [];
    // async.series([
    //   cb => {
    //     //bignum update if (block.height === 1) {
    //     if (bignum.isEqualTo(block.height, 1)) {
    //       return cb();
    //     }
    //     modules.delegates.generateDelegateList(block.height, (err, roundDelegates) => {
    //       if (err) {
    //         return cb(err);
    //       }
    //       for (let i = 0; i < roundDelegates.length; i++) {
    //         if (privated.unDelegatesByRound[round].indexOf(roundDelegates[i]) == -1) {
    //           outsiders.push(modules.accounts.generateAddressByPublicKey(roundDelegates[i]));
    //         }
    //       }
    //       cb();
    //     });
    //   },
    //   cb => {
    //     if (!outsiders.length) {
    //       return cb();
    //     }
    //     const escaped = outsiders.map(item => `'${item}'`);
    //     // shuai 2018-11-21
    //     library.dao.update('mem_account', {
    //       missedblocks: Sequelize.literal('missedblocks - 1')
    //     }, { address: { '$in': escaped.join(',') } }, dbTrans, cb)
    //     // library.dbLite.query(`update mem_accounts set missedblocks = missedblocks - 1 where address in (${escaped.join(',')})`, (err, data) => {
    //     //   cb(err);
    //     // });
    //   },
    //   cb => {
    //     const roundChanges = new RoundChanges(round, true);

    //     async.forEachOfSeries(privated.unDelegatesByRound[round], (delegate, index, next) => {
    //       const changes = roundChanges.at(index);
    //       let changeBalance = changes.balance;
    //       let changeFees = changes.fees;
    //       const changeRewards = changes.rewards;

    //       if (index === 0) {
    //         // bignum update
    //         // changeBalance += changes.feesRemaining;
    //         // changeFees += changes.feesRemaining;
    //         changeBalance = bignum.plus(changeBalance, changes.feesRemaining);
    //         changeFees = bignum.plus(changeFees, changes.feesRemaining);
    //       }

    //       modules.accounts.mergeAccountAndGet({
    //         public_key: delegate,   //wxm block database
    //         balance: bignum.minus(0, changeBalance).toString(),    //bignum update -changeBalance,
    //         u_balance: bignum.minus(0, changeBalance).toString(),  //bignum update -changeBalance,
    //         block_id: block.id,  //wxm block database
    //         round: modules.round.calc(block.height).toString(),
    //         fees: bignum.minus(0, changeFees).toString(),   //bignum update -changeFees,
    //         rewards: bignum.minus(0, changeRewards).toString()  //bignum update -changeRewards
    //       }, dbTrans, next);
    //     }, cb);
    //   },
    //   cb => {
    //     // distribute club bonus
    //     const bonus = new RoundChanges(round).getClubBonus();
    //     const fees = bonus.fees;
    //     const rewards = bonus.rewards;

    //     const BONUS_CURRENCY = constants.tokenName

    //     library.logger.info(`DDN witness club get new bonus: ${bonus}`)
    //     modules.accounts.mergeAccountAndGet({
    //       address: constants.foundAddress,
    //       balance: bignum.minus(0, fees, rewards).toString(),     //bignum update -(fees + rewards),
    //       u_balance: bignum.minus(0, fees, rewards).toString(),       //bignum update -(fees + rewards),
    //       fees: bignum.minus(0, fees).toString(),     //bignum update -fees,
    //       rewards: bignum.minus(0, rewards).toString(),       //bignum update -rewards,
    //       block_id: block.id,    //wxm block database
    //       round: modules.round.calc(block.height).toString(),
    //     }, dbTrans, err => {
    //       cb(err);
    //     });
    //   },
    //   cb => {
    //     self.getVotes(round, (err, votes) => {
    //       if (err) {
    //         return cb(err);
    //       }
    //       async.eachSeries(votes, (vote, cb) => {
    //         let address = null;
    //         address = modules.accounts.generateAddressByPublicKey(vote.delegate)
    //         library.dao.update('mem_account', {
    //           vote: Sequelize.literal('vote + ' + vote.amount),
    //         }, { address }, dbTrans, cb)
    //         // library.dbLite.query('update mem_accounts set vote = vote + $amount where address = $address', {
    //         //   address,
    //         //   amount: vote.amount
    //         // }, cb);
    //       }, err => {
    //         self.flush(round, err2 => {
    //           cb(err || err2);
    //         });
    //       })
    //     });
    //   }
    // ], err => {
    //   delete privated.unFeesByRound[round];
    //   delete privated.unRewardsByRound[round];
    //   delete privated.unDelegatesByRound[round];
    //   done(err)
    // });
    }

}

module.exports = Round;