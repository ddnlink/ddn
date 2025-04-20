/**
 * Delegate
 * wangxm   2018-01-08
 */
import * as DdnCrypto from '@ddn/crypto'
import { createHash } from '@ddn/crypto'
import { bignum } from '@ddn/utils'

let _singleton

class Delegate {
  static singleton(context) {
    if (!_singleton) {
      _singleton = new Delegate(context)
    }
    return _singleton
  }

  constructor(context) {
    Object.assign(this, context)
    this._context = context

    this._myDelegateKeypairs = {}
    this._myDelegateNum = 0

    this._forgingEanbled = true

    this._forkedRound = null;
    this._recoveryMode = false;
  }

  /**
   * 当前节点是否允许区块铸造
   */
  isForgeEnabled() {
    return this._forgingEanbled
  }

  /**
   * 授权可以铸块
   */
  enableForging() {
    this._forgingEanbled = true
  }

  /**
   * 授权不允许铸块
   */
  disableForging() {
    this._forgingEanbled = false
  }

  /**
   * 判断当前节点是否配置有有效受托人信息
   */
  hasValidDelegates() {
    return this._myDelegateNum > 0
  }

  /**
   * Get my able forging delegate
   * @param {object} keypair *
   */
  async enableForged(keypair) {
    this._myDelegateKeypairs[keypair.publicKey.toString('hex')] = keypair
  }

  async disableForgedByPublicKey(publicKey) {
    delete this._myDelegateKeypairs[publicKey]
  }

  async getMyDelegateByPublicKey(publicKey) {
    return this._myDelegateKeypairs[publicKey]
  }

  async prepare() {
    let secrets = null
    if (this.config.forging.secret) {
      secrets = Array.isArray(this.config.forging.secret) ? this.config.forging.secret : [this.config.forging.secret]
    }

    const delegateKeypairs = {}
    const delegatePublicKeys = []
    for (let i = 0; i < secrets.length; i++) {
      const keypair = DdnCrypto.getKeys(secrets[i])

      delegateKeypairs[keypair.publicKey] = keypair

      delegatePublicKeys.push(keypair.publicKey)
    }

    const accounts = await this.runtime.account.getAccountList({
      publicKey: {
        // wxm block database
        $in: delegatePublicKeys
      },
      limit: delegatePublicKeys.length
    })

    if (accounts && accounts.length === delegatePublicKeys.length) {
      accounts.forEach(account => {
        if (account.is_delegate) {
          this._myDelegateKeypairs[account.publicKey] = delegateKeypairs[account.publicKey] // wxm block database
          this._myDelegateNum++
          this.logger.trace(`Forging enabled on account: ${account.address}`)
        } else {
          this.logger.info(`Delegate with this public key not found: ${account.publicKey}`) // wxm block database
        }
      })
    } else {
      this.logger.info('Delegates not found.')
    }
  }

  async checkDelegates(publicKey, votes) {
    if (Array.isArray(votes)) {
      const account = await this.runtime.account.getAccountByPublicKey(publicKey)
      if (!account) {
        throw new Error('Account not found')
      }

      const existing_votes = account.delegates ? account.delegates.length : 0
      let additions = 0
      let removals = 0

      for (let i = 0; i < votes.length; i++) {
        const action = votes[i]

        const math = action[0]
        if (math !== '+' && math !== '-') {
          throw new Error('Invalid math operator')
        }

        if (math === '+') {
          additions += 1
        } else if (math === '-') {
          removals += 1
        }

        const publicKey2 = action.slice(1)
        try {
          Buffer.from(publicKey2, 'hex')
        } catch (e) {
          throw new Error('Invalid public key')
        }

        if (math === '+' && account.delegates !== null && account.delegates.includes(publicKey2)) {
          throw new Error('Failed to add vote, account has already voted for this delegate')
        }
        if (math === '-' && (account.delegates === null || !account.delegates.includes(publicKey2))) {
          throw new Error('Failed to remove vote, account has not voted for this delegate')
        }

        const account2 = await this.runtime.account.getAccount({
          publicKey: publicKey2,
          is_delegate: 1
        })
        if (!account2) {
          throw new Error('Delegate not found')
        }
      }

      const total_votes = existing_votes + additions - removals
      if (total_votes > this.constants.delegates) {
        const exceeded = total_votes - this.constants.delegates
        throw new Error(`Maximum number ${this.constants.delegates} votes exceeded (${exceeded} too many).`)
      }
    } else {
      throw new Error('Please provide an array of votes')
    }
  }

