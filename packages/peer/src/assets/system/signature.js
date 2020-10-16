/**
 * Signatures
 * wangxm   2019-03-25
 */
import DdnUtils from '@ddn/utils'
import ByteBuffer from 'bytebuffer'

class Signatures {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async create ({ second_keypair }, trs) {
    trs.recipientId = null
    trs.amount = '0'
    trs.asset.signature = {
      publicKey: second_keypair.publicKey.toString('hex')
    }
    return trs
  }

  async calculateFee (trs, sender) {
    return DdnUtils.bignum.multiply(this.constants.net.fees.signature, this.constants.fixedPoint)
  }

  async verify (trs, sender, cb) {
    if (!trs.asset.signature) {
      throw new Error('Invalid transaction asset')
    }

    if (!DdnUtils.bignum.isZero(trs.amount)) {
      throw new Error('Invalid transaction amount')
    }

    try {
      if (!trs.asset.signature.publicKey || Buffer.from(trs.asset.signature.publicKey, 'hex').length !== 32) {
        throw new Error('Invalid signature length')
      }
    } catch (e) {
      throw new Error('Invalid signature hex')
    }

    return trs
  }

  async process (trs, sender) {
    return trs
  }

  async getBytes ({ asset }) {
    try {
      var bb = new ByteBuffer(32, true)
      const publicKeyBuffer = Buffer.from(asset.signature.publicKey, 'hex')

      for (let i = 0; i < publicKeyBuffer.length; i++) {
        bb.writeByte(publicKeyBuffer[i])
      }

      bb.flip()
    } catch (e) {
      throw Error(e.toString())
    }
    return bb.toBuffer()
  }

  async isSupportLock () {
    return false
  }

  async apply ({ asset }, block, { address }, dbTrans) {
    const data = {
      address,
      second_signature: 1,
      u_second_signature: 0,
      second_public_key: asset.signature.publicKey
    }
    await this.runtime.account.setAccount(data, dbTrans)

    return await this.runtime.account.getAccountByAddress(address)
  }

  async undo (trs, block, { address }, dbTrans) {
    const data = {
      address,
      second_signature: 0,
      u_second_signature: 1,
      second_public_key: null
    }
    await this.runtime.account.setAccount(data, dbTrans)
    await this.deleteSignature(trs.id, dbTrans)
    return await this.runtime.account.getAccountByAddress(address)
  }

  /**
   * @description 回滚时删除对应的签名
   * @author created by wly
   * @param {*} transaction_id 交易id
   * @param {*} dbTrans 事物
   */
  async deleteSignature (transaction_id, dbTrans) {
    return new Promise((resolve, reject) => {
      this.dao.remove(
        'signature',
        {
          transaction_id
        },
        dbTrans,
        err => {
          if (err) {
            return reject(err)
          }
          resolve(true)
        }
      )
    })
  }

  async applyUnconfirmed ({ type }, { address }, dbTrans) {
    // if (sender.second_signature) {
    //     throw new Error('Double set second signature');
    // }

    const key = `${address}:${type}`
    if (this.oneoff.has(key)) {
      throw new Error('Double submit second signature')
    }

    this.oneoff.set(key, true)
  }

  async undoUnconfirmed ({ type }, { address }, dbTrans) {
    const key = `${address}:${type}`
    this.oneoff.delete(key)

    const data = { address, u_second_signature: 0 }
    await this.runtime.account.setAccount(data, dbTrans)

    return await this.runtime.account.getAccountByAddress(address)
  }

  async objectNormalize (trs) {
    const validateErros = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          publicKey: {
            type: 'string',
            format: 'publicKey'
          }
        },
        required: ['publicKey']
      },
      trs.asset.signature
    )
    if (validateErros) {
      throw new Error(validateErros[0].message)
    }

    return trs
  }

  async dbRead ({ s_publicKey, t_id }) {
    if (!s_publicKey) {
      return null
    } else {
      const signature = {
        transaction_id: t_id,
        publicKey: s_publicKey
      }

      return { signature }
    }
  }

  async dbSave ({ id, asset }, dbTrans) {
    // var publicKey = Buffer.from(trs.asset.signature.publicKey, 'hex');
    const obj = {
      transaction_id: id,
      publicKey: asset.signature.publicKey
    }

    return new Promise((resolve, reject) => {
      this.dao.insert('signature', obj, dbTrans, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  ready ({ signatures }, { multisignatures, multimin }) {
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

export default Signatures
