// import base58check from './base58check'
import base58check from '@ddn/crypto-base'
import RIPEMD160 from 'ripemd160'
// import base58checkcheck from './base58checkcheck'
import { createHash, getHash } from './nacl'
/**
 * TODO: 太简单，需要添加更多可验证信息
 * 字符串形式的地址，不再支持纯数字地址；
 * 1. 把地址base58check解码成字节数组
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
  // const h1 = Buffer.from(nacl.hash(publicKey))
  const h1 = createHash(publicKey)
  const h2 = new RIPEMD160().update(h1).digest() // fixme: 2020.9.20 这里的参数只能使用 string ？
  return tokenPrefix + base58check.encode(h2)
}

function generateContractAddress (contract, tokenPrefix) {
  console.log('--------1-----', contract)
  const h1 = getHash(contract, true, true, true)
  console.log('--------', h1)
  const h2 = new RIPEMD160().update(h1).digest() // fixme: 2020.9.20 这里的参数只能使用 string ？
  return tokenPrefix + base58check.encode(h2)
}

export { RIPEMD160, generateAddress, generateContractAddress, isAddress }
