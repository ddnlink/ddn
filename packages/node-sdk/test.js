const DdnJS = require('./lib').default
// const DdnCrypto =require('@ddn/crypto')
const data = {
  keypair: {
    publicKey: 'e382a23e136866863c2d8c7f743b1ada594da39f6a425c9ad031f69fe15a9352',
    privateKey:
      '5d87852ce777cd3cf1ad8b238f0cafe48ced31cb487057984189b9537c36b229e382a23e136866863c2d8c7f743b1ada594da39f6a425c9ad031f69fe15a9352'
  },
  address: 'D4g4BztXXU2vguNhx45qGSVB9GtSTp8329',
  secret: 'popular script split neglect tattoo example humor rent excite hammer call man',
  nethash: '0ab796cd',
  Daccount: {
    address: 'D4eobA3Apm3uh4SjwfzKmCzSXm7YjPDFtD',
    publicKey: 'a6b7fb9cb50318d266329cae7ce4153c0ecb99c52cf81770682036d064b6abb4',
    password: 'move grow forward session demise shuffle swift ramp child scheme pulp expire'
  },
  Eaccount: {
    address: 'DL4UoeD5MFUggwwMrscyL11tcLZnNgpCbv',
    publicKey: '0ce867dcd0f8cbd194267acf6313ffba9cc935a1190fcf1e8df4e72662f39f42',
    password: 'punch increase rebuild round layer vacuum trend arrow jeans utility vehicle kingdom'
  }
}
// let scret="real frown model drill number female soup powder air cook toilet hover"
// // var currency = 'test.HBL'
// // // 本次转账数（10000）=真实数量（10）*10**精度（3），需 <= 当前资产发行总量
// // var amount = '10000'
// // // 接收地址，需满足前文定义好的acl规则
// // var recipientId = 'HCbvkApChswHcAhhjthQB9NoHXF81R8mMf'
// // var message = 'xxxxx(交易所ID)'
// // const DdnJS = require('@ddn/node-sdk').default
// // async function main (){
// //   console.log('-------register publisher---------')
// //   let transaction = await DdnJS.aob.createIssuer('test', 'description test', scret)
// //   console.log(JSON.stringify({transaction}))
// //   console.log('--------register--------')
// //   let asset = await DdnJS.aob.createAsset('test.HBL', 'hbl desc', '100000000', 0, '', '0', '0', '0',  scret);
// //   console.log(JSON.stringify({transaction:asset}))
// //   console.log('--------publist--------')
// //   let publist = await DdnJS.aob.createIssue('test.HBL', 100000000, scret);
// //   console.log(JSON.stringify({transaction:publist}))
// //   console.log('----------------')
// //   var trs =await DdnJS.aob.createTransfer(currency, amount, recipientId, null, message, scret, null)
// //   console.log(JSON.stringify({transaction:trs}))

// // }

// // main()

