const Ddnjs = require('../lib').default
// import ddn from "../lib";

const targetAddress = 'D792yYKHLNSpsEoRT5c3whgmCq2VYpam55'
const amount = 100 * 100000000 // 100 DDN
const password = 'enter boring shaft rent essence foil trick vibrant fabric quote indoor output'
const secondPassword = 'erjimimashezhi001' // 不能使用？？
const message = '' // 转账备注

// 先执行初始化
Ddnjs.init()

// 其中password是在用户登录的时候记录下来的，secondPassword需要每次让用户输入
// 可以通过user.secondPublicKey来判断用户是否有二级密码，如果没有，则不必输入，以下几个交易类型类似
Ddnjs.transaction.createTransaction(targetAddress, amount, message, password).then(
  (transaction) => {
    console.log(JSON.stringify(transaction))
  }
).catch((err) => {
  console.log(err)
})

// curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":0,"nethash":"0ab796cd","amount":"10000000000","fee":"10000000","recipientId":"D792yYKHLNSpsEoRT5c3whgmCq2VYpam55","message":"","timestamp":6390175,"asset":{},"senderPublicKey":"2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e","signature":"a148f403969d43ff73ded1d633212880e3c003fa40a1ddc8f63ff4cbe0023b54bd3c578934ead6c5a1757398786916d0e6e6d039d08250a6c2e14365dce12c05","id":"e6ed6b1d46b741079dbf35dd87c6bd54acb8fc39cf38bafeb683d42a3bbc1376"}}' http://localhost:8001/peer/transactions && echo
