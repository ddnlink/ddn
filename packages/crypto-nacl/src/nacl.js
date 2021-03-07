/**
 * 该方法为加密算法涉及到的基础方法，如果更换其他的密码学算法，请注意实现下面的方法
 */
import nacl from 'tweetnacl'
import { getBytes } from './bytes'

// hex 不包含 asset 字段
async function getId (transaction) {
  const hash = await getHash(transaction)
  return hash.toString('hex')
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

// 验证，TODO trs重构： peer/src/kernal/transaction.js  2020.5.3
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

export {
  nacl, // 这里不应该导出
  getKeys,
  getId,
  getHash,
  createHash,
  sign,
  secondSign,
  verifyBytes,
  verifyHash
}
