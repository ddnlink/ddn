/**
 * 区块数据核心处理逻辑和方法
 * wangxm   2018-12-27
 */
import assert from 'assert'
import Sequelize from 'sequelize'

import * as DdnCrypto from '@ddn/crypto'
import { bignum } from '@ddn/utils'
import { System } from '../../utils/system'
import BlockStatus from './block-status'
import BlockCache from './block-cache'

let _singleton

class Block {
  static singleton(context) {
    if (!_singleton) {
      _singleton = new Block(context)
    }
    return _singleton
  }

  constructor(context) {
    Object.assign(this, context)
    this._context = context

    this._blockCache = new BlockCache({
      maxSize: 1000,
      logger: this.logger
    })

    this._lastBlock = null
    this._lastVoteTime = null
    this._lastPropose = null
    this._proposeCache = {}

    this._blockStatus = new BlockStatus(context)
    this._isSyncing = false

    this.processBlock = this.processBlock.bind(this);
  }

  async getCount(where) {
    return await this.dao.count('block', { where })
  }

  async calculateFee() {
    return bignum.multiply(this.constants.net.fees.transfer, this.constants.fixedPoint).toFixed()
  }

  getBlockStatus() {
    return this._blockStatus
  }

  setLastBlock(block) {
    this._lastBlock = block
  }

  getLastBlock() {
    return this._lastBlock
  }

  getBytes(block) {
    return DdnCrypto.getBytes(block, true, true)
  }

  getHash(block) {
    const newBlock = { ...block }
    if (newBlock.transactions) {
      delete newBlock.transactions
    }
    // fixme: 2020.8.8 该方法返回 buffer, 还是使用原始 的nacl把
    return DdnCrypto.createHash(this.getBytes(block))
    // return nacl.hash(this.getBytes(block))
  }

  async sign(block, { privateKey }) {
    const newBlock = { ...block }
    if (newBlock.transactions) {
      delete newBlock.transactions
    }
    return await DdnCrypto.sign(newBlock, { privateKey })
  }

  async getId(block) {
    const newBlock = { ...block }
    if (newBlock.transactions) {
      delete newBlock.transactions
    }
    return await DdnCrypto.getId(block)
  }

