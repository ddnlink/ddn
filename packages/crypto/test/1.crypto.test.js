'use strict'
import sha256 from 'fast-sha256'
import crypto from 'crypto'
import ddnCrypto from '../lib'

import { Buffer } from 'buffer'
import Debug from 'debug'
import node from '@ddn/node-sdk/lib/test'

const debug = Debug('debug')

async function createTransfer (address, amount, secret) {
  return await node.ddn.transaction.createTransaction(address, amount, null, secret)
}

describe('crypto', () => {
  describe('#sha256.hash', function () {
    it("sha256.hash is crypto.createHash('sha256') ", () => {
      const str = 'data'
      const h1 = crypto
        .createHash('sha256')
        .update(str)
        .digest()

      const h2 = Buffer.from(sha256.hash(Buffer.from(str)))
      const h3 = sha256.hash(Buffer.from(str))

      expect(h1).toStrictEqual(h2)
      expect(h1).not.toEqual(h3)
    })

    it("Buffer.from(data, 'hex') !== Buffer.from(data).toString('hex')", () => {
      // 加密 -> 转为 hex
      const buf1 = Buffer.from('publicKey').toString('hex')
      // 解密 -> 解码
      const buf2 = Buffer.from('publicKey', 'hex')

      const buf3 = Buffer.from(buf1, 'hex')

      expect(buf1).not.toBe(buf2)
      expect(buf3).not.toBe('publicKey')
    })

    it('should Buffer.from(sha256.hash(bytes)) is ok', () => {
      const bytes = Buffer.from('test')

      const result1 = Buffer.from(sha256.hash(bytes))
      const result2 = Buffer.from(sha256.hash(bytes))

      debug('result1= ', result1)
      debug('result2= ', result2)

      expect(result1).toEqual(result2)
    })
  })

  describe('#getHash', () => {
    const getHash = ddnCrypto.getHash

    it('should be a function', () => {
      expect(typeof getHash).toBe('function')
    })

    it('length should be 64', async function () {
      const trs = await createTransfer(node.Eaccount.address, '10000000000000', node.Gaccount.password)
      const hash = await getHash(trs)
      debug(hash)
      expect(hash.length).toBe(64)
    })
  })

  describe('#sign', () => {
    const sign = ddnCrypto.sign

    it('should be a function', () => {
      expect(typeof sign).toBe('function')
    })

    it('length should be 64', async function () {
      const keypair = await ddnCrypto.getKeys('secret')
      const trs = await createTransfer(node.Eaccount.address, '10000000000000', node.Gaccount.password)
      const signature = await sign(trs, keypair)
      const str = Buffer.from(signature, 'hex') // 必须解密
      expect(str.length).toBe(64)
    })

    it('signature should be 64', () => {
      const sign = 'a803070ed9ce06792363f7601c1e45ead7f7d5293455c64da95ad0fc635c82aaeb5dd21cae6afc1fe50a36049f890c047efb3b2480bc32d4904440ebc371f205'
      const str = Buffer.from(sign, 'hex')
      debug('str', str)
      expect(str.length).toEqual(64)
    })
  })

  describe('#getKeys', function () {
    it('The same secret should get a same keyPairs', () => {
      const secret = 'you cousin patch lemon luxury picture impact lens slogan exotic purse hole'
      const kp = ddnCrypto.getKeys(secret)
      const kp1 = ddnCrypto.getKeys(secret)

      debug(kp.publicKey, kp1.publicKey)

      expect(kp.publicKey).toEqual('1c4fd85dc2a0752864d1454bdc37a9e7f9a09fa2c83f1f8d4da9d9bfdd38ed65')
      expect(kp.publicKey).toEqual(kp1.publicKey)
    })

    it('Multi toString("hex") should be equal', done => {
      const Phasekey = ddnCrypto.generateSecret()
      const publicKey = ddnCrypto.getKeys(Phasekey).publicKey

      node.expect(publicKey).to.be.a('string')

      const publicKey2 = publicKey.toString('hex')
      const publicKey3 = publicKey2.toString('hex')

      debug('Multi toString("hex") publicKey', publicKey, publicKey2, publicKey3)

      expect(publicKey).toEqual(publicKey2)
      expect(publicKey2).toEqual(publicKey3)

      done()
    })
  })
})
