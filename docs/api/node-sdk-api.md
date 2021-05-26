---
order: 6
id: node-sdk-api
title: Node SDK Api
sidebar_label: DDN Node-SDK Api
---


## **1. DDN Node-sdk 说明**

### **1.0 特别说明**

本文档适用于那些基于`node.js`开发的应用程序，多数是后台运行的服务端程序，如果您开发浏览器或钱包等前端应用，请移步[`js-sdk`相关文档](./js-sdk-api.md)。

除非特殊说明，本文档仅仅适合于 `DDN v3.0.0` 以后的版本，当前最新版本为 `DDN v3.5.0`。

文档示例遵从`ES6`语法规范，特别地方会提示`ES5`语法，请注意辨别使用。`ES6`规范会大量使用异步方法，使用`async/await`方法调用。

### **1.1 安装**

```
npm install @ddn/node-sdk --save
```

如果使用 `yarn`，命令如下：

```
$ yarn add -D @ddn/node-sdk
```

### **1.2 使用**

在使用前，请下载对应的主网参数常量文件（文件名字为 `constants.js`)，并放在项目的`config`文件夹下,

了解您所请求的节点信息，写入文件 `.ddnrc.js` 作为节点配置。 上述文件结构如下：

```
project:
    |__ config
    |    |___constants.js
    |____.ddnrc.js
```

在您需要调用 `node=sdk`的地方，这样调用：

```
import DdnJS from '@ddn/node-sdk'

或者

const DdnJS = require('@ddn/node-sdk').default // 注意 有个 default 属性
```

### **1.3 说明**
很多函数都需要传入`secret`、`secondSecret`这2个参数，分表代表密码和二级密码，下面章节不再赘述。
自定义如下全局变量，用于之后章节代码演示。

- `secret` 密码
- `publicKey` 公钥
- `secondSecret` 二级密码

```
> const secret = 'borrow display rebel depart core buzz right distance avocado immense push minor'
> const publicKey = 'ebd4c62ebe2255b7ad5ee43120a9f9191c76e30928c92cd536351e3cc2c626ed';
> const secondSecret = 'helloworldDDN';
```


## **2 账户**

### **2.1 根据密码获取密钥对**

同步方法：`DdnJS.crypto.getKeys(secret)`

- `secret` 密码

```
> DdnJS.crypto.getKeys(secret)
{public_key:"0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",private_key:"ef972c7199f90fcbdfc8e2084f4f49bc23969b5e0c7b91cf48fcd10cf33f3fbc0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c"}
```

### **2.1 根据公钥获取地址**

同步方法：`DdnJS.crypto.getAddress(publicKey)`

- `publicKey`  公钥

```
> DdnJS.crypto.getAddress(publicKey);
'DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ'
```

### **2.3 设置二级密码，type=1**

异步方法：`DdnJS.signature.createSignature(secret, secondSecret)`
`备注` 在主链的交易类型为1

- `secret` 密码
- `secondSecret` 二级密码

```
> await DdnJS.signature.createSignature(secret, secondSecret)
{
    type: 1,
    nethash: "0ab796cd",
    amount: "0",
    fee: "500000000",
    recipient_id: null,
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    timestamp: 55201932,
    asset": {
        signature: {
            public_key: "d1278309b21a361fe43b52b5494a29124555742ec18eb92b7217fe64920e244f"
        }
    },
    signature: "3d0d031df1b014a4b4e953cd8deba43e2258bdfd958e15a06f1200a2255179d8e41aba4850313fe4bbb9dbaffc85b32b6f36b40557a4a96803cbd6a6e16d4f07",
    id: "65bcb122f2f0e58b400b467fa4196f29654b7d6d86267175f6f75dc3f41a1839"
}
```

### **2.4 账户锁仓，type=100**

异步方法：`DdnJS.transaction.createLock(height, secret, secondSecret)`
`备注` 在主链的交易类型为100

- `height` 锁仓高度
- `secret` 密码
- `secondSecret` 二级密码

```
> await DdnJS.transaction.createLock(8130, secret, secondSecret)
{
    type: 100,
    amount: "0",
    nethash: "0ab796cd",
    fee: "10000000",
    recipient_id: null,
    args: ["8130"],
    timestamp: 55202354,
    asset: {},
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    signature: "b1e0e4b2a4141f242ea0d30b4ab6ffcb50717e918d065d3df88d28965d2546d405b286af9ddf586a737f8d5e8ea1c1b2e5fbe007a6d7ffdb079fa5924be67e03",
    id: "74f9e14ce8e4f39ce521b61dd74c095e55ca07dae75590486aceef10855d07ee"
}
```


## **3 普通交易transactions**

### **3.1 在主链转账DDN，type=0**

异步方法：`DdnJS.transaction.createTransaction(recipientId, amount, message, secret, secondSecret)`
`备注` 在主链的交易类型为0

- `recipientId` 接收者地址
- `amount` 转账数量
- `message` 转账附言
- `secret` 密码
- `secondSecret` 二级密码

