import ByteBuffer from 'bytebuffer'

async function getBytes(transaction, skipSignature, skipSecondSignature, height) {
  if (height && height > 2) {
  return getBytesForBeforeHeight(transaction, skipSignature, skipSecondSignature, height)
  }
  let assetSize = 0
  let assetBytes = null

  assetBytes = await getAssetBytes(transaction)
  if (transaction.__assetBytes__) {
    assetBytes = transaction.__assetBytes__
  }
  if (assetBytes) assetSize = assetBytes.byteLength

  const size =
    1 + // type (int)
    4 + // timestamp (int)
    8 + // nethash 8
    32 + // senderPublicKey (int)
    32 + // requesterPublicKey (long)
    8 + // recipientId (long)
    8 + // amount (long)
    64 + // message
    64 // args or unused

  const bb = new ByteBuffer(size + assetSize, true)
  // const bb = new ByteBuffer(1, true);

  bb.writeByte(transaction.type) // +1
  bb.writeInt(transaction.timestamp) // +4
  bb.writeString(transaction.nethash) // +8

  // +32
  const senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, 'hex')
  for (let i = 0; i < senderPublicKeyBuffer.length; i++) {
    bb.writeByte(senderPublicKeyBuffer[i])
  }

  // +32
  if (transaction.requester_public_key) {
    // wxm block database
    const requesterPublicKey = Buffer.from(transaction.requester_public_key, 'hex') // wxm block database

    for (let i = 0; i < requesterPublicKey.length; i++) {
      bb.writeByte(requesterPublicKey[i])
    }
  }

  // +8
  if (transaction.recipientId) {
    bb.writeString(transaction.recipientId)
  } else {
    for (let i = 0; i < 8; i++) {
      bb.writeByte(0)
    }
  }

  // +8
  bb.writeString(transaction.amount)

  // +64
  if (transaction.message) bb.writeString(transaction.message)

  // +64
  if (transaction.args) {
    const args = transaction.args
    for (let i = 0; i < args.length; ++i) {
      bb.writeString(args[i])
    }
  }

  if (assetSize > 0) {
    for (let i = 0; i < assetSize; i++) {
      bb.writeByte(assetBytes[i])
    }
  }

  // +64 验证的时候要减去
  if (!skipSignature && transaction.signature) {
    const signatureBuffer = Buffer.from(transaction.signature, 'hex')
    for (let i = 0; i < signatureBuffer.length; i++) {
      bb.writeByte(signatureBuffer[i])
    }
  }

  // +64 验证的时候要再次减去
  if (!skipSecondSignature && transaction.sign_signature) {
    // wxm block database
    const signSignatureBuffer = Buffer.from(transaction.sign_signature, 'hex') // wxm block database
    for (let i = 0; i < signSignatureBuffer.length; i++) {
      bb.writeByte(signSignatureBuffer[i])
    }
  }

  bb.flip()

  return bb
}
async function getBytesForBeforeHeight(data, skipSignature, skipSecondSignature) {
  const bb = new ByteBuffer(null, true)
  data = objKeySort(data)
  if (skipSignature) {
    delete data.signature
  }
  if (skipSecondSignature) {
    delete data.sign_signature
  }
  await getAsset(bb,data)
  // if (transaction.__assetBytes__) {
  //   assetBytes = data.__assetBytes__
  //   delete data.__assetBytes__
  // }
  // for (let value of Object.values(data)) {
  //   if (typeof value === 'string') {
  //     bb.writeIString(value)
  //   } else if (typeof value === 'number') {
  //     bb.writeInt(value)
  //   } else if (typeof value === 'object') {
  //     if (Object.prototype.toString.call(value) === "[object Object]") {

  //     } else if (Object.prototype.toString.call(value) === "[object Array]") {
  //       for (let i = 0; i < value.length; ++i) {
  //         bb.writeString(value[i])
  //       }
  //     }

  //   }
  // }
  getObjectBytes(bb, data)
  bb.flip()
  return bb
}

// 获取对应的资产插件中的getBytes方法 todo 切换到新的加密算法时要删除
async function getAssetBytes(transaction) {
  if (data.asset) {
    const trans = global.assets.transTypeNames[transaction.type]
    const TransCls = require(trans.package).default[trans.name]
    let transInst = new TransCls({})
    const buf = await transInst.getBytes(transaction)

    transInst = null

    return buf
  }
  return null
}
async function getAsset(bb, data) {
  if (data.asset) {
    for (let value of Object.values(data)) {
      getObjectBytes(bb, value)
    }
  }
}
function objKeySort(obj, sort) {//排序的函数
  var newkey = sortKeys({ obj, sort })
  var newObj = {};//创建一个新的对象，用于存放排好序的键值对
  newkey.map((item) => {
    newObj[item] = obj[item]
    if (Object.prototype.toString.call(obj[item]) === "[object Object]") {
      newObj[item] = objKeySort(obj[item])
    }
  })
  return newObj;//返回排好序的新对象
}
function sortKeys({ obj, sort = 1 }) {
  if (sort > 0) {
    return Object.keys(obj).sort();
  } else {
    return (Object.keys(obj).sort()).reverse();
  }
}
function getObjectBytes(bb, data) {
  for (let value of Object.values(data)) {
    if (typeof value === 'string') {
      bb.writeIString(value)
    } else if (typeof value === 'number') {
      bb.writeInt(value)
    } else if (typeof value === 'object') {
      if (Object.prototype.toString.call(value) === "[object Object]") {

      } else if (Object.prototype.toString.call(value) === "[object Array]") {
        for (let i = 0; i < value.length; ++i) {
          bb.writeString(value[i])
        }
      }

    }
  }
}
export { getBytes }
