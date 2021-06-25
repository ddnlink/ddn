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

  async verify (trs, sender) {
    await this.runtime.energy.verifySend(trs, sender)

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
    await this.runtime.energy.execute(trs, block, sender, dbTrans)
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