```
> await DdnJS.transaction.createTransaction(targetAddress, amount, message, secret, secondSecret)
{
    type: 0,
    nethash: "0ab796cd",
    amount: "10000000000",
    fee: "10000000",
    recipient_id: "DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ",
    message: "转账测试",
    timestamp: 55202460,
    asset: {},
    sender_public_key: "2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e",
    signature: "149aa2ce067e60cc949e45341ba0cf7f1e4fd8f5658d1e5dce7801eb6d2c10a3e3d13c6a3e0209519e300c9122f952e26ae0a96f70ec7b907c2958a3dcd34f0d",
    id: "14dd631938d158becbbbb48d0e62b3899da87d115d7c60be16a7e2ee7e23783c"
}
```


### **3.2 根据交易内容获取交易id**

异步方法：`DdnJS.crypto.getId(transaction)`

- `transaction` 签名后的交易内容

```
> await DdnJS.transaction.createTransaction(targetAddress, amount, message, secret, secondSecret)
{
    type: 0,
    nethash: "0ab796cd",
    amount: "1000000000000",
    fee: "10000000",
    recipient_id: "D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L",
    message: "",
    timestamp: 55202702,
    asset: {},
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    signature: "c74bf62d6018c51606e8f4408e2708f35ce62f87f08e2668f394aea159ec32243347b47dfadd88bd3fcbc3a15aaaca53b1beddb13dfb5cdafb1549f52a1c7409",
    id: "d657434ddc9683f96a90ae0f2ef82ec5194f368ab70fef13466350a1d86d8fb6"
}

> await DdnJS.crypto.getId(transaction)
'd657434ddc9683f96a90ae0f2ef82ec5194f368ab70fef13466350a1d86d8fb6'  // 返回结果，交易id

```


## **4 资产相关AOB**

### **4.1 资产发行商注册，type=60**

异步方法：`DdnJS.aob.createIssuer(name, desc, secret, secondSecret)`
```
// 发行商名称,唯一标识
const name = 'IssuerName'
// 发行商描述
const desc = 'IssuerDesc'
// 构造交易数据
const trs = DdnJS.aob.createIssuer(name, desc, secret, secondSecret)
console.log(JSON.stringify(trs))
{
    "type": 60,
    "nethash": "0ab796cd",
    "amount": "0",
    "fee": "10000000000",
    "recipientId": null,
    "senderPublicKey": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c",
    "timestamp": 84671055,
    "message": null,
    "asset": {
        "aobIssuer": {
            "name": "rcpDa",
            "desc": "资产描述"
        }
    },
    "signature": "f8f8bb32e84fda67bdbf6cef27b83ae13684e5e9b4cf1ea3d22e4c1c1d013d10028422ffa199717fe55b4e73470b9f0d33f0a7123059a2fe628f8e58c824900f"
}
```



### **4.2 资产注册，type=61**

异步方法：`DdnJS.aob.createAsset(name, desc, maximum, precision, strategy, '0', '0', '0', secret, secondSecret`
```
// 资产名称，发行商名.资产名，唯一标识
const name = 'IssuerName.CNY'
const desc = '资产描述'
// 上限
const maximum = '1000000'
// 精度，小数点的位数，这里上限是1000000，精度为3，代表资产IssuerName.CNY的最大发行量为1000.000
const precision = 3
// 策略
const strategy = ''
// 构造交易数据
const trs = DdnJS.aob.createAsset(name, desc, maximum, precision, strategy, '0', '0', '0', secret, secondSecret)
console.log(JSON.stringify(trs))
{
    "type": 61,
    "nethash": "0ab796cd",
    "amount": "0",
    "fee": "50000000000",
    "recipientId": null,
    "senderPublicKey": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c",
    "timestamp": 84314778,
    "message": null,
    "asset": {
        "aobAsset": {
            "name": "IssuerName.CNY",
            "desc": "资产描述",
            "maximum": "1000000",
            "precision": 3,
            "strategy": "",
            "allow_blacklist": "0",
            "allow_whitelist": "0",
            "allow_writeoff": "0"
        }
    },
    "signature": "d06ac3ee9ecbca7e856a02a7fa9ac38283269bce02d187daa1e59ac3957a10aff756506816d1e7f528f9f9c0ce90e2dae07ccb36f8076157aa0e6c668e1ff60b"
}
```



### **4.3 资产设置访问控制列表(acl)模式，type=11**

异步方法：`DdnJS.aob.createFlags(currency, flagType, flag, secret, secondSecret)`
```
const currency = 'IssuerName.CNY'
// 资产是否注销，1：流通，2：注销
const flagType = 1
// 访问控制列表的类型，0：黑名单， 1：白名单，资产创建后默认为黑名单模式
const flag = 1
const trs = DdnJS.aob.createFlags(currency, flagType, flag, secret, secondSecret)
console.log(JSON.stringify(trs))
{
    "type":11,
    "amount":0,
    "fee":10000000,
    "recipientId":null,
    "senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",
    "timestamp":19400996,
    "asset":{
        "aobFlags":{
            "currency":"IssuerName.CNY",
            "flagType":1,
            "flag":1
        }
    },
    "signature":"b96fb3d1456e1f26357109cc24d82834eb9a4687f29e69c374bbb1d534568336e148cac52f213aa4d2a69185092f8e1143b49ec4b8048cd9b3af4e20f6ba0b08",
    "signSignature":"b37c77ebebe90341346be2aefe1e12bd7403e5d8f4d6e8f04630190b3e09494a28820da0ffd5f9ff011033aa6d70fc9bb4c159a4493be3b18fd7ff470103570d"
}

```

