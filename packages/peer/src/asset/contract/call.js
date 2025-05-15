/**
 * 合约调用
 * tailor   2018-12-28
 */
import Asset from '@ddn/asset-base'
import { bignum } from '@ddn/utils'

class  ContractCall extends Asset.Base {
  // eslint-disable-next-line no-useless-constructor
  constructor(context, transactionConfig) {
    super(context, transactionConfig)
  }
  // constructor(context) {
  //   Object.assign(this, context)
  //   this._context = context
  // }

  async create(data, trs) {
    trs.recipientId = null // wxm block database
    trs.amount = '0' // Bignum update

    // 调整一下前后端不一致的字段
    const trans = {
      sender_id: data.senderId,
      recipient_id: data.recipientId,
      gasLimit: data.gasLimit,
      method: data.method,
      args: data.args,
      amount: data.amount,
      currency: data.currency
    }

    const assetJsonName = await this.getAssetJsonName(trs.type)
    trs.asset[assetJsonName] = trans

    return trs
  }

  async calculateFee() {
    return bignum.multiply(this.constants.net.fees.contract_call, this.constants.fixedPoint)
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

  async apply(trs, block, sender, dbTrans) {
    await this.runtime.energy.call(trs, block, sender, dbTrans)
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

    // const Call = {
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
    //       Call.args = jsonObj.args
    //     }
    //   } catch (err) {
    //     this.logger.error("Can't parse contract call asset extend data", err)
    //   }
    // }

    // return { call }
    return raw
  }

  /**
   * 将合约执行交易存储到数据库中
   * @param {*} trs 交易对象
   * @param {*} dbTrans 数据库事务
   */
  async dbSave(trs, dbTrans) {
    const assetName = 'contractCall'
    const asset = trs.asset[assetName]

    const assetCall = {
      ...asset,
      transaction_id: trs.id,
      transaction_type: trs.type,
      timestamp: trs.timestamp
    }

    this.logger.debug('assetCall: ', assetCall)

    // 保存到trs_asset表
    let result = { success: true, error: null }
    try {
      await this.dao.insert('contract_transfer', assetCall, { transaction: dbTrans })
    } catch (error) {
      result.success = false
      result.error = error
    }

    // 保存扩展数据到trs_asset_ext表
    const assetCallResult = {
      transaction_id: trs.id,
      transaction_type: trs.type,
      contract_id: Array.isArray(trs.args) && trs.args.length > 0 ? trs.args[0] : null,
      gas: 0,
      stateChangesHash: null,
      data: null,
      timestamp: trs.timestamp // 添加交易的时间戳
    }

    try {
      await this.dao.insert('contract_result', assetCallResult, { transaction: dbTrans })
      return {
        success: true,
        message: 'Contract Call saved successfully'
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

export default ContractCall