  async objectNormalize(block) {
    for (const i in block) {
      if (block[i] === null || typeof block[i] === 'undefined') {
        delete block[i]
      }
    }

    const validateErrors = await this.ddnSchema.validateBlock(block)
    if (validateErrors) {
      this.logger.error(validateErrors[0].message)
      throw Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    try {
      for (let i = 0; i < block.transactions.length; i++) {
        block.transactions[i] = await this.runtime.transaction.objectNormalize(block.transactions[i])
      }
    } catch (e) {
      this.logger.error(e)
      throw Error(e.message || e.toString())
    }

    return block
  }

  /**
   * 处理创世区块
   */
  async handleGenesisBlock() {
    const genesisblock = this.genesisblock

    try {
      const row = await this.dao.findOneByPrimaryKey('block', genesisblock.id)
      const blockId = row && row.id
      if (blockId) {
        return true
      }
      const result = await this.dao.transaction(async dbTrans => {
        await this.saveBlock(genesisblock, dbTrans)
      })
      if (result) {
        // trasaction failed but rollback success
        this.logger.error(result)
        process.exit(1)
      }
      return true
    } catch (err) {
      this.logger.error(err)
      process.exit(1)
    }
  }

  /**
   * 序列化区块数据到数据库（仅仅是区块数据本身一条数据记录，不处理其中的交易数据）
   */
  async serializeBlock2Db(block, dbTrans) {
    const newBlock = {
      id: block.id,
      height: block.height,
      timestamp: block.timestamp,
      total_amount: block.total_amount,
      total_fee: block.total_fee,
      reward: block.reward || '0',
      number_of_transactions: block.number_of_transactions,
      payload_hash: block.payload_hash,
      payload_length: block.payload_length,
      generator_public_key: block.generator_public_key,
      block_signature: block.block_signature,
      version: block.version,
      previous_block: block.previous_block || null
    }

    try {
      return await this.dao.insert('block', newBlock, { transaction: dbTrans })
    } catch (err) {
      this.logger.error(`insert block fail: ${err.message || err.toString()}`)
      if (err instanceof Sequelize.UniqueConstraintError) {
        this.logger.warn(`Block ${block.id} already exists, skipping insertion`);
        return; // 不抛出错误，继续执行
      }
      throw new Error(`insert block fail: ${err.message || err.toString()}`)
    }
  }

  /**
   * 将数据对象序列化成区块JSON对象 dbRead
   * @param {*} data
   */
  serializeDbData2Block(raw) {
    if (!raw.b_id) {
      return null
    } else {
      const block = {
        id: raw.b_id,
        version: parseInt(raw.b_version),
        timestamp: parseInt(raw.b_timestamp),
        height: raw.b_height + '', // bignum update parseInt(raw.b_height),
        previous_block: raw.b_previousBlock, // wxm block database
        number_of_transactions: parseInt(raw.b_numberOfTransactions), // wxm block database
        total_amount: raw.b_totalAmount + '', // bignum update parseInt(raw.b_totalAmount),    //wxm block database
        total_fee: raw.b_totalFee + '', // bignum update parseInt(raw.b_totalFee),   //wxm block database
        reward: raw.b_reward + '', // bignum update parseInt(raw.b_reward),
        payload_length: parseInt(raw.b_payloadLength), // wxm block database
        payload_hash: raw.b_payloadHash, // wxm block database
        generator_public_key: raw.b_generatorPublicKey, // wxm block database
        generator_id: this.address.generateAddress(raw.b_generatorPublicKey), // imfly
        block_signature: raw.b_blockSignature, // wxm block database
        confirmations: raw.b_confirmations
      }
      // fixme: 2020.8.12 bignum 的性能可能会影响块同步
      block.totalForged = bignum.plus(block.total_fee, block.reward).toFixed()

      return block
    }
  }

  /**
   * 保存区块数据到数据库（包括区块数据记录和所有包含的交易数据记录）
   * @param {*} block
   * @param {*} dbTrans
   */
  async saveBlock(block, dbTrans) {
    this.logger.debug('saveBlock start!')
    try {
      await this.serializeBlock2Db(block, dbTrans)
    } catch (err) {
      this.logger.error(`serializeBlock2Db fail ${err}`)
      throw new Error(`serializeBlock2Db fail ${err}`)
    }
    if (block.transactions && block.transactions.length > 0) {
      for (let i = 0; i < block.transactions.length; i++) {
        const transaction = block.transactions[i]
        transaction.block_id = block.id
        transaction.block_height = block.height

        await this.runtime.transaction.serializeTransaction2Db(transaction, dbTrans)
      }
    }

    return true
  }

  async createBlock(data) {
    const transactions = this._sortTransactions(data.transactions)

    const nextHeight = data.previous_block ? bignum.plus(data.previous_block.height, 1).toString() : '1' // bignum update //wxm block database
    this.logger.debug(`Height is being created, nextHeight: ${nextHeight}`)
    const reward = this._blockStatus.calcReward(nextHeight)

    let totalFee = bignum.new(0)
    let totalAmount = bignum.new(0)

    const blockTransactions = []
    let payloadBytes = ''

    let size = 0
    for (const trs of transactions) {
      const transaction = this.runtime.transaction.deepCloneTransaction(trs)
      const bytes = DdnCrypto.getBytes(transaction)
      if (size + bytes.length > this.constants.maxPayloadLength) {
        break
      }

      size += bytes.length

      totalFee = bignum.plus(totalFee, transaction.fee)
      totalAmount = bignum.plus(totalAmount, transaction.amount)

      blockTransactions.push(transaction)
      payloadBytes += bytes
    }

    const payloadHash = DdnCrypto.createHash(Buffer.from(payloadBytes)) // payloadHash.update(bytes); // 类似 push？

    let block = {
      version: 0,
      height: bignum.plus(this._lastBlock.height, 1).toString(),
      total_amount: totalAmount.toFixed(), // Bignum update
      total_fee: totalFee.toFixed(), // Bignum update
      reward: reward.toString(), // Bignum update
      payload_hash: payloadHash.toString('hex'),
      timestamp: data.timestamp,
      number_of_transactions: blockTransactions.length,
      payload_length: size,
      previous_block: data.previous_block.id, // wxm block database
      generator_public_key: data.keypair.publicKey.toString('hex'),
      transactions: blockTransactions
    }
    try {
      block.block_signature = await this.sign(block, data.keypair)
      block = await this.objectNormalize(block)
      block.id = await this.getId(block)
    } catch (e) {
      this.logger.error(e)
      throw new Error(e.message || e.toString())
    }

    return block
  }

  /**
   * 接收到其他节点铸造的区块数据，进行确认处理
   * @param {*} block
   * @param {*} votes
   */
  async receiveNewBlock(block, votes) {
    // 检查当前状态
    const currentState = this.runtime.stateMachine.current;
    const stateName = this.runtime.stateMachine._getStateName(currentState);

    // 如果不是Ready状态，记录日志并检查是否可以继续处理
    if (!this.runtime.stateMachine.isReady()) {
      this.logger.debug(
        `Current state is ${stateName} (${currentState}), not Ready (2) when receiving block ${block.height}`
      )

      // 如果是处于Pending状态，但收到的区块高度比当前区块高得多，则尝试切换到Syncing状态
      if (this.runtime.stateMachine.isPending()) {
        const lastBlock = this.getLastBlock();
        const heightDiff = bignum.minus(block.height, lastBlock.height);

        if (bignum.isGreaterThan(heightDiff, 5)) {
          this.logger.warn(`Received block with height ${block.height} while in Pending state, current height is ${lastBlock.height}. Attempting to transition to Syncing state.`);
          try {
            this.runtime.stateMachine.transitionTo('Syncing');
            // 不直接调用 startSync，而是使用 runtime 中的 startBlockDataSyncTask 方法
            // 这样可以确保同步状态标记的正确设置
            setImmediate(() => {
              // 如果 runtime 中有 startBlockDataSyncTask 方法，则使用它
              if (this.runtime && typeof this.runtime.startBlockDataSyncTask === 'function') {
                this.runtime.startBlockDataSyncTask();
              } else {
                // 如果无法访问该方法，则回退到直接调用 startSync
                this.logger.warn('runtime.startBlockDataSyncTask not available, falling back to startSync');
                this.startSync(lastBlock.height);
              }
            });
          } catch (err) {
            this.logger.error(`Failed to transition to Syncing state: ${err.message}`);
            return;
          }
        } else {
          // 如果高度差异不大，仍然跳过
          return;
        }
      } else if (!this.runtime.stateMachine.isSyncing()) {
        // 如果不是Pending也不是Syncing，则跳过
        return;
      }
      // 如果是Syncing状态，则继续处理
    }

    if (this._isSyncing) {
      this.logger.debug('Currently syncing blocks, ignore new block')
      return
    }

    if (this._blockCache.has(block.id)) {
      this.logger.debug(`Block ${block.id} already in cache`)
      return
    }

    // 添加到缓存
    this._blockCache.add(block.id, block)

    try {
      await this.sequence.addAsync(async () => {
        // 接受的就是当前块，直接退出
        if (block.previous_block === this._lastBlock.previous_block && bignum.isEqualTo(block.height, this._lastBlock.height) && block.id === this._lastBlock.id) {
          this.logger.debug(`The received is the current block, do nothing!`)
          return
        }

        // 下一个区块的高度
        const expectedHeight = bignum.plus(this._lastBlock.height, 1)

        // 正常情况：当前块的前一个块是当前块（lastBlock），并且高度+1
        if (block.previous_block === this._lastBlock.id && bignum.isEqualTo(block.height, expectedHeight)) {

          this.logger.info(
            `Received new block id: ${block.id} height: ${block.height} round: ${await this.runtime.round.getRound(
              this.getLastBlock().height
            )} slot: ${this.runtime.slot.getSlotNumber(block.timestamp)} reward: ${this.getLastBlock().reward}`
          )

          await this.processBlock(block, votes, true, true, true)
          return // 显式返回
        }

        // 分叉情况1: 高度+1了，但是前一个块不是当前块
        if (block.previous_block !== this._lastBlock.id && bignum.isEqualTo(block.height, expectedHeight)) {
          await this.handleFork(block, 1)
          throw new Error('Fork:1')
        }

        // 分叉情况2: 高度一样，前一个块是当前块的前一块，但是与当前块的id却不一样（说明不是同一个块）
        if (block.previous_block === this._lastBlock.previous_block && bignum.isEqualTo(block.height, this._lastBlock.height) && block.id !== this._lastBlock.id) {
          await this.handleFork(block, 2)
          throw new Error('Fork:2')
        }

        // 分叉情况3: 区块高度不连续，或者说远大于+1的情况
        if (bignum.isGreaterThan(block.height, expectedHeight)) {
          this.logger.info(`Received discontinuous block height ${block.height}`)
          await this.startSync(this._lastBlock.height)
          return // 显式返回
        }

        this.logger.debug(`block.height: ${block.height}`)
        this.logger.debug(`expectedHeight: ${expectedHeight}`)
        this.logger.debug(`block.previous_block: ${block.previous_block}`)
        this.logger.debug(`this._lastBlock.previous_block: ${this._lastBlock.previous_block}`)
        this.logger.debug(`block.id: ${block.id}`)
        this.logger.debug(`this._lastBlock.id: ${this._lastBlock.id}`)
        this.logger.error(`Invalid block state: ${block.id} height: ${block.height}, previous_block: ${block.previous_block}, lastBlock: ${this._lastBlock.height}`)

        // 如果都不满足以上条件，说明区块无效
        // throw new Error('Invalid block state')
        return
      })
    } catch (err) {
      if (!err.message.startsWith('Fork:')) { // 更精确的错误判断
        this.logger.error('Failed to process new block:', err)
        throw err
      }
      // Fork 错误已经在 handleFork 中处理过了，这里不需要再抛出
    }
  }

  async receiveVotes(votes) {
    this.logger.debug('Receive votes start')

    // 检查当前状态
    const currentState = this.runtime.stateMachine.current;
    const stateName = this.runtime.stateMachine._getStateName(currentState);

    if (!this.runtime.stateMachine.isReady()) {
      this.logger.debug(`Current state is ${stateName} (${currentState}), not Ready (2) when receiving votes`)

      // 如果在Pending状态下收到投票，尝试恢复到Ready状态
      if (this.runtime.stateMachine.isPending()) {
        // 检查投票的区块高度与当前区块高度的差异
        const lastBlock = this.getLastBlock();
        const pendingBlock = this.runtime.consensus.getPendingBlock();

        if (pendingBlock && bignum.isEqualTo(pendingBlock.height, bignum.plus(lastBlock.height, 1))) {
          this.logger.warn(`Received votes for next block while in Pending state. Attempting to transition to Ready state.`);
          try {
            this.runtime.stateMachine.transitionTo('Ready');
          } catch (err) {
            this.logger.error(`Failed to transition to Ready state: ${err.message}`);
            return;
          }
        } else {
          return;
        }
      } else {
        return;
      }
    }

    try {
      await this.sequence.addAsync(async () => {
        const totalVotes = this.runtime.consensus.addPendingVotes(votes)

        if (totalVotes && totalVotes.signatures) {
          this.logger.debug(`receive new votes, total votes number ${totalVotes.signatures.length}`)
        }

        if (this.runtime.consensus.hasEnoughVotes(totalVotes)) {
          const block = this.runtime.consensus.getPendingBlock()
          this.logger.debug(`receiveVotes getPendingBlock block.height = ${block.heigh}`)

          const height = block.height
          const id = block.id

          try {
            await this.processBlock(block, totalVotes, true, true, false)
          } catch (err) {
            if (err) {
              this.logger.error(`receiveVotes error: ${err} height: ${height} id: ${id} `)
            }
          }

          this.logger.info(
            `receiveVotes: ${id} height: ${height} round: ${await this.runtime.round.getRound(
              height
            )} slot: ${this.runtime.slot.getSlotNumber(block.timestamp)} reward: ${block.reward}`
          )
        }
      })
    } catch (err) {
      this.logger.error('Failed to process votes:', err)
      throw err
    }
  }

  /**
   * 接收其他节点铸块投票
   * @param {*} propose
   */
  async receiveNewPropose(propose) {
    this.logger.debug('receiveNewPropose start.')

    // 检查当前状态
    const currentState = this.runtime.stateMachine.current;
    const stateName = this.runtime.stateMachine._getStateName(currentState);

    if (!this.runtime.stateMachine.isReady()) {
      this.logger.debug(
        `Current state is ${stateName} (${currentState}), not Ready (2) when receiving propose for height ${propose.height}`
      )

      // 如果在Pending状态下收到提议，并且提议的高度是当前高度+1，尝试恢复到Ready状态
      if (this.runtime.stateMachine.isPending()) {
        const lastBlock = this.getLastBlock();
        const expectedHeight = bignum.plus(lastBlock.height, 1).toString();

        if (bignum.isEqualTo(propose.height, expectedHeight)) {
          this.logger.warn(`Received propose for next block (height ${propose.height}) while in Pending state. Attempting to transition to Ready state.`);
          try {
            this.runtime.stateMachine.transitionTo('Ready');
          } catch (err) {
            this.logger.error(`Failed to transition to Ready state: ${err.message}`);
            return;
          }
        } else {
          return;
        }
      } else {
        return;
      }
    }

    if (this._proposeCache[propose.hash]) {
      this.logger.debug(`propose cache include propose hash: ${propose.hash}, propeseCache: ${this._proposeCache}`)
      return
    }
    this._proposeCache[propose.hash] = true

    try {
      await this.sequence.addAsync(async () => {
        if (
          this._lastPropose &&
          bignum.isEqualTo(this._lastPropose.height, propose.height) &&
          this._lastPropose.generator_public_key === propose.generator_public_key &&
          this._lastPropose.id !== propose.id
        ) {
          this.logger.warn(
            `generate different block with the same height, generator: ${propose.generator_public_key}`
          )
          return
        }

        if (!bignum.isEqualTo(propose.height, bignum.plus(this._lastBlock.height, 1))) {
          this.logger.debug('invalid propose height', propose)
          if (bignum.isGreaterThan(propose.height, bignum.plus(this._lastBlock.height, 1))) {
            this.logger.info(`receive discontinuous propose height ${propose.height}`)
          }
          return
        }

        if (this._lastVoteTime && Date.now() - this._lastVoteTime < (this.constants.interval * 1000) / 2) {
          this.logger.debug('ignore the frequently propose')
          return
        }

        this.logger.info(`receive propose height ${propose.height} bid ${propose.id}`)

        setImmediate(async () => {
          try {
            await this.runtime.peer.broadcast.broadcastNewPropose(propose)
          } catch (err) {
            this.logger.error(`Broadcast new propose failed: ${System.getErrorMsg(err)}`)
          }
        })

        try {
          await this.runtime.delegate.validateProposeSlot(propose)
          this.runtime.consensus.acceptPropose(propose)

          const activeKeypairs = await this.runtime.delegate.getActiveDelegateKeypairs(propose.height)
          if (activeKeypairs && activeKeypairs.length > 0) {
            const votes = this.runtime.consensus.createVotes(activeKeypairs, propose)
            this.logger.debug(`send votes height ${votes.height} id ${votes.id} sigatures ${votes.signatures.length}`)

            const from = propose.address
            const pos = from.indexOf(':')
            let host, port
            if (pos >= 0) {
              const fromIp = from.substring(0, pos)
              const fromPort = from.substring(pos + 1)
              host = fromIp
              port = parseInt(fromPort)
            } else {
              host = from
              port = 80
            }

            // 向提议请求节点回复本机授权
            let res
            setImmediate(async () => {
              try {
                res = await this.runtime.peer.p2p.post('/vote', votes, { host, port })
                if (!res.body.success) {
                  this.logger.debug(`Reply propose request fail ${JSON.stringify(res.body.message)}.`)
                }
              } catch (err) {
                this.logger.error(`Reply propose request failed: ${System.getErrorMsg(err)}`)
              }
            })

            this._lastVoteTime = Date.now()
            this._lastPropose = propose
          }
        } catch (err) {
          this.logger.error(`Receive propose fail, ${err}`)
          throw err
        }
      })
    } catch (err) {
      this.logger.error('Failed to process propose:', err)
      throw err
    }
  }

  async _applyTransactions(transactions, block, dbTrans) {
    const applyedTrsIdSet = new Set();
    const failedTransactions = [];

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const updatedAccountInfo = await this.runtime.account.setAccount(
        {
          publicKey: transaction.senderPublicKey,
          isGenesis: bignum.isEqualTo(block.height, 1)
        },
        dbTrans
      );

      const accountInfo = await this.runtime.account.getAccountByAddress(updatedAccountInfo.address, dbTrans);
      const newAccountInfo = Object.assign({}, accountInfo, updatedAccountInfo);

      try {
        await this.runtime.transaction.applyUnconfirmed(transaction, newAccountInfo, dbTrans);
        await this.runtime.transaction.apply(transaction, block, newAccountInfo, dbTrans);
        applyedTrsIdSet.add(transaction.id);
      } catch (err) {
        // 检查是否是交易已确认的错误
        if (err.toString().includes('The transaction has been confirmed')) {
          this.logger.warn(`Transaction ${transaction.id} has already been confirmed, continuing with block processing`);
          applyedTrsIdSet.add(transaction.id);
        } else {
          this.logger.error(`Failed to apply transaction ${transaction.id}: ${err.message || err.toString()}`);
          failedTransactions.push({
            id: transaction.id,
            error: err.message || err.toString()
          });
          // 不抛出错误，继续处理其他交易
        }
      } finally {
        await this.runtime.transaction.removeUnconfirmedTransaction(transaction.id);
      }
    }

    // 如果有失败的交易，记录日志但不中断区块应用
    if (failedTransactions.length > 0) {
      this.logger.warn(`Block ${block.id} applied with ${failedTransactions.length} failed transactions`);
      this.logger.debug('Failed transactions:', failedTransactions);
    }

    return applyedTrsIdSet;
  }