### **4.4 更新访问控制列表(acl)，type=12**

异步方法：`DdnJS.aob.createAcl(currency, operator, flag, list, secret, secondSecret)`

```
const currency = 'IssuerName.CNY'
// '+'表示增加列表， ‘-’表示删除列表
const operator = '+'
const list = ['15745540293890213312']
// 访问控制列表的类型，0：黑名单， 1：白名单
const flag =1
const trs = DdnJS.aob.createAcl(currency, operator, flag, list, secret, secondSecret)
console.log(JSON.stringify(trs))
{
    "type":12,
    "amount":0,
    "fee":20000000,
    "recipientId":null,
    "senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",
    "timestamp":19403125,
    "asset":{
        "aobAcl":{
            "currency":"IssuerName.CNY",
            "operator":"+",
            "flag":1,
            "list":[
                "15745540293890213312"
            ]
        }
    },
    "signature":"ad4060e04c1a12256de114e34499f8add24326753f1f8362991ee14aefc4c0fe90ff394d2db97e83770855a5688d463de00656fdd2d04604605cf3c04fdaca0e",
    "signSignature":"63129c58b1b9fcce88cbe829f3104a10ab06037253e9b65feb50ce0d2bb988533b93e8edcad016a85675f9027758fc318cf899ca7ef161a95a8d8a055ae83a02"
}
```

### **4.5 资产发行，type=64**

异步方法：`DdnJS.aob.createIssue(currency, amount, secret, secondSecret)`

```
const currency = 'IssuerName.CNY'
// 本次发行量=真实数量（100）*10**精度（3），所有发行量之和需 <= 上限*精度
const amount = '100000'
const trs = await DdnJS.aob.createIssue(currency, amount, secret, secondSecret)
console.log(JSON.stringify(trs))
{
    "transaction": {
        "type": 64,
        "nethash": "0ab796cd",
        "amount": "0",
        "fee": "10000000",
        "recipientId": null,
        "senderPublicKey": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c",
        "timestamp": 84315799,
        "message": null,
        "asset": {
            "aobIssue": {
                "currency": "IssuerName.CNY",
                "amount": "10000"
            }
        },
        "signature": "852acb37e1d336a2becd5c40660a72344d25312d95d3b7dff03d64031943460c1c020ccbbdcc4f9177d19c80e5a04b2bfe4e6bfe14273ce8703513162bb1fb07"
    }
}
```

### **4.6 资产转账，type=14**

异步方法：`DdnJS.aob.createTransfer(currency, amount, recipientId, null, message, secret, secondSecret)`
```
const currency = 'IssuerName.CNY'
// 本次转账数（10000）=真实数量（10）*10**精度（3），需 <= 当前资产发行总量
const amount = '10000'
// 接收地址，需满足前文定义好的acl规则
const recipientId = 'DKKHPvQb2A119LNicCQWLZQDFxhGVEY57a'
const message = 'xxxxx(交易所ID)'

const trs = DdnJS.aob.createTransfer(currency, amount, recipientId, null, message, secret, secondSecret)
console.log(JSON.stringify(trs))
{
    "type": 14,
    "amount": 0,
    "fee": 10000000,
    "recipientId": "DKKHPvQb2A119LNicCQWLZQDFxhGVEY57a",
    "senderPublicKey": "fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",
    "timestamp": 19481489,
    "asset": {
        "aobTransfer": {
            "currency": "IssuerName.CNY",
            "amount": "10000"
        }
    },
    "signature": "77789071a2ad6d407b9d1e0d654a9deb6d85340a3d2a13d786030e26ac773b4e9b5f052589958d2b8553ae5fc9449496946b5c225e0baa723e7ddecbd89f060a",
    "signSignature": "f0d4a000aae3dd3fa48a92f792d4318e41e3b56cdbaf98649261ae34490652b87645326a432d5deb69f771c133ee4b67d2d22789197be34249e6f7f0c30c1705"
}
```

### **4.7 资产注销，type=11**

