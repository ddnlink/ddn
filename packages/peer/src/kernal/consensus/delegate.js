/**
 * Delegate
 * wangxm   2018-01-08
 */
import * as DdnCrypto from '@ddn/crypto'
import { createHash } from '@ddn/crypto'
import { bignum } from '@ddn/utils'

let _singleton

class Delegate {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new Delegate(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context

    this._myDelegateKeypairs = {}
    this._myDelegateNum = 0

    this._forgingEanbled = true
  }

  /**
   * 当前节点是否允许区块铸造
   */
  isForgeEnabled () {
    return this._forgingEanbled
  }

  /**
   * 授权可以铸块
   */
  enableForging () {
    this._forgingEanbled = true
  }

  /**
   * 授权不允许铸块
   */
  disableForging () {
    this._forgingEanbled = false
  }

  /**
   * 判断当前节点是否配置有有效受托人信息
   */
  hasValidDelegates () {
    return this._myDelegateNum > 0
  }

  /**
   * Get my able forging delegate
   * @param {object} keypair *
   */
  async enableForged (keypair) {
    this._myDelegateKeypairs[keypair.publicKey.toString('hex')] = keypair
  }

  async disableForgedByPublicKey (publicKey) {
    delete this._myDelegateKeypairs[publicKey]
  }

  async getMyDelegateByPublicKey (publicKey) {
    return this._myDelegateKeypairs[publicKey]
  }

  async prepare () {
    let secrets = null
    if (this.config.forging.secret) {
      secrets = Array.isArray(this.config.forging.secret) ? this.config.forging.secret : [this.config.forging.secret]
    }

    const delegateKeypairs = {}
    const delegatePublicKeys = []
    for (let i = 0; i < secrets.length; i++) {
      const keypair = DdnCrypto.getKeys(secrets[i])

      delegateKeypairs[keypair.publicKey] = keypair

      delegatePublicKeys.push(keypair.publicKey)
    }

    const accounts = await this.runtime.account.getAccountList({
      publicKey: {
        // wxm block database
        $in: delegatePublicKeys
      },
      limit: delegatePublicKeys.length
    })

    if (accounts && accounts.length === delegatePublicKeys.length) {
      accounts.forEach(account => {
        if (account.is_delegate) {
          this._myDelegateKeypairs[account.publicKey] = delegateKeypairs[account.publicKey] // wxm block database
          this._myDelegateNum++
          this.logger.info(`Forging enabled on account: ${account.address}`)
        } else {
          this.logger.info(`Delegate with this public key not found: ${account.publicKey}`) // wxm block database
        }
      })
    } else {
      this.logger.info('Delegates not found.')
    }
  }

  async checkDelegates (publicKey, votes) {
    if (Array.isArray(votes)) {
      const account = await this.runtime.account.getAccountByPublicKey(publicKey)
      if (!account) {
        throw new Error('Account not found')
      }

      const existing_votes = account.delegates ? account.delegates.length : 0
      let additions = 0
      let removals = 0

      for (let i = 0; i < votes.length; i++) {
        const action = votes[i]

        const math = action[0]
        if (math !== '+' && math !== '-') {
          throw new Error('Invalid math operator')
        }

        if (math === '+') {
          additions += 1
        } else if (math === '-') {
          removals += 1
        }

        const publicKey2 = action.slice(1)
        try {
          Buffer.from(publicKey2, 'hex')
        } catch (e) {
          throw new Error('Invalid public key')
        }

        if (math === '+' && account.delegates !== null && account.delegates.includes(publicKey2)) {
          throw new Error('Failed to add vote, account has already voted for this delegate')
        }
        if (math === '-' && (account.delegates === null || !account.delegates.includes(publicKey2))) {
          throw new Error('Failed to remove vote, account has not voted for this delegate')
        }

        const account2 = await this.runtime.account.getAccount({
          publicKey: publicKey2,
          is_delegate: 1
        })
        if (!account2) {
          throw new Error('Delegate not found')
        }
      }

      const total_votes = existing_votes + additions - removals
      if (total_votes > this.constants.delegates) {
        const exceeded = total_votes - this.constants.delegates
        throw new Error(`Maximum number ${this.constants.delegates} votes exceeded (${exceeded} too many).`)
      }
    } else {
      throw new Error('Please provide an array of votes')
    }
  }

  // todo: 2020.10.2 待优化，包含 getAccountList 方法
  async getDelegates (query) {
    if (!query) {
      throw new Error('Missing query argument')
    }

    const delegates = await this.runtime.account.getAccountList(
      {
        is_delegate: 1, // wxm block database
        sort: [
          ['vote', 'DESC'],
          ['publicKey', 'ASC']
        ] // wxm block database
      },
      ['username', 'address', 'publicKey', 'vote', 'missedblocks', 'producedblocks', 'fees', 'rewards', 'balance']
    )

    let limit = query.limit || this.constants.delegates
    const offset = query.offset || 0
    let orderField = query.orderBy || 'rate:asc'

    orderField = orderField ? orderField.split(':') : null
    limit = limit > this.constants.delegates ? this.constants.delegates : limit

    const orderBy = orderField ? orderField[0] : null
    const sortMode = orderField && orderField.length === 2 ? orderField[1] : 'asc'

    const count = delegates.length
    // const length = Math.min(limit, count);
    const realLimit = Math.min(offset + limit, count)

    const lastBlock = this.runtime.block.getLastBlock()
    const totalSupply = this.runtime.block.getBlockStatus().calcSupply(lastBlock.height)

    for (let i = 0; i < delegates.length; i++) {
      delegates[i].rate = i + 1
      delegates[i].approval = bignum.divide(delegates[i].vote, totalSupply).toNumber()
      delegates[i].approval = Math.round(delegates[i].approval * 1e2)

      let percent = 100 - delegates[i].missedblocks / ((delegates[i].producedblocks + delegates[i].missedblocks) / 100)
      percent = Math.abs(percent) || 0

      const outsider = i + 1 > this.constants.delegates
      delegates[i].productivity = !outsider ? Math.round(percent * 1e2) / 1e2 : 0

      delegates[i].forged = bignum.plus(delegates[i].fees, delegates[i].rewards).toString()
    }

    return {
      delegates,
      sortMode,
      orderBy,
      count,
      offset,
      limit: realLimit
    }
  }

