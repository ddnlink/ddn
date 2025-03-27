import crypto from 'crypto'
import * as DdnCrypto from '@ddn/crypto'
import { constants } from '../config'
import { getFee } from '../fees'

const { nacl, getKeys, getId, getHash, createHash, sign, secondSign, verifyBytes, getBytes, generateAddress, isAddress, generateSecret, isValidSecret, verify, verifySecondSignature } = DdnCrypto

const fixedPoint = constants.fixedPoint

const toLocalBuffer = (buf) => {
  return typeof window !== 'undefined' ? new Uint8Array(buf.toArrayBuffer()) : buf.toBuffer()
}

const signBytes = (bytes, { privateKey }) => {
  const hash = createHash(Buffer.from(bytes, 'hex'))
  const signature = nacl.sign.detached(hash, Buffer.from(privateKey, 'hex'))
  return Buffer.from(signature).toString('hex')
}

const generateMd5Hash = (content) => {
  return crypto.createHash('md5').update(content).digest('hex')
}

export default {
  createHash,
  getBytes,
  getHash,
  getId,
  getFee,
  sign,
  secondSign,
  getKeys,
  generateAddress,
  isAddress,
  verify,
  verifySecondSignature,
  verifyBytes,
  fixedPoint,
  signBytes,
  toLocalBuffer,
  generateSecret,
  isValidSecret,
  generateMd5Hash
}