异步方法：`DdnJS.aob.createFlags(currency, flagType, flag, secret, secondSecret)`
```
const currency = 'IssuerName.CNY'
// flagType为资产是否注销，1：流通，2：注销
const flagType = 2
// flag为黑、白名单模式
const flag =1
const trs = DdnJS.aob.createFlags(currency, flagType, flag, secret, secondSecret)
console.log(JSON.stringify(trs))
{
    "type":11,
    "amount":0,
    "fee":10000000,
    "recipientId":null,
    "senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",
    "timestamp":19488690,
    "asset":{
        "aobFlags":{
            "currency":"IssuerName.CNY",
            "flagType":2,
            "flag":1
        }
    },
    "signature":"cbd656552417604704703e1236ec2bbed8eba6a2ccfcb54cc0b2d629c0a9d1335a264fc9f6dee1705f4a86c36a5ce2ba8e039d913a189b7c273c8ac0d9e3780c",
    "signSignature":"3c7b91d03efeed2dc86e1f2301da60789751c1be8850460d8c66c0ae8f55ea27d26f0bc79541d74b4777d9b85c518c1c73c0284dbf3e826db0a686560e57a80b"
}
```

## **5 受托人delegate**
### **5.1 注册受托人,type=2**

异步方法：`delegate.createDelegate(username, secret, secondSecret)`
`备注` 在主链的交易类型为2

- `username` 受托人名字
- `secret` 密码
- `secondSecret` 二级密码

```
> await DdnJS.delegate.createDelegate(userName, secret, secondSecret || undefined)
{
    type: 2,
    nethash: "0ab796cd",
    amount: "0",
    fee: "10000000000",
    recipient_id: null,
    sender_public_key: "07ada08c4585cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c",
    timestamp: 55203864,
    asset: {
        delegate: {
            username: "softwaiter",
            public_key: "07ada08c4585cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c"
        }
    },
    signature: "b3643b4e4e844ac3a2ce1a69f0fe7805e59d3f8e4914c7ac23348bc5c237891a47418fe0fbd592f007c8f2f5f5d9ec408fd44bcee3f7b4af54fcb2adf5901306",
    id: "271044a649f8e43ee054568987d72f611182b345c18021cd30e8fd586e3135f6"
}
```

### **5.2 给受托人增加/取消投票，type=3**

异步方法：`vote.createVote(keyList, secret, secondSecret)`
`备注` 在主链的交易类型为3

- `keyList` 受托人公钥列表
- `secret` 密码
- `secondSecret` 二级密码

```
// 投票内容是一个列表，列表中的每一个元素是一个符号加上所选择的受托人的公钥，符号为+表示投票，符号为-表示取消投票
> await DdnJS.vote.createVote(voteContent, secret, secondSecret || undefined);
{
    type: 3,
    nethash: "0ab796cd",
    amount: "0",
    fee: "10000000",
    recipient_id: null,
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    timestamp: 55204126,
    asset: {
        vote: {
            votes: ["+07ada08c4585cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c"]
        }
    },
    signature: "4113ae3454c02381f83725a6bc3081a4d93ac39c3a1601f79d01aa466c8cc1e3675a48682e379a4797450bec267c7fc50093cb62fb52ae86aef181aa782ea209",
    id: "ef297a4817f95e6a8c53e547a50f3e41c2105b15f20aa304ac5cd78b41671865"
}
```


<!-- ## **6 dapp相关**

### **6.1 dapp注册，type=5**

异步方法：`await DdnJS.dapp.createDApp(options, secret, secondSecret)`
```
const options = {
      name: 'ddn-dapp-demo',
      link: 'https://github.com/ddnlink/ddn-dapp-demo/archive/master.zip',
      category: 1,
      description: 'Decentralized news channel',
      tags: 'ddn,dapp,demo',
      icon: 'http://o7dyh3w0x.bkt.clouddn.com/hello.png',
      type: 0,
      delegates: [
        '8b1c24a0b9ba9b9ccf5e35d0c848d582a2a22cca54d42de8ac7b2412e7dc63d4',
        'aa7dcc3afd151a549e826753b0547c90e61b022adb26938177904a73fc4fee36',
        'e29c75979ac834b871ce58dc52a6f604f8f565dea2b8925705883b8c001fe8ce',
        '55ad778a8ff0ce4c25cb7a45735c9e55cf1daca110cfddee30e789cb07c8c9f3',
        '982076258caab20f06feddc94b95ace89a2862f36fea73fa007916ab97e5946a'
      ],
      unlock_delegates: 3
    }
await DdnJS.dapp.createDApp(options, secret, secondSecret)

{
  nethash: '0ab796cd',
  type: 5,
  amount: '0',
  fee: '10000000000',
  recipientId: null,
  senderPublicKey: '374dd603bd609187745bc71b75f3621652291bf21de8f74995a33053ca98f2cd',
  timestamp: 84978305,
  asset: {
    dapp: {
      category: 1,
      name: 'ddn-dapp-demo',
      description: 'Decentralized news channel',
      tags: 'ddn,dapp,demo',
      type: 0,
      link: 'https://github.com/ddnlink/ddn-dapp-demo/archive/master.zip',
      icon: 'http://o7dyh3w0x.bkt.clouddn.com/hello.png',
      delegates: [Array],
      unlock_delegates: 3
    }
  },
  signature: '4dc58e131bf8ed4e08106c5db4bb9a0ec63ea53e2629ba0f8b2cb62f02777a86127eaee0ecdee45fadc4f458021ef4a6a1aed262f5c817d849e54ad51b7a8d02',
  sign_signature: '0bf8cc293c1b08c8838a74ad1f11d14eb5e1760ba73b3db090924508d85d500a31a2714d2e54ae201c8262c3be0330759446154b4b0343aefb7b43280739440f',
  id: 'cf99231046f2ae8a978ce3475f7f324a10296cfd3c7f10d47acefa79833429f54ed873a8fbcdd9642be6d309ad24c6483a7722b2a68c42330b9d4d2ed82ac126'
}
```

