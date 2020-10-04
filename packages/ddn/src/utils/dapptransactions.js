var ByteBuffer = require('bytebuffer')

function getTransactionBytes (trs, skipSignature) {
  try {
    var bb = new ByteBuffer(1, true)
    bb.writeInt(trs.timestamp)
    bb.writeString(trs.fee)

    var senderPublicKeyBuffer = Buffer.from(trs.senderPublicKey, 'hex')
    for (var i = 0; i < senderPublicKeyBuffer.length; i++) {
      bb.writeByte(senderPublicKeyBuffer[i])
    }

    bb.writeInt(trs.type)

    for (var i = 0; i < trs.args.length; ++i) {
      bb.writeString(trs.args[i])
    }

    if (!skipSignature && trs.signature) {
      var signatureBuffer = Buffer.from(trs.signature, 'hex')
      for (var i = 0; i < signatureBuffer.length; i++) {
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
