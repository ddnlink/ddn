import assert from 'assert'
import { bignum } from '@ddn/utils'
import * as crypto from '@ddn/crypto'

// 常量定义
const DDN_CURRENCY = 'DDN'
const MAX_CODE_SIZE_K = 64
const MAX_ARGS_SIZE_K = 16

let _singleton
export class Energy {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new Energy(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  // 验证合约名称是否有效
  ensureContractNameValid (name) {
    assert(name && name.length >= 3 && name.length <= 32, 'Invalid contract name, length should be between 3 and 32')
    assert(name.match(/^[a-zA-Z]([-_a-zA-Z0-9]{3,32})+$/), 'Invalid contract name, please use letter, number or underscore')
  }

  // 创建上下文对象，用于合约执行
  async makeContext (senderAddress, transaction, account, block) {
    const sender = account || { address: senderAddress }
    const { address, username, publicKey, second_public_key, balance } = sender
    const senderInfo = {
      username,
      address,
      publicKey,
      second_public_key,
      balance
    }

    const last = this.runtime.block.getLastBlock()
    const lastBlock = {
      id: last.id,
      height: last.height,
      payloadHash: last.payload_hash,
      prevBlockId: last.previous_block,
      miner: last.generator_public_key,
      timestamp: last.timestamp
    }
    const currentBlock = block ? {
      id: block.id,
      height: block.height,
      payloadHash: block.payload_hash,
      prevBlockId: block.previous_block,
      miner: block.generator_public_key,
      timestamp: block.timestamp
    } : null

    return { senderId: senderAddress, tx: transaction, block: currentBlock, lastBlock, sender: senderInfo }
  }

  // 创建合约账户
  async createContractAccount (transId, ownerAddress) {
    const id = await crypto.generateContractAddress(`${transId}_${ownerAddress}`, this.constants.contractPrefix)
    await this.runtime.account.setAccount({ address: id })
    return id
  }

  ensureGasLimitValid (gasLimit, trs) {
    const basicGas = this.runtime.dvm.calcTransactionStorageGas(trs)
    assert(
      gasLimit > basicGas && gasLimit <= this.constants.maxGasLimit,
      `gas limit must greater than ${basicGas} and less than ${this.constants.maxGasLimit}`
    )
  }

  gasToDDN (gas) {
    const energy = gas * this.constants.gasPrice
    return parseInt(energy * (this.constants.fixedPoint / this.constants.energyPerDDN), 10)
  }

  /**
   * 检查账户是否有足够的能量覆盖gas消耗
   * @param {number} gasLimit - gas限制
   * @param {string} address - 账户地址
   * @param {number} blockHeight - 区块高度
   * @returns {Promise<boolean>} - 是否有足够能量
   */
  async isEnergyCovered (gasLimit, address, blockHeight) {
    try {
      // 简化实现：检查账户是否存在
      const account = await this.runtime.account.getAccountByAddress(address)
      if (!account) {
        this.logger.debug(`Account ${address} not found, energy not covered`)
        return false
      }

      // 简化实现：检查账户是否有能量记录
      const energyRecord = await this.dao.findOne('energy', {
        where: { address },
        transaction: null
      })

      if (!energyRecord) {
        this.logger.debug(`No energy record for account ${address}, energy not covered`)
        return false
      }

      // 计算所需能量
      const requiredEnergy = await this.getEnergyByGas(gasLimit)

      // 检查能量是否足够
      const hasEnough = energyRecord.amount >= requiredEnergy
      this.logger.debug(`Account ${address} energy check: required=${requiredEnergy}, available=${energyRecord.amount}, covered=${hasEnough}`)

      return hasEnough
    } catch (err) {
      this.logger.error(`Error checking energy coverage for ${address}: ${err.message}`, err)
      return false
    }
  }

  /**
   * 根据gas计算所需能量
   * @param {number} gas - gas数量
   * @returns {Promise<number>} - 所需能量
   */
  async getEnergyByGas (gas) {
    // 简化实现：直接返回gas * 能量价格因子
    const energyPriceFactor = this.constants.energyPriceFactor || 1
    return gas * energyPriceFactor
  }

  /**
   * 消耗账户能量
   * @param {number} amount - 能量数量
   * @param {string} address - 账户地址
   * @param {number} blockHeight - 区块高度
   * @param {string} tid - 交易ID
   * @param {object} dbTrans - 数据库事务
   * @returns {Promise<void>}
   */
  async consumeEnergy (amount, address, blockHeight, tid, dbTrans) {
    try {
      // 检查是否已经消耗过能量（这个检查在burningGas中已经做过，这里是双重保险）
      const existingRecord = await this.dao.findOne('energy_burning', {
        where: { tid },
        transaction: dbTrans
      })

      if (existingRecord) {
        this.logger.debug(`Energy already consumed for transaction '${tid}', skipping`)
        return
      }

      // 获取账户能量记录
      let energyRecord = await this.dao.findOne('energy', {
        where: { address },
        transaction: dbTrans
      })

      const timestamp = Math.floor(Date.now() / 1000);

      // 如果账户没有能量记录，创建一个新记录
      if (!energyRecord) {
        // 由于我们还没有实现质押逻辑，这里简化处理，为账户创建一个初始能量记录
        // 在实际实现中，应该根据质押规则计算能量
        const initialEnergy = amount * 2; // 给予足够的初始能量以完成当前交易

        await this.dao.insert('energy', {
          address,
          amount: initialEnergy,
          lastUpdateHeight: blockHeight,
          createTime: timestamp,
          updateTime: timestamp
        }, { transaction: dbTrans });

        energyRecord = {
          address,
          amount: initialEnergy
        };

        this.logger.debug(`Created initial energy record for account ${address} with amount ${initialEnergy}`);
      }

      // 检查能量是否足够
      if (energyRecord.amount < amount) {
        throw new Error(`Insufficient energy: required=${amount}, available=${energyRecord.amount}`)
      }

      // 更新能量记录
      await this.dao.update('energy',
        {
          amount: energyRecord.amount - amount,
          lastUpdateHeight: blockHeight,
          updateTime: timestamp
        },
        { where: { address }, transaction: dbTrans }
      )

      this.logger.debug(`Consumed ${amount} energy from account ${address} for transaction ${tid}`)
    } catch (err) {
      this.logger.error(`Failed to consume energy: ${err.message}`, err)
      throw err
    }
  }

  async checkGas (preferredEnergyAddress, address, gasLimit, useDDN = true) {
    const blockHeight = this.runtime.block.getLastBlock().height + 1

    // 首先检查优先能量地址是否有足够能量
    if (preferredEnergyAddress) {
      try {
        const energyEnough = await this.isEnergyCovered(gasLimit, preferredEnergyAddress, blockHeight)
        if (energyEnough) {
          return { enough: true, energy: true, payer: preferredEnergyAddress }
        }
      } catch (err) {
        this.logger.error(`Failed to check energy for preferred address ${preferredEnergyAddress}: ${err.message}`)
      }
    }

    // 然后检查发送者地址是否有足够能量
    try {
      const energyEnough = await this.isEnergyCovered(gasLimit, address, blockHeight)
      if (energyEnough) {
        return { enough: true, energy: true, payer: address }
      }
    } catch (err) {
      this.logger.error(`Failed to check energy for sender address ${address}: ${err.message}`)
    }

    // 如果不使用DDN支付，则返回不足
    if (!useDDN) return { enough: false }

    // 最后检查DDN余额
    const senderAccount = await this.runtime.account.getAccountByAddress(address)
    if (!senderAccount || !senderAccount.balance) return { enough: false }

    const ddn = this.gasToDDN(gasLimit)
    const enough = ddn <= senderAccount.balance
    return { enough, energy: false, ddn, payer: address }
  }

  async burningGas (gas, useEnergy, payer, block, tid, dbTrans) {
    if (gas <= 0) return null;

    const blockHeight = block ? block.height : this.runtime.block.getLastBlock().height + 1;
    const timestamp = Math.floor(Date.now() / 1000);

    // 检查是否已经消耗过gas
    const existingRecord = await this.dao.findOne('energy_burning', {
      where: { tid },
      transaction: dbTrans
    });

    if (existingRecord) {
      this.logger.debug(`Gas already consumed for transaction '${tid}', skipping`);
      return null;
    }

    try {
      if (useEnergy) {
        // 使用能量支付
        const energyAmount = await this.getEnergyByGas(gas);

        // 记录能量消耗到energy_burning表
        await this.dao.insert(
          'energy_burning',
          {
            tid,
            height: blockHeight,
            amount: energyAmount,
            ddn: 0, // 使用能量支付时DDN消耗为0
            address: payer,
            timestamp
          },
          {
            transaction: dbTrans
          }
        );

        // 消耗能量
        await this.consumeEnergy(energyAmount, payer, blockHeight, tid, dbTrans);
        this.logger.debug(`consume ${payer} ${energyAmount} energy for transaction '${tid}'`);
      } else {
        // 使用DDN支付
        const payAmount = this.gasToDDN(gas);
        this.logger.debug(`consume ${payer} ${payAmount} DDN for transaction '${tid}'`);

        const account = await this.runtime.account.getAccountByAddress(payer);
        if (!account) throw new Error('Account is not found');
        if (payAmount > account.balance) throw new Error('Insufficient balance');

        await this.runtime.account.merge(
          payer,
          {
            balance: bignum.minus(0, payAmount),
            block_id: block.id,
            round: await this.runtime.round.getRound(blockHeight)
          },
          dbTrans
        );

        // 记录DDN消耗到energy_burning表
        await this.dao.insert(
          'energy_burning',
          {
            tid,
            height: blockHeight,
            amount: 0, // 能量消耗为0
            ddn: payAmount, // 记录DDN消耗
            address: payer,
            timestamp
          },
          {
            transaction: dbTrans
          }
        );
      }
    } catch (err) {
      // 如果是唯一约束错误，说明记录已存在，可以忽略
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        this.logger.debug(`Energy burning record for transaction '${tid}' already exists`);
      } else {
        this.logger.error(`Failed to burn gas for transaction '${tid}': ${err.message}`, err);
        throw err;
      }
    }

    return null;
  }

