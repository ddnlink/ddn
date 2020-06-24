import Debug from 'debug'
import sha256 from 'fast-sha256'
import RIPEMD160 from 'ripemd160'
import node from '@ddn/node-sdk/lib/test'
import crypto from '../lib'
import base58check from '../lib/base58check'

const debug = Debug('test')
const tokenPrefix = 'D'

function isAddress (address) {
  return crypto.isAddress(address, tokenPrefix)
}

describe('address', () => {
  let Phasekey

  it('old 64bit address should be false', done => {
    node.expect(isAddress('a')).to.be.false
    node.expect(isAddress('')).to.be.false
    node.expect(isAddress()).to.be.false
    node.expect(isAddress(1)).to.be.false
    node.expect(isAddress('1a')).to.be.false
    node.expect(isAddress('1234567890123456789012')).to.be.false

    node.expect(isAddress('1')).to.be.false
    node.expect(isAddress('123456')).to.be.false

    done()
  })

  it('bitcoin Address should be invalid', done => {
    node.expect(isAddress('14VXPK3foDitWdv132rb3dZJkJUMrMSscp')).to.be.false
    done()
  })

  it('generateSecret should be ok', done => {
    Phasekey = crypto.generateSecret()
    debug('address.test.js addr', Phasekey)
    node.expect(Phasekey).to.be.a('string')

    done()
  })

  describe('#generateAddress', function () {
    const generateAddress = crypto.generateAddress

    it('should be a function', function () {
      expect(typeof generateAddress).toBe('function')
    })

    // 地址产生的详细过程
    it('should be ok', () => {
      // 1. 获得一个随机字符串，也称为助记词
      // const secret = crypto.generateSecret();
      const secret = 'you cousin patch lemon luxury picture impact lens slogan exotic purse hole'
      // 2. 产生公私钥对
      // const kp = crypto.keypair(secret);
      const kp = crypto.getKeys(secret)

      // 3. 对公钥进行sha256 hash 计算
      const hashPubKey = Buffer.from(sha256.hash(kp.publicKey))

      // 4. 进一步进行RIPEMD-160哈希计算
      const Ripemd160 = new RIPEMD160().update(hashPubKey).digest()

      // 5. 使用Base58Check编码将结果从字节字符串转换为base58字符串
      const strBase58 = base58check.encode(Ripemd160)

      // 6. 在上述转码后的前直接添加前缀（比如：D)
      const address = tokenPrefix + strBase58

      expect(kp.publicKey).toEqual('1c4fd85dc2a0752864d1454bdc37a9e7f9a09fa2c83f1f8d4da9d9bfdd38ed65') // 2be3d7a21dd9715d949c58910b38d01a063cfe8159320aa426b2249a6aaf1340
      expect(address).toEqual('DLNxuHtMwn7MrmcSmatFLHb9YPgfZ5uxMr')
    })

    it('Normal address should be ok', done => {
      const keyPair = crypto.getKeys(Phasekey)
      const addr = crypto.generateAddress(keyPair.publicKey, tokenPrefix)
      debug('address.test.js addr', addr)
      node.expect(isAddress(addr)).to.be.true

      done()
    })

    it('should generate address by publicKey', function () {
      const kp = crypto.getKeys('secret')
      const address = crypto.generateAddress(kp.publicKey, tokenPrefix)

      const kp2 = crypto.getKeys('enter boring shaft rent essence foil trick vibrant fabric quote indoor output')
      const address2 = crypto.generateAddress(kp2.publicKey, tokenPrefix)
      debug('address2', address2)
      expect(kp2.publicKey).toStrictEqual('daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1')
      expect(address2).toEqual('DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe')
      expect(address).toEqual('DFAZqQx6BxVyW63EqfZQBZYa1CTg7qH3oJ')
    })
  })
})
