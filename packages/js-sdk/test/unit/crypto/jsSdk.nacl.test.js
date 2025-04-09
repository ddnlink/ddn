import {
  getKeys,
  getId,
  getHash,
  createHash,
  sign,
  signWithHash,
  secondSign,
  verifyBytes,
  verifyHash
} from '../../../dist/crypto/'
import Debug from 'debug'
const debug = Debug('debug')

describe('nacl crypto functions', () => {
  const testSecret = 'test secret'
  const testTransaction = {
    type: 0,
    amount: '100000000',
    fee: '10000000',
    recipientId: 'D1234567890',
    timestamp: 12345678,
    asset: {}
  }

  describe('getKeys', () => {
    it('should generate key pair from secret', () => {
      debug('Testing getKeys with secret:', testSecret)
      const keys = getKeys(testSecret)
      debug('Generated keys:', keys)
      expect(keys).toHaveProperty('publicKey')
      expect(keys).toHaveProperty('privateKey')
      expect(keys.publicKey).toHaveLength(64)
      expect(keys.privateKey).toHaveLength(128)
    })
  })

  describe('getId', () => {
    it('should generate transaction id', async () => {
      debug('Testing getId with transaction:', testTransaction)
      const id = await getId(testTransaction)
      debug('Generated transaction id:', id)
      expect(id).toHaveLength(64)
    })
  })

  describe('getHash', () => {
    it('should generate hash from transaction', () => {
      debug('Testing getHash with transaction:', testTransaction)
      const hash = getHash(testTransaction)
      debug('Generated hash:', hash.toString('hex'))
      expect(hash).toBeInstanceOf(Buffer)
      expect(hash.length).toBe(32)
    })
  })

  describe('createHash', () => {
    it('should create hash from data', () => {
      const data = Buffer.from('test data')
      debug('Testing createHash with data:', data.toString())
      const hash = createHash(data)
      debug('Generated hash:', hash.toString('hex'))
      expect(hash).toBeInstanceOf(Buffer)
      expect(hash.length).toBe(32)
    })
  })

  describe('sign', () => {
    it('should sign transaction', async () => {
      const keys = getKeys(testSecret)
      debug('Testing sign with transaction:', testTransaction)
      debug('Using keys:', keys)
      const signature = await sign(testTransaction, keys)
      debug('Generated signature:', signature)
      expect(signature).toHaveLength(128)
    })
  })

  describe('signWithHash', () => {
    it('should sign hash directly', () => {
      const keys = getKeys(testSecret)
      const hash = createHash(Buffer.from('test data'))
      debug('Testing signWithHash with hash:', hash.toString('hex'))
      debug('Using keys:', keys)
      const signature = signWithHash(hash, keys)
      debug('Generated signature:', signature)
      expect(signature).toHaveLength(128)
    })
  })

  describe('secondSign', () => {
    it('should generate second signature', async () => {
      const keys = getKeys(testSecret)
      debug('Testing secondSign with transaction:', testTransaction)
      debug('Using keys:', keys)
      const signature = await secondSign(testTransaction, keys)
      debug('Generated second signature:', signature)
      expect(signature).toHaveLength(128)
    })
  })

  describe('verifyBytes', () => {
    it('should verify signed bytes', () => {
      const keys = getKeys(testSecret)
      const data = Buffer.from('test data')
      const hash = createHash(data)
      const signature = signWithHash(hash, keys)
      debug('Testing verifyBytes with data:', data.toString())
      debug('Using signature:', signature)
      debug('Using publicKey:', keys.publicKey)
      const isValid = verifyBytes(data, signature, keys.publicKey)
      debug('Verification result:', isValid)
      expect(isValid).toBe(true)
    })
  })

  describe('verifyHash', () => {
    it('should verify signed hash', () => {
      const keys = getKeys(testSecret)
      const hash = createHash(Buffer.from('test data'))
      const signature = signWithHash(hash, keys)
      debug('Testing verifyHash with hash:', hash.toString('hex'))
      debug('Using signature:', signature)
      debug('Using publicKey:', keys.publicKey)
      const isValid = verifyHash(hash, signature, keys.publicKey)
      debug('Verification result:', isValid)
      expect(isValid).toBe(true)
    })
  })
})