### **6.2 dapp充值，type=12 toconfirm**

异步方法：`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
const obj = {
    dapp_id: "14819b293859529eba5ca7b51cde02b808699fc0b128fd4de94800dc99665a48",
    currency: "DDN",
    amount: "1000000000000"
};
await DdnJS.assetPlugin.createPluginAsset(12, obj, secret, secondSecret)
{
    type: 12,
    nethash: "0ab796cd",
    amount: "1000000000000",
    recipient_id: null,
    sender_public_key: "2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e",
    timestamp: 55265239,
    message: null,
    asset: {
        inTransfer: {
            dapp_id: "14819b293859529eba5ca7b51cde02b808699fc0b128fd4de94800dc99665a48",
            currency: "DDN"
        }
    },
    fee: "10000000",
    signature: "8f4b3d21bfa3bca8c94ca55fafa13ed18c0c38e884261a9212a002a8fc13541b74592dbaf08b7e4fa8b60d6ffa36ab0fff00b303fc4f9eb08d80b68815552900"
}
```

### **6.3 dapp提现** -->
<!-- #### **6.3.1 创建提现交易，type=13**

异步方法：`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
const obj = {
    recipient_id: "DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ",
    dapp_id: "14819b293859529eba5ca7b51cde02b808699fc0b128fd4de94800dc99665a48",
    currency: "DDN",
    aobAmount: "100000000"
}
const transaction = await DdnJS.assetPlugin.createPluginAsset(12, obj, secret, secondSecret)
{
    type: 13,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: "DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ",
    sender_public_key: "07ada08c4585cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c",
    timestamp: 55265725,
    message: null,
    asset: {
        outTransfer: {
            dapp_id: "14819b293859529eba5ca7b51cde02b808699fc0b128fd4de94800dc99665a48",
            currency: "DDN",
            amount: "100000000"
        }
    },
    fee: "10000000",
    signature: "5cd65d4d0a3a79c00864ddb3d3d0add8c9c9244a0115ad642301d8c5e7ee72459a354bc647486535cf0018609ed6f6ef061bde0984f9f40cc3dee5aa38861e00"
}
```

#### **6.3.2 受托人对提现交易进行签名**

异步方法：`transfer.signOutTransfer(transaction, secret, secondSecret)`
`备注` dapp提现交易，需要多个受托人签名后才能生效。受托人签名的最小数量取决于dapp的注册参数：unlock_delegates。

```
// 沿用上一章节《6.3.1 创建提现交易,type=13》的变量
transaction.signatures = []; // 受托人签名列表
for (let i = 0; i < dapp.unlock_delegates; i++) {
    transaction.signatures.push(await DdnJS.transfer.signOutTransfer(transaction, delegates[i].password))    //使用受托人密钥对交易进行签名
}
{
    type: 13,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: "DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ",
    sender_public_key: "07ada08c4585cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c",
    timestamp: 55265725,
    message: null,
    asset: {
        outTransfer: {
            dapp_id: "14819b293859529eba5ca7b51cde02b808699fc0b128fd4de94800dc99665a48",
            currency: "DDN",
            amount: "100000000"
        }
    },
    fee: "10000000",
    signature: "5cd65d4d0a3a79c00864ddb3d3d0add8c9c9244a0115ad642301d8c5e7ee72459a354bc647486535cf0018609ed6f6ef061bde0984f9f40cc3dee5aa38861e00",
    signatures: ["5cd65d4d0a3a79c00864ddb3d3d0add8c9c9244a0115ad642301d8c5e7ee72459a354bc647486535cf0018609ed6f6ef061bde0984f9f40cc3dee5aa38861e00", "a973969668745228b7908521d1acb3dabe3a9aaa448ceeeede145b71e7e5377a61797552b145f8643b76cb809296b2c267a8bd8599705de19b2edb1a3589e300", "8973bd23807763fc3e1973b269665e256c0c61a181b090705afea7038d0ba0adcfafbfc371f334be84b33630de0528e05c5ffe9e5c8c296e92c190582dadc30d"]
}
``` -->


## **6 存证Evidence**

### **6.1 创建存证交易，type=20**