// // 创建dapp
// // async function createDapp(){
// //   let secret="popular script split neglect tattoo example humor rent excite hammer call man"
// //   const options = {
// //     name: 'ddn-dapp-demo2',
// //     link: 'https://github.com/ddnlink/ddn-dapp-demo/archive/master2.zip',
// //     category: 1,
// //     description: 'Decentralized news channel',
// //     tags: 'ddn,dapp,demo',
// //     icon: 'http://o7dyh3w0x.bkt.clouddn.com/hello2.png',
// //     type: 0,
// //     delegates: [
// //       'be15a90fcdb77365fcda1cbb76798209141d7482aed8c175b0278b81d1e89ae7',
// //       '8fb0e2a9575ae7a47be6be2190c2f5c056105d9fdd624f9a01776970ce850e2b',
// //       'e784c27b8b49fe6c9d6a650cf9ed867810d945585b1123f5a3543cd9e7bc4326',
// //       '1318e2bd2461caa74ea1518b8a359f0920d9bbb2c500776849d45d6d94332325',
// //       'bbcb3b8961b86be6f1fe9f568476066fc2c7676b7f1340f76c484a431a324ac7'
// //     ],
// //     unlock_delegates: 3
// //   }
// //   const transaction=await DdnJS.dapp.createDApp(options,secret)
// //   console.log(JSON.stringify({transaction}))
// // }
// // createDapp()
// // dapp充值
// // async function createDappIner() {
// //   let secret = "enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
// //   var dappid = "fddb6eff4f17ade6537d887e12574f2fc27af3a85f01460ccfb1d24ed114653dd7fb69dba66b30feb6f71d0a02f15495e6062e6db0cad3bfc9fa0856fd73f1c0";
// //   var currency = "DDN";
// //   var amount = "10000000000";
// //   const transaction = await DdnJS.transfer.createInTransfer(dappid, currency, amount, secret)
// //   console.log(JSON.stringify({ transaction }))
// // }
// // createDappIner()
// // dapp 链内转账
// // async function createInnerTransaction() {
// //   let secret = "enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
// //   var type = 3;
// //   var options = {fee: '1000000', type: type, args: '["DDN","10000000","D8BVJ2MH1wjfJpyXeFHRo2j9Ddbgh6uFcA"]'};
// //   const transaction = await DdnJS.dapp.createInnerTransaction(options,secret)
// //   console.log(JSON.stringify({ transaction }))
// // }
// // createInnerTransaction()
// // dapp提现
// // async function createOuterTransaction() {
// //   let secret = "enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
// //   var type = 2;
// //   var options = { fee: '1000000', type: type, args: '["rcp.RNC","1000000"]' };
// //   const transaction = await DdnJS.dapp.createInnerTransaction(options, secret)
// //   console.log(JSON.stringify({ transaction }))
// // }
// // createOuterTransaction()

// // async function createEvendence(){
// //     let secret = "enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
// //     const evidence = {
// //       ipid: 'IPIDasdf2018s0501221md',
// //       title: 'Evidencetitle',
// //       hash: 'contensthash',
// //       author: 'author1',
// //       url: 'dat://helloworld/index.html',
// //       tags: 'test, article',
// //       size: '12',
// //       type: 'html'
// //     }
// //     transaction = await DdnJS.evidence.createEvidence(evidence, secret)
// //   console.log(JSON.stringify({ transaction }))
// // }
// // createEvendence()

async function createAobIssure () {
  var name = 'IssuerName'
  // 发行商描述
  var desc = 'IssuerDesc'
  // let secret = "enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
  const transaction = await DdnJS.aob.createIssuer(name, desc, data.secret)
  console.log(JSON.stringify({ transaction }))
}
createAobIssure()
async function createAobAsset () {
  // let secret = "enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
  const transaction = await DdnJS.aob.createAsset(
    'IssuerName.RNC',
    '描述lpl',
    '100000000',
    0,
    '',
    '1',
    '1',
    '1',
    data.secret
  )
  console.log(JSON.stringify({ transaction }))
}
createAobAsset()
async function publishAsset () {
  // const secret = 'enter boring shaft rent essence foil trick vibrant fabric quote indoor output'
  const transaction = await DdnJS.aob.createIssue('IssuerName.RNC', 100, data.secret)
  console.log(JSON.stringify({ transaction }))
}
publishAsset()
async function Acl () {
  // let secret = "enter boring shaft rent essence foil trick vibrant fabric quote indoor output"

  var currency = 'IssuerName.RNC'
  // 资产是否注销，1：流通，2：注销
  var flagType = 1
  // 访问控制列表的类型，0：黑名单， 1：白名单，资产创建后默认为黑名单模式
  var flag = 1
  var transaction = await DdnJS.aob.createFlags(currency, flagType, flag, data.secret)
  console.log(JSON.stringify({ transaction }))
}
Acl()

// async function create () {
//   const targetAddress = data.Eaccount.address
//   const amount = '10000'
//   const message = 'xxx'
//   const secret = data.secret
//   const transaction = await DdnJS.transaction.createTransaction(targetAddress, amount, message, secret)
//   console.log(JSON.stringify({ transaction }))
// }
// create()