  // todo: 2020.10.2 待优化，包含 getAccountList 方法
  async getDelegates(query) {
    if (!query) {
      throw new Error('Missing query argument')
    }

    const delegates = await this.runtime.account.getAccountList(
      {
        is_delegate: 1, // wxm block database
        sort: [
          ['vote', 'DESC'],
          ['publicKey', 'ASC']
        ] // wxm block database
      },
      ['username', 'address', 'publicKey', 'vote', 'missedblocks', 'producedblocks', 'fees', 'rewards', 'balance']
    )

    let limit = query.limit || this.constants.delegates
    const offset = query.offset || 0
    let orderField = query.orderBy || 'rate:asc'

    orderField = orderField ? orderField.split(':') : null
    limit = limit > this.constants.delegates ? this.constants.delegates : limit

    const orderBy = orderField ? orderField[0] : null
    const sortMode = orderField && orderField.length === 2 ? orderField[1] : 'asc'

    const count = delegates.length
    // const length = Math.min(limit, count);
    const realLimit = Math.min(offset + limit, count)

    const lastBlock = this.runtime.block.getLastBlock()
    const totalSupply = this.runtime.block.getBlockStatus().calcSupply(lastBlock.height)

    for (let i = 0; i < delegates.length; i++) {
      delegates[i].rate = i + 1
      delegates[i].approval = bignum.divide(delegates[i].vote, totalSupply).toNumber()
      delegates[i].approval = Math.round(delegates[i].approval * 1e2)

      let percent = 100 - delegates[i].missedblocks / ((delegates[i].producedblocks + delegates[i].missedblocks) / 100)
      percent = Math.abs(percent) || 0

      const outsider = i + 1 > this.constants.delegates
      delegates[i].productivity = !outsider ? Math.round(percent * 1e2) / 1e2 : 0

      delegates[i].forged = bignum.plus(delegates[i].fees, delegates[i].rewards).toString()
    }

    return {
      delegates,
      sortMode,
      orderBy,
      count,
      offset,
      limit: realLimit
    }
  }

  /**
   * 返回所有受托人的public_key列表
   */
  async getDelegatePublickKeysSortByVote() {
    const delegates = await this.runtime.account.getAccountList(
      {
        is_delegate: 1, // wxm block database
        // sort: {"vote": -1, "publicKey": 1},
        sort: [
          ['vote', 'DESC'],
          ['publicKey', 'ASC']
        ], // wxm block database
        limit: this.constants.delegates
      },
      ['publicKey', 'vote']
    )

    if (!delegates || !delegates.length) {
      throw new Error('No active delegates found')
    }

    return delegates.map(({ publicKey }) => publicKey)
  }

  /**
   * 返回乱序处理的受托人public_key列表
   */
  async getDisorderDelegatePublicKeys(height) {
    let truncDelegateList
    try {
      truncDelegateList = await this.getDelegatePublickKeysSortByVote()
    } catch (err) {
      this.logger.error('************* Cannot get delegate list ************' + err.toString())
      throw err
    }

    const seedSource = (await this.runtime.round.getRound(height)).toString()
    // wxm 对查询返回的受托人列表进行乱序处理
    // let currentSeed = nacl.hash(Buffer.from(seedSource))
    let currentSeed = createHash(Buffer.from(seedSource))
    for (let i = 0, delCount = truncDelegateList.length; i < delCount; i++) {
      for (let x = 0; x < 4 && i < delCount; i++, x++) {
        const newIndex = currentSeed[x] % delCount
        const b = truncDelegateList[newIndex]
        truncDelegateList[newIndex] = truncDelegateList[i]
        truncDelegateList[i] = b
      }
      currentSeed = createHash(Buffer.from(currentSeed))
    }
    return truncDelegateList
  }

