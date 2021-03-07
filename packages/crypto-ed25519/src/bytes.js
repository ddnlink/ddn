import ByteBuffer from 'bytebuffer'

async function getBytes (transaction, skipSignature, skipSecondSignature,height) {
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

async function getAssetBytes (transaction) {
  if (global.assets && global.assets.transTypeNames[transaction.type]) {
    const trans = global.assets.transTypeNames[transaction.type]
    const TransCls = require(trans.package).default[trans.name]
    let transInst = new TransCls({})
    const buf = await transInst.getBytes(transaction)

    transInst = null

    return buf
  }
  return null
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
export { getBytes }
