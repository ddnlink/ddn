/**
 * Round
 * wangxm   2018-01-07
 */
import { bignum } from '@ddn/utils'

import RoundChanges from './round-changes'

let _singleton

class Round {
  static singleton(context) {
    if (!_singleton) {
      _singleton = new Round(context)
    }
    return _singleton
  }

  constructor(context) {
    Object.assign(this, context)
    this._context = context

    this._feesByRound = {}
    this._rewardsByRound = {}
    this._delegatesByRound = {}
    // this._unDelegatesByRound = {}
    this._transitioning = false;
    this._lastStableHeight = 0;
  }

  async prepare() {
    try {
      const lastBlock = this.runtime.block.getLastBlock()
      if (!lastBlock) {
        this.logger.debug('No last block found, skipping round prepare')
        return
      }

      const round = await this.getRound(lastBlock.height)
      const roundStr = round.toString()

      let aliases = 'INTEGER'
      if (this.config.database.options.dialect === 'mysql') {
        aliases = 'SIGNED'
      }

      // 这里没有将 bignum 计算传进去，通过 / % 等运算符，字符串形式的 bignum 会自动转为 number
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
          fees: '0',
          rewards: [],
          delegates: []
        }
      }

      this._feesByRound[round] = row.fees || '0'
      this._rewardsByRound[round] = row.rewards.length > 0 ? row.rewards.split(',') : []
      this._delegatesByRound[round] = row.delegates.length ? row.delegates.split(',') : []

      // 初始化 _unFeesByRound 和 _unRewardsByRound
      this._unFeesByRound = { ...this._feesByRound }
      this._unRewardsByRound = { ...this._rewardsByRound }
    } catch (err) {
      this.logger.error('Failed to prepare round:', err)
      throw err
    }
  }

  /**
   * 获得某高度下的铸块周期
   * @param {*} height 高度（bignum）
   * return string
   */
  async getRound(height) {
    let value = 0
    if (bignum.isGreaterThan(bignum.modulo(height, this.constants.delegates), 0)) {
      value = 1
    }
    return bignum.plus(bignum.floor(bignum.divide(height, this.constants.delegates)), value).toString()
  }

  async getVotes(round, dbTrans) {
    // shuai 2018-11-24
    return await this.dao.findListByGroup('mem_round', {
      where: { round: round.toString() },
      group: ['delegate', 'round'],
      attributes: ['delegate', 'round', [this.dao.db_fnSum('amount'), 'amount']],
      transaction: dbTrans
    })
  }

  async flush(round, dbTrans) {
    return await this.dao.remove('mem_round', { where: { round: round.toString() }, transaction: dbTrans })
  }

  async directionSwap(direction, lastBlock) {
    // wxm TODO
  }

  /**
   * tick 是比 round 更小的周期，做一些 round 周期内的数据整理工作
   * @param {object} block 区块
   * @param {array}} dbTrans 交易
   */
  async tick(block, dbTrans) {
    try {
      const round = await this.getRound(block.height)
      const nextRound = await this.getRound(bignum.plus(block.height, 1))

      // 1. 先执行基本的账户更新
      await this.runtime.account.merge(
        null,
        {
          publicKey: block.generator_public_key,
          producedblocks: 1,
          block_id: block.id,
          round
        },
        dbTrans
      )

      // 2. 更新轮次数据：手续费、奖励、受托人，每个块都要先累积起来
      this._feesByRound[round] = this._feesByRound[round] || '0'
      this._feesByRound[round] = bignum.plus(this._feesByRound[round], block.total_fee).toString()

      this._rewardsByRound[round] = this._rewardsByRound[round] || []
      this._rewardsByRound[round].push(block.reward)

      this._delegatesByRound[round] = this._delegatesByRound[round] || []
      this._delegatesByRound[round].push(block.generator_public_key)

      // 同步更新 _unFeesByRound 和 _unRewardsByRound
      this._unFeesByRound = { ...this._feesByRound }
      this._unRewardsByRound = { ...this._rewardsByRound }

      // 3. 特殊处理第一个区块
      if (bignum.isEqualTo(block.height, 1)) {
        this.logger.debug('First block, skipping rewards')
        return true
      }

      // 4. 检查轮次切换
      if (bignum.isEqualTo(round, nextRound)) {
        this.logger.debug('Same round, continuing...')
        return true
      }

      // 5. 轮次切换处理
      if (this._delegatesByRound[round]) {
        const delegatesCount = this._delegatesByRound[round].length
        this.logger.warn('Round change detected:', {
          round,
          nextRound,
          height: block.height,
          delegatesCount
        })

        try {
          // 6. 处理奖励分发
          await this.processRoundRewards(block, round, dbTrans)

          // 7. 处理未参与铸块的受托人
          await this.processOutsiders(block, round, dbTrans)

          // 8. 处理投票
          await this.processVotes(round, dbTrans)

          // 9. 清理旧轮次数据
          await this.flush(round, dbTrans)

          // 10. 清理内存中的数据
          delete this._feesByRound[round]
          delete this._rewardsByRound[round]
          delete this._delegatesByRound[round]
          delete this._unFeesByRound[round]
          delete this._unRewardsByRound[round]

          return true
        } catch (err) {
          this.logger.error('Round tick error:', err)
          throw err
        }
      }

      return false
    } catch (err) {
      this.logger.error('Round tick failed:', err)
      throw err
    }
  }

  // 处理轮次奖励
  async processRoundRewards(block, round, dbTrans) {
    try {
      const changes = new RoundChanges(this, round)
      const delegates = this._delegatesByRound[round]

      if (!delegates || !delegates.length) {
        this.logger.warn('No delegates in round:', round)
        return false
      }

      // 处理每个受托人的奖励  fixme：针对每一个块进行处理，而不是一个轮次 2025-01-04
      for (let i = 0; i < delegates.length; i++) {
        const delegatePublicKey = delegates[i]
        const balance = changes.at(i)

        if (!balance || typeof balance.balance !== 'string') {
          this.logger.error('Invalid balance for delegate:', {
            delegate: delegatePublicKey,
            balance
          })
          continue
        }

        this.logger.debug('Updating balance for delegate:', {
          delegate: delegatePublicKey,
          balance: balance.balance
        })

        await this.runtime.account.merge(
          null,
          {
            publicKey: delegatePublicKey,
            balance: balance.balance,
            u_balance: balance.balance,
            fees: balance.fees,
            rewards: balance.rewards,
            block_id: block.id,
            round: round
          },
          dbTrans
        )
      }

      // 处理基金会奖励
      const bonus = changes.getClubBonus()
      if (bonus && bonus.fees && bonus.rewards) {
        const totalBalance = bignum.plus(bonus.fees, bonus.rewards).toString()
        await this.runtime.account.merge(
          this.constants.foundAddress,
          {
            address: this.constants.foundAddress,
            balance: totalBalance,
            u_balance: totalBalance,
            fees: bonus.fees,
            rewards: bonus.rewards,
            block_id: block.id,
            round: round
          },
          dbTrans
        )
      }

      return true
    } catch (err) {
      this.logger.error('Process round rewards error:', err)
      throw err
    }
  }

  // 处理未参与铸块的受托人
  async processOutsiders(block, round, dbTrans) {
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
  }

  // 处理投票
  async processVotes(round, dbTrans) {
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
  }

  /**
   * tick 的反向操作
   * @param {objec} block 区块
   * @param {object} previousBlock 前一区块
   * @param {array} dbTrans 交易
   */
  async backwardTick(block, previousBlock, dbTrans) {
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
      const peers = await this.runtime.peer.getPeers();
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