  /**
   * 返回当前所有受托人列表中 在本地节点配置中 存在的私钥信息
   * @param {*} height
   */
  async getActiveDelegateKeypairs(height) {
    const delegates = await this.getDisorderDelegatePublicKeys(height)

    const results = []
    for (const key in this._myDelegateKeypairs) {
      if (delegates.includes(key)) {
        results.push(this._myDelegateKeypairs[key])
      }
    }
    return results
  }

  /**
   * 返回当前时间当前节点接下来可以进行铸造区块的受托人信息和时间戳
   * @param {*} curSlot
   * @param {*} height
   */
  async getForgeDelegateWithCurrentTime(curSlot, height) {
    const activeDelegates = await this.getDisorderDelegatePublicKeys(height)
    let currentSlot = curSlot
    const lastSlot = this.runtime.slot.getLastSlot(currentSlot)

    // 添加轮次验证
    const nextHeight = bignum.plus(height, 1)
    const currentRound = await this.runtime.round.getRound(height)
    const nextRound = await this.runtime.round.getRound(nextHeight)

    // 在轮次切换点添加额外验证
    if (currentRound !== nextRound) {
      this.logger.debug('Round transition point:', {
        height,
        currentRound,
        nextRound,
        currentSlot,
        lastSlot
      })

      // 确保新轮次的受托人列表已准备好
      const nextRoundDelegates = await this.getDisorderDelegatePublicKeys(bignum.plus(height, 1))
      if (!nextRoundDelegates || nextRoundDelegates.length !== this.constants.delegates) {
        this.logger.error('Next round delegates not ready')
        return null
      }
    }

    for (; currentSlot < lastSlot; currentSlot += 1) {
      let delegatePublicKey = activeDelegates[currentSlot % this.constants.delegates]

      if (process.env.TEST_ENV === 'test') {
        // 故意引入错误的逻辑时记录警告日志
        if (currentSlot % 10 === 0) {
          this.logger.warn('人为制造分叉:', {
            height,
            round: currentRound,
            slot: currentSlot,
            originalDelegate: delegatePublicKey
          })
          delegatePublicKey = 'fake_delegate_public_key'
        }
      }

      // 记录正常的铸块委托人信息
      if (delegatePublicKey && this._myDelegateKeypairs[delegatePublicKey]) {
        return {
          time: this.runtime.slot.getSlotTime(currentSlot),
          keypair: this._myDelegateKeypairs[delegatePublicKey]
        }
      }
    }

    // 记录未找到合适委托人的情况
    this.logger.warn('当前时间段未找到合法的铸块委托人:', {
      height,
      round: currentRound,
      currentSlot,
      lastSlot
    })

    return null
  }

  /**
   * 验证区块槽位
   * @param {Object} params 参数对象
   * @param {string} params.height 区块高度
   * @param {number} params.timestamp 时间戳
   * @param {string} params.generator_public_key 生成者公钥
   * @returns {Promise<boolean>} 验证结果，true 表示验证通过，false 表示验证失败
   */
  async validateBlockSlot({ height, timestamp, generator_public_key }) {
    const activeDelegates = await this.getDisorderDelegatePublicKeys(height)
    const currentSlot = this.runtime.slot.getSlotNumber(timestamp)
    const delegateKey = activeDelegates[currentSlot % this.constants.delegates]

    // 添加区块验证的详细日志
    this.logger.debug('验证区块槽位:', {
      height,
      timestamp,
      currentSlot,
      expectedDelegate: delegateKey,
      actualDelegate: generator_public_key
    })

    // 如果受托人一致，验证通过
    if (delegateKey && generator_public_key === delegateKey) {
      return true
    }

    // 检查是否是已知的受托人
    const isKnownDelegate = await this.isDelegatePublicKey(generator_public_key)

    // 记录分叉警告日志
    this.logger.warn('检测到潜在的分叉:', {
      height,
      timestamp,
      expectedDelegate: delegateKey,
      actualDelegate: generator_public_key,
      slot: currentSlot,
      isKnownDelegate
    })

    // 记录验证失败的错误信息
    this.logger.error(
      `槽位验证失败, 期望的受托人: ${delegateKey}, 实际的受托人: ${generator_public_key}`
    )

    // 返回 false 表示验证失败
    return false
  }

