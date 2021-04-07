/**
 * 执行合约
 * tailor   2018-12-28
 */
import ByteBuffer from 'bytebuffer'
import { bignum } from '@ddn/utils'
// import { getId } from '@ddn/crypto'

// const MAX_CODE_SIZE = 32768
// const MAX_GAS_LIMIT = 10000000

class ContractTransfer {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async create ({ address, sender, gasLimit, method, amount, currency, args }, trs) {
    trs.recipientId = null // wxm block database
    trs.amount = '0' // Bignum update

    const trans = {
      address,
      gas_limit: gasLimit,
      amount,
      currency,
      transaction_id: trs.id
    }

    trs.asset.transfer = trans

    return trs
  }

  async calculateFee () {
    return bignum.multiply(this.constants.net.fees.contract, this.constants.fixedPoint)
  }

  async verify (trs) {
    // const basicGas = this.runtime.dvm.calcTransactionStorageGas(trs)
    // if(gasLimit < basicGas || gasLimit > MAX_GAS_LIMIT) {
    //   throw new Error(`gas limit must greater than ${basicGas} and less than ${MAX_GAS_LIMIT}`)
    // }

    if (trs.recipientId) {
      throw new Error('Invalid recipient')
    }

    if (!trs.asset || !trs.asset.transfer) {
      throw new Error('Invalid transaction asset')
    }

    return trs
  }

  async process (trs) {
    return trs
  }

  async getBytes ({ asset }) {
    if (!asset.contract.address) {
      return null
    }

    const bb = new ByteBuffer()
    bb.writeUTF8String(asset.payResult.contractId)
    bb.writeUTF8String(asset.payResult.transactionId)
    bb.writeUTF8String(asset.payResult.amount)
    bb.writeUTF8String(asset.payResult.currency)
    bb.writeUTF8String(asset.payResult.timestamp)
    bb.flip()
    return bb.toBuffer()
  }

  async isSupportLock () {
    return false
  }

  async apply (trs, block, sender, dbTrans) {
    const { id, height, delegate, prevBlockId, payloadHash, timestamp } = this.runtime.block.getLastBlock()
    const lastBlock = { id, height, delegate, prevBlockId, payloadHash, timestamp }
    const context = { senderAddress: sender.address, transaction: trs, block, lastBlock, sender }
    const trans = trs.asset.transfer // { address, gas_limit, method, args }

    const amount = bignum.plus(trans.amount, 0)

    const checkResult = await this.runtime.energy.checkGas(sender.address, trans.gas_limit)

    console.log(`amount type of amount: ${typeof amount}`, amount, amount.toString())

    try {
      const result = await this.runtime.dvm.transferContract(
        trans.gas_limit,
        context,
        trans.address,
        trans.method,
        amount.toString(),
        trans.currency
      )

      // console.log(result)
      await this.runtime.energy.handleResult(trans.address, result, trs, block.height, checkResult.payer, dbTrans)
    } catch (err) {
      console.log(err)
      throw err
    }
  }

  async undo ({ id, asset }, _, { address, nameexist }, dbTrans) {
    // const data = {
    //   address,
    //   u_is_delegate: 0, // wxm block database
    //   is_delegate: 0, // wxm block database
    //   vote: 0
    // }

    // if (asset.contract.name) {
    //   data.u_username = null
    //   data.username = asset.contract.name
    // }

    // let account = await this.runtime.account.getAccountByAddress(address)

    // await this.runtime.account.setAccount(data, dbTrans)
    await this.dao.remove('contract_result', { where: { transaction_id: id }, transaction: dbTrans })
  }

  async applyUnconfirmed (trs, sender) {}

  async undoUnconfirmed (trs, sender) {}

  async objectNormalize (trs) {
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          address: {
            type: 'string'
          }
        },
        required: ['address']
      },
      trs.asset.transfer
    )
    if (validateErrors) {
      throw new Error(
        `Can't verify contract transaction, incorrect parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      )
    }

    return trs
  }

  async dbRead (raw) {
    return raw
  }

  // 替换dbSave方法 ---wly
  /**
   * 功能:新增一条contract数据
   */
  async dbSave (trs, dbTrans) {
    // const trf = trs.asset.transfer
    // return await this.dao.insert('contract_transfer', {
    //   transaction_id: trs.id,
    //   amount: trf.gas_limit,
    //   currency: 'DDN',
    // }, {
    //   transaction: dbTrans
    // })
  }

  async ready ({ signatures }, { multisignatures, multimin }) {
    if (Array.isArray(multisignatures) && multisignatures.length) {
      if (!signatures) {
        return false
      }
      return signatures.length >= multimin - 1
    } else {
      return true
    }
  }
}

export default ContractTransfer
