import nacl from 'tweetnacl'
import crypto from 'crypto'
import RIPEMD160 from 'ripemd160'
import Mnemonic from 'bitcore-mnemonic'
import base58check from './base58check'

import DdnUtils from '@ddn/utils'

import constants from '../constants'
import { getBytes } from './bytes.browser'

let Buffer
if (typeof Buffer === 'undefined') {
  Buffer = require('buffer/').Buffer
}
const fixedPoint = constants.fixedPoint

// const {
//   verify,
//   verifySecondSignature,
//   verifyBytes
// } = DdnCrypto

function toLocalBuffer (buf) {
  if (typeof window !== 'undefined') {
    return new Uint8Array(buf.toArrayBuffer())
  } else {
    return buf.toBuffer()
  }
}

async function getFee (transaction) {
  switch (transaction.type) {
    case DdnUtils.assetTypes.TRANSFER: // Normal
      return DdnUtils.bignum.multiply(0.1, fixedPoint)
    case DdnUtils.assetTypes.SIGNATURE: // Signature
      return DdnUtils.bignum.multiply(100, fixedPoint)
    case DdnUtils.assetTypes.DELEGATE: // Delegate
      return DdnUtils.bignum.multiply(10000, fixedPoint)
    case DdnUtils.assetTypes.VOTE: // Vote
      return DdnUtils.bignum.new(fixedPoint)
    case DdnUtils.assetTypes.AOB_ISSUER: // Issuer
      return DdnUtils.bignum.multiply(100, fixedPoint)
    case DdnUtils.assetTypes.AOB_ASSET: // Issuer
      return DdnUtils.bignum.multiply(500, fixedPoint)
    // case DdnUtils.assetTypes.AOB_FLAG: // Issuer
    //   return DdnUtils.bignum.multiply(100, fixedPoint)
    // case DdnUtils.assetTypes.AOB_ACL: // Issuer
    //   return DdnUtils.bignum.multiply(100, fixedPoint)
    // case DdnUtils.assetTypes.AOB_ISSUE: // Issuer
    //   return DdnUtils.bignum.multiply(100, fixedPoint)
    default: {
      let fee = constants.net.fees.send
      // if (Asset.Utils.isTypeValueExists(transaction.type)) {
        console.log('transaction.type', transaction.type)
        // const trans = Asset.Utils.getTransactionByTypeValue(transaction.type)
        // const TransCls = require(trans.package).default[trans.name]
        // let transInst = new TransCls({
        //   constants: {
        //     fixedPoint
        //   }
        // })

        // fee = await transInst.calculateFee(transaction)

        // transInst = null
      // }
      return fee
    }
  }
}

function signBytes (bytes, { privateKey }) {
  const hash = createHash(Buffer.from(bytes, 'hex'))
  const signature = nacl.sign.detached(hash, Buffer.from(privateKey, 'hex'))
  return Buffer.from(signature).toString('hex')
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
function isAddress (address) {
  const tokenPrefix = constants.tokenPrefix
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

// fixme: 将所有 generateBase58CheckAddress -> generateAddress
function generateAddress (publicKey) {
  const tokenPrefix = constants.tokenPrefix
  if (typeof publicKey === 'string') {
    publicKey = Buffer.from(publicKey, 'hex')
  }
  const h1 = nacl.hash(publicKey)

  const h2 = new RIPEMD160().update(Buffer.from(h1)).digest()
  return tokenPrefix + base58check.encode(h2)
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

// hex
async function getId (transaction) {
  const hash = await getHash(transaction)
  return hash.toString('hex')
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

function generateMd5Hash (content) {
  const md5 = crypto.createHash('md5')
  const result = md5.update(content).digest('hex')
  return result
}

function bufToHex (data) {
  return Buffer.from(data).toString('hex')
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
  // verify,
  // verifySecondSignature,
  // verifyBytes,

  fixedPoint, // 测试和前端用
  signBytes,
  toLocalBuffer, // 测试和前端用
  generateSecret, // 测试和前端用,重构： generatePhasekey() -> generateSecret()
  isValidSecret,
  generateMd5Hash // 测试和前端用
}
