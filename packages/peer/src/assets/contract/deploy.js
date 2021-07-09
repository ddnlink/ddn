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
    const contract = {
      id: raw.c_id,
      gas_limit: raw.c_gas_limit,
      name: raw.c_name,
      desc: raw.c_desc,
      owner: raw.c_owner,
      version: raw.c_version,
      code: raw.c_code
    }
    return { contract }
  }

  // 替换dbSave方法 ---wly
  /**
   * 功能:新增一条contract数据
   */
  async dbSave (trs, dbTrans) {}

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
