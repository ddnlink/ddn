/**
 * 执行合约
 * tailor   2018-12-28
 */
import ByteBuffer from 'bytebuffer'
import { bignum } from '@ddn/utils'
// import { getId } from '@ddn/crypto'

// const MAX_CODE_SIZE = 32768

class ContractExecute {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async create ({ address, sender, gasLimit, method, args }, trs) {
    trs.recipientId = null // wxm block database
    trs.amount = '0' // Bignum update

    const exe = {
      id: address,
      gas_limit: gasLimit,
      method,
      transaction_id: trs.id,
      timestamp: trs.timestamp
    }

    trs.asset.execute = exe

    return trs
  }

  async calculateFee () {
    return bignum.multiply(this.constants.net.fees.contract, this.constants.fixedPoint)
  }

  async verify (trs) {
    if (trs.recipientId) {
      throw new Error('Invalid recipient')
    }

    if (!trs.asset || !trs.asset.execute) {
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
    bb.writeUTF8String(asset.contractResult.contractId)
    bb.writeUTF8String(asset.contractResult.transactionId)
    bb.writeUTF8String(asset.contractResult.success)
    bb.writeUTF8String(asset.contractResult.error)
    bb.writeUTF8String(asset.contractResult.gas)
    bb.writeUTF8String(asset.contractResult.stateChangesHash)
    bb.writeUTF8String(asset.contractResult.data)
    bb.writeUTF8String(asset.contractResult.timestamp)
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
    const exe = trs.asset.execute // { address, gas_limit, method, args }

    const checkResult = await this.runtime.energy.checkGas(sender.address, exe.gas_limit)

    try {
      const exeResult = await this.runtime.dvm.executeContract(exe.gas_limit, context, exe.address, exe.method)

      // const resultData = exeResult.data
      exeResult.data = undefined

      await this.runtime.energy.handleResult(exe.address, exeResult, trs, block.height, checkResult.payer, dbTrans)
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
      trs.asset.execute
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
    // return await this.dao.insert('contract', {
    //   ...trs.asset.contract,
    //   transaction_id: trs.id,
    //   public_key: trs.senderPublicKey,
    //   vmVersion: this.runtime.dvm.vmVersion,
    //   state: 0,
    //   useRegisterGas: trs.asset.contract.useRegisterGas !== false ? 1 : 0,
    //   timestamp: trs.timestamp,
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

export default ContractExecute