  async _saveBlockAndTick(block, isSaveBlock, dbTrans) {
    if (isSaveBlock) {
      try {
        await this.saveBlock(block, dbTrans);
      } catch (err) {
        this.logger.error(`Save block fail ${err}`);
        throw new Error(`Save block fail ${err}`);
      }
    }

    try {
      await this.runtime.round.tick(block, dbTrans);
    } catch (error) {
      this.logger.error(`tick error dbTrans rollback error: ${JSON.stringify(error)}`);
      throw new Error(error);
    }
  }

  async _cleanupState(block) {
    this.setLastBlock(block);
    this._blockCache.clear();
    this._proposeCache = {};
    this._lastVoteTime = null;
    this.oneoff.clear();
    this.balanceCache.commit();
    this.runtime.consensus.clearState();
  }

  async _broadcastNewBlock(block, votes) {
    this.logger.info(`Block applied correctly with ${block.transactions.length} transactions`);
    votes.signatures = votes.signatures.slice(0, 6);

    setImmediate(async () => {
      try {
        await this.runtime.peer.broadcast.broadcastNewBlock(block, votes);
        await this.runtime.transaction.execAssetFunc('onNewBlock', block, votes);
      } catch (err) {
        this.logger.error(`Broadcast new block failed: ${System.getErrorMsg(err)}`);
      }
    });
  }

