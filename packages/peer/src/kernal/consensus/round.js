/**
 * Round
 * wangxm   2018-01-07
 */
import { bignum } from '@ddn/utils'

import RoundChanges from './round-changes'

let _singleton

class Round {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new Round(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context

    this._feesByRound = {}
    this._rewardsByRound = {}
    this._delegatesByRound = {}
    // this._unDelegatesByRound = {}
    this._transitioning = false;
    this._lastStableHeight = 0;
  }

  async prepare () {
    const round = await this.getRound(this.runtime.block.getLastBlock().height)
    const roundStr = round.toString()
    // console.log(this.config.database.options.dialect)
    let aliases = 'INTEGER'
    if (this.config.database.options.dialect === 'mysql') {
      aliases = 'SIGNED'
    } else {
      aliases = 'INTEGER'
    }
    // 这里没有将 bignum 计算传进去，通过 / % 等运算符，字符串形式的 bignum 会自动转为 number cast函数mysql中转number 是SIGNED psql和sqlite中是INTEGER
    let row = await this.dao.findOne('block', {
      where: {
        [roundStr]: this.dao.db_str(
          `(select (cast(block.height / ${this.constants.delegates} as ${aliases}) + (case when block.height % ${this.constants.delegates} > 0 then 1 else 0 end))) = ${roundStr}`
        )
      },
      attributes: [
        [this.dao.db_fnSum('total_fee'), 'fees'],
        [this.dao.db_fnGroupConcat('reward'), 'rewards'],
        [this.dao.db_fnGroupConcat('generator_public_key'), 'delegates']
      ]
    })
    if (!row) {
      row = {
        fees: '',
        rewards: [],
        delegates: []
      }
    }

    this._feesByRound[round] = row.fees
    this._rewardsByRound[round] = row.rewards.length > 0 ? row.rewards.split(',') : []
    this._delegatesByRound[round] = row.delegates.length ? row.delegates.split(',') : []
  }

  /**
   * 获得某高度下的铸块周期
   * @param {*} height 高度（bignum）
   * return string
   */
  async getRound (height) {
    let value = 0
    if (bignum.isGreaterThan(bignum.modulo(height, this.constants.delegates), 0)) {
      value = 1
    }
    return bignum.plus(bignum.floor(bignum.divide(height, this.constants.delegates)), value).toString()
  }

  async getVotes (round, dbTrans) {
    // shuai 2018-11-24
    return await this.dao.findListByGroup('mem_round', {
      where: { round: round.toString() },
      group: ['delegate', 'round'],
      attributes: ['delegate', 'round', [this.dao.db_fnSum('amount'), 'amount']],
      transaction: dbTrans
    })
  }

  async flush (round, dbTrans) {
    return await this.dao.remove('mem_round', { where: { round: round.toString() }, transaction: dbTrans })
  }

  async directionSwap (direction, lastBlock) {
    // wxm TODO
  }