  /**
   * 处理合约元数据
   * @private
   * @param {string} contractId 合约ID
   * @param {object} result 合约执行结果
   * @param {object} trs 交易对象
   * @param {string} code 合约代码（可选）
   * @returns {Promise<string>} 处理后的元数据
   */
  async _processMetadata(contractId, result, trs, code) {
    let metadata = null

    // 1. 首先尝试从result.data获取元数据
    if (result && result.data) {
      try {
        metadata = typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        this.logger.debug(`Using metadata from result.data for contract ${contractId}`)
      } catch (err) {
        this.logger.error(`Failed to stringify metadata from result.data for contract ${contractId}:`, err)
      }
    }

    // 2. 如果result.data中没有元数据，尝试从交易资产中获取
    if (!metadata && trs.asset && trs.asset.contract && trs.asset.contract.metadata) {
      try {
        metadata = trs.asset.contract.metadata
        this.logger.debug(`Using metadata from transaction asset for contract ${contractId}`)
      } catch (err) {
        this.logger.error(`Failed to get metadata from transaction asset for contract ${contractId}:`, err)
      }
    }

    // 3. 如果还是没有元数据，尝试重新编译合约代码生成
    const contractCode = code || (trs.asset && trs.asset.contract && trs.asset.contract.code)
    if (!metadata && contractCode) {
      try {
        const compileResult = await this.runtime.compiler.compile(contractCode)
        if (compileResult && compileResult.metadata) {
          metadata = JSON.stringify(compileResult.metadata.toJSONObject())
          this.logger.debug(`Generated metadata by recompiling code for contract ${contractId}`)
        }
      } catch (err) {
        this.logger.error(`Failed to generate metadata by recompiling for contract ${contractId}:`, err)
      }
    }

    // 确保metadata不为null
    if (!metadata) {
      this.logger.warn(`No metadata available for contract ${contractId}, using empty object`)
      metadata = '{}'
    }

    return metadata
  }

