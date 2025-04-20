/**
 * Consensus 共识
 * wangxm   2018-01-08
 */
// import ByteBuffer from 'bytebuffer'
import assert from 'assert'
// import ip from 'ip'
import * as DdnCrypto from '@ddn/crypto'
import { createHash } from '@ddn/crypto'
import { bignum } from '@ddn/utils'

let _singleton

class Consensus {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new Consensus(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  clearState () {
    this._pendingVotes = null
    this._votesKeySet = {}
    this._pendingBlock = null
  }

  getProposeHash (propose) {
    return createHash(DdnCrypto.getBytes(propose, true, true))
  }

  async createPropose (keypair, { generator_public_key, height, id, timestamp }, address) {
    assert(keypair.publicKey.toString('hex') === generator_public_key)
    const propose = {
      height,
      id,
      timestamp,
      generator_public_key, // wxm block database
      address
    }
    const hash = this.getProposeHash(propose)
    propose.hash = hash.toString('hex')
    // propose.signature = nacl.sign.detached(hash, Buffer.from(keypair.privateKey, 'hex'))
    propose.signature = await DdnCrypto.sign(propose, keypair)
    return propose
  }

  acceptPropose (propose) {
    const newPropose = {
      height: propose.height,
      id: propose.id,
      timestamp: propose.timestamp,
      generator_public_key: propose.generator_public_key,
      address: propose.address
    }
    const hash = this.getProposeHash(newPropose)
    if (propose.hash !== hash.toString('hex')) {
      throw new Error('Propose hash is not correct')
    }
    newPropose.hash = hash.toString('hex')
    const newHash = this.getProposeHash(newPropose)
    try {
      const signature = Buffer.from(propose.signature, 'hex')
      const publicKey = Buffer.from(propose.generator_public_key, 'hex') // wxm block database
      if (DdnCrypto.verifyHash(newHash, signature, publicKey)) {
        return
      } else {
        throw new Error('Vefify signature failed')
      }
    } catch (e) {
      throw new Error(`Verify signature exception: ${e.toString()}`)
    }
  }

  setPendingBlock (block) {
    this._pendingVotes = null
    this._votesKeySet = {}
    this._pendingBlock = block
  }

  getPendingBlock () {
    return this._pendingBlock
  }

  addPendingVotes ({ height, id, signatures }) {
    if (!this._pendingBlock || !bignum.isEqualTo(this._pendingBlock.height, height) || this._pendingBlock.id !== id) {
      return this._pendingVotes
    }

    for (let i = 0; i < signatures.length; ++i) {
      const item = signatures[i]

      if (this._votesKeySet[item.key]) {
        continue
      }

      if (this.verifyVote(height, id, item)) {
        this._votesKeySet[item.key] = true
        if (!this._pendingVotes) {
          this._pendingVotes = {
            height,
            id,
            signatures: []
          }
        }
        this._pendingVotes.signatures.push(item)
      }
    }
    return this._pendingVotes
  }

  hasPendingBlock (timestamp) {
    if (!this._pendingBlock) {
      return false
    }
    return this.runtime.slot.getSlotNumber(this._pendingBlock.timestamp) === this.runtime.slot.getSlotNumber(timestamp)
  }

  async normalizeVotes (votes) {
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          height: {
            type: 'string'
          },
          id: {
            type: 'string'
          },
          signatures: {
            type: 'array',
            minLength: 1,
            maxLength: this.constants.delegates
          }
        },
        required: ['height', 'id', 'signatures']
      },
      votes
    )
    if (validateErrors) {
      this.logger.error(`Consensus.normalizeVotes: ${validateErrors[0].message}`)
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    return votes
  }

  /**
   * 对当前高度的块进行hash，方便后面受托人签名（投票）
   * @param {string} height 高度
   * @param {string} id 块id
   */
  getVoteHash (height, id) {
    return createHash(DdnCrypto.getBytes({ height, id }, false, false, false))
    // const bytes = new ByteBuffer()

    // bytes.writeString(`${height}`)
    // bytes.writeString(id)

    // bytes.flip()
    // return createHash(bytes.toBuffer())
  }

  /**
   * 受托人给当前高度的区块签名
   * @param {array} keypairs 受托人公私钥对
   * @param {object} param1 块高度、id
   */
  createVotes (keypairs, { height, id }) {
    const hash = this.getVoteHash(height, id)
    const votes = {
      height,
      id,
      signatures: []
    }

    keypairs.forEach(el => {
      votes.signatures.push({
        key: el.publicKey.toString('hex'),
        sig: DdnCrypto.signWithHash(hash, el)
      })
    })

    return votes
  }

  verifyVote (height, id, { sig, key }) {
    try {
      const hash = this.getVoteHash(height, id)
      const signature = Buffer.from(sig, 'hex')
      const publicKey = Buffer.from(key, 'hex')
      return DdnCrypto.verifyHash(hash, signature, publicKey)
    } catch (e) {
      return false
    }
  }

  /**
   * 判断投票基于本地是否足够，需要 ${this.constants.voters} 个
   * @param {*} votes
   */
  hasEnoughVotes (votes) {
    return votes && votes.signatures && votes.signatures.length >= this.constants.voters
  }

  /**
   * 判断投票基于分布节点是否足够，需要至少 ${this.constants.remoteVoters} 个
   * @param {*} votes
   */
  hasEnoughVotesRemote (votes) {
    return votes && votes.signatures && votes.signatures.length >= this.constants.remoteVoters
  }

  /**
   * 获取当前共识高度
   * @returns {string} 当前共识高度（字符串形式）
   */
  async getHeight() {
    try {
      // 如果有待处理的区块，返回其高度
      if (this._pendingBlock && this._pendingBlock.height) {
        // 直接返回字符串形式的高度，不进行解析
        return this._pendingBlock.height.toString();
      }

      // 否则返回当前区块链高度
      const lastBlock = this.runtime.block.getLastBlock();
      if (lastBlock && lastBlock.height) {
        // 使用 bignum 处理高度并返回字符串
        return lastBlock.height.toString();
      }
      return '0';
    } catch (err) {
      this.logger.error(`获取共识高度失败: ${err.message}`);
      return '0';
    }
  }
}

export default Consensus
