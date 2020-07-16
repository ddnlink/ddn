// import ByteBuffer from 'bytebuffer'
// const bb = new ByteBuffer()
// console.log('bb', bb)
// console.log('bb.toArrayBuffer()', bb.toArrayBuffer())
// const arrayBuffer = new Uint8Array(bb.toArrayBuffer())
// console.log('arrayBuffer', arrayBuffer)
// bb.writeString('Hello world!')
// console.log('bb', bb)
// bb.flip()
// console.log('bb', bb)
// console.log('bb.toBuffer', bb.toBuffer())

// const evidence = {
//   ipid: 'IPIDasdf20180501221md',
//   title: 'title',
//   hash: 'fileHash',
//   url: 'filePath',
//   author: 'Evanlai',
//   size: 'size',
//   type: 'fileType',
//   tags: 'world,cup,test'
// }
// console.log('evidence', evidence)
// // 注册区块链
// // let transaction = DdnJS.evidence.createEvidence(evidence,"dfasdf");

async function main() {
  var ddn = require('./lib').default
  var targetAddress = 'DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh'
  var amount = 100 * 100000000 // 100 DDN
  var password = 'enter boring shaft rent essence foil trick vibrant fabric quote indoor output'
  // var secondPassword = 'erjimimashezhi001'
  var message = '' // 转账备注
  var transaction = await ddn.transaction.createTransaction(targetAddress, amount, message, password)
  console.log(JSON.stringify(transaction))
}

main()