  async handleResult (contractId, contractAddr, result, trs, blockHeight, useEnergy, payer, dbTrans) {
    // 处理result为undefined或非对象的情况
    if (!result || typeof result !== 'object') {
      this.logger.error(`Contract execution result is ${result === undefined ? 'undefined' : typeof result} for contract ${contractId}`)
      result = {
        success: false,
        error: `Contract execution failed: result is ${result === undefined ? 'undefined' : 'invalid type'}`,
        gas: 0
      }
    }

    // 确保结果对象包含必要的字段
    if (result.success === undefined) {
      this.logger.warn(`Contract result missing 'success' field for ${contractId}, assuming false`)
      result.success = false
    }

    if (result.gas === undefined) {
      this.logger.warn(`Contract result missing 'gas' field for ${contractId}, assuming 0`)
      result.gas = 0
    }

    // 提取结果字段，使用默认值确保安全
    const success = !!result.success
    const error = result.error || null
    const gas = result.gas || 0
    const stateChangesHash = result.stateChangesHash || null

    try {
      // 消耗gas
      const block = await this.runtime.block.getBlockByHeight(blockHeight)
      await this.burningGas(gas, useEnergy, payer, block, trs.id, dbTrans)
    } catch (gasErr) {
      // 如果是唯一约束错误，说明gas已经被消耗，可以忽略
      if (gasErr.message && gasErr.message.includes('UNIQUE constraint failed')) {
        this.logger.debug(`Gas already consumed for transaction '${trs.id}', skipping`)
      } else {
        this.logger.error(`Failed to burn gas for ${contractId}: ${gasErr.message}`, gasErr)
        // 不抛出异常，继续处理结果
      }
    }

    try {
      // 处理元数据
      const metadata = await this._processMetadata(contractId, result, trs)

      // 截断错误消息
      const shortError = !error ? null :
        (typeof error === 'string' && error.length > 120) ?
          error.substring(0, 120) + '...' :
          String(error).substring(0, 120)

      // 创建合约结果记录
      const crt = {
        transaction_id: trs.id,
        contract_id: contractId,
        success: success ? 1 : 0,
        error: shortError,
        gas,
        stateChangesHash,
        data: metadata, // 使用处理后的元数据
        timestamp: trs.timestamp // 添加交易的时间戳
      }

      // 检查是否已存在结果记录
      const existingResult = await this.dao.findOne('contract_result', {
        where: { transaction_id: trs.id },
        transaction: dbTrans
      })

      if (existingResult) {
        this.logger.debug(`Contract result for transaction '${trs.id}' already exists, skipping insert`)
      } else {
        // 保存合约结果
        await this.dao.insert('contract_result', crt, {
          transaction: dbTrans
        })
        this.logger.debug(`Contract result saved for ${contractId} with metadata: ${!!metadata}`)
      }

      // 处理合约转账
      if (success && result.transfers && result.transfers.length > 0) {
        for (const t of result.transfers) {
          await this.transfer(
            contractId,
            t.currency,
            String(t.amount),
            contractAddr,
            t.to,
            trs.id,
            await this.runtime.block.getBlockByHeight(blockHeight),
            dbTrans
          )
        }
      }
    } catch (err) {
      // 记录错误但不抛出，确保交易处理可以继续
      this.logger.error(`Failed to save contract result for ${contractId}: ${err.message}`, err)
    }

    // 移除transfers字段，避免重复处理
    result.transfers = undefined

    // 转换结果中的BigInt类型为字符串
    this._convertBigintToString(result)

    return result
  }

