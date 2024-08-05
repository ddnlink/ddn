// import ByteBuffer from 'bytebuffer'
import { getBytes as naclGetBytes } from '@ddn/crypto'

async function getBytes (transaction, skipSignature, skipSecondSignature) {
  return naclGetBytes(transaction, skipSignature, skipSecondSignature)
}

// 系统需要 Uint8Array
// function arrayBufferToUnit8Array(byteBuffer) {
//   const unit8Buffer = new Uint8Array(byteBuffer.toArrayBuffer())
//   const buffer = []
//   for (let i = 0; i < unit8Buffer.length; i++) {
//     buffer[i] = unit8Buffer[i]
//   }
//   return Buffer.from(buffer)
// }

// async function getAssetBytes (transaction) {
//   if (global.assets && global.assets.transTypeNames[transaction.type]) {
//     const trans = global.assets.transTypeNames[transaction.type]
//     const TransCls = require(trans.package).default[trans.name]
//     let transInst = new TransCls()
//     const buf = await transInst.getBytes(transaction)

//     transInst = null

//     return buf
//   }
//   return null
// }

export { getBytes }
