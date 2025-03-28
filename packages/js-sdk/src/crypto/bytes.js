import ByteBuffer from 'bytebuffer'

// import { getBytes as getBytesTobuffer } from '@ddn/crypto-base'

/**
 * @author creazy
 * @param {object} data  获取字节的数据源
 * @param {boolean} skipSignature 是否排除签名字段 默认 false
 * @param {*} skipSecondSignature 是否排除二次签名字段 默认 false
 * @param {*} skipId 是否排除id字段 默认 true
 * @description 根据排序json key排序后的数据逐个字段获取字节，适用于交易和区块
 */
function getBytes (data, skipSignature, skipSecondSignature, skipId) {
  return arrayBufferToUnit8Array(getBytesTobuffer(data, skipSignature, skipSecondSignature, skipId))
}

// 系统需要 Uint8Array
function arrayBufferToUnit8Array (byteBuffer) {
  const unit8Buffer = new Uint8Array(byteBuffer.toArrayBuffer())
  const buffer = []
  for (let i = 0; i < unit8Buffer.length; i++) {
    buffer[i] = unit8Buffer[i]
  }
  return Buffer.from(buffer)
}

function getBytesTobuffer (data, skipSignature, skipSecondSignature, skipId) {
  const transaction = JSON.parse(JSON.stringify(data))
  return getBytesForBeforeHeight(transaction, skipSignature, skipSecondSignature, skipId)
}

function getBytesForBeforeHeight (data, skipSignature, skipSecondSignature, skipId) {
  const bb = new ByteBuffer(128, true)
  data = objKeySort(data)
  if (skipSignature) {
    delete data.signature
    delete data.block_signature
  }
  if (skipSecondSignature) {
    delete data.sign_signature
  }
  // 去掉id字段
  if (!skipId && data.id) {
    delete data.id
  }
  // 去掉signatures字段(dapp提现操作会额外加入该字段，没有存储只有认证)
  if (data.signatures) {
    delete data.signatures
  }
  getAsset(bb, data)
  getObjectBytes(bb, data)
  bb.flip()
  return bb
}

function getAsset (bb, data) {
  if (data.asset) {
    for (const value of Object.values(data.asset)) {
      getObjectBytes(bb, value)
    }
    delete data.asset
  }
}

function objKeySort (obj, sort) {
  // 排序的函数
  var newkey = sortKeys({ obj, sort })
  var newObj = {} // 创建一个新的对象，用于存放排好序的键值对
  newkey.map(item => {
    newObj[item] = obj[item]
    if (Object.prototype.toString.call(obj[item]) === '[object Object]') {
      newObj[item] = objKeySort(obj[item])
    }
  })
  return newObj // 返回排好序的新对象
}

function sortKeys ({ obj, sort = 1 }) {
  if (sort > 0) {
    return Object.keys(obj).sort()
  } else {
    return Object.keys(obj).sort().reverse()
  }
}

function getObjectBytes (bb, data) {
  for (const value of Object.values(data)) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    if (typeof value === 'string') {
      bb.writeString(value)
    } else if (typeof value === 'number') {
      bb.writeInt(value)
    } else if (typeof value === 'object') {
      if (Object.prototype.toString.call(value) === '[object Object]') {
        // 创世区块包含交易信息 transaction：[{}]，交易信息包含args:['aa',33]
      } else if (Object.prototype.toString.call(value) === '[object Array]') {
        for (let i = 0; i < value.length; ++i) {
          if (Object.prototype.toString.call(value[i]) === '[object Object]') {
            getAsset(bb, value[i])
            getObjectBytes(bb, value[i])
          } else {
            bb.writeString(value[i])
          }
        }
      }
    }
  }
}
export { getBytes }
