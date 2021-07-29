import { getBytes as getBytesTobuffer } from '@ddn/crypto-base'

/**
 * @author creazy
 * @param {object} data  获取字节的数据源
 * @param {boolean} skipSignature 是否排除签名字段 默认 false
 * @param {*} skipSecondSignature 是否排除二次签名字段 默认 false
 * @param {*} skipId 是否排除id字段 默认 true
 * @description 根据排序json key排序后的数据逐个字段获取字节，适用于交易和区块
 */
function getBytes (data, skipSignature, skipSecondSignature, skipId) {
  return getBytesTobuffer(data, skipSignature, skipSecondSignature, skipId)
}

export { getBytes }