  async _handleUnconfirmedTransactions(applyedTrsIdSet) {
    const unconfirmedTrs = await this.runtime.transaction.getUnconfirmedTransactionList(true);
    try {
      await this.runtime.transaction.undoUnconfirmedList();
    } catch (err) {
      this.logger.error('Failed to undo uncomfirmed transactions', err);
      return process.exit(0);
    }

    this.oneoff.clear();

    const redoTrs = unconfirmedTrs.filter(item => !applyedTrsIdSet.has(item.id));
    try {
      await this.runtime.transaction.receiveTransactions(redoTrs);
    } catch (err) {
      this.logger.error('Failed to redo unconfirmed transactions', err);
    }
  }

  async applyBlock({ block, votes, isBroadcast, isSaveBlock }) {
    const doApplyBlock = async () => {
      this.logger.debug('doApplyBlock is starting');
      const sortedTrs = this._sortTransactions(block.transactions);

      try {
        const result = await this.dao.transaction(async dbTrans => {
          const applyedTrsIdSet = await this._applyTransactions(sortedTrs, block, dbTrans);
          await this._saveBlockAndTick(block, isSaveBlock, dbTrans);
          return applyedTrsIdSet;
        });

        this.logger.debug('Apply block transaction result: ', result);
        if (result) {
          const lastHeight = await this.runtime.dvm.getLastHeight();
          if (lastHeight >= 0) {
            await this.runtime.dvm.rollback(this._lastBlock.height);
          }
          return;
        }

        this.runtime.dvm.commit(block.height);
        this.logger.debug('The dao.transaction is finished.');

        await this._cleanupState(block);

        if (isBroadcast) {
          await this._broadcastNewBlock(block, votes);
        }
      } catch (err) {
        this.balanceCache.rollback();
        this.logger.error(`Rollback or commit error, apply block fail: ${err}`);
        process.exit(1);
      }
    };

    return this.balancesSequence.addAsync(async () => {
      try {
        await doApplyBlock();
      } catch (err) {
        this.logger.error(`Failed to apply block: ${err}`);
        throw err;
      }
    });
  }

  verifySignature(block) {
    // 接受到的block是protobuf 解密之后的，因为解密后的json是类似 Blcok{}这样，带个名称前缀，应该不是标准的json数据，所以使用Object.assign，这样数据就是{}
    block = Object.assign({}, block)
    const newBlock = { ...block }
    let res = null
    const { block_signature, generator_public_key } = block
    // TODO creazy 铸造区块时没有下面这两个字段，同步时有，验证时不通过，现在手动删除，应该提出一个方法，生成一个需要验证的区块信息统一处理
    if (newBlock.generator_id) {
      delete newBlock.generator_id
    }
    if (newBlock.totalForged) {
      delete newBlock.totalForged
    }
    if (newBlock.transactions) {
      delete newBlock.transactions
    }
    // 块进行签名时是没有block_singuter字段的，所以验证时也跳过获取block_singuter的字节，这里第二个参数是跳过获取block_singuter字节
    const data = this.getBytes(newBlock, true)
    const hash = DdnCrypto.createHash(data)
    res = DdnCrypto.verifyHash(hash, block_signature, generator_public_key)
    return res
  }