  /**
   * tick 是比 round 更小的周期，做一些 round 周期内的数据整理工作
   * @param {object} block 区块
   * @param {array}} dbTrans 交易
   */
  async tick (block, dbTrans) {
    const round = await this.getRound(block.height)

    await this.runtime.account.merge(
      null,
      {
        publicKey: block.generator_public_key, // wxm block database
        producedblocks: 1,
        block_id: block.id, // wxm block database
        round
      },
      dbTrans
    )

    this._feesByRound[round] = this._feesByRound[round] || '0'

    this._feesByRound[round] = bignum.plus(this._feesByRound[round], block.total_fee) // wxm block database

    this._rewardsByRound[round] = this._rewardsByRound[round] || []
    this._rewardsByRound[round].push(block.reward)

    this._delegatesByRound[round] = this._delegatesByRound[round] || []
    this._delegatesByRound[round].push(block.generator_public_key)

    const nextRound = await this.getRound(bignum.plus(block.height, 1))

    // 在一个 round 里，不需要其他操作
    if (bignum.isEqualTo(round, nextRound) && !bignum.isEqualTo(block.height, 1)) {
      this.logger.debug('Round tick completed in the same round: ', {
        height: block.height
      })
      return
    }

    // 受托人数量，不是创世区块，也不是第一轮
    if (
      this._delegatesByRound[round].length !== this.constants.delegates &&
      !bignum.isEqualTo(block.height, 1) &&
      !bignum.isEqualTo(block.height, this.constants.delegates)
    ) {
      this.logger.debug('Round tick completed 2', {
        height: block.height,
        delegatesByRound: this._delegatesByRound[round].length
      })
      return
    }

    const outsiders = []

    if (!bignum.isEqualTo(block.height, 1)) {
      const roundDelegates = await this.runtime.delegate.getDisorderDelegatePublicKeys(block.height)

      for (let i = 0; i < roundDelegates.length; i++) {
        if (!this._delegatesByRound[round].includes(roundDelegates[i])) {
          outsiders.push(this.runtime.account.generateAddressByPublicKey(roundDelegates[i]))
        }
      }
    }

    if (outsiders.length) {
      const escaped = outsiders.map(item => `'${item}'`)
      await this.runtime.account.updateAccount(
        {
          missedblocks: this.dao.db_str('missedblocks + 1')
        },
        { address: escaped.join(',') },
        dbTrans
      )
    }

    const roundChanges = new RoundChanges(this._context, round)
    for (let index = 0; index < this._delegatesByRound[round].length; index++) {
      const delegate = this._delegatesByRound[round][index]

      const changes = roundChanges.at(index)
      let changeBalance = changes.balance
      let changeFees = changes.fees
      const changeRewards = changes.rewards
      if (index === this._delegatesByRound[round].length - 1) {
        changeBalance = bignum.plus(changeBalance, changes.feesRemaining)
        changeFees = bignum.plus(changeFees, changes.feesRemaining)
      }

      await this.runtime.account.merge(
        null,
        {
          publicKey: delegate, // wxm block database
          balance: changeBalance.toString(),
          u_balance: changeBalance.toString(),
          block_id: block.id, // wxm block database
          round: await this.getRound(block.height), // Todo: 数据库是 int 型，赋值是 str
          fees: changeFees.toString(),
          rewards: changeRewards.toString()
        },
        dbTrans
      )
    }

    // distribute club bonus
    const bonus = new RoundChanges(this._context, round).getClubBonus()
    const fees = bonus.fees
    const rewards = bonus.rewards

    this.logger.info(`DDN witness club get new bonus: ${JSON.stringify(bonus)}`)

    await this.runtime.account.merge(
      this.constants.foundAddress,
      {
        address: this.constants.foundAddress,
        balance: bignum.plus(fees, rewards).toString(),
        u_balance: bignum.plus(fees, rewards).toString(),
        fees: fees.toString(),
        rewards: rewards.toString(),
        block_id: block.id, // wxm block database
        round: await this.getRound(block.height)
      },
      dbTrans
    )

    const votes = await this.getVotes(round, dbTrans)

    for (let i = 0; i < votes.length; i++) {
      const vote = votes[i]
      const address = this.runtime.account.generateAddressByPublicKey(vote.delegate)
      await this.runtime.account.updateAccount(
        {
          vote: this.dao.db_str(`vote + ${vote.amount}`)
        },
        { address },
        dbTrans
      )
    }

    if (this.runtime.socketio) {
      setImmediate(async () => {
        try {
          await this.runtime.socketio.emit('rounds/change', { number: round })
        } catch (err) {
          this.logger.error(`The socket emit error: rounds/change. ${err}`)
        }
      })
    }

    await this.flush(round, dbTrans)

    delete this._feesByRound[round]
    delete this._rewardsByRound[round]
    delete this._delegatesByRound[round]

    this.logger.debug('Round tick completed 3', {
      height: block.height
    })
  }

  /**
   * tick 的反向操作
   * @param {objec} block 区块
   * @param {object} previousBlock 前一区块
   * @param {array} dbTrans 交易
   */
  async backwardTick (block, previousBlock, dbTrans) {
    const done = err => {
      if (err) {
        this.logger.error(`Round backward tick failed: ${err}`)
      } else {
        this.logger.debug('Round backward tick completed', {
          block,
          previousBlock
        })
      }
    }

    const round = await this.getRound(block.height)
    const prevRound = await this.getRound(previousBlock.height)
    this.logger.debug(
      `Round backward tick prevRound is ${prevRound} of previousBlock.height ${previousBlock.height} or previousBlock.b_height ${previousBlock.b_height}`
    )

    await this.runtime.account.merge(
      null,
      {
        publicKey: block.generator_public_key, // wxm block database
        producedblocks: -1,
        block_id: block.id, // wxm block database
        round
      },
      dbTrans
    )

    this._feesByRound[round] = this._feesByRound[round] || 0

    this._feesByRound[round] = bignum.minus(this._feesByRound[round], block.totalFee)

    this._rewardsByRound[round] = this._rewardsByRound[round] || []
    this._rewardsByRound[round].pop()

    this._delegatesByRound[round] = this._delegatesByRound[round] || []
    this._delegatesByRound[round].pop()

    if (prevRound === round && !bignum.isEqualTo(previousBlock.height, 1)) {
      return done()
    }

    this.logger.warn('Unexpected roll back cross round', {
      round,
      prevRound,
      block,
      previousBlock
    })
    process.exit(1)
  }

