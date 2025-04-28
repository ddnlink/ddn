/**
 * 受托人资产交易
 * wangxm   2018-12-28
 */
import ByteBuffer from 'bytebuffer'
import { bignum } from '@ddn/utils'
import * as crypto from '@ddn/crypto'

class Contract {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async create ({ name, sender, gasLimit, version, desc, code, useRegisterGas }, trs) {
    trs.recipientId = null // wxm block database
    trs.amount = '0' // Bignum update

    const contract = {
      name,
      transaction_id: trs.id,
      owner: sender.address,
      state: 0,
      code,
      desc,
      version,
      gas_limit: gasLimit,
      timestamp: trs.timestamp
    }
    const id = await crypto.generateContractAddress(contract)
    trs.asset.contract = { id, ...contract }

    return trs
  }

  async calculateFee () {
    return bignum.multiply(this.constants.net.fees.contract, this.constants.fixedPoint)
  }

  async verify (trs, sender) {
    if (trs.recipientId) {
      throw new Error('Invalid recipient')
    }

    if (!trs.asset || !trs.asset.contract) {
      throw new Error('Invalid transaction asset')
    }

    const { id, name, code, owner, desc, version, gas_limit } = trs.asset.contract
    const contract_id = await crypto.generateContractAddress(
      { name, gas_limit, owner, desc, version, code },
      this.constants.tokenPrefix
    )
    if (!contract_id || contract_id === id) throw new Error('contract id is not correct')

    // if (!id || !id.length) {
    //   throw new Error('id is not exist')
    // }

    if (desc && desc.length >= 255) {
      throw new Error('desc is too long')
    }

    if (version && version.length >= 32) {
      throw new Error('version is too long')
    }

    if (!code || code.length >= this.constants.maxCodeSize) {
      throw new Error('code size should be less than 32k')
    }

    // if (contract) {
    //   throw new Error(`Contract '${address}' exists already`)
    // }

    if (name.length > 20) {
      throw new Error('name is too long. Maximum is 20 characters')
    }

    if (this.address.isAddress(name)) {
      throw new Error('name can not be a potential address')
    }

    const checkResult = await this.runtime.energy.checkGas(sender.address, gas_limit)
    if (!checkResult.enough) {
      throw new Error('Gas is not enough')
    }

    const result = await this.runtime.compiler.compile(code)
    if (!result || !result.compiledCode || !result.metadata) {
      throw new Error('failed compile contract')
    }

    return trs
  }

  async process (trs) {
    return trs
  }

  async getBytes ({ asset }) {
    if (!asset.contract.id) {
      return null
    }

    const bb = new ByteBuffer()
    bb.writeUTF8String(asset.contract.id)
    bb.writeUTF8String(asset.contract.name)
    bb.writeUTF8String(asset.contract.transactionId)
    bb.writeUTF8String(asset.contract.desc)
    bb.writeUTF8String(asset.contract.version)
    // bb.writeUTF8String(asset.contract.vmVersion)
    bb.writeUTF8String(asset.contract.code)
    // bb.writeUTF8String(asset.contract.timestamp)
    bb.flip()
    return bb.toBuffer()
  }

  async isSupportLock () {
    return false
  }

  async apply (trs, block, sender, dbTrans) {
    await this.runtime.energy.deploy(trs, block, sender, dbTrans)
  }

  async undo (trs, _, sender, dbTrans) {
    await this.dao.remove('contract', { where: { transaction_id: trs.id }, transaction: dbTrans })
  }

  async applyUnconfirmed (trs, sender) {}

  async undoUnconfirmed (trs, sender) {}

  async objectNormalize (trs) {
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
          desc: {
            type: 'string'
          },
          version: {
            type: 'string'
          },
          code: {
            type: 'string'
          }
        },
        required: ['name', 'version', 'code']
      },
      trs.asset.contract
    )
    if (validateErrors) {
      throw new Error(
        `Can't verify contract transaction, incorrect parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      )
    }

    return trs
  }

  async dbRead (raw) {
    if (!raw.asset_trs_id) {
      return null
    }

    // id等信息在 energy.js 里处理
    const contract = {
      name: raw.asset_str2,
      owner: raw.asset_str3,
      desc: raw.asset_str4,
      version: raw.asset_str5,
      gas_limit: raw.asset_int1
    }

    // 处理扩展JSON数据，获取代码
    if (raw.asset_ext_json) {
      try {
        const jsonObj = JSON.parse(raw.asset_ext_json)
        if (jsonObj.code) {
          contract.code = jsonObj.code
        }
      } catch (err) {
        this.logger.error("Can't parse contract asset extend data", err)
      }
    }

    return { contract }
  }

  /**
   * 定义资产属性和字段的对应关系
   */
  async propsMapping () {
    return [
      { field: 'str1', prop: 'id' },
      { field: 'str2', prop: 'name' },
      { field: 'str3', prop: 'owner' },
      { field: 'str4', prop: 'desc' },
      { field: 'str5', prop: 'version' },
      { field: 'int1', prop: 'gas_limit' },
      { field: 'str_ext', prop: 'code' }
    ]
  }

  /**
   * 将合约交易存储到数据库中
   * @param {*} trs 交易对象
   * @param {*} dbTrans 数据库事务
   */
  async dbSave (trs, dbTrans) {
    try {
      // 检查资产记录是否已存在
      const existingAsset = await this.dao.findOne('trs_asset', {
        where: { transaction_id: trs.id },
        transaction: dbTrans
      });
      
      if (existingAsset) {
        this.logger.warn(`Asset for transaction ${trs.id} already exists, skipping`);
        return existingAsset;
      }
      
      const assetName = 'contract'
      const asset = trs.asset[assetName]

      const assetInst = {
        transaction_id: trs.id,
        transaction_type: trs.type,
        timestamp: trs.timestamp
      }

      const jsonExtObj = {}
      let hasJsonExt = false

      // 将合约数据映射到trs_asset表的字段
      assetInst.str1 = asset.id
      assetInst.str2 = asset.name
      assetInst.str3 = asset.owner
      assetInst.str4 = asset.desc || ''
      assetInst.str5 = asset.version
      assetInst.int1 = asset.gas_limit

      // 将代码存储到扩展JSON中
      hasJsonExt = true
      jsonExtObj.code = asset.code

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
    } catch (err) {
      if (this.isRecordExistsError(err)) {
        this.logger.warn(`Asset for transaction ${trs.id} already exists (detected from error), skipping`);
        return { transaction_id: trs.id }; // 返回一个最小化的资产对象
      }
      
      // 其他错误需要抛出
      throw err;
    }
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

export default Contract
