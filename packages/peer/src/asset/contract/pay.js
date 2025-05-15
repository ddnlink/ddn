/**
 * 执行合约
 * tailor   2018-12-28
 */
// import ByteBuffer from 'bytebuffer'
import { bignum } from '@ddn/utils'
// import { getId } from '@ddn/crypto'

class ContractPay {
  constructor(context) {
    Object.assign(this, context)
    this._context = context
  }

  async create({ senderId, recipientId, gasLimit, method, amount, currency, args }, trs) {
    trs.recipientId = null // wxm block database
    trs.amount = '0' // Bignum update

    const trans = {
      sender_id: senderId,
      recipient_id: recipientId,
      gasLimit: gasLimit,
      method,
      args,
      amount,
      currency
    }

    trs.asset.contractPay = trans

    return trs
  }

  async calculateFee() {
    return bignum.multiply(this.constants.net.fees.contract_pay, this.constants.fixedPoint)
  }

  async verify(trs, sender) {
    await this.runtime.energy.verifySend(trs, sender)

    return trs
  }

  async process(trs) {
    return trs
  }

  async getBytes({ asset }) { }

  async isSupportLock() {
    return false
  }

  // fixme: 参数不一致
  async apply(trs, block, sender, dbTrans) {
    // contractId, currency, amount, senderId, recipientId, tid, block, dbTrans
    await this.runtime.energy.pay(trs, block, sender, dbTrans)
  }

  async undo(trs, _, sender, dbTrans) {
    await this.dao.remove('contract_tansfer', { where: { transaction_id: trs.id }, transaction: dbTrans })
    await this.dao.remove('contract_result', { where: { transaction_id: trs.id }, transaction: dbTrans })
  }

  async applyUnconfirmed(trs, sender) { }

  async undoUnconfirmed(trs, sender) { }

  // async objectNormalize (trs) {
  //   let assetObj = await this.getAssetObject(trs)
  //   assetObj = Object.assign({}, assetObj)
  //   const validateErrors = await this.ddnSchema.validateAobIssuer(assetObj)
  //   if (validateErrors) {
  //     this.logger.error(
  //       `Failed to normalize aob issuer: ${trs.type} ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
  //     )
  //     this.logger.debug(`Failed to normalize aob issuer  asset: ${trs}`)
  //     throw new Error(`Failed to normalize aob issuer: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
  //   }

  //   return trs
  // }
  async objectNormalize(trs) {
    return trs
  }

  // fixme: 这里没有继承 asset_base 所以，这里不应该对字段进行处理
  async dbRead(raw) {
    // if (!raw.asset_trs_id) {
    //   return null
    // }

    // const transfer = {
    //   sender_id: raw.asset_str1,
    //   recipient_id: raw.asset_str2,
    //   method: raw.asset_str3,
    //   currency: raw.asset_str4,
    //   amount: raw.asset_str5,
    //   gasLimit: raw.asset_int1
    // }

    // // 处理扩展JSON数据
    // if (raw.asset_ext_json) {
    //   try {
    //     const jsonObj = JSON.parse(raw.asset_ext_json)
    //     if (jsonObj.args) {
    //       transfer.args = jsonObj.args
    //     }
    //   } catch (err) {
    //     this.logger.error("Can't parse contract transfer asset extend data", err)
    //   }
    // }

    // return { transfer }
    return raw
  }

  /**
   * 将合约执行交易存储到数据库中
   * @param {*} trs 交易对象
   * @param {*} dbTrans 数据库事务
   */
  async dbSave(trs, dbTrans) {
    const assetName =  'contractPay' // 'transfer'
    const asset = trs.asset[assetName]

    const assetPay = {
      ...asset,
      transaction_id: trs.id,
      transaction_type: trs.type,
      timestamp: trs.timestamp
    }

    this.logger.debug('assetPay: ', assetPay)

    // 保存到trs_asset表
    let result = { success: true, error: null }
    try {
      await this.dao.insert('contract_transfer', assetPay, { transaction: dbTrans })
    } catch (error) {
      result.success = false
      result.error = error
    }

    // 保存扩展数据到trs_asset_ext表
    const assetPayResult = {
      transaction_id: trs.id,
      transaction_type: trs.type,
      contract_id: Array.isArray(trs.args) && trs.args.length > 0 ? trs.args[0] : null,
      gas: 0,
      stateChangesHash: null,
      data: null,
      timestamp: trs.timestamp // 添加交易的时间戳
    }

    try {
      await this.dao.insert('contract_result', assetPayResult, { transaction: dbTrans })
      return {
        success: true,
        message: 'Contract transfer saved successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async ready({ signatures }, { multisignatures, multimin }) {
    return true
  }
}

export default ContractPay
