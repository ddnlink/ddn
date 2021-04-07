import { bignum } from '@ddn/utils'
import assert from 'assert'
// import { getId } from '@ddn/crypto'

const MAX_GAS_LIMIT = 100000000000

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

    if (result.transfers && result.transfers.length > 0) {
      for (const t of result.transfers) {
        await this.transfer(t.currency, String(t.amount), contractId, t.recipientAddress, trs, block.height, dbTrans)
      }
    }

    result.transfers = undefined
  }

  async transfer (currency, amount, senderId, recipientId, trs, height, dbTrans) {
    const trsf = {
      // id: 'aFEDwaDFsds',
      transaction_id: trs.id,
      // height,
      // senderId,
      // recipientId,
      currency,
      amount
      // timestamp: trs.timestamp,
    }
    // trsf.id = await getId(trsf)
    this.dao.insert('contract_transfer', trsf, {
      transaction: dbTrans
    })
  }
}

export default Energy