  // 将结果中的BigInt类型转换为字符串
  _convertBigintToString (obj) {
    if (typeof obj !== 'object' || obj === null) return

    Object.keys(obj).forEach(key => {
      const value = obj[key]
      const type = typeof value
      if (type === 'bigint') {
        obj[key] = String(value)
      } else if (type === 'object') {
        this._convertBigintToString(value)
      }
    })
  }

  // 内部方法，用于处理合约转账
  async transfer (contractId, currency, amount, senderId, recipientId, tid, block, dbTrans) {
    return await this.pay(contractId, currency, amount, senderId, recipientId, tid, block, dbTrans)
  }

  // fixme: 参数不一致
  // type: 12 原：transfer
  async pay (contractId, currency, amount, senderId, recipientId, tid, block, dbTrans) {
    // 设置发送方账户
    await this.runtime.account.setAccount({ address: senderId }, dbTrans)

    // 减少发送方余额
    await this.runtime.account.merge(
      senderId,
      {
        address: senderId,
        balance: -amount,
        u_balance: -amount,
        block_id: block.id,
        round: await this.runtime.round.getRound(block.height)
      },
      dbTrans
    )

    // 设置接收方账户
    await this.runtime.account.setAccount({ address: recipientId }, dbTrans)

    // 增加接收方余额
    await this.runtime.account.merge(
      recipientId,
      {
        address: recipientId,
        balance: amount,
        u_balance: amount,
        block_id: block.id,
        round: await this.runtime.round.getRound(block.height)
      },
      dbTrans
    )

    // 获取交易信息以获取时间戳
    const trs = await this.dao.findOne('tr', { where: { id: tid } });

    // 创建合约转账记录
    const trsf = {
      contract_id: contractId,
      transaction_id: tid,
      block_height: block.height,
      sender_id: senderId,
      recipient_id: recipientId,
      currency,
      amount,
      timestamp: trs.timestamp // 添加时间戳
    }
    await this.dao.insert('contract_transfer', trsf, {
      transaction: dbTrans
    })
    return { success: true }
  }

