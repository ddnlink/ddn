const ByteBuffer = require('bytebuffer')

function getTransactionBytes (trs, skipSignature) {
  const bb = new ByteBuffer(1, true)

  try {
    bb.writeInt(trs.timestamp)
    bb.writeString(trs.fee)

    const senderPublicKeyBuffer = Buffer.from(trs.senderPublicKey, 'hex')
    for (let i = 0; i < senderPublicKeyBuffer.length; i++) {
      bb.writeByte(senderPublicKeyBuffer[i])
    }

    bb.writeInt(trs.type)

    for (let i = 0; i < trs.args.length; ++i) {
      bb.writeString(trs.args[i])
    }

    if (!skipSignature && trs.signature) {
      const signatureBuffer = Buffer.from(trs.signature, 'hex')
      for (let i = 0; i < signatureBuffer.length; i++) {
        bb.writeByte(signatureBuffer[i])
      }
    }

    bb.flip()
  } catch (e) {
    throw Error(e.toString())
  }
  return bb.toBuffer()
}

module.exports = {
  getTransactionBytes: getTransactionBytes
}
