import Debug from 'debug'
import sha256 from 'fast-sha256'
import RIPEMD160 from 'ripemd160'

import * as crypto from '../src'
import base58check from '@ddn/crypto-base'

const debug = Debug('debug')

const tokenPrefix = 'D'

function isAddress (address) {
  return crypto.isAddress(address, tokenPrefix)
}

describe('address', () => {
  let Phasekey

  it('old 64bit address should be false', done => {
    expect(isAddress('a')).toBeFalsy()
    expect(isAddress('')).toBeFalsy()
    expect(isAddress()).toBeFalsy()
    expect(isAddress(1)).toBeFalsy()
    expect(isAddress('1a')).toBeFalsy()
    expect(isAddress('1234567890123456789012')).toBeFalsy()

    expect(isAddress('1')).toBeFalsy()
    expect(isAddress('123456')).toBeFalsy()

    done()
  })

  it('bitcoin Address should be invalid', done => {
    expect(isAddress('14VXPK3foDitWdv132rb3dZJkJUMrMSscp')).toBeFalsy()
    done()
  })

  it('generateSecret should be ok', done => {
    Phasekey = crypto.generateSecret()
    debug('address.test.js addr', Phasekey)
    expect(typeof Phasekey).toBe('string')

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
      // debug('kp sodium ', sodium)
      // const kpSodium = sodium.getKeys(sodium.createHash(secret))

      // debug('kp sodium publicKey', kpSodium)

      // 3. 对公钥进行sha256 hash 计算
      const hashPubKey = Buffer.from(sha256.hash(kp.publicKey))

      // 4. 进一步进行RIPEMD-160哈希计算
      const Ripemd160 = new RIPEMD160().update(hashPubKey).digest()

      // 5. 使用Base58Check编码将结果从字节字符串转换为base58字符串
      const strBase58 = base58check.encode(Ripemd160)

      // 6. 在上述转码后的前直接添加前缀（比如：D)
      const address = tokenPrefix + strBase58

      expect(kp.publicKey).toEqual(
        '041cea82005bf3c04694c03df736f2cafdc6e13d454511dada1fa3ee8b1abe2ae977f1ad1a4b5ed6421847205ae5291eb7f71f1eb93ea426804a2bf620c8352c8d'
      ) // 1c4fd85dc2a0752864d1454bdc37a9e7f9a09fa2c83f1f8d4da9d9bfdd38ed65 2be3d7a21dd9715d949c58910b38d01a063cfe8159320aa426b2249a6aaf1340
      expect(address).toEqual('DwMyKw11tiyQNzhmt1zwMSKSfr6Ni5wPy') //
    })

    it('Normal address should be ok', done => {
      const keyPair = crypto.getKeys(Phasekey)
      const addr = crypto.generateAddress(keyPair.publicKey, tokenPrefix)
      debug('address.test.js addr', addr)
      expect(isAddress(addr)).toBeTruthy()

      done()
    })

    it('should generate address by publicKey', function () {
      const kp = crypto.getKeys('secret')
      const address = crypto.generateAddress(kp.publicKey, tokenPrefix)
      expect(address).toEqual('DHSx41SrKuyRALssgpvttem34tcCHZNPBe') // DFAZqQx6BxVyW63EqfZQBZYa1CTg7qH3oJ

      const kp2 = crypto.getKeys('enter boring shaft rent essence foil trick vibrant fabric quote indoor output')
      const address2 = crypto.generateAddress(kp2.publicKey, tokenPrefix)

      debug('kp2.publicKey', kp2.publicKey)
      debug('address2', address2)

      expect(kp2.publicKey).toStrictEqual(
        '0410d15cb4a3747d9bcf6339ef7b1d8462e86da595e7da3f4dd17bb1b7e3b43cf9c67e41a439ec1ddae15e697b71bbfa2c4f662fce5105fc21c404df9ddae513f7'
      ) // daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1
      expect(address2).toEqual('D7WWq2DW83nx7KfCAbTkWrdy3XxfUhcPUp')
    })
  })
})