  async verifySend (trs, sender) {
    let contract_id, gasLimit, method, args_str

    // 处理args字段，支持数组格式
    if (Array.isArray(trs.args)) {
      // 如果args已经是数组，直接使用
      [contract_id, gasLimit, method, args_str] = trs.args
    } else {
      // 如果不是数组，记录错误并抛出异常
      this.logger.error('Invalid args format: args must be an array')
      throw new Error('Invalid args format: args must be an array')
    }

    let args = []
    try {
      args = args_str ? (typeof args_str === 'string' ? JSON.parse(args_str) : args_str) : []
    } catch (err) {
      this.logger.error(`Failed to parse contract args: ${err.message}`)
      throw new Error(`Invalid contract args format: ${err.message}`)
    }

    assert(method !== undefined && method !== null, 'method name can not be null or undefined')
    assert(Array.isArray(args), 'Invalid contract method args, it should be array')
    assert(
      JSON.stringify(args).length <= this.constants.maxCodeSize,
      `args length can not exceed ${this.constants.maxCodeSize} bytes`
    )

    const checkResult = await this.checkGas(sender.address, gasLimit)
    assert(checkResult.enough, 'Gas is not enough')

    const record = await this.dao.findOne('contract', { where: { id: contract_id }, attributes: ['id', 'metadata'] })
    assert(!!record, `Contract ${contract_id} not found`)
    const meta = JSON.parse(record.metadata)
    const mtd = meta.methods.find(t => t.name === method)
    assert(!!mtd, `Invalid contract method ${method}, method name not found`)
  }