异步方法：`DdnJS.evidence.createEvidence(evidencee, secret, secondSecret);`
```
const evidencee = {
    ipid: 'ipid3', // 资产id
    title: 'node.randomUsername()', // 标题
    description: ' has been evidence.', // 描述
    hash: 'f082022ee664008a1f15d62514811dfd', // 数据哈希
    author: 'Evanlai', //作者
    size: '2448kb',  //大小
    type: 'html', //类型
    url: 'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html', // 链接地址
    tags: 'world,cup,test', // 标签
  };

  // 其中password是在用户登录的时候记录下来的，secondPassword需要每次让用户输入
  // 可以通过user.secondPublicKey来判断用户是否有二级密码，如果没有，则不必输入，以下几个交易类型类似
  const transaction = await DdnJS.evidence.createEvidence(evidencee, secret, null);
  console.log(JSON.stringify({ transaction }));

  {
    "transaction":{
        "type":20,
        "nethash":"0ab796cd",
        "amount":"0",
        "fee":"10000000",
        "recipientId":null,
        "senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
        "timestamp":93994165,
        "asset":{
            "evidence":{
                "ipid":"ipid3",
                "title":"node.randomUsername()",
                "description":" has been evidence.",
                "hash":"f082022ee664008a1f15d62514811dfd",
                "author":"Evanlai",
                "size":"2448kb",
                "type":"html",
                "url":"dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "tags":"world,cup,test",
                "ext":"china",
                "ext1":12345,
                "ext2":"2020-11-12T09:49:50.503Z"
            }
        },
        "signature":"26bd82046495f3dc4b2ed9d4452aa0f25be2a5a542fc52c5561a34c06dc8e1ebec03f6fcdbca115517d898c319c56cb448b35596e61bdd677adf9dfd4a87350f",
        "id":"0ff3ba6dc2ceab676107f9a6a66c60d9ec17745a8cd53e3f25ff0da6829727da7d2fc6d470d43d85bd13923b7bdfe54bca6d4da97b0ac60ccd5b55b6a11b51b6"
    }
}
```

## **7 签名验证相关crypto**

自定义如下已签名的转账交易内容(在主链给D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L转账100DDN)，用于下面章节演示。
```
const targetAddress = "D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L";
const amount = 100*100000000;   //100 DDN
const message = 'notethis';
const transaction = await DdnJS.transaction.createTransaction(targetAddress, amount, message, secret, secondSecret)

{
    type: 0,
    nethash: "0ab796cd",
    amount: "10000000000",
    fee: "10000000",
    recipient_id: "D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L",
    message: "notethis",
    timestamp: 55275113,
    asset: {},
    sender_public_key: "2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e",
    signature: "785cdcbf205980cd995c44603a0c68aa4a6f5aa1b89d7679712d5925efe7cf4dd721cd7e8e48f3db21a3ea055baec85990dca2886bf651feacd2ed9cf2c2060d",
    id: "ea9eb61d77bd3e405786dcdef04d5486a2c52ed3448216fefedc453c8a12b06b"
}
```

### **7.1 根据交易内容获取字节Buffer对象**

异步方法：`crypto.getBytes(transaction, skipSignature, skipSecondSignature)`

- `transaction` 交易内容,可以是签名后也可是未签名的,默认需传入签名后的交易。必传参数
- `skipSignature` 是否跳过签名计算，默认不跳过。非必传参数
- `skipSecondSignature` 是否跳过二级密码签名计算，默认不跳过。非必传参数

```
// 此时transaction.signature和transaction.signSignature都会计算在内
await DdnJS.crypto.getBytes(transaction)
> <Buffer 00 41 6f 4b 03 30 61 62 37 39 36 63 64 2e 6d 97 8c 5e 6f 1f bf c5 a2 7a bd 96 4d 9b 6a dc 35 2d aa 81 e3 1d 90 98 a4 f5 ee 3d 7f 88 5e 44 34 46 4e 32 ... >   // 返回的字节buffer对象
```

### **7.2 根据交易内容获取Hash Buffer对象**

异步方法：`crypto.getHash(transaction, skipSignature, skipSecondSignature)`

- `transaction` 交易内容,可以是签名后也可是未签名的,默认需传入签名后的交易。必传参数
- `skipSignature` 是否跳过签名计算，默认不跳过。非必传参数
- `skipSecondSignature` 是否跳过二级密码签名计算，默认不跳过。非必传参数

```
// 此时transaction.signature和transaction.signSignature都会计算在内
await DdnJS.crypto.getHash(transaction)
> <Buffer d5 31 9c 14 43 4c 7d c4 49 80 b5 8e 81 70 cb 45 fe 53 4c 58 6b c0 bc 1d 42 49 1c 22 47 28 42 a1> // 返回的Hash Buffer
```

### **7.3 对交易Bytes Buffer进行签名**

异步方法：`crypto.signBytes(bytes, keys)`

- `bytes` 交易的Bytes Buffer，未签名交易或者一级密码签名但二级密码未签名的交易
- `keys` 公钥/私钥 密钥对