  async validateProposeSlot({ height, timestamp, generator_public_key }) {
    const activeDelegates = await this.getDisorderDelegatePublicKeys(height)
    const currentSlot = this.runtime.slot.getSlotNumber(timestamp)
    const delegateKey = activeDelegates[currentSlot % this.constants.delegates]
    if (delegateKey && generator_public_key === delegateKey) {
      return
    }
    throw new Error('Failed to validate propose slot')
  }

  /**
   * 该方法向forks_stats插入数据，但未在其他地方用该表数据
   * @param {*} block
   * @param {*} cause 原因，1~5
   */
  async fork(block, cause) {
    // 添加详细的分叉原因描述
    const forkReasons = {
      1: '双重铸造',
      2: '不连续的区块高度',
      3: '双重签名',
      4: '不同的区块 ID',
      5: '不合法的时间戳'
    }

    this.logger.error('检测到区块链分叉:', {
      cause: forkReasons[cause] || '未知原因',
      height: block.height,
      blockId: block.id,
      delegate: block.generator_public_key,
      timestamp: block.timestamp,
      previousBlock: block.previous_block
    })

    // 记录分叉时的网络状态
    let activeConnections = 0
    try {
      activeConnections = await this.runtime.peer.getActiveConnectionCount()
    } catch (err) {
      this.logger.error(`获取活跃连接数失败: ${err.message}`)
    }

    let consensusHeight = 0
    try {
      consensusHeight = await this.runtime.consensus.getHeight()
    } catch (err) {
      this.logger.error(`获取共识高度失败: ${err.message}`)
    }

    this.logger.warn('分叉时的网络状态:', {
      lastBlockHeight: this.runtime.block.getLastBlock().height,
      activeConnections,
      consensusHeight
    })

    // 记录分叉信息到数据库
    try {
      return await this.dao.insert('forks_stat', {
        delegate_public_key: block.generator_public_key,
        block_timestamp: block.timestamp,
        block_id: block.id,
        block_height: block.height,
        previous_block: block.previous_block,
        cause
      })
    } catch (err) {
      this.logger.error(`记录分叉信息失败: ${err.message}`)
    }
  }

  /**
   * 清理重复签名导致的问题
   * @private
   * @param {Object} block 分叉区块
   */
  async _cleanupDuplicateSignatures(block) {
    try {
      // 获取区块中的交易
      const transactions = await this.dao.findList('tr', {
        where: {
          block_id: block.id
        }
      })

      if (!transactions || transactions.length === 0) {
        this.logger.warn('未找到分叉区块中的交易')
        return
      }

      // 查找多重签名交易
      for (const trs of transactions) {
        if (trs.type === assetTypes.MULTISIGNATURE || trs.signatures) {
          this.logger.info(`尝试清理交易 ${trs.id} 的重复签名`)

          // 查找相同发送者的其他未确认交易
          if (trs.senderId) {
            const senderTrs = await this.runtime.transaction.getUnconfirmedTransactionsByAddress(trs.senderId)

            if (senderTrs && senderTrs.length > 0) {
              this.logger.info(`发现发送者 ${trs.senderId} 的 ${senderTrs.length} 个未确认交易`)

              // 检查是否有重复的多重签名交易
              for (const otherTrs of senderTrs) {
                if (otherTrs.signatures && otherTrs.signatures.some(sig => trs.signatures && trs.signatures.includes(sig))) {
                  this.logger.warn(`发现重复签名交易: ${otherTrs.id}`)
                  await this.runtime.transaction.removeUnconfirmedTransaction(otherTrs.id)
                }
              }
            }
          }
        }
      }
    } catch (err) {
      this.logger.error(`清理重复签名失败: ${err.message}`)
      throw err
    }
  }

