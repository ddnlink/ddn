import { getBytes as getBytesTobuffer } from '@ddn/crypto-base'

/**
 * @author creazy
 * @param {object} data  获取字节的数据源
 * @param {boolean} skipSignature 是否排除签名字段 默认 false
 * @param {*} skipSecondSignature 是否排除二次签名字段 默认 false
 * @param {*} skipId 是否排除id字段 默认 true
 * @description 根据排序json key排序后的数据逐个字段获取字节
 */
function getBytes (transaction, skipSignature, skipSecondSignature, skipId) {
  return arrayBufferToBuffer(getBytesTobuffer(transaction, skipSignature, skipSecondSignature, skipId))
}

// 系统需要 Uint8Array
function arrayBufferToBuffer (byteBuffer) {
  return byteBuffer.toBuffer()
}

export {
  getBytes
}