  // register type: 11 / 原：deploy
  async register (trs, block, sender, dbTrans) {
    try {
      const { name, gasLimit, desc, version, code, consumeOwnerEnergy } = trs.asset.contract

      // 验证参数
      this.ensureGasLimitValid(gasLimit, trs)
      this.ensureContractNameValid(name)
      assert(!desc || desc.length <= 255, 'Invalid description, can not be longer than 255')
      assert(!version || version.length <= 32, 'Invalid version, can not be longer than 32')
      assert(code && code.length <= MAX_CODE_SIZE_K * 1024, `Contract code size can not exceed ${MAX_CODE_SIZE_K}K`)

      const senderAddress = sender.address

      // 检查gas是否足够
      const checkResult = await this.checkGas(undefined, senderAddress, gasLimit, true)
      assert(checkResult.enough, 'Insufficient energy')

      // 检查合约名称是否已存在
      const existingContract = await this.dao.findOne('contract', { where: { name } })
      assert(!existingContract, `Contract '${name}' exists already`)

      // 创建合约ID
      const contractId = await this.dao.autoId.generateId('CONTRACT')

      // 创建合约账户地址
      const contractAddress = await this.createContractAccount(trs.id, senderAddress)

      // 创建上下文
      const context = await this.makeContext(senderAddress, trs, sender, block)

      // 注册合约
      this.logger.info(`Deploy smart contract id: ${contractId}, name: ${name}`)
      const registerResult = await this.runtime.dvm.registerContract(gasLimit, context, contractId, name, code)

      // 保存结果数据
      const resultData = registerResult.data
      registerResult.data = undefined

      // 处理结果
      await this.handleResult(
        contractId,
        contractAddress,
        registerResult,
        trs,
        block.height,
        checkResult.energy,
        checkResult.payer,
        dbTrans
      )

      // 如果注册成功，保存合约记录
      if (registerResult.success) {
        await this.dao.insert(
          'contract',
          {
            id: contractId,
            transaction_id: trs.id,
            name,
            owner_id: senderAddress,
            address: contractAddress,
            version,
            vm_version: this.runtime.dvm.vmVersion,
            desc,
            code,
            state: 0,
            consumeOwnerEnergy: consumeOwnerEnergy !== false ? 1 : 0,
            metadata: resultData,
            timestamp: trs.timestamp
          },
          {
            transaction: dbTrans
          }
        )

        this.logger.debug(`Contract ${contractId} saved to database with metadata: ${!!resultData}`)

        // 创建合约账户
        const data = {
          address: contractId,
          u_is_delegate: 0,
          is_delegate: 0,
          vote: 0
        }

        if (name) {
          data.u_username = null
          data.username = name
        }

        await this.runtime.account.setAccount(data)
      }

      return registerResult
    } catch (err) {
      // 记录错误但不抛出，让交易处理继续
      this.logger.error(`Contract deployment error: ${err.message}`, err)

      // 创建失败结果
      const failResult = {
        success: false,
        error: err.message,
        gas: trs.asset.contract.gasLimit || 0
      }

      try {
        // 尝试生成合约ID
        const { name, ownerId, version } = trs.asset.contract
        const contractId = await crypto.generateContractAddress(
          { name, ownerId, version },
          this.constants.tokenPrefix
        )

        // 消耗gas
        const checkResult = await this.checkGas(undefined, sender.address, gasLimit, true)
        if (checkResult.enough) {
          const blockObj = await this.runtime.block.getBlockByHeight(block.height)
          await this.burningGas(gasLimit, checkResult.energy, checkResult.payer, blockObj, trs.id, dbTrans)
        }

        // 记录失败结果
        await this.handleResult(
          contractId,
          null,
          failResult,
          trs,
          block.height,
          checkResult && checkResult.energy,
          checkResult && checkResult.payer,
          dbTrans
        )
      } catch (innerErr) {
        this.logger.error(`Failed to handle contract deployment error: ${innerErr.message}`, innerErr)
      }

      return failResult
    }
  }