  async switchRound(newRound) {
    try {
      this._transitioning = true;
      
      await this.waitForStability();
      
      this._lastStableHeight = await this.getCurrentHeight();
      
      const prevRound = this.currentRound;
      this.currentRound = newRound;
      
      if (!await this.validateDelegateList(newRound)) {
        throw new Error('受托人列表验证失败');
      }
      
      await this.broadcastRoundSwitch(prevRound, newRound);
      
      await this.waitForNetworkConfirmation();
      
    } catch (err) {
      await this.rollbackRoundSwitch();
      throw err;
    } finally {
      this._transitioning = false;
    }
  }

  async waitForStability() {
    const MAX_WAIT = 10;
    let attempts = 0;
    
    while (attempts < MAX_WAIT) {
      if (await this.isNetworkStable()) {
        return true;
      }
      await this.sleep(1000);
      attempts++;
    }
    
    throw new Error('网络状态不稳定，无法切换 round');
  }

  async isNetworkStable() {
    const peers = await this.getPeerStatus();
    const stablePeers = peers.filter(p => p.height === this.getCurrentHeight());
    return stablePeers.length >= this.getMinimumPeers();
  }

  async getCurrentHeight() {
    const lastBlock = await this.runtime.block.getLastBlock();
    return lastBlock.height;
  }

  async validateDelegateList(round) {
    try {
      const delegates = await this.runtime.delegate.getDisorderDelegatePublicKeys(round);
      
      // 验证受托人数量
      if (delegates.length !== this.constants.delegates) {
        return false;
      }
      
      // 验证受托人资格
      for (const delegate of delegates) {
        const account = await this.runtime.account.getAccountByPublicKey(delegate);
        if (!account || !account.is_delegate) {
          return false;
        }
      }
      
      return true;
    } catch (err) {
      this.logger.error('受托人列表验证失败:', err);
      return false;
    }
  }

  async broadcastRoundSwitch(prevRound, newRound) {
    try {
      const roundData = {
        prevRound,
        newRound,
        height: await this.getCurrentHeight(),
        timestamp: Date.now()
      };
      
      await this.runtime.peer.broadcast('round/switch', roundData);
    } catch (err) {
      this.logger.error('广播轮次切换失败:', err);
      throw err;
    }
  }

  async waitForNetworkConfirmation() {
    const CONFIRMATION_THRESHOLD = 0.8; // 80%节点确认阈值
    const MAX_WAIT_TIME = 60000; // 最大等待时间60秒
    const startTime = Date.now();
    
    while (Date.now() - startTime < MAX_WAIT_TIME) {
      const peers = await this.getPeerStatus();
      const confirmedPeers = peers.filter(p => p.round === this.currentRound);
      
      if (confirmedPeers.length / peers.length >= CONFIRMATION_THRESHOLD) {
        return true;
      }
      
      await this.sleep(1000);
    }
    
    throw new Error('等待网络确认超时');
  }

  async rollbackRoundSwitch() {
    try {
      // 恢复到之前的轮次
      this.currentRound = this._lastRound;
      
      // 重置高度
      await this.runtime.block.setLastBlock(
        await this.runtime.block.findOne({
          height: this._lastStableHeight
        })
      );
      
      // 通知其他节点
      await this.broadcastRoundSwitch(this.currentRound, this._lastRound);
    } catch (err) {
      this.logger.error('轮次切换回滚失败:', err);
      throw err;
    }
  }

  async getPeerStatus() {
    try {
      const peers = await this.runtime.peer.getRandomPeers();
      const statuses = [];
      
      for (const peer of peers) {
        try {
          const status = await this.runtime.peer.getPeerStatus(peer);
          statuses.push(status);
        } catch (err) {
          this.logger.warn(`获取节点 ${peer.ip} 状态失败:`, err);
        }
      }
      
      return statuses;
    } catch (err) {
      this.logger.error('获取节点状态失败:', err);
      throw err;
    }
  }

  getMinimumPeers() {
    // 返回最小所需确认节点数(通常为总节点数的2/3)
    return Math.ceil(this.constants.delegates * 2 / 3);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default Round
