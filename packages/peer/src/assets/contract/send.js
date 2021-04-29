/**
 * 执行合约
 * tailor   2018-12-28
 */
// import ByteBuffer from 'bytebuffer'
import { bignum } from '@ddn/utils'
// import { getId } from '@ddn/crypto'

class ContractTransfer {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async create ({ senderId, recipientId, gasLimit, method, amount, currency, args }, trs) {
    trs.recipientId = null // wxm block database
    trs.amount = '0' // Bignum update

    const trans = {
      sender_id: senderId,
      recipient_id: recipientId,
      gas_limit: gasLimit,
      method,
      args,
      amount,
      currency
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
    return trs
  }

  async process (trs) {
    return trs
  }

  async getBytes ({ asset }) {}

  async isSupportLock () {
    return false
  }

  async apply (trs, block, sender, dbTrans) {
    try {
      // console.log(trs.args)
      await this.runtime.energy.execute(trs, block, sender, dbTrans)
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  async undo (trs, _, sender, dbTrans) {
    await this.dao.remove('contract_tansfer', { where: { transaction_id: trs.id }, transaction: dbTrans })
    await this.dao.remove('contract_result', { where: { transaction_id: trs.id }, transaction: dbTrans })
  }

  async applyUnconfirmed (trs, sender) {}

  async undoUnconfirmed (trs, sender) {}

  async objectNormalize (trs) {
    return trs
  }

  async dbRead (raw) {}

  // 替换dbSave方法 ---wly
  /**
   * 功能:新增一条contract数据
   */
  async dbSave (trs, dbTrans) {}

  async ready ({ signatures }, { multisignatures, multimin }) {
    return true
  }
}

export default ContractTransfer
