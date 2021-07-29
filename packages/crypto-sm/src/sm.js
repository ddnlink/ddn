/**
 * 该文件为加密算法涉及到的基础方法，如果更换其他的密码学算法，请注意实现下面的方法
 */
import { getBytes } from './bytes'
import { sm2, sm3 } from 'sm-crypto'

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
  // const hash = createHash(Buffer.from(secret))

  // const m = new Uint8Array(nacl.sign.seedLength)
  // for (let i = 0; i < m.length; i++) m[i] = hash[i]

  // const keypair = nacl.sign.keyPair.fromSeed(m)
  const keypair = sm2.generateKeyPairHex(secret)
  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey
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
  // const signature = nacl.sign.detached(hash, Buffer.from(privateKey, 'hex'))
  const signature = sm2.doEncrypt(hash, privateKey)

  return signature
}

/**
 * Usage:
 * data.signature =  signWithHash(hash, keypair);
 * @param {object} hash to be signed hash
 * @param {object} param1 keypair.privateKey
 */
function signWithHash (hash, { privateKey }) {
  const signature = sm2.doEncrypt(hash, privateKey) // nacl.sign.detached(hash, Buffer.from(privateKey, 'hex'))
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
  const signature = sm2.doEncrypt(hash, privateKey) // nacl.sign.detached(hash, Buffer.from(privateKey, 'hex'))
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

  // const signatureBuffer = Buffer.from(signature, 'hex')
  // const publicKeyBuffer = Buffer.from(publicKey, 'hex')
  const res = sm2.doDecrypt(hash, signature, publicKey)
  return res
}

function verifyHash (hash, signature, publicKey) {
  // const signatureBuffer = Buffer.from(signature, 'hex')
  // const publicKeyBuffer = Buffer.from(publicKey, 'hex')
  const res = sm2.doDecrypt(hash, signature, publicKey)
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
function getHash (trs, skipSignature, skipSecondSignature, skipId) {
  const bytes = getBytes(trs, skipSignature, skipSecondSignature, skipId)
  return createHash(bytes)
}

/**
 * 使用中注意 data 格式，默认是unit8Arrary，如果是涉密字段（经过 buffer、签名、加密的字段）都是可以直接使用的，不然就要对其简单处理 Buffer.from(data)
 * 返回值为 Buffer
 * @param {String}  data 需要 hash 的数据，格式为 unit8Arrary, 这里的方法与 crypto.createHash('sha256').update(strBuffer).digest() 相似，结果不同
 */
function createHash (data) {
  return sm3(data.toString())
}

// function bufToHex(data) {
//   return Buffer.from(data).toString('hex')
// }

export {
  // nacl, // 这里不应该导出
  getKeys,
  getId,
  getHash,
  createHash,
  sign,
  signWithHash,
  secondSign,
  verifyBytes,
  verifyHash
}