  /**
   * verify block before save
   * @param {object} block block data
   * @param {object}} votes votes
   */
  async verifyBlock(block, votes) {
    // TODO creazy 创建块时为什么id和height不再在createBlock中产生
    // try {
    //   block.id = await this.getId(block)
    // } catch (e) {
    //   throw new Error(`Failed to get block id: ${e.toString()}`)
    // }
    // block.height = bignum.plus(this._lastBlock.height, 1).toString()

    // 显式声明验证预期高度 TODO：这里的逻辑与上面的不同，需要验证和测试 2025.2.1
    const expectedHeight = bignum.plus(this._lastBlock.height, 1).toString()
    if (!bignum.isEqualTo(block.height, expectedHeight)) {
      throw new Error(`Block height mismatch: expected ${expectedHeight}, got ${block.height}`)
    }

    // 验证区块ID
    // try {
    //   const calculatedId = await this.getId(block)
    //   if (block.id !== calculatedId) {
    //     throw new Error(`Block ID mismatch: expected ${calculatedId}, got ${block.id}`)
    //   }
    // } catch (err) {
    //   throw new Error(`Failed to verify block ID: ${err.message}`)
    // }

    if (typeof this._lastBlock.height === 'undefined') {
      this.logger.debug(`verifyBlock, block: ${JSON.stringify(block)}, pre-block: ${JSON.stringify(this._lastBlock)}`)
    }
    this.logger.debug(`verifyBlock, id: ${block.id}, pre-h: ${this._lastBlock.height}, h: ${block.height}`)

    if (!block.previous_block && !bignum.isEqualTo(block.height, 1)) {
      // wxm block database
      throw new Error('Previous block should not be null')
    }

    const expectedReward = this._blockStatus.calcReward(block.height)

    if (!bignum.isEqualTo(block.height, 1) && !bignum.isEqualTo(expectedReward, block.reward)) {
      throw new Error('Invalid block reward')
    }
    try {
      if (!this.verifySignature(block)) {
        throw new Error('Failed to verify block signature')
      }
    } catch (e) {
      throw new Error(`Got exception while verify block signature: ${e.toString()}`)
    }

    // FIXME: 每次重启服务都会出现该错误 2020.6.2
    if (block.previous_block !== this._lastBlock.id) {
      await this.runtime.delegate.fork(block, 1)
      this.logger.debug('Incorrect previous block hash, block.previous_block', block.previous_block)
      this.logger.debug('Incorrect previous block hash, this._lastBlock.id', this._lastBlock.id)
      throw new Error('Incorrect previous block hash')
    }

    if (block.version > 0) {
      throw new Error(`Invalid block version: ${block.version}, id: ${block.id}`)
    }

    const blockSlotNumber = this.runtime.slot.getSlotNumber(block.timestamp)
    const lastBlockSlotNumber = this.runtime.slot.getSlotNumber(this._lastBlock.timestamp)

    if (blockSlotNumber > this.runtime.slot.getSlotNumber() + 1 || blockSlotNumber <= lastBlockSlotNumber) {
      throw new Error(`Can't verify block timestamp: ${block.id}`)
    }

    if (block.payload_length > this.constants.maxPayloadLength) {
      throw new Error(`Can't verify payload length of block: ${block.id}`)
    }

    if (
      block.transactions.length !== block.number_of_transactions ||
      block.transactions.length > this.constants.maxTxsPerBlock
    ) {
      throw new Error(`Invalid amount of block assets: ${block.id}`)
    }

    this.caculateRound(block)

    if (votes) {
      if (!bignum.isEqualTo(block.height, votes.height)) {
        throw new Error('Votes height is not correct')
      }
      if (block.id !== votes.id) {
        throw new Error('Votes id is not correct')
      }
      if (!votes.signatures || !this.runtime.consensus.hasEnoughVotesRemote(votes)) {
        throw new Error('Votes signature is not correct')
      }
      await this.verifyBlockVotes(block, votes)
    }
  }

  caculateRound(block) {
    let totalAmount = bignum.new(0)
    let totalFee = bignum.new(0)

    let payloadBytes = ''
    const appliedTransactions = {}
    for (const i in block.transactions) {
      const transaction = block.transactions[i]
      const newTransaction = this.runtime.transaction.deepCloneTransaction(transaction)
      let bytes
      try {
        bytes = DdnCrypto.getBytes(newTransaction)
      } catch (e) {
        throw new Error(`Failed to get transaction bytes: ${e.toString()}`)
      }

      if (appliedTransactions[transaction.id]) {
        throw new Error(`Duplicate transaction id in block ${block.id}`)
      }

      appliedTransactions[transaction.id] = transaction
      payloadBytes += bytes
      totalAmount = bignum.plus(totalAmount, transaction.amount)

      totalFee = bignum.plus(totalFee, transaction.fee)
    }
    const payloadHash = DdnCrypto.createHash(Buffer.from(payloadBytes))

    if (payloadHash.toString('hex') !== block.payload_hash) {
      throw new Error(`Invalid payload hash: ${block.id}`)
    }

    if (!bignum.isEqualTo(totalAmount, block.total_amount)) {
      throw new Error(`Invalid total amount: ${block.id}`)
    }

    if (!bignum.isEqualTo(totalFee, block.total_fee)) {
      throw new Error(`Invalid total fee: ${block.id}`)
    }
  }

  async verifyBlockVotes({ height }, { height: votesHeight, id, signatures }) {
    let delegatesList
    try {
      delegatesList = await this.runtime.delegate.getDisorderDelegatePublicKeys(height)
    } catch (err) {
      this.logger.error('Failed to get delegate list while verifying block votes')
      process.exit(1)
    }

    const publicKeySet = {}
    delegatesList.forEach(item => {
      publicKeySet[item] = true
    })

    this.logger.debug('block verifyblockVotes get delegates list ', delegatesList.length)
    for (const item of signatures) {
      if (!publicKeySet[item.key]) {
        throw new Error(`Votes key is not in the top list: ${item.key}`)
      }
      if (!this.runtime.consensus.verifyVote(votesHeight, id, item)) {
        throw new Error('Failed to verify vote')
      }
    }
  }

  /**
   *
   * @param {*} block
   * @param {*} votes
   * @param {*} broadcast
   * @param {*} save
   * @param {*} verifyTrs
   */
  async processBlock(block, votes, broadcast, save, verifyTrs) {
    if (!this.runtime.loaded) {
      this.logger.debug('processBlock this.runtime.loaded: ', this.runtime.loaded)
      throw new Error('DDN is preparing')
    }

    if (!block.transactions) block.transactions = []
    try {
      block = await this.objectNormalize(block)
    } catch (e) {
      throw new Error(`Failed to normalize block: ${e.toString()}`)
    }

    block.transactions = this._sortTransactions(block.transactions)

    try {
      await this.verifyBlock(block, votes)
    } catch (error) {
      throw new Error(`Verify block fail, ${error}`)
    }

    this.logger.debug('verify block ok')

    try {
      const row = await this.dao.findOne('block', {
        where: {
          id: block.id
        }
      })

      const bId = row && row.id
      if (bId && save) {
        throw new Error(`Block already exists: ${block.id}`)
      }

      try {
        await this.runtime.delegate.validateBlockSlot(block)
      } catch (err) {
        await this.runtime.delegate.fork(block, 3)
        throw new Error(`Can't verify slot: ${err}`)
      }

      this.logger.debug('verify block slot ok')

      if (block.transactions && block.transactions.length) {
        const trsIds = []
        for (let i = 0; i < block.transactions.length; i++) {
          const transaction = block.transactions[i]
          trsIds.push(transaction.id)
        }

        let existsTrsIds = []
        if (trsIds.length > 0) {
          try {
            existsTrsIds = await this.dao.findList('tr', {
              where: {
                id: {
                  $in: trsIds
                }
              },
              attributes: ['id']
            })
          } catch (err) {
            throw new Error(`Failed to query transaction from db: ${err}`)
          }
        }

        for (let i = 0; i < block.transactions.length; i++) {
          const transaction = block.transactions[i]

          await this.runtime.account.setAccount({
            publicKey: transaction.senderPublicKey
          })
          // TODO creazy 这里的交易都是经过验证的，而且到这里的交易都是合法合规的，没有必要重新获取id
          if (!transaction.id) {
            transaction.id = await DdnCrypto.getId(transaction) // 2020.5.18
          }
          transaction.block_id = block.id // wxm block database

          const existsTrs = existsTrsIds.find(item => {
            item.id === transaction.id
          })
          if (existsTrs) {
            // wxy 这里如果库里存在一些交易就不存这个块吗？TODO
            await this.runtime.transaction.removeUnconfirmedTransaction(transaction.id)
            throw new Error(`Transaction already exists: ${transaction.id}`)
          }

          if (verifyTrs) {
            const sender = await this.runtime.account.getAccountByPublicKey(transaction.senderPublicKey)
            await this.runtime.transaction.verify(transaction, sender)
          }
        }
      }

      this.logger.debug('verify block transactions ok')

      try {
        await this.applyBlock({ block, votes, isBroadcast: broadcast, isSaveBlock: save })
      } catch (err) {
        this.logger.error(`Failed to apply block: ${err}`)
        throw err
      }
    } catch (err) {
      throw new Error(`Failed to query blocks from db: ${err}`)
    }
  }

