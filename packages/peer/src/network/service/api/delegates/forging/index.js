import DdnCrypto from '@ddn/crypto'
import DdnUtils from '@ddn/utils'

/**
 * RootRouter接口
 * wangxm   2019-03-22
 */
class RootRouter {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async getGetForgedByAccount (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        generatorPublicKey: {
          type: 'string',
          format: 'publicKey'
        }
      },
      required: ['generatorPublicKey']
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const account = await this.runtime.account.getAccountByPublicKey(query.generatorPublicKey)
    if (!account) {
      throw new Error('Account not found')
    }

    return {
      fees: `${account.fees}`, // DdnUtils.bignum update
      rewards: `${account.rewards}`,
      forged: DdnUtils.bignum.plus(account.fees, account.rewards).toString()
    }
  }

  async postEnable (req) {
    const body = req.body
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        secret: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        publicKey: {
          type: 'string',
          format: 'publicKey'
        }
      },
      required: ['secret']
    }, body)
    if (validateErrors) {
      return { success: false, error: validateErrors[0].message }
    }

    const ip = req.connection.remoteAddress
    if (this.config.forging.access.whiteList.length > 0 &&
            !this.config.forging.access.whiteList.includes(ip)) {
      return { success: false, error: 'Access denied' }
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    if (body.publicKey) {
      if (keypair.publicKey !== body.publicKey) {
        return { success: false, error: 'Invalid passphrase' }
      }
    }

    const myDelegate = await this.runtime.delegate.getMyDelegateByPublicKey(keypair.publicKey)
    if (myDelegate) {
      return { success: false, error: 'Forging is already enabled' }
    }

    let account
    try {
      account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey)
    } catch (err) {
      return { success: false, error: err.toString() }
    }

    if (account && account.is_delegate) { // wxm block database
      await this.runtime.delegate.enableForged(keypair)
      this.logger.info(`Forging enabled on account: ${account.address}`)
      return { success: true, address: account.address }
    } else {
      return { success: false, error: 'Delegate not found' }
    }
  }

  async postDisable (req) {
    const body = req.body
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        secret: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        publicKey: {
          type: 'string',
          format: 'publicKey'
        }
      },
      required: ['secret']
    }, body)
    if (validateErrors) {
      return { success: false, error: validateErrors[0].message }
    }

    const ip = req.connection.remoteAddress
    if (this.config.forging.access.whiteList.length > 0 &&
            !this.config.forging.access.whiteList.includes(ip)) {
      return { success: false, error: 'Access denied' }
    }

    const keypair = DdnCrypto.getKeys(body.secret)
    if (body.publicKey) {
      if (keypair.publicKey !== body.publicKey) {
        return { success: false, error: 'Invalid passphrase' }
      }
    }

    const myDelegate = await this.runtime.delegate.getMyDelegateByPublicKey(keypair.publicKey)
    if (!myDelegate) {
      return { success: false, error: 'Delegate not found' }
    }

    let account
    try {
      account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey)
    } catch (err) {
      return { success: false, error: err.toString() }
    }

    if (account && account.is_delegate) { // wxm block database
      await this.runtime.delegate.disableForgedByPublicKey(keypair.publicKey)
      this.logger.info(`Forging disabled on account: ${account.address}`)
      return { success: true, address: account.address }
    } else {
      return { success: false, error: 'Delegate not found' }
    }
  }

  async getStatus (req) {
    const query = req.query
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          format: 'publicKey'
        }
      },
      required: ['publicKey']
    }, query)
    if (validateErrors) {
      return { success: false, error: validateErrors[0].message }
    }

    const delegate = await this.runtime.delegate.getMyDelegateByPublicKey(query.publicKey)
    return { success: true, enabled: !!delegate }
  }
}

export default RootRouter
