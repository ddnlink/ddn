/* ---------------------------------------------------------------------------------------------
 *  Created by Imfly on Wed Jan 29 2020 11:48:54
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import nacl from 'tweetnacl'
import RIPEMD160 from 'ripemd160'
import Mnemonic from 'bitcore-mnemonic'
import { getBytes } from './bytes'

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

// hex 不包含 asset 字段
async function getId (transaction) {
  const hash = await getHash(transaction)
  return hash.toString('hex')
}

/**
 * 生成助记词
 * @param {*} ent 该参数可以是 语言词汇表，比如：Mnemonic.Words.ENGLISH(默认)，可以是位数，128 ~ 256 并 ent % 32 == 0
 */
function generateSecret (ent) {
  const param = ent || Mnemonic.Words.ENGLISH
  return new Mnemonic(param).toString()
}

function isValidSecret (secret) {
  return Mnemonic.isValid(secret)
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
  // 引用包
  nacl,
  RIPEMD160,
  Mnemonic,

  getBytes,
  keypair,
  getKeys,
  getId,
  getHash,

  generateSecret, // 重构： generatePhasekey() -> generateSecret()
  isValidSecret,
  // packages
  createHash,
  sign,
  secondSign,

  // 验证： 前端验证，底层也会验证
  verifyBytes
}