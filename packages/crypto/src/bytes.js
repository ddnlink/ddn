import ByteBuffer from 'bytebuffer'
import Asset from '@ddn/asset-base'

async function getBytes (transaction, skipSignature, skipSecondSignature) {
  let assetSize = 0
  let assetBytes = null

  assetBytes = await getAssetBytes(transaction)
  if (transaction.__assetBytes__) {
    assetBytes = transaction.__assetBytes__
  }
  if (assetBytes) assetSize = assetBytes.length

  const size = 1 + // type (int)
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
  if (transaction.requester_public_key) { // wxm block database
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
  if (!skipSecondSignature && transaction.sign_signature) { // wxm block database
    const signSignatureBuffer = Buffer.from(transaction.sign_signature, 'hex') // wxm block database
    for (let i = 0; i < signSignatureBuffer.length; i++) {
      bb.writeByte(signSignatureBuffer[i])
    }
  }

  bb.flip()

  return bb.toBuffer()

  // competifined browser
  // const arrayBuffer = new Uint8Array(bb.toArrayBuffer());

  // const buffer = [];

  // for (let i = 0; i < arrayBuffer.length; i++) {
  //     buffer[i] = arrayBuffer[i];
  // }

  // return Buffer.from(buffer);
}

async function getAssetBytes (transaction) {
  if (Asset.Utils.isTypeValueExists(transaction.type)) {
    const trans = Asset.Utils.getTransactionByTypeValue(transaction.type)
    const transCls = require(trans.package).default[trans.name]

    let transInst = new transCls()
    const buf = await transInst.getBytes(transaction)
    transInst = null

    return buf
  }
  return null
}

export {
  getBytes
}
