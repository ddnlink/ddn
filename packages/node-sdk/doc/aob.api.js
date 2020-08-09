var DdnJS = require('../lib').default
// 一级密码
var secret = 'pact october wrap gain amazing spring biology allow skull aware laundry unhappy'
// 二级密码
var secondSecret = 'erjimima001'
// 发行商名称,唯一标识
var name = 'IssuerName'
// 发行商描述
var desc = 'IssuerDesc'

// 先执行初始化
DdnJS.init()

// 构造交易数据
DdnJS.aob.createIssuer(name, desc, secret).then((trs) => {
  console.log(JSON.stringify(trs))
}).catch((err) => {
  console.log(err)
})

// 将生成的交易数据通过post发送给server，注册资产发行商IssuerName
// curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":60,"nethash":"0ab796cd","amount":"0","fee":"10000000000","recipientId":null,"senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":6390696,"message":null,"asset":{"aobIssuer":{"name":"IssuerName","desc":"IssuerDesc"}},"signature":"951c426398018ea4293d302b4f75d43163de8d2f83acb6ed130fa45a75c1a1f7fe4fdb5b82c3b78b6bcb1005eb4f423e04b4968f9421502ca46c8ca47ac99308","id":"147abbb8ab5a794c3b31933650053c7fcca7c4362ee3cde21c1945e02e167dc0"}}' 'http://localhost:8001/peer/transactions' && echo
