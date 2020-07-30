import nacl from 'tweetnacl'
import crypto from 'crypto'

import DdnCrypto from '@ddn/crypto'
import { assetTypes, bignum } from '@ddn/utils'
import Asset from '@ddn/asset-base'
import { constants } from '../config'

let Buffer
if (typeof Buffer === 'undefined') {
  Buffer = require('buffer/').Buffer
}

const {
  createHash,
  getBytes,
  getHash,
  getId,
  generateSecret, // 重构： generatePhasekey() -> generateSecret()
  isValidSecret,
  sign, // 一致
  secondSign, // 一致
  getKeys, // 一致

  verify,
  verifySecondSignature,
  verifyBytes
} = DdnCrypto

function toLocalBuffer (buf) {
  if (typeof window !== 'undefined') {
    return new Uint8Array(buf.toArrayBuffer())
  } else {
    return buf.toBuffer()
  }
}

async function getFee (transaction) {
  switch (transaction.type) {
    case assetTypes.TRANSFER: // Normal
      return bignum.multiply(constants.net.fees.transfer, constants.fixedPoint)
    case assetTypes.SIGNATURE: // Signature
      return bignum.multiply(constants.net.fees.signature, constants.fixedPoint)
    case assetTypes.DELEGATE: // Delegate
      return bignum.multiply(constants.net.fees.delegate, constants.fixedPoint)
    case assetTypes.VOTE: // Vote
      return bignum.multiply(constants.net.fees.vote, constants.fixedPoint)
    default: {
      let fee = constants.net.fees.transfer
      if (Asset.Utils.isTypeValueExists(transaction.type)) {
        const trans = Asset.Utils.getTransactionByTypeValue(transaction.type)
        const TransCls = require(trans.package).default[trans.name]
        let transInst = new TransCls({
          constants
        })

        fee = await transInst.calculateFee(transaction)

        transInst = null
      }
      return fee
    }
  }
}

function signBytes (bytes, { privateKey }) {
  const hash = createHash(Buffer.from(bytes, 'hex'))
  const signature = nacl.sign.detached(hash, Buffer.from(privateKey, 'hex'))
  return Buffer.from(signature).toString('hex')
}

function isAddress (address) {
  return DdnCrypto.isAddress(address, constants.tokenPrefix)
}

// fixme: 将所有 generateBase58CheckAddress -> generateAddress
function generateAddress (publicKey) {
  return DdnCrypto.generateAddress(publicKey, constants.tokenPrefix)
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

  signBytes,
  toLocalBuffer, // 测试和前端用
  generateSecret, // 测试和前端用,重构： generatePhasekey() -> generateSecret()
  isValidSecret,
  generateMd5Hash // 测试和前端用
}
