/**
 * 受托人资产交易
 * wangxm   2018-12-28
 */
import ByteBuffer from 'bytebuffer'
import { bignum } from '@ddn/utils'
import { getId } from '@ddn/crypto'

const MAX_CODE_SIZE = 32768

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
      publisher: sender.address,
      state: 0,
      code,
      desc,
      version,
      vmVersion: this.contract.vmVersion,
      useRegisterGas: useRegisterGas !== false ? 1 : 0,
      gas_limit: gasLimit,
      timestamp: trs.timestamp
    }
    const id = await getId(contract)
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

    const { id, name, code, desc, version, gas_limit } = trs.asset.contract

    if (!id || !id.length) {
      throw new Error('id is not exist')
    }

    if (desc && desc.length >= 255) {
      throw new Error('desc is too long')
    }

    if (version && version.length >= 32) {
      throw new Error('version is too long')
    }

    if (!code || code.length >= MAX_CODE_SIZE) {
      throw new Error('code size should be less than 32k')
    }

    const checkResult = await this.runtime.energy.checkGas(sender.address, gas_limit)

    if (!checkResult.enough) {
      throw new Error('Gas is not enough')
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
    const { id, height, delegate, prevBlockId, payloadHash, timestamp } = this.runtime.block.getLastBlock()
    const lastBlock = { id, height, delegate, prevBlockId, payloadHash, timestamp }
    const context = { senderAddress: sender.address, transaction: trs, block, lastBlock, sender }
    const contract = trs.asset.contract

    console.log('create contract ', contract)

    const checkResult = await this.runtime.energy.checkGas(sender.address, contract.gas_limit)

    const publishResult = await this.runtime.dvm.publishContract(
      contract.gas_limit,
      context,
      contract.id,
      contract.name,
      contract.code
    )

    const resultData = publishResult.data
    if (publishResult.success) {
      contract.metadata = JSON.stringify(resultData)
    }
    publishResult.data = undefined

    await this.runtime.energy.handleResult(contract.id, publishResult, trs, block.height, checkResult.payer, dbTrans)

    // create contract account
    const data = {
      address: contract.id,
      u_is_delegate: 0, // wxm block database
      is_delegate: 0, // wxm block database
      vote: 0
    }

    if (contract.name) {
      data.u_username = null
      data.username = contract.name
    }
    this.runtime.account.setAccount(data)

    // return publishResult
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
    await this.dao.remove('contract', { where: { transaction_id: id }, transaction: dbTrans })
  }

  async applyUnconfirmed (trs, sender) {}

  async undoUnconfirmed (trs, sender) {}

  async objectNormalize (trs) {
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
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
        required: ['id', 'name', 'version', 'code']
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
    return raw
  }

  // 替换dbSave方法 ---wly
  /**
   * 功能:新增一条contract数据
   */
  async dbSave (trs, dbTrans) {
    return await this.dao.insert(
      'contract',
      {
        ...trs.asset.contract,
        transaction_id: trs.id,
        publisher: trs.senderId,
        vmVersion: this.runtime.dvm.vmVersion,
        state: 0,
        useRegisterGas: trs.asset.contract.useRegisterGas !== false ? 1 : 0,
        timestamp: trs.timestamp
      },
      {
        transaction: dbTrans
      }
    )
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
