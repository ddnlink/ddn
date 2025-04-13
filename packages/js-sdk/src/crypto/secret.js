import * as bip39 from 'bip39'
import crypto from 'crypto-browserify'

// 检测运行环境
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node
const nodeCrypto = isNode ? require('crypto') : null

/**
 * 生成助记词
 * @param {*} ent 该参数可以是 语言词汇表，比如：Mnemonic.Words.ENGLISH(默认)，可以是位数，128 ~ 256 并 ent % 32 == 0
 */
function generateSecret (ent) {
  const strength = ent || 128
  return bip39.generateMnemonic(strength, isNode ? nodeCrypto.randomBytes : crypto.randomBytes)
}

// ddn-cli 使用
function isValidSecret (secret) {
  // return Mnemonic.isValid(secret)
  return bip39.validateMnemonic(secret)
}

export { generateSecret, isValidSecret }