```
// 定义未签名交易
const transaction = {
    type: 0,
    nethash: "0ab796cd",
    amount: "10000000000",
    fee: "10000000",
    recipient_id: "D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L",
    message: "notethis",
    timestamp: 55275113,
    asset: {}
}

// 根据密码，生成
const keys = await DdnJS.crypto.getKeys(node.Gaccount.password);
{
    "public_key":"2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e","private_key":"863669059023e53d46d92b6a1a7bdaa8a9ff3555d98c07517c2a3a08c89ff9d02e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e"
}

transaction.sender_public_key = keys.public_key;
> '2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e'

// 获取交易的Bytes Buffer
const buf = await DdnJS.crypto.getBytes(transaction);
> '<Buffer 00 69 6e 4b 03 30 61 62 37 39 36 63 64 2e 6d 97 8c 5e 6f 1f bf c5 a2 7a bd 96 4d 9b 6a dc 35 2d aa 81 e3 1d 90 98 a4 f5 ee 3d 7f 88 5e 44 34 46 4e 32 ... >'

// 通过私钥对交易Bytes Buffer进行签名
const signature = DdnJS.crypto.signBytes(buf, keys);
> '785cdcbf205980cd995c44603a0c68aa4a6f5aa1b89d7679712d5925efe7cf4dd721cd7e8e48f3db21a3ea055baec85990dca2886bf651feacd2ed9cf2c2060d'    // 返回值与上面自定义的已签名交易中的签名一致

transaction.signature = signature;
```

### **7.4 验证交易签名是否和已存在的签名一致**

同步方法：`crypto.verifyBytes(bytes, signature, publicKey)` 返回true/false

- `bytes` 交易的Bytes Buffer，未签名交易或者一级密码签名但二级密码未签名的交易
- `signature` 待校验的签名
- `publicKey` 签名者公钥

```
// 沿用上一章节《对交易Bytes Buffer进行签名》的变量
DdnJS.crypto.verifyBytes(buf,transaction.signature,transaction.senderPublicKey)
> true
```

## **8 智能合约**
### **8.1 部署智能合约**
请求参数说明：

|名称	|类型   |必填 |说明              |
|------ |-----  |---  |----              |
|transaction|json|Y|DdnJS.contract.deploy生成部署合约交易|

返回参数说明：

|名称|类型|说明|
|------|-----|----|
|success|boolean|是否成功获得response数据。|
|transactionId|string|交易id|


请求示例：
```js
// 合约参数
const options = {
    name: 'test contract', // 合约名称
    desc: '合约描述',       // 合约描述
    gas_limit: '100000',   // 本次交易消耗的最大gas
    owner: 'DM3j18U3zmW87HcwGPZviaRrnmZfhJmYoG', //合约所有者地址，默认是交易发起人
    version: 'v1.0',       // 合约代码版本
    code: '...' // 略, 合约的ts源代码，可以用fs.readFileSync('./contract.ts')的方式读取
}

// 构造交易数据
const trs = DdnJS.contract.deploy(options, secret)
console.log(JSON.stringify(trs))
{
	"type": 60,
	"nethash": "0ab796cd",
	"amount": "0",
	"fee": "10000000000",
	"recipientId": null,
	"senderPublicKey": "e382a23e136866863c2d8c7f743b1ada594da39f6a425c9ad031f69fe15a9352",
	"timestamp": 107116316,
	"message": null,
	"asset": {
		"contract": {
			"name": "test contract",
			"gas_limit": 5000,
			"owner": "D4g4BztXXU2vguNhx45qGSVB9GtSTp8329",
			"desc": "test contract",
			"version": "1.0.0",
			"code": "合约代码"
		}
	},
	"signature": "41f18e0e181d2a07c491ef60599b81e3d8eeef486b4359c3f81415a54623dc34f3505b33bac50f53b09a560e1b58d0f692183178d059ac692a85b354ffe70602",
	"id": "0ee7a3909cef660ecfb8a81c76747cc815310be7f52232f6533a32f45e6657cb196c4d172b286bc96093c2e09de5935c91c790839c7ebed3d16b1430c0c0674f"
}
```
将生成的交易数据以transaction为key，放入json，调用上链接口提交，注册合约
```sh
curl --location --request POST 'http://127.0.0.1:8001/peer/transactions' \
--header 'Content-Type: application/json' \
--header 'nethash: 0ab796cd' \
--header 'version: 3.0' \
--data-raw '{
    "transaction": {
        "type": 60,
        "nethash": "0ab796cd",
        "amount": "0",
        "fee": "10000000000",
        "recipientId": null,
        "senderPublicKey": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c",
        "timestamp": 84314217,
        "message": null,
        "asset": {
            "contract": {
				"name": "test contract",
				"gas_limit": 5000,
				"owner": "D4g4BztXXU2vguNhx45qGSVB9GtSTp8329",
				"desc": "test contract",
				"version": "1.0.0",
				"code": "合约代码"
            }
        },
        "signature": "4043460ca15d3b24361e611b3009ad3212ae97c0872267bf855b765b38a9386580db368a7f12dcf9165a6367c08ee30d67c48ffe68e08a382e2ab0638dd1560f"
    }
}'
```
返回结果
```json
{
    "success": true,
    "transactionId": "8c70ba13ddac0a3d6d1d4abf5d7cc1af43c4cc3a1c96c6b04ccf0e604b88f64115b8a57245318da424dd6daf6dbf3b41eebe529f464e0cceea045587246d8f9c"
}
```

