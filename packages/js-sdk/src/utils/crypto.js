import crypto from 'crypto'
import path from 'path'
// import {
//   nacl,
//   getKeys,
//   getId,
//   getHash,
//   createHash,
//   sign,
//   secondSign,
//   verifyBytes,
//   getBytes,
//   generateAddress,
//   isAddress,
//   generateSecret, // 测试和前端用,重构： generatePhasekey() -> generateSecret()
//   isValidSecret,
//   verify,
//   verifySecondSignature
// } from '@ddn/crypto'

import { constants } from '../config'
import { getFee } from '../fees'

const constantsFile = path.resolve(__dirname, '..', '..', './constants.js')
let userConstantsFile, cryptoModule
try {
  userConstantsFile = require(constantsFile)
} catch (error) {
  userConstantsFile = {}
}
if (!userConstantsFile.crypto) {
  // userConstantsFile.crypto = '@ddn/crypto-nacl'
  cryptoModule = require('@ddn/crypto-nacl')
} else if (userConstantsFile.crypto === '@ddn/crypto-nacl') {
  cryptoModule = require('@ddn/crypto-nacl')
} else if (userConstantsFile.crypto === '@ddn/crypto-sm') {
  cryptoModule = require('@ddn/crypto-sm')
}
const {
  nacl,
  getKeys,
  getId,
  getHash,
  createHash,
  sign,
  secondSign,
  verifyBytes,
  getBytes,
  generateAddress,
  isAddress,
  generateSecret, // 测试和前端用,重构： generatePhasekey() -> generateSecret()
  isValidSecret,
  verify,
  verifySecondSignature
} = cryptoModule

// const Buffer = require('safe-buffer').Buffer

const fixedPoint = constants.fixedPoint

function toLocalBuffer (buf) {
  if (typeof window !== 'undefined') {
    return new Uint8Array(buf.toArrayBuffer())
  } else {
    return buf.toBuffer()
  }
}

function signBytes (bytes, { privateKey }) {
  const hash = createHash(Buffer.from(bytes, 'hex'))
  const signature = nacl.sign.detached(hash, Buffer.from(privateKey, 'hex'))
  return Buffer.from(signature).toString('hex')
}

function generateMd5Hash (content) {
  const md5 = crypto.createHash('md5')
  const result = md5.update(content).digest('hex')
  return result
}

// 注意接口变更说明
export default {
  createHash,
  getBytes,
  getHash,
  getId,
  getFee,
  sign, // 一致
  secondSign, // 一致
  getKeys, // 一致
  generateAddress, // 测试和前端用 一致
  isAddress,

  // 验证
  verify,
  verifySecondSignature,
  verifyBytes,

  fixedPoint, // 测试和前端用
  signBytes,
  toLocalBuffer, // 测试和前端用
  generateSecret, // 测试和前端用,重构： generatePhasekey() -> generateSecret()
  isValidSecret,
  generateMd5Hash // 测试和前端用
}
