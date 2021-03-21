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
    // const bytes = new ByteBuffer()

    // bytes.writeString(propose.height)
    // bytes.writeString(propose.id)

    // const generatorPublicKeyBuffer = Buffer.from(propose.generator_public_key, 'hex') // wxm block database
    // for (let i = 0; i < generatorPublicKeyBuffer.length; i++) {
    //   bytes.writeByte(generatorPublicKeyBuffer[i])
    // }

    // bytes.writeInt(propose.timestamp)

    // const parts = propose.address.split(':')
    // assert(parts.length === 2)
    // bytes.writeInt(ip.toLong(parts[0]))
    // bytes.writeInt(Number(parts[1]))

    // bytes.flip()

    // return createHash(bytes.toBuffer())
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
    // {
    //   height: '13',
    //   id: '149be5d39cf0e6a8aeb16e1d0eb27636786b18b34e50e4d4f0b0f4dd3100d42aa446d47dcaf38e3cd91341f515e8a2b39f71a59b2e341d01f5e54c94707d3639',
    //   timestamp: 104895420,
    //   generator_public_key: 'a8ac0f8e0793d5c9b84b53796ee2879701c00807f6a18c04dfa827a15f59cc15',
    //   address: '127.0.0.1:8000',
    //   hash: 'e857ea94cabe9810aa937db5b4abd704c1038f876c03ddcbe0c6263a441f0aee4acca62fee8eef7d8961e98655b3896a36d22b8f6340279c867e5d98f3baf8e0',
    //   signature: '886f206f3a15719fd334e721e48624392d9f7fa0bbe23dd60addf5d01b525dc5664cd7ff505dc1588345677a7dd11e10eec42f783481ad4e7a549e66bed8930a'
    // }
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
}

export default Consensus