  /**
   * 铸造区块
   * @param {*} keypair
   * @param {*} timestamp
   */
  async generateBlock(keypair, timestamp) {
    if (this.runtime.consensus.hasPendingBlock(timestamp)) {
      this.logger.warn('Skipping block generation - pending block exists')
      return
    }

    // 添加轮次切换检查
    const currentHeight = bignum.plus(this._lastBlock.height, 1)
    const nextHeight = bignum.plus(currentHeight, 1)
    const currentRound = await this.runtime.round.getRound(currentHeight)
    const nextRound = await this.runtime.round.getRound(nextHeight)

    if (currentRound !== nextRound) {
      this.logger.debug('Generating block at round transition:', {
        height: currentHeight,
        currentRound,
        nextRound
      })

      // 确保轮次切换时的状态正确
      await this.runtime.round.prepare()
    }

    // 验证受托人权限
    const isValidDelegate = await this.runtime.delegate.validateDelegate(keypair.publicKey, currentHeight)
    if (!isValidDelegate) {
      this.logger.error('Invalid delegate for block generation')
      return
    }

    this.logger.info('generateBlock enter')

    const ready = []

    const transactions = await this.runtime.transaction.getUnconfirmedTransactionList(
      false,
      this.constants.maxTxsPerBlock
    )
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i]
      const sender = await this.runtime.account.getAccountByPublicKey(transaction.senderPublicKey)
      if (!sender) {
        this.logger.error('Invalid sender: ' + JSON.stringify(transaction))
        break
      }