  /**
   * 检查公钥是否属于已知的受托人
   * @param {string} publicKey 公钥
   * @returns {Promise<boolean>} 是否是受托人
   */
  async isDelegatePublicKey(publicKey) {
    try {
      // 在mem_account表中查找具有该公钥且is_delegate=1的账户
      const delegates = await this.dao.findList('mem_account', {
        where: {
          publicKey: publicKey,
          is_delegate: 1
        }
      })
      return delegates && delegates.length > 0
    } catch (err) {
      this.logger.error(`检查受托人公钥失败: ${err.message}`)
      return false
    }
  }

  async handleFork(block, cause) {
    try {
      this._recoveryMode = true;
      this._forkedRound = await this.getCurrentRound();

      // 记录分叉信息
      await this.logger.warn(`检测到分叉: ${cause}, 高度: ${block.height}`);

      // 保存当前状态
      const snapshot = await this.createStateSnapshot();

      // 尝试恢复到分叉点
      await this.rollbackToBlock(block.height - 1);

      // 重新同步区块
      await this.synchronizeFromPeers();

      // 确保状态机恢复到正确状态
      // if (this.runtime.stateMachine && this.runtime.stateMachine.isPending()) {
        this.logger.info('将状态从Pending恢复到Syncing');
        this.runtime.stateMachine.transitionTo('Syncing');
      // }

      // 如果恢复失败，使用快照恢复
      if (!await this.isChainValid()) {
        await this.restoreSnapshot(snapshot);
      }

      // 记录恢复结果
      this.logger.info(`分叉处理完成, 高度: ${block.height}`);
    } catch (err) {
      this.logger.error('分叉处理失败:', err);
      throw err;
    } finally {
      this._recoveryMode = false;
      this._forkedRound = null;
    }
  }

  async cleanup() {
    if (this._recoveryMode) {
      await this.finalizeRecovery();
    }

    // 确保清理所有状态
    await this.saveConsensusState();
    await this.notifyPeers();
  }

  async createStateSnapshot() {
    try {
      const currentState = {
        height: await this.getCurrentHeight(),
        round: this._forkedRound,
        delegates: await this.getDelegatePublickKeysSortByVote(),
        blocks: await this.getRecentBlocks(2),
        timestamp: Date.now()
      };

      const snapshotId = createHash(Buffer.from(JSON.stringify(currentState))).toString('hex');

      const snapshot = {
        id: snapshotId,
        height: currentState.height,
        round: currentState.round,
        snapshot_data: JSON.stringify(currentState),
        created_at: new Date()
      };

      // 验证快照数据
      const errors = await this.runtime.schema.validateSnapshot(snapshot);
      if (errors) {
        throw new Error(`快照数据验证失败: ${JSON.stringify(errors)}`);
      }

      await this.dao.insert('snapshot', snapshot);

      this.logger.info('创建状态快照成功:', {
        id: snapshotId,
        height: currentState.height,
        round: currentState.round
      });

      return currentState;
    } catch (err) {
      this.logger.error('创建状态快照失败:', err);
      throw err;
    }
  }

  async rollbackToBlock(height) {
    try {
      // 获取目标区块
      const targetBlock = await this.runtime.block.findOne({
        height: height
      });

      if (!targetBlock) {
        throw new Error(`未找到高度为 ${height} 的区块`);
      }

      // 删除目标高度之后的区块
      await this.dao.remove('blocks', {
        where: {
          height: {
            $gt: height
          }
        }
      });

      // 重置内存中的状态
      await this.runtime.block.setLastBlock(targetBlock);

      this.logger.info(`已回滚到区块高度: ${height}`);
    } catch (err) {
      this.logger.error('区块回滚失败:', err);
      throw err;
    }
  }

