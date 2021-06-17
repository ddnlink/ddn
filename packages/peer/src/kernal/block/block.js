/**
 * 区块数据核心处理逻辑和方法
 * wangxm   2018-12-27
 */
import os from 'os'
import ip from 'ip'
import assert from 'assert'

// import ByteBuffer from 'bytebuffer'
import * as DdnCrypto from '@ddn/crypto'
// import { nacl } from '@ddn/crypto'
import { runtimeState, bignum } from '@ddn/utils'
import { System } from '../../utils/system'
import BlockStatus from './block-status'

let _singleton

class Block {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new Block(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context

    this._lastBlock = null
    this._blockCache = {}

    this._lastVoteTime = null

    this._lastPropose = null
    this._proposeCache = {}

    this._blockStatus = new BlockStatus(context)
  }

  async getCount (where) {
    return await this.dao.count('block', { where })
  }

  async calculateFee () {
    return bignum.multiply(this.constants.net.fees.transfer, this.constants.fixedPoint).toString()
  }

  getBlockStatus () {
    return this._blockStatus
  }

  setLastBlock (block) {
    this._lastBlock = block
  }

  getLastBlock () {
    return this._lastBlock
  }

  getBytes (block) {
    return DdnCrypto.getBytes(block, true, true)
  }

  getHash (block) {
    const newBlock = { ...block }
    if (newBlock.transactions) {
      delete newBlock.transactions
    }
    // fixme: 2020.8.8 该方法返回 buffer, 还是使用原始 的nacl把
    return DdnCrypto.createHash(this.getBytes(block))
    // return nacl.hash(this.getBytes(block))
  }

  async sign (block, { privateKey }) {
    const newBlock = { ...block }
    if (newBlock.transactions) {
      delete newBlock.transactions
    }
    return await DdnCrypto.sign(newBlock, { privateKey })
  }

  async getId (block) {
    const newBlock = { ...block }
    if (newBlock.transactions) {
      delete newBlock.transactions
    }
    return await DdnCrypto.getId(block)
  }

  async objectNormalize (block) {
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
      throw Error(e.toString())
    }