      if (await this.runtime.transaction.ready(transaction, sender)) {
        try {
          await this.runtime.transaction.verify(transaction, sender)
          ready.push(transaction)
        } catch (err) {
          this.logger.error(`Failed to verify transaction ${transaction.id}`, err)
          await this.runtime.transaction.removeUnconfirmedTransaction(transaction.id)
        }
      }
    }

    this.logger.debug('All unconfirmed transactions ready')

    let block
    try {
      block = await this.createBlock({
        keypair,
        timestamp,
        previous_block: this._lastBlock,
        transactions: ready
      })

      // 生成成功后添加到缓存
      if (block && block.id) {
        this._blockCache.add(block.id, block)
      }

    } catch (e) {
      throw new Error(`Create block model failed: ${e.toString()}`)
    }

    this.logger.info(`Generate new block at height ${parseInt(this._lastBlock.height) + 1}`)

    try {
      await this.verifyBlock(block, null)
    } catch (error) {
      // this.logger.error(`verifyBlock not passed ${error}`)
      throw new Error(`verifyBlock failed when generate new block: ${error}`)
    }

    // 本地 keypairs
    const activeKeypairs = await this.runtime.delegate.getActiveDelegateKeypairs(block.height)
    assert(activeKeypairs && activeKeypairs.length > 0, 'Active keypairs should not be empty')

    this.logger.debug(`Get active delegate keypairs len: ${activeKeypairs.length}`)

    const localVotes = this.runtime.consensus.createVotes(activeKeypairs, block)
    this.logger.debug(`Get local votes: ${localVotes.signatures.length}`)

    if (this.runtime.consensus.hasEnoughVotes(localVotes)) {
      try {
        await this.processBlock(block, localVotes, true, true, false)
        this.logger.log(
          `Forged new block id: ${block.id} height: ${block.height} round: ${await this.runtime.round.getRound(
            block.height
          )} slot: ${this.runtime.slot.getSlotNumber(block.timestamp)} reward: ${block.reward}`
        )
      } catch (err) {
        this.logger.error(`Forged new block ${err}`)
        throw new Error(`Forged new block ${err}`)
      }
    } else {
      if (!this.config.publicIp) {
        throw new Error('No public ip')
      }

      const p2pAddr = `${this.config.publicIp}:${this.config.p2pPort}`

      let propose
      try {
        propose = await this.runtime.consensus.createPropose(keypair, block, p2pAddr)
      } catch (e) {
        throw new Error(`Failed to create propose: ${e.toString()}`)
      }

      this.runtime.consensus.setPendingBlock(block)
      this.runtime.consensus.addPendingVotes(localVotes)
      this._proposeCache[propose.hash] = true

      setImmediate(async () => {
        try {
          await this.runtime.peer.broadcast.broadcastNewPropose(propose)
        } catch (err) {
          this.logger.error(`Broadcast new propose failed: ${System.getErrorMsg(err)}`)
          throw new Error(`Broadcast new propose failed: ${System.getErrorMsg(err)}`)
        }
      })
    }
  }

  _sortTransactions(transactions) {
    return transactions.sort((a, b) => {
      if (a.type !== b.type) {
        if (a.type === 1) {
          return 1
        }
        if (b.type === 1) {
          return -1
        }
        return a.type - b.type
      }

      if (!bignum.isEqualTo(a.amount, b.amount)) {
        if (bignum.isGreaterThan(a.amount, b.amount)) {
          return 1
        } else {
          return -1
        }
      }

      return a.id.localeCompare(b.id)
    })
  }

  /**
   * 解析区块链完整数据（包括区块数据、交易数据和其他扩展交易数据）成JSON对象
   * @param {*} data
   */
  async _parseObjectFromFullBlocksData(data) {
    let blocks = {}
    const order = []
    for (let i = 0; i < data.length; i++) {
      const _block = this.serializeDbData2Block(data[i])
      if (_block) {
        if (!blocks[_block.id]) {
          if (_block.id === this.genesisblock.id) {
            // wxm async ok      genesisblock.block.id
            _block.generationSignature = new Array(65).join('0')
          }

          order.push(_block.id)
          blocks[_block.id] = _block
        }

        const _transaction = await this.runtime.transaction.serializeDbData2Transaction(data[i])
        blocks[_block.id].transactions = blocks[_block.id].transactions || {}
        if (_transaction) {
          // wxm 同步数据时缺少nethash，这里补齐
          _transaction.nethash = this.config.nethash

          if (!blocks[_block.id].transactions[_transaction.id]) {
            blocks[_block.id].transactions[_transaction.id] = _transaction
          }
        }
      }
    }

    blocks = order.map(v => {
      blocks[v].transactions = Object.keys(blocks[v].transactions).map(t => blocks[v].transactions[t])
      return blocks[v]
    })

    return blocks
  }

  async _popLastBlock(oldLastBlock) {
    const { id, height } = oldLastBlock

    return this.balancesSequence.addAsync(async () => {
      try {
        this.logger.info(`Begin to pop block height: ${height}, id: ${id}`)

        // 1. 验证并获取前一个区块
        const previousBlock = await this.runtime.dataquery.queryFullBlockData(
          { id: oldLastBlock.previous_block },
          1,
          0,
          [['height', 'asc']]
        )

        if (!previousBlock || !previousBlock.length) {
          throw new Error('Previous block not found')
        }

        // 2. 规范化区块数据
        const blockNormalize = await this._parseObjectFromFullBlocksData(previousBlock)
        const normalizedPrevBlock = blockNormalize[0]

        // 3. 验证区块连续性
        if (!bignum.isEqualTo(normalizedPrevBlock.height, bignum.minus(height, 1).toString())) {
          throw new Error('Block height discontinuity detected')
        }

        // 4. 处理交易回滚
        const transactions = this._sortTransactions(oldLastBlock.transactions).reverse()

        // 5. 使用事务处理所有数据库操作
        await this.dao.transaction(async dbTrans => {
          try {
            // 回滚交易
            for (const transaction of transactions) {
              this.logger.debug(`Undoing transaction: ${transaction.id}`)

              const sender = await this.runtime.account.getAccountByPublicKey(
                transaction.senderPublicKey,
                dbTrans
              )

              if (!sender) {
                throw new Error(`Transaction sender not found: ${transaction.id}`)
              }

              await this.runtime.transaction.undo(transaction, oldLastBlock, sender, dbTrans)
              await this.runtime.transaction.undoUnconfirmed(transaction, dbTrans)
              await this.runtime.transaction.deleteTransaction({
                trsId: transaction.id,
                dbTrans
              })
            }

            // 回滚轮次数据
            await this.runtime.round.backwardTick(oldLastBlock, normalizedPrevBlock, dbTrans)

            // 删除当前区块
            await this.deleteBlock({ blockId: id, dbTrans })

          } catch (err) {
            this.logger.error('Transaction rollback failed:', err)
            throw err // 触发事务回滚
          }
        })

        // 6. 更新内存状态
        this.setLastBlock(normalizedPrevBlock)

        // 7. 清理缓存
        if (this._blockCache) {
          this._blockCache.remove(id)
        }

        return normalizedPrevBlock // 替换 cb(null, normalizedPrevBlock)
      } catch (err) {
        this.logger.error('Block pop failed:', err)
        throw err // 替换 cb(err)
      }
    })
  }

  async deleteBlock({ blockId, dbTrans }) {
    return await this.dao.remove('block', { where: { id: blockId }, transaction: dbTrans })
  }

  async deleteBlocksBefore({ height }) {
    const blocks = []

    while (bignum.isLessThan(height, this._lastBlock.height)) {
      blocks.unshift(this._lastBlock)
      // try {

      await this._popLastBlock(this._lastBlock)
      // } catch (error) {
      //   this.debug.error(`pop last block fail: ${error}`)
      //   throw new Error(`pop last block fail: ${error}`)
      // }
      // const newLastBlock = await this._popLastBlock(this._lastBlock)
      // this.setLastBlock(newLastBlock)
    }

    return blocks
  }

  async simpleDeleteAfterBlock(blockId) {
    const result = await this.dao.findOne('block', {
      where: {
        id: blockId
      },
      attributes: ['height']
    })
    if (!result || !result.height) {
      return
    }
    return await this.dao.remove('block', {
      where: {
        height: {
          $gte: result.height // todo: ?????? 2020.8.11
        }
      }
    })
  }

  async loadBlocksOffset(limit, offset, verify) {
    this.logger.debug(`loadBlockOffset limit: ${limit}, offset: ${offset}, verify: ${verify}`)

    try {
      const result = await this.dbSequence.addAsync(async () => {
        const where = {
          height: {
            $gte: offset || 0
          }
        }

        const blocksData = await this.runtime.dataquery.queryFullBlockData(where, limit || 1, 0, [
          ['height', 'asc']]
        )

        const blocks = await this._parseObjectFromFullBlocksData(blocksData)
        this.logger.debug('loadBlocksOffset blocks[0].height', blocks[0].height)

        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i]
          this.logger.debug('loadBlocksOffset processing:', block.id)

          block.transactions = this._sortTransactions(block.transactions)
          if (verify) {
            const lastBlock = this.getLastBlock()
            if (lastBlock && lastBlock.id) {
              await this.verifyBlock(block, null)
            }
            await this.applyBlock({ block, votes: null, isBroadcast: false, isSaveBlock: false })
          } else {
            this.setLastBlock(block)
          }
        }

        return this.getLastBlock()
      })

      return result
    } catch (err) {
      this.logger.error('Failed to load blocks offset:', err)
      throw err
    }
  }

  async queryBlockData(where, sorts, offset, limit, returnTotal) {
    const w = where || {}
    const s = sorts || null
    const o = offset || 0
    const l = limit || 100
    if (l > 100) {
      throw new Error('Invalid limit. Maximum is 100')
    }

    const rows = await this.dao.findList('block', {
      limit: 1,
      offset: 0,
      attributes: [[this.dao.db_fnMax('height'), 'maxHeight']]
    })
    if (!rows) {
      throw new Error('Get Block Error.')
    }

    let maxHeight = 2
    if (rows.length > 0) {
      maxHeight = rows[0].maxHeight + 1
    }

    const rows2 = await this.dao.findPage('block', {
      where: w,
      limit: l,
      offset: o,
      attributes: [
        ['id', 'b_id'],
        ['height', 'b_height'],
        ['number_of_transactions', 'b_numberOfTransactions'],
        ['total_amount', 'b_totalAmount'],
        ['total_fee', 'b_totalFee'],
        ['reward', 'b_reward'],
        ['payload_length', 'b_payloadLength'],
        ['generator_public_key', 'b_generatorPublicKey'],
        ['block_signature', 'b_blockSignature'],
        ['version', 'b_version'],
        ['timestamp', 'b_timestamp'],
        ['previous_block', 'b_previousBlock'],
        [this.dao.db_str(maxHeight + '-height'), 'b_confirmations']
      ],
      order: s
    })

    const blocks = []
    for (let i = 0; i < rows2.rows.length; i++) {
      blocks.push(this.serializeDbData2Block(rows2.rows[i]))
    }

    return {
      blocks,
      count: rows2.total
    }
  }

  /**
   * 根据id、height、hash任一属性，查询对应的区块数据，不包括包含的交易列表
   * @param {*} query
   */
  async querySimpleBlockData(query) {
    this.logger.debug('start querySimpleBlockData, query is ', query)
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            minLength: 1
          },
          height: {
            type: 'string',
            minLength: 1
          },
          hash: {
            type: 'string',
            minLength: 1
          }
        }
      },
      query
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    let where = null
    const keys = ['id', 'height', 'hash']
    for (const i in keys) {
      const key = keys[i]
      if (typeof query[key] !== 'undefined' && query[key] !== null) {
        where = {
          [key]: query[key]
        }
        break
      }
    }
    if (!where) {
      throw new Error('Invalid params')
    }

    try {
      const block = await this.dbSequence.addAsync(async () => {
        const row = await this.dao.findOne('block', {
          attributes: [[this.dao.db_fnMax('height'), 'maxHeight']]
        })
        if (!row) {
          throw new Error('Get Block Error.')
        }

        let maxHeight = row.maxHeight + 1

        const row2 = await this.dao.findOne('block', {
          where,
          attributes: [
            ['id', 'b_id'],
            ['height', 'b_height'],
            ['number_of_transactions', 'b_numberOfTransactions'],
            ['total_amount', 'b_totalAmount'],
            ['total_fee', 'b_totalFee'],
            ['reward', 'b_reward'],
            ['payload_length', 'b_payloadLength'],
            ['generator_public_key', 'b_generatorPublicKey'],
            ['block_signature', 'b_blockSignature'],
            ['version', 'b_version'],
            ['timestamp', 'b_timestamp'],
            ['previous_block', 'b_previousBlock'],
            [this.dao.db_str(maxHeight + '-height'), 'b_confirmations']
          ]
        })
        if (!row2) {
          throw new Error('Block not found')
        }

        return this.serializeDbData2Block(row2)
      })

      return block
    } catch (err) {
      this.logger.error('Failed to query simple block data:', err)
      throw err
    }
  }

  sandboxApi(call, args, cb) {
    if (typeof this[call] !== 'function') {
      return cb(`Function not found in module: ${call}`)
    }

    const callArgs = [args, cb]
    return this[call].apply(this, callArgs)
  }

  getHeight(req, cb) {
    const lastBlock = this.runtime.block.getLastBlock()
    return cb(null, lastBlock && lastBlock.height ? lastBlock.height : '0')
  }

  /**
   * 获取共同区块
   * @param {Object} block 区块数据
   * @returns {Promise<Object>} 共同区块
   */
  async getCommonBlock(block) {
    try {
      const minHeight = Math.max(1, block.height - 5)
      const maxHeight = block.height
      const blocks = await this.getBlocks(minHeight, maxHeight)

      for (const b of blocks) {
        if (b.id === block.previous_block) {
          return b
        }
      }
      throw new Error(`Common block not found for block ${block.id} at height ${block.height}`)
    } catch (err) {
      this.logger.error('Failed to get common block:', err)
      throw err
    }
  }

  /**
   * 回滚到指定区块
   * @param {number} height 目标高度
   */
  async rollbackToBlock(height) {
    try {
      const currentBlock = this.getLastBlock()
      if (currentBlock.height <= height) {
        return
      }

      this.logger.warn(`Rolling back to block at height ${height} from ${currentBlock.height}`)

      await this.dao.transaction(async dbTrans => {
        try {
          // 回滚区块数据
          await this.simpleDeleteAfterBlock(height)

          // 获取目标区块
          const targetBlock = await this.dao.findOne('block', {
            where: { height },
            order: [['height', 'DESC']]
          })

          if (!targetBlock) {
            this.logger.error(`Target block at height ${height} not found`)
            return
          }

          // 设置为最新区块
          this.setLastBlock(targetBlock)

          // 清理缓存
          this._blockCache.clear()
          this._proposeCache = {}

          this.logger.info(`Successfully rolled back to block at height ${height}`)
        } catch (err) {
          this.logger.error('Failed during rollback transaction:', err)
          // 不抛出错误，让事务自动回滚
          return
        }
      })
    } catch (err) {
      this.logger.error('Failed to rollback:', err)
      // 记录错误但不中断程序
      this.runtime.transitionTo('Rollback')
      // 可以触发一个回滚失败的事件，让其他模块知道
      this.runtime.bus && this.runtime.bus.message('rollbackFailed', {
        height,
        error: err.message
      })
    }
  }

  /**
   * 处理分叉
   * @param {Object} block 区块数据
   * @param {number} type 分叉类型
   */
  async handleFork(block, type) {
    this.logger.warn({
      fork: {
        type,
        height: block.height,
        id: block.id,
        previousBlock: block.previous_block,
        timestamp: block.timestamp
      },
      currentBlock: {
        height: this._lastBlock.height,
        id: this._lastBlock.id,
        previousBlock: this._lastBlock.previous_block,
        timestamp: this._lastBlock.timestamp
      }
    }, 'Fork detected')

    try {
      // 通知委托人处理分叉
      await this.runtime.delegate.fork(block, type)

      // 获取共同区块
      const commonBlock = await this.getCommonBlock(block)
      if (!commonBlock) {
        this.logger.error('Failed to find common block, will retry sync later')
        return
      }

      // 回滚到共同区块
      await this.rollbackToBlock(commonBlock.height)

      // 清理缓存
      this._blockCache.clear()
      this._proposeCache = {}

      // 启动同步
      await this.startSync(commonBlock.height)

    } catch (err) {
      this.logger.error('Fork handling failed:', err)
      // 记录错误但不中断程序
      this.runtime.stateMachine.transitionTo('Fork');
      // 可以触发一个分叉处理失败的事件
      this.runtime.bus && this.runtime.bus.message('forkHandlingFailed', {
        block,
        type,
        error: err.message
      })

      // 设置一个定时器，稍后重试
      setTimeout(() => {
        this.startSync(this._lastBlock.height)
          .catch(e => this.logger.error('Retry sync failed:', e))
      }, 10000) // 10秒后重试
    }
  }

  /**
   * 启动同步
   * @param {number} fromHeight 起始高度
   */
  async startSync(fromHeight) {
    if (this._isSyncing) {
      this.logger.debug('Already syncing blocks')
      return
    }

    try {
      this._isSyncing = true
      this.logger.info(`Start syncing blocks from height ${fromHeight}`)

      // 获取可用节点
      const peers = await this.runtime.peer.getPeers()
      if (!peers || peers.length === 0) {
        throw new Error('No peers available for sync')
      }

      // 从其他节点同步区块
      for (const peer of peers) {
        try {
          await this.runtime.peer.syncBlocksFromPeer(peer, fromHeight)
          break
        } catch (err) {
          this.logger.warn(`Failed to sync blocks from peer ${peer.ip}:${peer.port}:`, err)
          continue
        }
      }
    } catch (err) {
      this.logger.error('Failed to start sync:', err)
      throw err
    } finally {
      this._isSyncing = false
    }
  }
}

export default Block