  // pay type: 13 原 execute
  async call (trs, block, sender, dbTrans) {
    try {
      // 解析参数
      let contractId, gasLimit, method, argsStr, currency, amount, args = [];

      // 处理args字段，支持数组格式
      if (Array.isArray(trs.args)) {
        // 如果args已经是数组，直接使用
        if (trs.args.length >= 6) {
          // 支付合约调用格式: [contract_id, gasLimit, amount, currency, method, args_str]
          [contractId, gasLimit, amount, currency, method, argsStr] = trs.args
        } else {
          // 普通合约调用格式: [contract_id, gasLimit, method, args_str]
          [contractId, gasLimit, method, argsStr] = trs.args
        }
      } else {
        // 如果不是数组，记录错误并抛出异常
        this.logger.error('Invalid args format: args must be an array')
        throw new Error('Invalid args format: args must be an array')
      }

      // 验证参数
      this.ensureGasLimitValid(gasLimit, trs)
      assert(method !== undefined && method !== null, 'method name can not be null or undefined')

      // 解析参数字符串
      try {
        args = argsStr ? (typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr) : []
      } catch (err) {
        this.logger.error(`Failed to parse contract args: ${err.message}`)
        throw new Error(`Invalid contract args format: ${err.message}`)
      }

      assert(Array.isArray(args), 'Invalid contract args, should be array')
      assert(JSON.stringify(args).length <= MAX_ARGS_SIZE_K * 1024, `stringified args length can not exceed ${MAX_ARGS_SIZE_K}K`)

      // 获取合约信息
      const contractInfo = await this.dao.findOne('contract', {
        where: { id: contractId },
        attributes: ['id', 'name', 'address', 'owner_id', 'consumeOwnerEnergy', 'metadata']
      })
      assert(contractInfo !== undefined, `Contract '${contractId}' not found`)

      // 检查合约所有者能量优先使用
      const preferredEnergyAddress = contractInfo.consumeOwnerEnergy ? contractInfo.owner_id : undefined

      // 检查gas是否足够
      const checkResult = await this.checkGas(preferredEnergyAddress, sender.address, gasLimit, true)
      assert(checkResult.enough, 'Insufficient energy')

      // 创建上下文
      const context = await this.makeContext(sender.address, trs, sender, block)

      let result;

      // 如果是支付调用
      if (amount !== undefined && amount !== null && currency) {
        // 验证金额
        const bigAmount = bignum.plus(amount, 0)
        assert(bigAmount.gt(0), 'Invalid amount, should be greater than 0')

        // 如果支付者和gas支付者相同，且使用DDN支付，检查余额是否足够同时支付gas和转账
        if (checkResult.payer === sender.address && currency === DDN_CURRENCY && !checkResult.energy) {
          const account = await this.runtime.account.getAccountByAddress(sender.address)
          const ddnEnough = bignum.plus(account.balance, 0).gte(bigAmount.plus(checkResult.ddn || 0))
          assert(ddnEnough, 'Insufficient DDN for transfer and gas')
        }

        // 调用合约支付方法
        this.logger.info(`Pay to contract ${contractInfo.name} with ${bigAmount} ${currency}`)
        result = await this.runtime.dvm.payContract(
          gasLimit,
          context,
          contractInfo.name,
          method,
          bigAmount.toString(),
          currency,
          ...args
        )

        // 如果执行成功，处理转账
        if (result && result.success) {
          await this.transfer(
            contractId,
            currency,
            bigAmount.toString(),
            sender.address,
            contractInfo.address,
            trs.id,
            block,
            dbTrans
          )
        }
      }
      // 普通调用
      else {
        // 调用合约方法
        this.logger.info(`Call contract ${contractInfo.name} method ${method}`)
        result = await this.runtime.dvm.callContract(gasLimit, context, contractInfo.name, method, ...args)
      }

      // 验证结果对象
      if (!result) {
        this.logger.error(`Contract execution returned undefined result for ${contractId}.${method}`)
        result = {
          success: false,
          error: `Contract execution returned undefined result for ${contractId}.${method}`,
          gas: gasLimit
        }
      } else if (typeof result !== 'object') {
        this.logger.error(`Contract execution returned invalid result type for ${contractId}.${method}`)
        result = {
          success: false,
          error: `Contract execution returned invalid result type for ${contractId}.${method}`,
          gas: gasLimit
        }
      }

      // 处理合约执行结果
      await this.handleResult(
        contractId,
        contractInfo.address,
        result,
        trs,
        block.height,
        checkResult.energy,
        checkResult.payer,
        dbTrans
      )

      return result
    } catch (err) {
      // 捕获整个执行过程中的错误
      this.logger.error(`Contract execution error: ${err.message}`, err)

      // 创建错误结果对象
      const errorResult = {
        success: false,
        error: err.message,
        gas: trs.args && trs.args[1] || 0 // 使用gasLimit，如果未定义则为0
      }

      try {
        // 尝试记录错误结果
        if (trs.args && trs.args[0]) {
          const contractId = trs.args[0]
          const contractInfo = await this.dao.findOne('contract', {
            where: { id: contractId },
            attributes: ['address']
          })

          await this.handleResult(
            contractId,
            contractInfo ? contractInfo.address : null,
            errorResult,
            trs,
            block.height,
            false,
            sender.address,
            dbTrans
          )
        }
      } catch (resultErr) {
        // 如果记录结果也失败，只记录日志但不抛出异常
        this.logger.error(`Failed to handle error result: ${resultErr.message}`, resultErr)
      }

      // 返回错误结果而不是抛出异常，确保交易处理可以继续
      return errorResult
    }
  }
}