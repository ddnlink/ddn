/**
 * 受托人资产交易
 * wangxm   2018-12-28
 */
import ByteBuffer from 'bytebuffer'
import { bignum } from '@ddn/utils'
import * as crypto from '@ddn/crypto'

class Contract {
  constructor(context) {
    Object.assign(this, context);
    this.ctx = context
  }

  async create({ name, sender, gasLimit, version, desc, code, useRegisterGas }, trs) {
    trs.recipientId = null // wxm block database
    trs.amount = '0' // Bignum update

    const id = await this.dao.autoId.generateId('CONTRACT')

    const contract = {
      id,
      name,
      transactionId: trs.id,
      ownerId: sender.address,
      state: 0,
      code,
      desc,
      version,
      gasLimit: gasLimit,
      timestamp: trs.timestamp
    }
    trs.asset.contract = contract

    return trs
  }

  async calculateFee() {
    return bignum.multiply(this.constants.net.fees.contract, this.constants.fixedPoint)
  }

  async verify(trs, sender) {
    if (trs.recipientId) {
      throw new Error('Invalid recipient')
    }

    if (!trs.asset || !trs.asset.contract) {
      throw new Error('Invalid transaction asset')
    }

    const { id, name, code, desc, version, gasLimit } = trs.asset.contract
    // const contract_id = await crypto.generateContractAddress(
    //   { name, gasLimit, owner, desc, version, code },
    //   this.constants.tokenPrefix
    // )
    // if (!contract_id || contract_id !== id) throw new Error('contract id is not correct')
    this.logger.debug('contract id: ', id, this.constants.contractPrefix)
    // if (!crypto.isContractAddress(id, this.constants.contractPrefix)) throw new Error('contract id is not correct')

    if (desc && desc.length >= 255) {
      throw new Error('desc is too long')
    }

    if (version && version.length >= 32) {
      throw new Error('version is too long')
    }

    if (!code || code.length >= this.constants.maxCodeSize) {
      throw new Error('code size should be less than 32k')
    }

    if (name.length > 32) {
      throw new Error(`name ${name} is too long. Maximum is 32 characters`)
    }

    // if (this.address.isAddress(name)) {
    //   throw new Error('name can not be a potential address')
    // }

    const checkResult = await this.runtime.energy.checkGas(sender.address, gasLimit)
    if (!checkResult.enough) {
      throw new Error('Gas is not enough')
    }

    try {
      // 编译合约代码，获取编译后的代码和元数据
      const compileResult = await this.runtime.compiler.compile(code)

      if (!compileResult || !compileResult.compiledCode || !compileResult.metadata) {
        throw new Error('Invalid compilation result')
      }

      // 将元数据转换为JSON字符串并保存到合约对象中
      trs.asset.contract.metadata = JSON.stringify(compileResult.metadata.toJSONObject())

      // 可选：保存编译后的代码，如果需要的话
      // trs.asset.contract.compiledCode = compileResult.compiledCode

      this.logger.debug(`Contract metadata generated for ${name}`)
    } catch (error) {
      this.logger.error('Failed to compile contract', error)
      throw new Error('Failed to compile contract: ' + (error.message || error))
    }

    return trs
  }

  async process(trs) {
    return trs
  }

  async getBytes({ asset }) {
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

  async isSupportLock() {
    return false
  }

  async apply(trs, block, sender, dbTrans) {
    await this.runtime.energy.register(trs, block, sender, dbTrans)
  }

  async undo(trs, _, sender, dbTrans) {
    await this.dao.remove('contract', { where: { transactionId: trs.id }, transaction: dbTrans })
  }

  async applyUnconfirmed(trs, sender) { }

  async undoUnconfirmed(trs, sender) { }

  async objectNormalize(trs) {
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

  async dbRead(raw) {
    // if (!raw.asset_trs_id) {
    //   return null
    // }

    // // id等信息在 energy.js 里处理
    // const contract = {
    //   name: raw.asset_str2,
    //   owner: raw.asset_str3,
    //   desc: raw.asset_str4,
    //   version: raw.asset_str5,
    //   gasLimit: raw.asset_int1
    // }

    // // 处理扩展JSON数据，获取代码
    // if (raw.asset_ext_json) {
    //   try {
    //     const jsonObj = JSON.parse(raw.asset_ext_json)
    //     if (jsonObj.code) {
    //       contract.code = jsonObj.code
    //     }
    //   } catch (err) {
    //     this.logger.error("Can't parse contract asset extend data", err)
    //   }
    // }

    // return { contract }
    return raw
  }

  /**
   * 将合约交易存储到数据库中
   * @param {*} trs 交易对象
   * @param {*} dbTrans 数据库事务
   */
  async dbSave(trs, dbTrans) {
    const assetName = 'contract'
    const asset = trs.asset[assetName]

    asset.transactionId = trs.id
    asset.timestamp = trs.timestamp

    // 如果合约id未定义，则生成一个
    if (!asset.id) {
      asset.id = await crypto.generateContractAddress(
        { name: asset.name, gasLimit: asset.gasLimit, owner: asset.owner, desc: asset.desc, version: asset.version, code: asset.code },
        this.constants.tokenPrefix
      );
    }

    // 确保元数据存在
    if (!asset.metadata) {
      this.logger.warn(`Contract ${asset.id} has no metadata, attempting to generate it`);
      try {
        // 如果元数据不存在，尝试重新编译生成
        const compileResult = await this.runtime.compiler.compile(asset.code);
        if (compileResult && compileResult.metadata) {
          asset.metadata = JSON.stringify(compileResult.metadata.toJSONObject());
          this.logger.debug(`Generated metadata for contract ${asset.id}`);
        } else {
          this.logger.warn(`Failed to generate metadata for contract ${asset.id}`);
        }
      } catch (err) {
        this.logger.error(`Error generating metadata for contract ${asset.id}:`, err);
        // 继续保存合约，即使没有元数据
      }
    }

    try {
      await this.dao.insert('contract', asset, { transaction: dbTrans })
      this.logger.debug(`Contract ${asset.id} saved to database with metadata: ${!!asset.metadata}`);
    } catch (error) {
      this.logger.error(`Asset for transaction ${trs.id} save fail:`, error);
      throw error;
    }
  }

  async ready({ signatures }, { multisignatures, multimin }) {
    if (Array.isArray(multisignatures) && multisignatures.length) {
      if (!signatures) {
        return false
      }
      return signatures.length >= multimin - 1
    } else {
      return true
    }
  }

  /**
   * Get contract details
   * @param id  contract id
   * @returns contract detail { contract : { id, name, transactionId, id, owner, vmVersion,
   * desc, timestamp, metadata } }
   */
  async getContracts(req, res) {
    const where = {
      trs_type: await this.getTransactionType()
    }

    if (req.query.name) {
      where.name = req.query.name.toLowerCase()
    }
    if (req.query.timestamp) {
      where.timestamp = {
        $gt: req.query.timestamp
      }
    }

    const pageIndex = req.query.pageindex || 1
    const pageSize = req.query.pagesize || 50

    return await new Promise((resolve, reject) => {
      this.queryAsset(where, [], true, pageIndex, pageSize)
        .then(rows => {
          resolve({ success: true, state: 0, result: rows })
        })
        .catch(err => {
          this.logger.error('contract error', err)
          reject(err)
        })
    })

    // return { success: true, contract };
    // } catch (err) {
    //   this.logger.error('Error getting contract:', err);
    //   return { success: false, error: err.message };
    // }
  }
}

export default Contract