    return block
  }

  /**
   * 处理创世区块
   */
  async handleGenesisBlock () {
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
  async serializeBlock2Db (block, dbTrans) {
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
      this.logger.error(`insert block fail: ${err.toString()}`)
      throw new Error(`insert block fail: ${err.toString()}`)
    }
  }

  /**
   * 将数据对象序列化成区块JSON对象 dbRead
   * @param {*} data
   */
  serializeDbData2Block (raw) {
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
      block.totalForged = bignum.plus(block.total_fee, block.reward).toString()

      return block
    }
  }

  /**
   * 保存区块数据到数据库（包括区块数据记录和所有包含的交易数据记录）
   * @param {*} block
   * @param {*} dbTrans
   */
  async saveBlock (block, dbTrans) {
    this.logger.debug('saveBlock start!')
    try {
      await this.serializeBlock2Db(block, dbTrans)
    } catch (err) {
      this.logger.error(`serializeBlock2Db fail ${err}`)
      throw new Error(`serializeBlock2Db fail ${JSON.stringify(err)}`)
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

  async createBlock (data) {
    const transactions = this._sortTransactions(data.transactions)

    this.logger.debug('Height is being created!!')
    const nextHeight = data.previous_block ? bignum.plus(data.previous_block.height, 1).toString() : '1' // bignum update //wxm block database
    this.logger.debug(`Height is being created, nextHeight: ${nextHeight}`)
    const reward = this._blockStatus.calcReward(nextHeight)

    let totalFee = bignum.new(0)
    let totalAmount = bignum.new(0)
    let size = 0

    const blockTransactions = []
    let payloadBytes = ''

    for (const transaction of transactions) {
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
      total_amount: totalAmount.toString(), // Bignum update
      total_fee: totalFee.toString(), // Bignum update
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
      throw new Error(e.toString())
    }

    return block
  }

  /**
   * 接收到其他节点铸造的区块数据，进行确认处理
   * @param {*} block
   * @param {*} votes
   */
  async receiveNewBlock (block, votes) {
    if (this.runtime.state !== runtimeState.Ready || !this.runtime.loaded) {
      this.logger.debug(
        `prepare is not ready ,state: ${this.runtime.state}, Ready: ${runtimeState.Ready}, loaded: ${this.runtime.loaded}`
      )
      return
    }

    if (this._blockCache[block.id]) {
      this.logger.debug(`blockCache include block: ${block.id}`)
      return
    }
    this._blockCache[block.id] = true

    await new Promise((resolve, reject) => {
      this.sequence.add(
        async cb => {
          if (
            block.previous_block === this._lastBlock.id &&
            bignum.isEqualTo(bignum.plus(this._lastBlock.height, 1), block.height)
          ) {
            // wxm block database
            this.logger.info(
              `Received new block id: ${block.id} height: ${block.height} round: ${await this.runtime.round.getRound(
                this.getLastBlock().height
              )} slot: ${this.runtime.slot.getSlotNumber(block.timestamp)} reward: ${this.getLastBlock().reward}`
            )
            try {
              await this.processBlock(block, votes, true, true, true)
            } catch (err) {
              this.logger.error(`Received new block err: ${err}`)
            }
            cb()
          } else if (
            block.previous_block !== this._lastBlock.id &&
            bignum.isEqualTo(bignum.plus(this._lastBlock.height, 1), block.height)
          ) {
            // wxm block database
            // } else if (block.previous_block !== this._lastBlock.id && this._lastBlock.height + 1 === block.height) { // wxm block database
            // Fork: Same height but different previous block id
            await this.runtime.delegate.fork(block, 1)

            cb('Fork-1')
          } else if (
            block.previous_block === this._lastBlock.previous_block &&
            bignum.isEqualTo(block.height, this._lastBlock.height) &&
            block.id !== this._lastBlock.id
          ) {
            // wxm block database
            // } else if (block.previous_block === this._lastBlock.previous_block && block.height === this._lastBlock.height && block.id !== this._lastBlock.id) { // wxm block database
            // Fork: Same height and previous block id, but different block id
            this.logger.error(`fork 2 block: ${block}, lastBlock: ${this._lastBlock}`)
            await this.runtime.delegate.fork(block, 2)
            cb('Fork-2')
          } else if (bignum.isGreaterThan(block.height, bignum.plus(this._lastBlock.height, 1))) {
            this.logger.info(`receive discontinuous block height ${block.height}`)

            cb()
          } else {
            cb()
          }
        },
        err => {
          if (err) {
            return reject(err)
          }

          resolve()
        }
      )
    })
  }

  async receiveVotes (votes) {
    this.logger.debug('Receive votes start')
    if (this.runtime.state !== runtimeState.Ready) {
      return
    }

    this.sequence.add(async cb => {
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

      cb()
    })
  }

  /**
   * 接收其他节点铸造区块的授权申请提议，进行授权操作
   * @param {*} propose
   */
  async receiveNewPropose (propose) {
    this.logger.debug('receiveNewPropose start.')
    if (this.runtime.state !== runtimeState.Ready) {
      this.logger.debug(
        `receive new propose ,prepare is not ready ,state: ${this.runtime.state}, Ready: ${runtimeState.Ready}`
      )
      return
    }

    if (this._proposeCache[propose.hash]) {
      this.logger.debug(`propose cache include propose hash: ${propose.hash}, propeseCache: ${this._proposeCache}`)
      return
    }
    this._proposeCache[propose.hash] = true

    await new Promise((resolve, reject) => {
      this.sequence.add(
        async cb => {
          if (
            this._lastPropose &&
            bignum.isEqualTo(this._lastPropose.height, propose.height) &&
            this._lastPropose.generator_public_key === propose.generator_public_key &&
            this._lastPropose.id !== propose.id
          ) {
            this.logger.warn(
              `generate different block with the same height, generator: ${propose.generator_public_key}`
            )
            return cb()
          }

          if (!bignum.isEqualTo(propose.height, bignum.plus(this._lastBlock.height, 1))) {
            this.logger.debug('invalid propose height', propose)
            if (bignum.isGreaterThan(propose.height, bignum.plus(this._lastBlock.height, 1))) {
              this.logger.info(`receive discontinuous propose height ${propose.height}`)
            }
            return cb()
          }

          if (this._lastVoteTime && Date.now() - this._lastVoteTime < (this.constants.interval * 1000) / 2) {
            this.logger.debug('ignore the frequently propose')
            return cb()
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

              const replyData = {
                api: '/votes',
                method: 'POST',
                data: votes,
                peer: {
                  id: 1,
                  version: this.config.version,
                  os: os.platform() + os.release(),
                  clock: null
                }
              }

              const from = propose.address
              const pos = from.indexOf(':')
              if (pos >= 0) {
                const fromIp = from.substring(0, pos)
                const fromPort = from.substring(pos + 1)
                replyData.peer.ip = ip.toLong(fromIp)
                replyData.peer.port = parseInt(fromPort)
              } else {
                replyData.peer.ip = ip.toLong(from)
                replyData.peer.port = 80
              }

              // 向提议请求节点回复本机授权
              let res
              setImmediate(async () => {
                try {
                  res = await this.runtime.peer.request(replyData)
                  if (res.body.success === false) {
                    this.logger.debug(`Replay propose request fail ${JSON.stringify(res.body.message)}.`)
                  }
                } catch (err) {
                  if (err) {
                    this.logger.error(`Replay propose request failed: ${System.getErrorMsg(err)}`)
                  }
                }
              })

              this._lastVoteTime = Date.now()
              this._lastPropose = propose
            }
          } catch (err) {
            this.logger.error(`Receive propose fail, ${err}`)
            cb(err)
          }

          cb()
        },
        err => {
          if (err) {
            reject(err)
          }
          this.logger.debug('receivePropose finished')
          resolve()
        }
      )
    })
  }

  /**
   * 应用区块数据，执行交易逻辑，并保存区块和交易数据到数据库中
   * @param {*} block 区块数据
   * @param {*} votes 投票数据
   * @param {*} isBroadcast 是否广播
   * @param {*} isSaveBlock 是否保存到数据库
   */
  async applyBlock ({ block, votes, isBroadcast, isSaveBlock }) {
    const applyedTrsIdSet = new Set()

    const doApplyBlock = async () => {
      this.logger.debug('doApplyBlock is starting')

      const sortedTrs = this._sortTransactions(block.transactions)

      try {
        const result = await this.dao.transaction(async dbTrans => {
          for (let i = 0; i < sortedTrs.length; i++) {
            const transaction = sortedTrs[i]
            const updatedAccountInfo = await this.runtime.account.setAccount(
              {
                publicKey: transaction.senderPublicKey,
                isGenesis: bignum.isEqualTo(block.height, 1)
              },
              dbTrans
            )
            // 吴连有 todo 最好加事物，报uuid的错误是存储数据时取的dbTrans不对
            const accountInfo = await this.runtime.account.getAccountByAddress(updatedAccountInfo.address, dbTrans)
            const newAccountInfo = Object.assign({}, accountInfo, updatedAccountInfo)

            try {
              await this.runtime.transaction.applyUnconfirmed(transaction, newAccountInfo, dbTrans)
              await this.runtime.transaction.apply(transaction, block, newAccountInfo, dbTrans)
            } catch (err) {
              this.logger.error(`Apply unconfirmed ${err.toString()}`)
              throw new Error(`Apply unconfirmed ${err.toString()}`)
            } finally {
              await this.runtime.transaction.removeUnconfirmedTransaction(transaction.id)
            }

            applyedTrsIdSet.add(transaction.id)
          }

          this.logger.debug('apply block ok')

          if (isSaveBlock) {
            try {
              await this.saveBlock(block, dbTrans)
            } catch (err) {
              this.logger.error(`Save block fail ${err}`)
              throw new Error(`Save block fail ${err}`)
            }
          }
          try {
            await this.runtime.round.tick(block, dbTrans)
          } catch (error) {
            this.logger.error(`tick error dbTrans rollback error: ${JSON.stringify(error)}`)
            throw new Error(error)
          }
          this.logger.debug('save block ok')
        })

        this.runtime.dvm.commit(block.height)
        // found errors but rollback success
        if (result) {
          const lastHeight = await this.runtime.dvm.getLastHeight()
          if (lastHeight >= 0) {
            await this.runtime.dvm.rollback(this._lastBlock.height)
          }
          throw new Error(result)
        }

        this.logger.debug('The dao.transaction is finished.')
        this.setLastBlock(block)

        this._blockCache = {}
        this._proposeCache = {}
        this._lastVoteTime = null

        this.oneoff.clear()
        this.balanceCache.commit()
        this.runtime.consensus.clearState()

        if (isBroadcast) {
          this.logger.info(`Block applied correctly with ${block.transactions.length} transactions`)
          votes.signatures = votes.signatures.slice(0, 6)

          setImmediate(async () => {
            try {
              await this.runtime.peer.broadcast.broadcastNewBlock(block, votes)
              await this.runtime.transaction.execAssetFunc('onNewBlock', block, votes)
            } catch (err) {
              this.logger.error(`Broadcast new block failed: ${System.getErrorMsg(err)}`)
              // TODO: 2020.8.30 检查该处是否抛出错误
              // throw new Error(`Broadcast new block failed: ${System.getErrorMsg(err)}`)
            }
          })
        }
      } catch (err) {
        // 出错且回滚失败
        applyedTrsIdSet.clear() // wxm TODO 清除上面未处理的交易记录
        this.balanceCache.rollback()

        this.logger.error(`Rollback or commit error, apply block fail: ${err}`)
        process.exit(1)
      }
    }
    const self = this
    return new Promise((resolve, reject) => {
      this.balancesSequence.add(
        async cb => {
          const unconfirmedTrs = await this.runtime.transaction.getUnconfirmedTransactionList(true)
          try {
            await this.runtime.transaction.undoUnconfirmedList()
          } catch (err) {
            self.logger.error('Failed to undo uncomfirmed transactions', err)
            return process.exit(0)
          }

          self.oneoff.clear()

          try {
            await doApplyBlock()
          } catch (err) {
            self.logger.error(`Failed to apply block 1: ${err}`)
          }

          const redoTrs = unconfirmedTrs.filter(item => !applyedTrsIdSet.has(item.id))
          try {
            await self.runtime.transaction.receiveTransactions(redoTrs)
          } catch (err) {
            self.logger.error('Failed to redo unconfirmed transactions', err)
          }
          cb()
        },
        err => {
          if (err) {
            reject(err)
          } else {
            resolve(true)
          }
        }
      )
    })
  }

  verifySignature (block) {
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
  async verifyBlock (block, votes) {
    // TODO creazy 创建块时为什么id和height不再在createBlock中产生
    // try {
    //   block.id = await this.getId(block)
    // } catch (e) {
    //   throw new Error(`Failed to get block id: ${e.toString()}`)
    // }
    block.height = bignum.plus(this._lastBlock.height, 1).toString()

    if (typeof this._lastBlock.height === 'undefined') {
      this.logger.debug(`verifyBlock, block: ${JSON.stringify(block)}, pre-block: ${JSON.stringify(this._lastBlock)}`)
    }
    this.logger.debug(`verifyBlock, id: ${block.id}, pre-h: ${this._lastBlock.height}, h: ${block.height}`)

    if (!block.previous_block && !bignum.isEqualTo(block.height, 1)) {
      // wxm block database
      throw new Error('Previous block should not be null')
    }

    const expectedReward = this._blockStatus.calcReward(block.height)

    // if (block.height !== 1 && !bignum.isEqualTo(expectedReward, block.reward)) {
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

  async verifyBlockVotes ({ height }, { height: votesHeight, id, signatures }) {
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
  async processBlock (block, votes, broadcast, save, verifyTrs) {
    if (!this.runtime.loaded) {
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
  async generateBlock (keypair, timestamp) {
    if (this.runtime.consensus.hasPendingBlock(timestamp)) {
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
        previous_block: this._lastBlock, // wxm block database
        transactions: ready
      })
    } catch (e) {
      // this.logger.error('create block model ', e)
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

      const serverAddr = `${this.config.publicIp}:${this.config.port}`

      let propose
      try {
        propose = await this.runtime.consensus.createPropose(keypair, block, serverAddr)
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

  _sortTransactions (transactions) {
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
  async _parseObjectFromFullBlocksData (data) {
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

  async _popLastBlock (oldLastBlock) {
    const { id, height } = oldLastBlock
    return new Promise((resolve, reject) => {
      let previousBlock
      this.balancesSequence.add(
        async cb => {
          this.logger.info(`begin to pop block ${height} ${id}`)

          previousBlock = await this.runtime.dataquery.queryFullBlockData(
            {
              id: oldLastBlock.previous_block
            },
            1,
            0,
            [['height', 'asc']]
          )
          if (!previousBlock || !previousBlock.length) {
            return cb('popLastBlock err: previousBlock is null')
          }

          const blockNormalize = await this._parseObjectFromFullBlocksData(previousBlock)
          previousBlock = blockNormalize[0]

          let transactions = this._sortTransactions(oldLastBlock.transactions)
          transactions = transactions.reverse()
          try {
            await this.dao.transaction(async dbTrans => {
              for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i]

                this.logger.info('undo transacton: ', transaction.id)
                const sender = await this.runtime.account.getAccountByPublicKey(transaction.senderPublicKey, dbTrans)
                await this.runtime.transaction.undo(transaction, oldLastBlock, sender, dbTrans)
                await this.runtime.transaction.undoUnconfirmed(transaction, dbTrans)
                // wulianyou
                await this.runtime.transaction.deleteTransaction({ trsId: transaction.id, dbTrans })
              }

              await this.runtime.round.backwardTick(oldLastBlock, previousBlock, dbTrans)
              await this.deleteBlock({ blockId: id, dbTrans })
            })
            cb(null, previousBlock)
          } catch (err) {
            cb('popLastBlock err: ' + err)
          }
        },
        (err, result) => {
          if (err) {
            if (!result) {
              this.logger.error('_popLastBlock`s dao.transaction is fail.', err)
              // throw new Error(err2)
            }
            reject(err)
          } else {
            this.setLastBlock(previousBlock)
            resolve(previousBlock)
          }
        }
      )
    })
  }

  async deleteBlock ({ blockId, dbTrans }) {
    return await this.dao.remove('block', { where: { id: blockId }, transaction: dbTrans })
  }

  async deleteBlocksBefore ({ height }) {
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

  async simpleDeleteAfterBlock (blockId) {
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

  async loadBlocksOffset (limit, offset, verify) {
    this.logger.debug(`loadBlockOffset limit: ${limit}, offset: ${offset}, verify: ${verify}`)

    return new Promise((resolve, reject) => {
      this.dbSequence.add(
        async cb => {
          const where = {
            height: {
              $gte: offset || 0
            }
          }

          try {
            const blocksData = await this.runtime.dataquery.queryFullBlockData(where, limit || 1, 0, [
              ['height', 'asc']
            ])

            const blocks = await this._parseObjectFromFullBlocksData(blocksData)
            this.logger.debug('loadBlocksOffset blocks[0].height', blocks[0].height) // height is bignum 2020.8

            for (let i = 0; i < blocks.length; i++) {
              const block = blocks[i]
              this.logger.debug('loadBlocksOffset processing:', block.id)

              block.transactions = this._sortTransactions(block.transactions)
              if (verify) {
                const lastBlock = this.getLastBlock()
                if (lastBlock && lastBlock.id) {
                  try {
                    if (
                      block.id !==
                      'd7d9935a6ddb6c1528f577a9ac5040708b9e6bb847df09ca1736012e5757b17d798e71dc7ea87281d8359dab7577adfe348c103e7542b4452ef26a9831c0e78f'
                    ) {
                      await this.verifyBlock(block, null)
                    }
                  } catch (error) {
                    // this.logger.error(`verifyBlock not passed ${error}`)
                    throw new Error(`verifyBlock not passed ${error}`)
                  }
                }
                // fixme: 获取到块之后，isSaveBlock 应该是 true
                await this.applyBlock({ block, votes: null, isBroadcast: false, isSaveBlock: false })
              } else {
                this.setLastBlock(block)
              }
            }

            cb()
          } catch (e) {
            cb(e)
          }
        },
        err => {
          if (err) {
            this.logger.error('loadBlocksOffset:', err)
            reject(err)
          } else {
            resolve(this.getLastBlock())
          }
        }
      )
    })
  }

  async queryBlockData (where, sorts, offset, limit, returnTotal) {
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
  async querySimpleBlockData (query) {
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

    return new Promise((resolve, reject) => {
      this.dbSequence.add(
        async cb => {
          try {
            const row = await this.dao.findOne('block', {
              attributes: [[this.dao.db_fnMax('height'), 'maxHeight']]
            })
            if (!row) {
              return cb('Get Block Error.')
            }
            let maxHeight = 2
            maxHeight = row.maxHeight + 1 // height - bignum ?

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
              return cb('querySimpleBlockData Block not found')
            }
            const block = this.serializeDbData2Block(row2)
            cb(null, block)
          } catch (err) {
            return cb(err)
          }
        },
        (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        }
      )
    })
  }

  sandboxApi (call, args, cb) {
    // sandboxHelper.callMethod(shared, call, args, cb)
    if (typeof this[call] !== 'function') {
      return cb(`Function not found in module: ${call}`)
    }

    const callArgs = [args, cb]
    return this[call].apply(this, callArgs)
  }

  getHeight (req, cb) {
    const lastBlock = this.runtime.block.getLastBlock()
    return cb(null, lastBlock && lastBlock.height ? lastBlock.height : '0')
  }
}

export default Block
