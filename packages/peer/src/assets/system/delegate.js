/**
 * 受托人资产交易
 * wangxm   2018-12-28
 */
import ByteBuffer from 'bytebuffer'
import DdnUtils from '@ddn/utils'

class Delegate {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async create ({ username, sender }, trs) {
    trs.recipientId = null // wxm block database
    trs.amount = '0' // Bignum update
    trs.asset.delegate = {
      username,
      publicKey: sender.publicKey // wxm block database
    }

    if (trs.asset.delegate.username) {
      trs.asset.delegate.username = trs.asset.delegate.username.toLowerCase().trim()
    }

    return trs
  }

  async calculateFee () {
    return DdnUtils.bignum.multiply(this.constants.net.fees.delegate, this.constants.fixedPoint)
  }

  async verify (trs, { is_delegate }) {
    if (trs.recipientId) {
      throw new Error('Invalid recipient')
    }

    if (!DdnUtils.bignum.isZero(trs.amount)) {
      throw new Error('Invalid transaction amount')
    }

    if (is_delegate) { // wxm block database
      throw new Error('Account is already a delegate')
    }

    if (!trs.asset || !trs.asset.delegate) {
      throw new Error('Invalid transaction asset')
    }

    if (!trs.asset.delegate.username) {
      throw new Error('Username is undefined')
    }

    const allowSymbols = /^[a-z0-9!@$&_.]+$/g

    const username = String(trs.asset.delegate.username).toLowerCase().trim()

    if (username === '') {
      throw new Error('Empty username')
    }

    if (username.length > 20) {
      throw new Error('Username is too long. Maximum is 20 characters')
    }

    if (this.address.isAddress(username)) {
      throw new Error('Username can not be a potential address')
    }

    if (!allowSymbols.test(username)) {
      throw new Error('Username can only contain alphanumeric characters with the exception of !@$&_.')
    }

    const account = await this.runtime.account.getAccount({ username })
    if (account) {
      throw new Error('Username already exists')
    }

    return trs
  }

  async process (trs) {
    return trs
  }

  async getBytes ({ asset }) {
    if (!asset.delegate.username) {
      return null
    }

    const bb = new ByteBuffer()
    bb.writeUTF8String(asset.delegate.username)
    bb.flip()
    return bb.toBuffer()
  }

  async isSupportLock () {
    return false
  }

  async apply ({ asset }, block, { address }, dbTrans) {
    const data = {
      address,
      u_is_delegate: 0, // wxm block database
      is_delegate: 1, // wxm block database
      vote: 0
    }

    if (asset.delegate.username) {
      data.u_username = null
      data.username = asset.delegate.username
    }

    await this.runtime.account.setAccount(data, dbTrans)

    return await this.runtime.account.getAccountByAddress(address)
  }

  async undo ({ asset }, { address, nameexist }, dbTrans) {
    const data = {
      address,
      u_is_delegate: 1, // wxm block database
      is_delegate: 0, // wxm block database
      vote: 0
    }

    if (!nameexist && asset.delegate.username) {
      data.username = null
      data.u_username = asset.delegate.username
    }

    await this.runtime.account.setAccount(data, dbTrans)

    return await this.runtime.account.getAccountByAddress(address)
  }

  async applyUnconfirmed ({ asset, type }, { isDelegate, address }) {
    if (isDelegate) {
      throw new Error('Account is already a delegate')
    }

    const nameKey = `${asset.delegate.username}:${type}`
    const idKey = `${address}:${type}`
    if (this.oneoff.has(nameKey) || this.oneoff.has(idKey)) {
      throw new Error('Double submit')
    }

    this.oneoff.set(nameKey, true)
    this.oneoff.set(idKey, true)
  }

  async undoUnconfirmed ({ asset, type }, { address }) {
    const nameKey = `${asset.delegate.name}:${type}`
    const idKey = `${address}:${type}`
    this.oneoff.delete(nameKey)
    this.oneoff.delete(idKey)
  }

  async objectNormalize (trs) {
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          format: 'publicKey'
        }
      },
      required: ['publicKey']
    }, trs.asset.delegate)
    if (validateErrors) {
      throw new Error(`Can't verify delegate transaction, incorrect parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    return trs
  }

  async dbRead ({ d_username, t_senderPublicKey, t_senderId }) {
    if (!d_username) {
      return null
    } else {
      const delegate = {
        username: d_username,
        publicKey: t_senderPublicKey, // wxm block database
        address: t_senderId
      }

      return { delegate }
    }
  }

  // 替换dbSave方法 ---wly
  /**
	 * 功能:新增一条delegate数据
	*/
  async dbSave ({ asset, id }, dbTrans) {
    return new Promise((resolve, reject) => {
      this.dao.insert('delegate', {
        username: asset.delegate.username,
        transaction_id: id
      }, dbTrans, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
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

export default Delegate
