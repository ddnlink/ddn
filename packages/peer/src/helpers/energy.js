import { bignum } from '@ddn/utils'
import assert from 'assert'
import * as crypto from '@ddn/crypto'

const MAX_GAS_LIMIT = 100000000000
const MAX_ARGS_SIZE = 16

let _singleton
class Energy {
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

  ensureGasLimitValid (gasLimit, trs) {
    const basicGas = this.runtime.dvm.calcTransactionStorageGas(trs)
    assert(
      gasLimit > basicGas && gasLimit <= MAX_GAS_LIMIT,
      `gas limit must greater than ${basicGas} and less than ${MAX_GAS_LIMIT}`
    )
  }

  gasToDDN (gas) {
    const energy = gas * this.constants.gasPrice
    return parseInt(energy * (this.constants.fixedPoint / this.constants.energyPerDDN), 10)
  }

  async checkGas (address, gasLimit) {
    const senderAccount = await this.runtime.account.getAccountByAddress(address)
    if (!senderAccount || !senderAccount.balance) return { enough: false }

    const ddn = this.gasToDDN(gasLimit)
    const enough = ddn <= senderAccount.balance
    return { enough, ddn, payer: address }
  }

  async burningGas (gas, address, block, tid, dbTrans) {
    const height = this.runtime.block.getLastBlock().height + 1
    const payAmount = this.gasToDDN(gas)

    this.logger.debug(`consume ${address} ${payAmount} DDN for transaction '${tid}'`)
    if (payAmount <= 0) return null
    const account = await this.runtime.account.getAccountByAddress(address)
    if (!account) throw new Error('Account is not found')
    if (payAmount > account.balance) throw new Error('Insufficient balance')
    await this.runtime.account.merge(
      address,
      {
        balance: bignum.minus(0, payAmount),
        block_id: block.id, // wxm block database
        round: await this.runtime.round.getRound(block.height)
      },
      dbTrans
    )
    await this.dao.insert(
      'burning',
      {
        tid,
        height,
        ddn: payAmount,
        address
      },
      {
        transaction: dbTrans
      }
    )

    return null
  }

  async handleResult (contractId, result, trs, block, payer, dbTrans) {
    const { success, error, gas, stateChangesHash, data } = result
    await this.burningGas(gas || 0, payer, block, trs.id, dbTrans)

    const shortError = !error ? null : error.length <= 120 ? error : error.substr(0, 120) + '...'
    const crt = {
      transaction_id: trs.id,
      contract_id: contractId,
      success: success ? 1 : 0,
      error: shortError,
      gas,
      stateChangesHash,
      data
    }
    // crt.id = await getId(crt)
    this.dao.insert('contract_result', crt, {
      transaction: dbTrans
    })
  }

  async transfer (contractId, currency, amount, senderId, recipientId, tid, block, dbTrans) {
    await this.runtime.account.setAccount({ address: senderId }, dbTrans)

    await this.runtime.account.merge(
      senderId,
      {
        address: senderId, // wxm block database
        balance: -amount,
        u_balance: -amount,
        block_id: block.id, // wxm block database
        round: await this.runtime.round.getRound(block.height)
      },
      dbTrans
    )
    await this.runtime.account.setAccount({ address: recipientId }, dbTrans)

    await this.runtime.account.merge(
      recipientId,
      {
        address: recipientId, // wxm block database
        balance: amount,
        u_balance: amount,
        block_id: block.id, // wxm block database
        round: await this.runtime.round.getRound(block.height)
      },
      dbTrans
    )
    const trsf = {
      contract_id: contractId,
      transaction_id: tid,
      block_height: block.height,
      sender_id: senderId,
      recipient_id: recipientId,
      currency,
      amount
      // timestamp: trs.timestamp,
    }
    // trsf.id = await getId(trsf)
    this.dao.insert('contract_transfer', trsf, {
      transaction: dbTrans
    })
  }