  /**
   * 返回所有受托人的public_key列表
   */
  async getDelegatePublickKeysSortByVote () {
    const delegates = await this.runtime.account.getAccountList(
      {
        is_delegate: 1, // wxm block database
        // sort: {"vote": -1, "publicKey": 1},
        sort: [
          ['vote', 'DESC'],
          ['publicKey', 'ASC']
        ], // wxm block database
        limit: this.constants.delegates
      },
      ['publicKey', 'vote']
    )

    if (!delegates || !delegates.length) {
      throw new Error('No active delegates found')
    }

    return delegates.map(({ publicKey }) => publicKey)
  }

  /**
   * 返回乱序处理的受托人public_key列表
   */
  async getDisorderDelegatePublicKeys (height) {
    let truncDelegateList
    try {
      truncDelegateList = await this.getDelegatePublickKeysSortByVote()
    } catch (err) {
      this.logger.error('************* Cannot get delegate list ************' + err.toString())
      throw err
    }

    const seedSource = await this.runtime.round.getRound(height).toString()
    // wxm 对查询返回的受托人列表进行乱序处理
    // let currentSeed = nacl.hash(Buffer.from(seedSource))
    let currentSeed = createHash(Buffer.from(seedSource))
    for (let i = 0, delCount = truncDelegateList.length; i < delCount; i++) {
      for (let x = 0; x < 4 && i < delCount; i++, x++) {
        const newIndex = currentSeed[x] % delCount
        const b = truncDelegateList[newIndex]
        truncDelegateList[newIndex] = truncDelegateList[i]
        truncDelegateList[i] = b
      }
      currentSeed = createHash(Buffer.from(currentSeed))
    }

    return truncDelegateList
  }

  /**
   * 返回当前所有受托人列表中 在本地节点配置中 存在的私钥信息
   * @param {*} height
   */
  async getActiveDelegateKeypairs (height) {
    const delegates = await this.getDisorderDelegatePublicKeys(height)

    const results = []
    for (const key in this._myDelegateKeypairs) {
      if (delegates.includes(key)) {
        results.push(this._myDelegateKeypairs[key])
      }
    }
    return results
  }

  /**
   * 返回当前时间当前节点接下来可以进行铸造区块的受托人信息和时间戳
   * @param {*} curSlot
   * @param {*} height
   */
  async getForgeDelegateWithCurrentTime (curSlot, height) {
    const activeDelegates = await this.getDisorderDelegatePublicKeys(height)

    let currentSlot = curSlot
    const lastSlot = this.runtime.slot.getLastSlot(currentSlot)
    for (; currentSlot < lastSlot; currentSlot += 1) {
      const delegatePublicKey = activeDelegates[currentSlot % this.constants.delegates]
      if (delegatePublicKey && this._myDelegateKeypairs[delegatePublicKey]) {
        return {
          time: this.runtime.slot.getSlotTime(currentSlot),
          keypair: this._myDelegateKeypairs[delegatePublicKey]
        }
      }
    }
    return null
  }

  async validateBlockSlot ({ height, timestamp, generator_public_key }) {
    const activeDelegates = await this.getDisorderDelegatePublicKeys(height)

    const currentSlot = this.runtime.slot.getSlotNumber(timestamp)
    const delegateKey = activeDelegates[currentSlot % this.constants.delegates]

    if (delegateKey && generator_public_key === delegateKey) {
      return
    }
    throw new Error(
      `Failed to verify slot, expected delegate: ${generator_public_key}, gotten delegate: ${delegateKey}`
    )
  }

  async validateProposeSlot ({ height, timestamp, generator_public_key }) {
    const activeDelegates = await this.getDisorderDelegatePublicKeys(height)
    const currentSlot = this.runtime.slot.getSlotNumber(timestamp)
    const delegateKey = activeDelegates[currentSlot % this.constants.delegates]
    if (delegateKey && generator_public_key === delegateKey) {
      return
    }
    throw new Error('Failed to validate propose slot')
  }

  /**
   * 该方法向forks_stats插入数据，但未在其他地方用该表数据
   * @param {*} block
   * @param {*} cause 原因，1~5
   */
  async fork (block, cause) {
    this.logger.info('Fork', {
      delegate: block.generator_public_key,
      block: {
        id: block.id,
        timestamp: block.timestamp,
        height: block.height,
        previous_block: block.previous_block
      },
      cause
    })

    return new Promise((resolve, reject) => {
      this.dao.insert(
        'forks_stat',
        {
          delegate_public_key: block.generator_public_key,
          block_timestamp: block.timestamp,
          block_id: block.id,
          block_height: block.height,
          previous_block: block.previous_block,
          cause
        },
        (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        }
      )
    })
  }
}

export default Delegate