### **8.2 调用send方法，修改合约状态**
请求参数说明：

|名称	|类型   |必填 |说明              |
|------ |-----  |---  |----              |
|transaction|json|Y|DdnJS.aob.createAsset根据资产名字、描述、上限、精度、策略、一级密码、二级密码生成的交易数据|

返回参数说明：

|名称|类型|说明|
|------|-----|----|
|success|boolean|是否成功获得response数据。|
|transactionId|string|交易id|


请求示例：
```js
const options = {
    id: 'xxxxxx',         // 合约地址，唯一标识
    gas_limit: 10000,     // 本次调用最大可消耗的gas
    method: 'transfer',   // 合约方法名，合约代码中确实存在的方法
    args: ['200', 'DDN'], // 方法变量，按照合约中方法参数顺序，以数组的形式提供
}
// 构造交易数据
const trs = DdnJS.contract.send(options, secret)
console.log(JSON.stringify(trs))
{
    "type": DdnUtils.assetTypes.CONTRACT_TRANSFER, // 12
    "nethash": "0ab796cd",
    "amount": "0",
    "fee": "50000000000",
    "args": "['DKAzdDnLnB6TcgwfTCGfEQ7pTE94a5FW1C', 'transfer', '10000', [200, 'ddn']]",
    "recipientId": null,
    "senderPublicKey": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c",
    "timestamp": 84314778,
    "message": null,
    "signature": "d06ac3ee9ecbca7e856a02a7fa9ac38283269bce02d187daa1e59ac3957a10aff756506816d1e7f528f9f9c0ce90e2dae07ccb36f8076157aa0e6c668e1ff60b"
}

```
将生成的交易数据以transaction为key，放入json，调用上链接口提交，注册资产IssuerName.CNY
```sh
curl --location --request POST 'http://127.0.0.1:8001/peer/transactions' \
--header 'Content-Type: application/json' \
--header 'nethash: 0ab796cd' \
--header 'version: 3.0' \
--data-raw `{
    "transaction": {
        "type": 12,
        "nethash": "0ab796cd",
        "amount": "0",
        "fee": "50000000000",
		"args": "['DKAzdDnLnB6TcgwfTCGfEQ7pTE94a5FW1C', 'transfer', '10000', [200, 'ddn']]",
        "recipientId": null,
        "senderPublicKey": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c",
        "timestamp": 84314778,
        "message": null,
        "signature": "d06ac3ee9ecbca7e856a02a7fa9ac38283269bce02d187daa1e59ac3957a10aff756506816d1e7f528f9f9c0ce90e2dae07ccb36f8076157aa0e6c668e1ff60b"
    }
}`

```
JSON返回示例：
```json
{
    "success": true,
    "transactionId": "b763c260aea7769d71063c3dcf4aa7b07d58a3765d6561967f3a09b99e8348e70ab701d52a149348be00494fe84c62bb58cd677a0de3fdcef472899569ef407a"
}
```

## **9 其它**

### **9.1 时间相关slot.time**

#### **9.1.1 DDN主网创世块生成时间**

同步方法：`utils.slots.beginEpochTime()`
`备注` 结果为UTC时间,即DDN纪元的开始时间。

```
DdnJS.utils.slots.beginEpochTime()
> 2017-08-20T20:00:00.000Z // DDN主网创世块（block heihgt=1）生成时间，但主网正式运行可以延后（主网正式运行的标志是 生成了block heihgt=2的区块）
```


#### **9.1.2 根据unix时间戳获获DDN时间戳**

同步方法：`utils.slots.getTime(time)`
`备注` 获得结果叫做EpochTim（DDN时间戳），传入的time相对于DDN纪元经历的秒数

- `time` 如果不传值则取当前时刻的 Unix时间戳*1000 (即单位是毫秒）

```
DdnJS.utils.slots.getTime()
> 40655681 // DDN时间戳

const unix_timestamp = 1507713496
const epochTime = DdnJS.utils.slots.getTime(unix_timestamp * 1000)
> 40655896    // DDN时间戳
```

#### **9.1.3 根据DDN时间戳获取unix时间戳**

同步方法：`utils.slots.getRealTime(epochTime)`
`备注` 返回结果是真实的 unix时间戳* 1000

- `epochTime` DDN时间戳，单位是秒

```
const unix_timestamp = 1507713496  // unix时间戳
const epochTime = DdnJS.utils.slots.getTime(unix_timestamp * 1000)
> 40655896    // 通过unix时间戳获取到DDN时间戳

const real_time = DdnJS.utils.slots.getRealTime(epochTime)
> 1507713496000 // 通过DDN时间戳获取unix时间戳

const unix_timestamp === real_time / 1000
> true // 换算结果一致
```

#### **9.1.4 时间格式化**

同步方法：`DdnJS.utils.format.timeAgo()`
计算时间戳发生的时间

```
DdnJS.utils.format.timeAgo(84681568)
> 24 mins ago
```


同步方法：`DdnJS.utils.format.fullTimestamp()`