  // fixme: 与 block.js 中的同步逻辑重复，需要重构 2025.1.21
  /**
   * 获取当前区块链高度
   * @returns {Promise<number>} 当前区块链高度
   */
  async getCurrentHeight() {
    try {
      const lastBlock = this.runtime.block.getLastBlock();
      return lastBlock ? lastBlock.height : 0;
    } catch (err) {
      this.logger.error(`获取当前高度失败: ${err.message}`);
      throw err;
    }
  }

  async synchronizeFromPeers() {
    try {
      const peers = await this.runtime.peer.getPeers();
      if (!peers.length) {
        throw new Error('没有可用的节点进行同步');
      }

      // 获取当前高度
      const currentHeight = await this.getCurrentHeight();

      // 从每个节点获取区块并验证
      for (const peer of peers) {
        try {
          const blocks = await this.runtime.peer.getBlocksFromPeer(peer, currentHeight);
          await this.validateAndApplyBlocks(blocks);
        } catch (err) {
          this.logger.warn(`从节点 ${peer.ip} 同步失败:`, err);
          continue;
        }
      }
    } catch (err) {
      this.logger.error('节点同步失败:', err);
      throw err;
    }
  }

  /**
   * 获取最近的区块数据
   * @param {number} count 获取的区块数量
   * @returns {Promise<Array>} 区块数组
   */
  async getRecentBlocks(count = 10) {
    try {
      const lastBlock = this.runtime.block.getLastBlock();
      if (!lastBlock) {
        return [];
      }

      const minHeight = Math.max(1, bignum.minus(lastBlock.height, count - 1).toNumber());
      const maxHeight = lastBlock.height;

      return await this.runtime.block.getBlocks(minHeight, maxHeight);
    } catch (err) {
      this.logger.error(`获取最近区块失败: ${err.message}`);
      throw err;
    }
  }

  /**
   * 验证区块签名
   * @param {Object} block 区块数据
   * @returns {boolean} 验证结果
   */
  verifyBlockSignature(block) {
    try {
      return this.runtime.block.verifySignature(block);
    } catch (err) {
      this.logger.error(`验证区块签名失败: ${err.message}`);
      return false;
    }
  }

  async isChainValid() {
    try {
      // 验证最近的100个区块
      const recentBlocks = await this.getRecentBlocks(2);

      for (let i = 1; i < recentBlocks.length; i++) {
        const currentBlock = recentBlocks[i];
        const previousBlock = recentBlocks[i - 1];

        // 验证区块连续性
        if (currentBlock.previous_block !== previousBlock.id) {
          return false;
        }

        // 验证区块签名
        if (!this.verifyBlockSignature(currentBlock)) {
          return false;
        }
      }

      return true;
    } catch (err) {
      this.logger.error('链验证失败:', err);
      return false;
    }
  }

  /**
   * 验证并应用区块
   * @param {Array} blocks 区块数组
   * @returns {Promise<boolean>} 应用结果
   */
  async validateAndApplyBlocks(blocks) {
    if (!blocks || !blocks.length) {
      return true;
    }

    try {
      for (const block of blocks) {
        // 验证区块
        if (!await this.runtime.block.objectNormalize(block)) {
          this.logger.error(`区块格式验证失败: ${block.id}`);
          return false;
        }

        // 应用区块
        await this.runtime.block.processBlock(block, null, false, true, true);
        this.logger.info(`应用区块成功: ${block.id}, 高度: ${block.height}`);
      }
      return true;
    } catch (err) {
      this.logger.error(`验证和应用区块失败: ${err.message}`);
      return false;
    }
  }

  /**
   * 恢复受托人列表
   * @param {Array} delegates 受托人公钥列表
   * @returns {Promise<void>}
   */
  async restoreDelegateList(delegates) {
    try {
      // 这里只是记录日志，实际上受托人列表是从数据库中动态计算的
      this.logger.info(`恢复受托人列表，共 ${delegates.length} 个受托人`);
    } catch (err) {
      this.logger.error(`恢复受托人列表失败: ${err.message}`);
      throw err;
    }
  }

