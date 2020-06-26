/* ---------------------------------------------------------------------------------------------
 *  Created by Imfly on Wed Jan 29 2020 11:48:54
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import nacl from 'tweetnacl'
import RIPEMD160 from 'ripemd160'
import Mnemonic from 'bitcore-mnemonic'
import base58check from './base58check'
import { getBytes } from './bytes'

function randomName () {
  // Convert arguments to Array
  const array = Array.prototype.slice.apply(arguments)

  let size = 16
  if (array.length > 2) {
    size = array.shift()
  }

  let name = array[0]
  const random = array[1]

  if (name.length > 0) {
    size = size - 1
  }

  for (let i = 0; i < size; i++) {
    name += random.charAt(Math.floor(Math.random() * random.length))
  }

  return name
}

function randomNethash () {
  return randomName(8, '', 'abcdefghijklmnopqrstuvwxyz0123456789')
}

function randomString (max) {
  const possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%^&*@'
  return randomName(max, '', possible)
}

// 根据助记词生成密钥对
function keypair (secret) {
  return getKeys(secret)
}

// 兼容处理
function getKeys (secret) {
  const hash = createHash(Buffer.from(secret))

  const m = new Uint8Array(nacl.sign.seedLength)
  for (let i = 0; i < m.length; i++) m[i] = hash[i]

  const keypair = nacl.sign.keyPair.fromSeed(m)

  return {
    publicKey: bufToHex(keypair.publicKey),
    privateKey: bufToHex(keypair.secretKey)
  }
}

/**
 * Usage:
 * trs.signature = await sign(trs, keypair);
 * @param {object} transaction to be signed
 * @param {object} param1 keypair.privateKey
 */
async function sign (transaction, { privateKey }) {
  const hash = await getHash(transaction, true, true)
  const signature = nacl.sign.detached(hash, Buffer.from(privateKey, 'hex'))

  return bufToHex(signature)
}

/**
 * Usage:
 * trs.sign_signature = await secondSign(trs, keypair)
 * @param {object} transaction to be signed
 * @param {object} param1 keypair.privateKey
 */
async function secondSign (transaction, { privateKey }) {
  const hash = await getHash(transaction, false, true)
  const signature = nacl.sign.detached(hash, Buffer.from(privateKey, 'hex'))
  return bufToHex(signature)
}

// hex
async function getId (transaction) {
  const hash = await getHash(transaction)
  return hash.toString('hex')
}

// 生成助记词 === node-sdk.crypto.generatePhasekey()
function generateSecret () {
  return new Mnemonic(Mnemonic.Words.ENGLISH).toString()
}

function isValidSecret (secret) {
  return Mnemonic.isValid(secret)
}

/**
 * description:
 * 字符串形式的地址，不再支持纯数字地址；
 * 1. 把地址base58解码成字节数组
 * 2. 把数组分成两个字节数组，字节数组（1）是后4字节数组，字节数组（2）是减去后4字节的数组
 * 3. 把字节数组（2）两次Sha256 Hash
 * 4. 取字节数组（2）hash后的前4位，跟字节数组（1）比较。如果相同校验通过。
 * 5. 校验通过的解码字节数组取第一个字节，地址前缀。
 * 6. 检验前缀的合法性（根据主网参数校验），注意大小写。
 * Note: address.slice(0, -4) === address.slice(0, address.length - 4)
 */
function isAddress (address, tokenPrefix) {
  if (typeof address !== 'string') {
    return false
  }
  if (!base58check.decodeUnsafe(address.slice(1))) {
    return false
  }
  if ([tokenPrefix].indexOf(address[0]) === -1) {
    return false
  }
  return true
}

function generateAddress (publicKey, tokenPrefix) {
  if (typeof publicKey === 'string') {
    publicKey = Buffer.from(publicKey, 'hex')
  }
  const h1 = nacl.hash(publicKey)

  const h2 = new RIPEMD160().update(Buffer.from(h1)).digest()
  return tokenPrefix + base58check.encode(h2)
}

// 验证，计划重构： peer/src/kernal/transaction.js  2020.5.3
/**
 * 该方法验证使用私钥签名的字节信息是否正确，参数公钥与私钥对应，即：私钥签名的信息，公钥可以验证通过
 * @param {hash} bytes 字节流 hash 值
 * @param {string} signature 签名
 * @param {string} publicKey 公钥
 */
function verifyBytes (bytes, signature, publicKey) {
  // 保证字节类型
  if (!(bytes instanceof Buffer)) {
    bytes = Buffer.from(bytes)
  }

  const hash = createHash(bytes)

  const signatureBuffer = Buffer.from(signature, 'hex')
  const publicKeyBuffer = Buffer.from(publicKey, 'hex')
  const res = nacl.sign.detached.verify(hash, signatureBuffer, publicKeyBuffer)
  return res
}

function verifyHash (hash, signature, publicKey) {
  const signatureBuffer = Buffer.from(signature, 'hex')
  const publicKeyBuffer = Buffer.from(publicKey, 'hex')
  const res = nacl.sign.detached.verify(hash, signatureBuffer, publicKeyBuffer)
  return res
}

// 验证签名
// todo: 本方法并没有被实际使用，请参考 peer/kernal/transaction/transaction.js的 verifySignature 重构
async function verify (transaction, senderPublicKey) {
  if (!transaction.signature) {
    return false
  }

  if (!senderPublicKey) {
    senderPublicKey = transaction.senderPublicKey
  }

  const bytes = await getBytes(transaction, true, true)
  return verifyBytes(bytes, transaction.signature, senderPublicKey)
}

/**
 * 二次签名验证
 * @param {object} transaction 交易数据
 * @param {string} publicKey 二次签名公钥
 */
async function verifySecondSignature (transaction, publicKey) {
  if (!transaction.sign_signature) {
    return false
  }
  const bytes = await getBytes(transaction, false, true)
  return verifyBytes(bytes, transaction.sign_signature, publicKey)
}

/**
 * 获得交易数据的哈希值
 * 等于 getBytes + createHash
 *
 * note: tweetnacl 包的所有方法必须使用 Uint8Array 类型的参数。
 * @param {object} trs 交易数据
 * @param {boolean} skipSignature 跳过签名
 * @param {boolean} skipSecondSignature 跳过二次签名
 */
async function getHash (trs, skipSignature, skipSecondSignature) {
  const bytes = await getBytes(trs, skipSignature, skipSecondSignature)
  return createHash(bytes)
}

/**
 * 使用中注意 data 格式，默认是unit8Arrary，如果是涉密字段（经过 buffer、签名、加密的字段）都是可以直接使用的，不然就要对其简单处理 Buffer.from(data)
 * 返回值为 Buffer
 * @param {String}  data 需要 hash 的数据，格式为 unit8Arrary, 这里的方法与 crypto.createHash('sha256').update(strBuffer).digest() 相似，结果不同
 */
function createHash (data) {
  return Buffer.from(nacl.hash(data))
}

function bufToHex (data) {
  return Buffer.from(data).toString('hex')
}

export default {
  randomString,
  randomNethash,

  getBytes,
  keypair,
  getKeys,
  getId,
  getHash,

  generateSecret, // 重构： generatePhasekey() -> generateSecret()
  isValidSecret,
  generateAddress,
  isAddress,

  base58check,

  // packages
  createHash,
  sign,
  secondSign,

  // 验证： 前端验证，底层也会验证
  verify,
  verifySecondSignature,
  verifyBytes,
  verifyHash
}
