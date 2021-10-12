/**
 * 该文件为加密算法涉及到的基础方法，如果更换其他的密码学算法，请注意实现下面的方法
 */
import { getBytes } from './bytes'
import { sm2, sm3 } from '@ddn/sm-crypto'

/**
 * 该方法用于生成交易Id，仅包含核心交易字段信息。所以，在调用本方法之前，要过滤掉系统生成的字段。
 * @param {object} transaction 交易体
 * @returns 16进制的Hash值（不包含 asset 字段）
 */
async function getId (transaction) {
  const hash = await getHash(transaction)
  return hash.toString('hex')
}

// 兼容处理
function getKeys (secret) {
  const keypair = sm2.generateKeyPairHexBySecret(secret)
  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey
  }
}

/**
 * Usage:
 * trs.signature = await sign(trs, keypair);
 * @param {object} transaction to be signed
 * @param {object} privateKey keypair.privateKey
 */
async function sign (transaction, { privateKey }) {
  const hash = await getHash(transaction, true, true)
  const signature = sm2.doSignature(hash, privateKey)
  return signature
}

/**
 * Usage:
 * data.signature =  signWithHash(hash, keypair);
 * @param {object} hash to be signed hash
 * @param {object} param1 keypair.privateKey
 */
function signWithHash (hash, { privateKey }) {
  const signature = sm2.doSignature(hash, privateKey)
  return signature
}

/**
 * Usage:
 * trs.sign_signature = await secondSign(trs, keypair)
 * @param {object} transaction to be signed
 * @param {object} param1 keypair.privateKey
 */
async function secondSign (transaction, { privateKey }) {
  const hash = await getHash(transaction, false, true)
  const signature = sm2.doSignature(hash, privateKey)
  return signature
}

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
  const res = sm2.doVerifySignature(hash, signature, publicKey)
  return res
}
/**
 *
 * @param {*} hash hash数据格式为16进制str
 * @param {*} signature 签名
 * @param {*} publicKey  公匙
 * @returns Boolean
 */

function verifyHash (hash, signature, publicKey) {
  // 这里这样处理是因为程序中调用该方法时有的传的值时16进制的signature, publicKey，有的传的时buffer.from(signature, publicKey),需要转为16进制
  const signatureStr = signature.toString('hex')
  const publicKeyStr = publicKey.toString('hex')
  const res = sm2.doVerifySignature(hash, signatureStr, publicKeyStr)
  return res
}

/**
 * 获得交易数据的哈希值
 * 等于 getBytes + createHash
 * @param {object} trs 交易数据
 * @param {boolean} skipSignature 跳过签名
 * @param {boolean} skipSecondSignature 跳过二次签名
 */
function getHash (trs, skipSignature, skipSecondSignature, skipId) {
  const bytes = getBytes(trs, skipSignature, skipSecondSignature, skipId)
  return createHash(bytes)
}

/**
 * 使用中注意 data 格式是 Buffer.from(data)或者string，SM3杂凑算法，与sha256类似
 * 返回值为 16进制str
 * @param {String}  data 需要 hash 的数据，格式为 Buffer.from(data)或string, 这里的方法与 crypto.createHash('sha256').update(strBuffer).digest() 相似
 */
function createHash (data) {
  return Buffer.from(sm3(data.toString()))
}

export { getKeys, getId, getHash, createHash, sign, signWithHash, secondSign, verifyBytes, verifyHash }
