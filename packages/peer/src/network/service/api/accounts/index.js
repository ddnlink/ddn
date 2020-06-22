import DdnCrypto from '@ddn/crypto'
import Mnemonic from 'bitcore-mnemonic'

/**
 * AccountService 接口
 * wangxm   2019-03-22
 */
class AccountService {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async get (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        address: {
          type: 'string',
          minLength: 1
        }
      },
      required: ['address']
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    let account = await this.runtime.account.getAccountByAddress(query.address)
    if (!account) {
      account = {
        address: query.address,
        u_balance: 0,
        balance: 0,
        publicKey: '',
        u_second_signature: '',
        second_signature: '',
        second_public_key: '',
        multisignatures: '',
        u_multisignatures: '',
        lock_height: '0',
        username: ''
      }
    }

    const lastBlock = this.runtime.block.getLastBlock()
    return {
      success: true,
      account: {
        address: account.address,
        unconfirmed_balance: account.u_balance,
        balance: account.balance,
        publicKey: account.publicKey,
        username: account.username,
        unconfirmed_signature: account.u_second_signature,
        second_signature: account.second_signature,
        second_public_key: account.second_public_key,
        multisignatures: account.multisignatures,
        u_multisignatures: account.u_multisignatures,
        lock_height: `${account.lock_height}`
      },
      latestBlock: {
        height: `${lastBlock.height}`,
        timestamp: lastBlock.timestamp
      },
      version: await this.runtime.peer.version()
    }
  }

  async getGetBalance (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        address: {
          type: 'string',
          minLength: 1,
          maxLength: 50
        }
      },
      required: ['address']
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    if (!this.runtime.account.isAddress(query.address)) {
      throw new Error('Invalid address')
    }

    const account = await this.runtime.account.getAccountByAddress(query.address)
    const balance = account ? account.balance : 0
    const unconfirmedBalance = account ? account.u_balance : 0
    return { success: true, balance, unconfirmedBalance }
  }

  async getGetPublicKey (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        address: {
          type: 'string',
          minLength: 1
        }
      },
      required: ['address']
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const account = await this.runtime.account.getAccountByAddress(query.address)
    if (!account || !account.publicKey) {
      throw new Error('Account does not have a public key')
    }
    return { success: true, publicKey: account.publicKey }
  }

  async postGeneratePublicKey (req) {
    const body = req.body
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        secret: {
          type: 'string',
          minLength: 1
        }
      },
      required: ['secret']
    }, body)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    const publicKey = keypair.publicKey
    const address = this.runtime.account.generateAddressByPublicKey(publicKey)
    let account = await this.runtime.account.getAccountByAddress(address)
    if (!account) {
      account = {
        address,
        u_balance: 0,
        balance: 0,
        publicKey,
        u_second_public_key: '',
        second_signature: '',
        second_public_key: '',
        multisignatures: '',
        u_multisignatures: ''
      }
    }

    return {
      success: true,
      publicKey: account ? account.publicKey : null
    }
  }

  async getNew (req) {
    const query = Object.assign({}, req.body, req.query)
    let ent = Number(query.ent)
    if (![128, 256, 384].includes(ent)) {
      ent = 128
    }

    const secret = new Mnemonic(ent).toString()
    const keypair = DdnCrypto.getKeys(secret)

    const address = this.runtime.account.generateAddressByPublicKey(keypair.publicKey)

    return {
      secret,
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,
      address
    }
  }

  async getTop (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          minimum: 0,
          maximum: 100
        },
        offset: {
          type: 'integer',
          minimum: 0
        }
      }
    }, query)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    if (!query.limit) {
      query.limit = 100
    }

    const queryResult = await this.runtime.account.getAccountList({
      sort: [['balance', 'DESC']], // wxm block database
      offset: query.offset,
      limit: query.limit
    })
    const accounts = queryResult.map(({ address, balance, publicKey }) => ({
      address,
      balance,
      publicKey
    }))
    return { success: true, accounts }
  }

  async getCount (req) {
    const count = await new Promise((resolve, reject) => {
      this.dao.count('mem_account', null,
        (err, count) => {
          if (err) {
            reject(err || 'Database error')
          } else {
            resolve(count)
          }
        })
    })
    return { success: true, count }
  }

  async postOpen (req) {
    const body = req.body
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        secret: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        }
      },
      required: ['secret']
    }, body)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    const publicKey = keypair.publicKey
    const address = this.runtime.account.generateAddressByPublicKey(publicKey)
    let account = await this.runtime.account.getAccountByAddress(address)
    if (!account) {
      account = {
        address,
        u_balance: 0,
        balance: 0,
        publicKey,
        u_second_signature: '',
        second_signature: '',
        second_public_key: '',
        multisignatures: '',
        u_multisignatures: ''
      }
    }

    return {
      success: true,
      account: {
        address: account.address,
        unconfirmed_balance: account.u_balance,
        balance: account.balance,
        publicKey: account.publicKey,
        unconfirmed_signature: account.u_second_signature,
        second_signature: account.second_signature,
        second_public_key: account.second_public_key,
        multisignatures: account.multisignatures,
        u_multisignatures: account.u_multisignatures,
        lock_height: account.lock_height || 0
      }
    }
  }

  async postOpen2 (req) {
    const body = req.body
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          format: 'publicKey'
        }
      },
      required: ['publicKey']
    }, body)
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const address = this.runtime.account.generateAddressByPublicKey(body.publicKey)
    let account = await this.runtime.account.getAccountByAddress(address)
    if (!account) {
      account = {
        address,
        u_balance: 0,
        balance: 0,
        publicKey: body.publicKey,
        u_second_signature: '',
        second_signature: '',
        second_public_key: '',
        multisignatures: '',
        u_multisignatures: ''
      }
    }

    const accountData = {
      address: account.address,
      unconfirmed_balance: account.u_balance,
      balance: account.balance,
      publicKey: account.publicKey,
      unconfirmed_signature: account.u_second_signature,
      second_signature: account.second_signature,
      second_public_key: account.second_public_key,
      multisignatures: account.multisignatures,
      u_multisignatures: account.u_multisignatures,
      lock_height: account.lock_height || 0
    }

    const lastBlock = this.runtime.block.getLastBlock()

    return {
      success: true,
      account: accountData,
      latestBlock: {
        height: `${lastBlock.height}`,
        timestamp: lastBlock.timestamp
      },
      version: await this.runtime.peer.version()
    }
  }
}

export default AccountService