  async deploy (trs, block, sender, dbTrans) {
    const last = this.runtime.block.getLastBlock()
    const lastBlock = {
      id: last.id,
      height: last.height,
      payloadHash: last.payload_hash,
      prevBlockId: last.previous_block,
      miner: last.generator_public_key,
      timestamp: last.timestamp
    }
    const currentBlock = {
      id: block.id,
      height: block.height,
      payloadHash: block.payload_hash,
      prevBlockId: block.previous_block,
      miner: block.generator_public_key,
      timestamp: block.timestamp
    }
    const origin = {
      username: sender.username,
      address: sender.address,
      publicKey: sender.publicKey,
      second_public_key: sender.second_public_key,
      balance: sender.balance
    }
    const ctx = { senderId: sender.address, tx: trs, block: currentBlock, lastBlock, origin }

    const { id: contract_id, name, gas_limit, owner, desc, version, code } = trs.asset.contract
    const id = await crypto.generateContractAddress(
      { name, gas_limit, owner, desc, version, code },
      this.constants.tokenPrefix
    )
    assert(!contract_id || contract_id === id, 'contract id is not correct')

    const checkResult = await this.runtime.energy.checkGas(sender.address, gas_limit)

    this.logger.info(`Deploy smart contract id: ${id}, name: ${name}`)

    const publishResult = await this.runtime.dvm.deployContract(gas_limit, ctx, id, name, code)
    this.logger.debug(publishResult)
    this.logger.info(`Deploy smart contract id: ${id}, success: ${publishResult.success}`)
    const resultData = publishResult.data
    if (publishResult.success) {
      await this.dao.insert(
        'contract',
        {
          ...trs.asset.contract,
          id,
          transaction_id: trs.id,
          timestamp: trs.timestamp,
          state: 0,
          metadata: JSON.stringify(resultData)
        },
        {
          transaction: dbTrans
        }
      )
    }
    publishResult.data = undefined

    await this.handleResult(id, publishResult, trs, block.height, checkResult.payer, dbTrans)

    // create contract account
    const data = {
      address: id,
      u_is_delegate: 0, // wxm block database
      is_delegate: 0, // wxm block database
      vote: 0
    }

    if (name) {
      data.u_username = null
      data.username = name
    }
    this.runtime.account.setAccount(data)

    // return publishResult
  }

  async execute (trs, block, sender, dbTrans) {
    const last = this.runtime.block.getLastBlock()
    const lastBlock = {
      id: last.id,
      height: last.height,
      payloadHash: last.payload_hash,
      prevBlockId: last.previous_block,
      miner: last.generator_public_key,
      timestamp: last.timestamp
    }
    const currentBlock = {
      id: block.id,
      height: block.height,
      payloadHash: block.payload_hash,
      prevBlockId: block.previous_block,
      miner: block.generator_public_key,
      timestamp: block.timestamp
    }
    const origin = {
      username: sender.username,
      address: sender.address,
      publicKey: sender.publicKey,
      second_public_key: sender.second_public_key,
      balance: sender.balance
    }
    const ctx = { senderId: sender.address, tx: trs, block: currentBlock, lastBlock, origin }

    const options = trs.args && trs.args[0] // { address, gas_limit, method, args }
    const { id: contract_id, gas_limit, method, currency } = options

    let args = []
    try {
      args = JSON.parse(options.args)
    } catch (err) {
      this.logger.error(err)
      throw err
    }
    // console.log('args...', args, `contract_id: ${contract_id}`, options)

    assert(method !== undefined && method !== null, 'method name can not be null or undefined')
    assert(Array.isArray(args), 'Invalid contract method args, it should be array')
    assert(JSON.stringify(args).length <= MAX_ARGS_SIZE * 1024, `args length can not exceed ${MAX_ARGS_SIZE}K`)

    const checkResult = await this.checkGas(sender.address, options.gas_limit)

    const { metadata } = await this.dao.findOne('contract', contract_id, { attributes: ['id', 'metadata'] })
    const meta = JSON.parse(metadata)
    const mtd = meta.methods.find(t => t.name === method)
    assert(!!mtd, 'Invalid contract method, method name not found')

    try {
      let result
      let amount = options.amount
      if (!!mtd.payable && !!currency && !!amount) {
        if (amount !== undefined && amount !== null) {
          amount = bignum.plus(amount, 0)
        }
        this.logger.info(`Transfer to contract ${amount} ${currency} transactions`)
        result = await this.runtime.dvm.payContract(
          gas_limit,
          ctx,
          contract_id,
          method,
          amount.toString(),
          currency,
          ...args
        )
        if (result.success) {
          await this.transfer(
            contract_id,
            currency,
            amount.toString(),
            sender.address,
            contract_id,
            trs.id,
            block,
            dbTrans
          )
        }
      } else if (!mtd.payable) {
        this.logger.info(`Send to contract method: ${mtd.name}`)
        result = await this.runtime.dvm.sendContract(gas_limit, ctx, contract_id, method, ...args)
        if (result.transfers && result.transfers.length > 0) {
          for (const t of result.transfers) {
            await this.transfer(
              contract_id,
              t.currency,
              String(t.amount),
              contract_id,
              t.recipientAddress,
              trs.id,
              block,
              dbTrans
            )
          }
        }

        result.transfers = undefined
      }

      // console.log(result)
      await this.handleResult(contract_id, result, trs, block.height, checkResult.payer, dbTrans)
    } catch (err) {
      this.logger.error(err)
      throw err
    }
  }
}

export default Energy