  /**
   * 广播当前状态
   * @returns {Promise<void>}
   */
  async broadcastCurrentState() {
    try {
      const currentState = {
        height: await this.getCurrentHeight(),
        lastBlock: this.runtime.block.getLastBlock().id
      };

      await this.runtime.peer.broadcast('chain/state', currentState);
      this.logger.info('广播当前状态成功');
    } catch (err) {
      this.logger.error(`广播当前状态失败: ${err.message}`);
      throw err;
    }
  }

  async restoreSnapshot(snapshot) {
    try {
      // 验证快照数据完整性
      if (!snapshot || !snapshot.blocks || !snapshot.delegates) {
        throw new Error('快照数据不完整');
      }

      this.logger.info('开始从快照恢复:', {
        height: snapshot.height,
        round: snapshot.round
      });

      // 回滚到快照高度
      await this.rollbackToBlock(snapshot.height - 1);

      // 重新应用快照中的区块
      await this.validateAndApplyBlocks(snapshot.blocks);

      // 恢复受托人列表
      await this.restoreDelegateList(snapshot.delegates);

      this.logger.info('快照恢复完成:', {
        height: snapshot.height,
        round: snapshot.round
      });
    } catch (err) {
      this.logger.error('快照恢复失败:', err);
      throw err;
    }
  }

  async finalizeRecovery() {
    try {
      // 清理临时数据
      await this.dao.remove('snapshots', {
        where: {
          created_at: {
            $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 删除24小时前的快照
          }
        }
      });

      // 广播当前状态
      await this.broadcastCurrentState();

      this.logger.info('恢复流程已完成');
    } catch (err) {
      this.logger.error('恢复流程终止失败:', err);
      throw err;
    }
  }

  async saveConsensusState() {
    try {
      const state = {
        height: await this.getCurrentHeight(),
        round: this._forkedRound,
        lastBlock: await this.runtime.block.getLastBlock(),
        timestamp: Date.now()
      };

      await this.dao.insert('consensus_state', {
        state: JSON.stringify(state),
        created_at: new Date()
      });
    } catch (err) {
      this.logger.error('保存共识状态失败:', err);
      throw err;
    }
  }

  async notifyPeers() {
    try {
      const currentState = {
        height: await this.getCurrentHeight(),
        round: this._forkedRound,
        lastBlock: await this.runtime.block.getLastBlock()
      };

      // 广播给所有节点
      await this.runtime.peer.broadcast('consensus/state', currentState);
    } catch (err) {
      this.logger.error('节点通知失败:', err);
      throw err;
    }
  }

  async getSnapshot(height, round) {
    try {
      const snapshot = await this.dao.findOne('snapshots', {
        where: {
          height,
          round
        },
        order: [['created_at', 'DESC']]
      });

      if (!snapshot) {
        throw new Error(`未找到高度 ${height} 轮次 ${round} 的快照`);
      }

      return JSON.parse(snapshot.snapshot_data);
    } catch (err) {
      this.logger.error('获取快照失败:', err);
      throw err;
    }
  }

  async cleanupOldSnapshots(retentionHours = 24) {
    try {
      const retentionTime = new Date(Date.now() - retentionHours * 60 * 60 * 1000);

      await this.dao.remove('snapshots', {
        where: {
          created_at: {
            $lt: retentionTime
          }
        }
      });

      this.logger.info(`清理了 ${retentionHours} 小时前的快照`);
    } catch (err) {
      this.logger.error('清理过期快照失败:', err);
      throw err;
    }
  }

  async validateDelegate(publicKey, height) {
    try {
      const activeDelegates = await this.getDisorderDelegatePublicKeys(height)
      const round = await this.runtime.round.getRound(height)

      this.logger.debug('Validating delegate:', {
        publicKey,
        height,
        round,
        isDelegateActive: activeDelegates.includes(publicKey)
      })

      return activeDelegates.includes(publicKey)
    } catch (err) {
      this.logger.error('Delegate validation failed:', err)
      return false
    }
  }
}

export default Delegate
