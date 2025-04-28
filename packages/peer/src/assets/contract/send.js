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
    return bignum.multiply(this.constants.net.fees.contract_transfer, this.constants.fixedPoint)
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

  async dbRead (raw) {
    if (!raw.asset_trs_id) {
      return null
    }

    const transfer = {
      sender_id: raw.asset_str1,
      recipient_id: raw.asset_str2,
      method: raw.asset_str3,
      currency: raw.asset_str4,
      amount: raw.asset_str5,
      gas_limit: raw.asset_int1
    }

    // 处理扩展JSON数据
    if (raw.asset_ext_json) {
      try {
        const jsonObj = JSON.parse(raw.asset_ext_json)
        if (jsonObj.args) {
          transfer.args = jsonObj.args
        }
      } catch (err) {
        this.logger.error("Can't parse contract transfer asset extend data", err)
      }
    }

    return { transfer }
  }

  /**
   * 定义资产属性和字段的对应关系
   */
  async propsMapping () {
    return [
      { field: 'str1', prop: 'sender_id' },
      { field: 'str2', prop: 'recipient_id' },
      { field: 'str3', prop: 'method' },
      { field: 'str4', prop: 'currency' },
      { field: 'str5', prop: 'amount' },
      { field: 'int1', prop: 'gas_limit' },
      { field: 'str_ext', prop: 'args' }
    ]
  }

  /**
   * 将合约执行交易存储到数据库中
   * @param {*} trs 交易对象
   * @param {*} dbTrans 数据库事务
   */
  async dbSave (trs, dbTrans) {
    const assetName = 'transfer'
    const asset = trs.asset[assetName]

    const assetInst = {
      transaction_id: trs.id,
      transaction_type: trs.type,
      timestamp: trs.timestamp
    }

    const jsonExtObj = {}
    let hasJsonExt = false

    // 将合约执行数据映射到trs_asset表的字段
    assetInst.str1 = asset.sender_id
    assetInst.str2 = asset.recipient_id
    assetInst.str3 = asset.method
    assetInst.str4 = asset.currency || ''
    assetInst.str5 = asset.amount || '0'
    assetInst.int1 = asset.gas_limit

    // 将参数存储到扩展JSON中
    if (asset.args) {
      hasJsonExt = true
      jsonExtObj.args = asset.args
    }

    // 保存到trs_asset表
    let result = await this.dao.insert('trs_asset', assetInst, { transaction: dbTrans })

    // 保存扩展数据到trs_asset_ext表
    if (hasJsonExt) {
      const assetExtInst = {
        transaction_id: trs.id,
        json_ext: JSON.stringify(jsonExtObj)
      }

      result = await this.dao.insert('trs_asset_ext', assetExtInst, { transaction: dbTrans })
    }

    return result
  }

  async ready ({ signatures }, { multisignatures, multimin }) {
    return true
  }
}

export default ContractTransfer
