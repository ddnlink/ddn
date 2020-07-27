---
id: ddn-javascript-sdk
title: DDN Javascript SDK
sidebar_label: DDN Javascript SDK
---


## **1 ddn-javascript-sdk说明**

### **1.0 本文档适合的版本**

除非特殊说明，本文档仅仅适合于 `DDN v3.0.0` 以前的版本，当前最新版本为 `DDN v3.0.0`

### **1.1 ddn-javascript-sdk安装**

```js
npm install @ddn/ddn-javascript-sdk // 正式开源之后的安装方法，请向官方申请
var ddnsdk = require('@ddn/ddn-javascript-sdk');
```

### **1.2 说明**
很多函数都需要传入secret、secondSecret这2个参数，分表代表密码和二级密码，下面章节不再赘述。
自定如下全局变量，用于之后章节代码演示。

- `secret` 密码
- `publicKey` 公钥
- `secondSecret` 二级密码

```js
let secret = 'lens domain skirt token enlist use witness eternal album dentist fresh dove'
let publicKey = '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161';
let secondSecret = 'helloworldDDN';
```

生成的json交易信息都需要通过http api进行广播。
- 主链交易通过 `POST /peer/transactions`
- dapp交易通过 `PUT /api/dapps/dappID/transactions/signed`


## **2 账户**  

### **2.1 根据密码获取密钥对**

`crypto.getKeys(secret)`

- `secret` 密码

```js
ddnsdk.crypto.getKeys(secret)

{ public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  private_key: '75716dceb43074b586c1b90f56996b8f53b256c24925585b8b17e10353899d7d084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161' }
```

### **2.2 根据公钥获取地址**

`crypto.getAddress(publicKey)`

- `publicKey`  公钥

```js
 ddnsdk.crypto.getAddress(publicKey);

'DAmubZohMoKRk2pSRXSpppxWiFXcpTSUiE'

```

### **2.3 设置二级密码,type=1**

`signature.createSignature(secret, secondSecret)`
`备注` 在主链的交易类型为1

- `secret` 密码    
- `secondSecret` 二级密码

```js
 ddnsdk.signature.createSignature(secret, secondSecret)

{ type: 1,
  amount: 0,
  fee: 500000000,
  recipient_id: null,
  sender_public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  timestamp: 40566038,
  asset: { signature: { public_key: '632a41caf7d3c8d3754f27a11004acaea6f5571eed28b42451b5560ee91e991c' } },
  signature: 'ee42f4dc17ace4f76f86fba93c7d86b61a69de46ac96e102e9f93668c8cdd9e6281821c63cb3e0c23099968cccdcfd0197aaab42afba4a98fa696c17b133be06',
  id: '2237134c11b3cbaa9b7951f4afd47454ca04af2c7c6a030729ec63f75230e9ad' }

```

### **2.4 账户锁仓,type=100**

`transaction.createLock(height, secret, secondSecret)`
`备注` 在主链的交易类型为100

- `height` 锁仓高度
- `secret` 密码
- `secondSecret` 二级密码

```js
 ddnsdk.transaction.createLock(8130, secret, secondSecret)

{ type: 100,
  amount: 0,
  fee: 10000000,
  recipient_id: null,
  args: [ '8130' ],
  timestamp: 40566287,
  asset: {},
  sender_public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  signature: '06f6852d0e2e56ca441fa60b407aaa2197290ff096558c746c9c8bcdc971b8c4065ec08edd49c7292eca51849c16c5b8f0d33bb4ce972a932603dcf46a391e0e',
  sign_signature: '3b645b0f6a2c597c55595669a856489c0c4f3a132c798c615b8e0241f3169a367edea7228ebc8915d5fd7a0571cc08c971d07520b9908c80c9b2c2c76ada5e07',
  id: 'c87d93af84939076a65a49c3b483897d262edc340b2d4184a4d2505b58711a91' }
```


## **3 普通交易transactions**  

### **3.1 在主链转账DDN,type=0**

`transaction.createTransaction(recipientId, amount, message, secret, secondSecret)`
`备注` 在主链的交易类型为0

- `recipientId` 接收者地址
- `amount` 转账数量
- `message` 转账附言
- `secret` 密码
- `secondSecret` 二级密码

```js
 let targetAddress = "D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L";  

 let amount = 100*100000000;   //100 DDN

 let message = 'notethis';

 ddnsdk.transaction.createTransaction(targetAddress, amount, message, secret, secondSecret)
{ type: 0,
  amount: 10000000000,
  fee: 10000000,
  recipient_id: 'D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L',
  message: 'notethis',
  timestamp: 40566970,
  asset: {},
  sender_public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  signature: '9bef374be100fcfec59d245af59e5646ba5dcb79c6f1399ddd676a617542eeb45cc363822b84410e379f0caa501c25b66e59142353c04d23d1cb95cf64cef306',
  sign_signature: '513e3efdbb65f8e60e85ca98d8d065ec9bd3bfa6f45a1f48cfade9c94d410338ee64bd55938c168b10f0749335c050312785dbf08882ffd0e40a65fde8c2b10b',
  id: '871554a8346d84cab2147324706d8ab5494fde928a7463a68d536ed6c0357897' }

```
### **3.2 根据交易内容获取交易id**

`crypto.getId(transaction)`

- `transaction` 签名后的交易内容

```
> transaction = ddnsdk.transaction.createTransaction(targetAddress, amount, message, secret, secondSecret)
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

> await ddnsdk.crypto.getId(transaction)  
'd657434ddc9683f96a90ae0f2ef82ec5194f368ab70fef13466350a1d86d8fb6'  // 返回结果，交易id

```

## **4 资产相关AOB**  

### **4.1 资产发行商注册,type=60**

`assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)`  
`备注` 在主链的交易类型为60

- `trsType` number
```js
let trsType = 60
```

- `assetInfo` object
```js
const assetInfo = {
        name: "IssuerName", // 资产发行商名字
        desc: 'IssuerDesc', // 资产发行商描述
        issuer_id: "address", // 创建者address
        fee: '10000000000', // 费用
}

ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)

{
	"type": 60,
	"amount": 0,
	"fee": 10000000000,
	"recipient_id": null,
	"sender_public_key": "fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",
	"timestamp": 19395607,
	"asset": {
		"aobIssuer": {
			"name": "IssuerName",
			"desc": "IssuerDesc",
      "issuer_id": "IssuerAddress",
		}
	},
	"signature": "c6ed2a4bafe2b8aa31f4aaceacc2a96cb028abbabb2ed062937498c58e24ca5467a340ddd63b67f809a680ff91b83e685c64991eb695494ddb2fdc57e5761607",
	"sign_signature": "8eceacbd47c2b8ed335145ced19d7a3a51f99bdd6631d16ed214180c6f80e29bd6d572f45e7c7d685584e55cb5c303cf340406553ece28c9c0a2fa7a777aac0b"
}
```

### **4.2 资产注册,type=61**

`ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)`  
`备注` 在主链的交易类型为61

- `trsType` number
```js
let trsType = 61
```

- `assetInfo` object
```js
const assetInfo = {
            name: "DDD.NCR", // 资产名称，格式为：发行商名.资产名，是资产的唯一标识
            desc: "DDD新币种", // 资产描述
            maximum: "100000000", // 资产可发行的上限值
            precision: 2, // 精度，小数点的位数，这里上限是1000000，精度为3，代表资产IssuerName.CNY的最大发行量为1000.000
            strategy: '', // 发行策略策略，如没隔1年发行10%
            allow_blacklist: '1',
            allow_whitelist: '1',
            allow_writeoff: '1',
            fee: '50000000000'
}

ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)
{
	"type": 61,
	"amount": 0,
	"fee": 50000000000,
	"recipient_id": null,
	"sender_public_key": "fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",
	"timestamp": 19397444,
	"asset": {
		"aobAsset": {
			"name": "IssuerName.CNY",
			"desc": "资产描述",
			"maximum": "1000000",
			"precision": 3,
			"strategy": ""，
      "allow_blacklist": '1',
      "allow_whitelist": '1',
      "allow_writeoff": '1',
		}
	},
	"signature": "c755587d331dd2eb62ef91dce1511d83a3e603c7cdc7548a16052519c21ea89c78364e35e5d46da0e2103fa2fb7f037eec55a5deba18826fa13e4252422d750e",
	"sign_signature": "1b7ed4c21c477b8ff3d2acfdfd7ff85617093f4c21de70938c46b61c9704b037dbcf7f9e5f5dd1a5dc8f22cf473aaa459e6e5b15ced388b8a1da1e307987a509"
}
```

### **4.3 资产流通/注销设置,type=62**

`ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)`  
`备注` 在主链的交易类型为62

- `trsType` number
```js
let trsType = 61
```
- `assetInfo` object
```js
const assetInfo = {
            currency: "DDD.NCR", // 资产名称
            flagType: 1, // 资产是否注销，1：流通，2：注销
            flag: 1, // 访问控制列表的类型，0：黑名单， 1：白名单，资产创建后默认为黑名单模式
}

ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)
{
	"type": 62,
	"amount": 0,
	"fee": 10000000,
	"recipient_id": null,
	"sender_public_key": "fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",
	"timestamp": 19400996,
	"asset": {
		"aobFlags": {
			"currency": "IssuerName.CNY",
			"flagType": 1,
			"flag": 1
		}
	},
	"signature": "b96fb3d1456e1f26357109cc24d82834eb9a4687f29e69c374bbb1d534568336e148cac52f213aa4d2a69185092f8e1143b49ec4b8048cd9b3af4e20f6ba0b08",
	"sign_signature": "b37c77ebebe90341346be2aefe1e12bd7403e5d8f4d6e8f04630190b3e09494a28820da0ffd5f9ff011033aa6d70fc9bb4c159a4493be3b18fd7ff470103570d"
}
```

### **4.4 更新访问控制列表(acl),type=63**

`ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)`  
`备注` 在主链的交易类型为63

- `trsType` number
```js
let trsType = 63
```
- `assetInfo` object
```js
const assetInfo = {
            currency: "DDD.NCR", // 资产名称
            flag: 1, // 访问控制列表的类型，0：黑名单， 1：白名单，资产创建后默认为黑名单模式
            operator: "+", // 操作符，'+'表示增加列表， ‘-’表示删除列表
            list: [ // 待修改地址列表
                'address',
            ].join(",")
}
ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)
{
	"type": 63,
	"amount": 0,
	"fee": 10000000,
	"recipient_id": null,
	"sender_public_key": "fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",
	"timestamp": 19403125,
	"asset": {
		"aobAcl": {
			"currency": "IssuerName.CNY",
			"operator": "+",
			"flag": 1,
			"list": "15745540293890213312"
		}
	},
	"signature": "ad4060e04c1a12256de114e34499f8add24326753f1f8362991ee14aefc4c0fe90ff394d2db97e83770855a5688d463de00656fdd2d04604605cf3c04fdaca0e",
	"sign_signature": "63129c58b1b9fcce88cbe829f3104a10ab06037253e9b65feb50ce0d2bb988533b93e8edcad016a85675f9027758fc318cf899ca7ef161a95a8d8a055ae83a02"
}
```

### **4.5 资产发行,type=64**

`ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)`  
`备注` 在主链的交易类型为64

- `trsType` number
```js
let trsType = 64
```
- `assetInfo` object
```js
const assetInfo = {
            currency: "DDD.NCR", // 资产名称
            aobAmount: "50000000", // 本次发行量=真实数量（100）*10**精度（3），并且所有发行量之和 <= 上限*精度
            fee: '10000000',
}

ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)
{
	"type": 6,4
	"amount": 0,
	"fee": 10000000,
	"recipient_id": null,
	"sender_public_key": "fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",
	"timestamp": 19475744,
	"asset": {
		"aobIssue": {
			"currency": "IssuerName.CNY",
			"amount": "50000000"
		}
	},
	"signature": "32b01a18eca2b0dc7e2ce77ba4e758eaae2532f60844760a762cc20918e7439ac6ca585b921db6ede833ed0bf1c62e30cec545a928abafe0b679183a6ad02202",
	"signSignature": "4fc290d7d7d788e9112a56233df0fe796cba39be3efa0cebf00cbc7e5bc5fd1369fad49e5698d967845b5c02e427926049cab25845d4d385e4a395791906f909"
}
```

### **4.6 资产转账,type=14**

`ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)`
`备注` 在主链的交易类型为65

- `trsType` number
```js
let trsType = 65
```
- `assetInfo` object
```js
const assetInfo = {
            recipient_id: 'AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a', // 收地址，需满足前文定义好的acl规则
            currency: "DDD.NCR", // 资产名字
            aobAmount: "10000", // 本次转账数（10000）=真实数量（10）*10**精度（3），需 <= 当前资产发行总量
            message: '测试转账',
            fee: '0',
}
ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)
{
	"type": 65,
	"amount": 0,
	"fee": 0,
	"recipient_id": "AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a",
	"sender_public_key": "fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",
	"timestamp": 19481489,
	"asset": {
		"aobTransfer": {
			"currency": "IssuerName.CNY",
			"amount": "10000"
		}
	},
	"signature": "77789071a2ad6d407b9d1e0d654a9deb6d85340a3d2a13d786030e26ac773b4e9b5f052589958d2b8553ae5fc9449496946b5c225e0baa723e7ddecbd89f060a",
	"sign_signature": "f0d4a000aae3dd3fa48a92f792d4318e41e3b56cdbaf98649261ae34490652b87645326a432d5deb69f771c133ee4b67d2d22789197be34249e6f7f0c30c1705"
}
```

## **5 受托人delegate**
### **5.1 注册受托人,type=2**

`delegate.createDelegate(username, secret, secondSecret)`
`备注` 在主链的交易类型为2

- `username` 受托人名字
- `secret` 密码
- `secondSecret` 二级密码

```js
 let userName='huoding'

 ddnsdk.delegate.createDelegate(userName, secret, secondSecret || )

{ type: 2,
  amount: 0,
  fee: 10000000000,
  recipient_id: null,
  sender_public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  timestamp: 40568017,
  asset: 
   { delegate: 
      { username: 'huoding',
        public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161' } },
  signature: 'e471ade7ded7785f597821f8946d4e98da5ba4331505141c5bea5ff80bbf30b649218ef03254ac703ce93e15207c8b71c69c0d1400cb5790440860ed0e51a30a',
  sign_signature: 'ec47d565a70e6ad075abaf1ff55c129bde9495e4cc7ab2a9404b698ef257f3b1cfd0ce4f9f1854a1bbfec0f663867823a544f80964e3be05ddf03a50a9b77d07',
  id: '774ccf5e7d9d9fefa459b23d96e10ffae4bb891e1e07912ac1370af04192e810' }
```

### **5.2 给受托人增加/取消投票,type=3**

`vote.createVote(keyList, secret, secondSecret)`
`备注` 在主链的交易类型为3

- `keyList` 受托人公钥列表
- `secret` 密码
- `secondSecret` 二级密码

```js
// 投票内容是一个列表，列表中的每一个元素是一个符号加上所选择的受托人的公钥，符号为+表示投票，符号为-表示取消投票
 let voteContent = [
...     '-ae256559d06409435c04bd62628b3e7ea3894c43298556f52b1cfb01fb3e3dc7',
...     '+c292db6ea14d518bc29e37cb227ff260be21e2e164ca575028835a1f499e4fe2'
... ];


 transaction=ddnsdk.vote.createVote(voteContent, secret, secondSecret || );
{ type: 3,
  amount: 0,
  fee: 10000000,
  recipient_id: null,
  sender_public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  timestamp: 40568669,
  asset: { vote: { votes: [Array] } },
  signature: '66f6f3c4fbb8545df53ea35ff655fc1a28815591885757d0b735e77ed348caf33d8d9cb2895f85cd40bf2d3b4633f45a19ebd1dd130233305a603304a92ce003',
  sign_signature: 'c026d373e026b524efd82ad1ab046708ee1ff68573f016490d12908f5ad00a97fa7501f46834c94f6dd64afd00aa77f9d29ded087977ac6601778d4aacb5cd0e',
  id: '0789524787384e2e4da7773afdd3871193a67303c4da69c4a9070eaa5676d36c' }
  
 transaction.asset.vote.votes
[ '-ae256559d06409435c04bd62628b3e7ea3894c43298556f52b1cfb01fb3e3dc7',
  '+c292db6ea14d518bc29e37cb227ff260be21e2e164ca575028835a1f499e4fe2' ]

```

## **6 dapp相关**

### **6.1 dapp注册,type=11**

`ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)`
`备注` 在主链的交易类型为11

- `trsType` number
```js
let trsType = 11
```
- `assetInfo` object 
```js
 let assetInfo = { // dapp的基本属性，如名字、url、icon、预置的受托人公钥、dapp类型、dapp tag等信息
...   name: 'ddn-dapp-test',
...   link: 'https://github.com/ddnlink/ddn-dapp-test/archive/master.zip',
...   category: 1,
...   description: 'Decentralized news channel',
...   tags: 'ddn,dapp,demo,cctime',
...   icon: 'http://yourdomain.com/hello.png',
...   type: 0,
...   fee: '10000000000',
...   delegates: 
...    [ '8b1c24a0b9ba9b9ccf5e35d0c848d582a2a22cca54d42de8ac7b2412e7dc63d4',
...      'aa7dcc3afd151a549e826753b0547c90e61b022adb26938177904a73fc4fee36',
...      'e29c75979ac834b871ce58dc52a6f604f8f565dea2b8925705883b8c001fe8ce',
...      '55ad778a8ff0ce4c25cb7a45735c9e55cf1daca110cfddee30e789cb07c8c9f3',
...      '982076258caab20f06feddc94b95ace89a2862f36fea73fa007916ab97e5946a' ],
...   unlock_delegates: 3 };

ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)

{ type: 11,
  amount: 0,
  fee: 10000000000,
  recipient_id: null,
  sender_public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  timestamp: 40572296,
  asset: 
   { dapp: 
      { category: 1,
        name: 'ddn-dapp-test',
        description: 'Decentralized news channel',
        tags: 'ddn,dapp,demo',
        type: 0,
        link: 'https://github.com/ddnlink/ddn-dapp-test/archive/master.zip',
        icon: 'http://yourdomain.com/hello.png',
        delegates: [Array],
        unlock_delegates: 3 } },
  signature: '5a8e2dba5e14b4ec62ce1b8543de2796d3cded249ed899c5049dd0adeff00963dd40436e7cfc6f9952e09d5c6ac8f5144d3e568f263586520c68012d3c7ca509',
  id: 'ecf9366a128408b843f0e6b2bd7261a4d602c32ae36a8c3cef609e904f180735' }
 trs.asset.dapp.delegates
[ '8b1c24a0b9ba9b9ccf5e35d0c848d582a2a22cca54d42de8ac7b2412e7dc63d4',
  'aa7dcc3afd151a549e826753b0547c90e61b022adb26938177904a73fc4fee36',
  'e29c75979ac834b871ce58dc52a6f604f8f565dea2b8925705883b8c001fe8ce',
  '55ad778a8ff0ce4c25cb7a45735c9e55cf1daca110cfddee30e789cb07c8c9f3',
  '982076258caab20f06feddc94b95ace89a2862f36fea73fa007916ab97e5946a' ]
```

### **6.2 dapp充值,type=12**

`ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)`
`备注` 在主链的交易类型为12

- `trsType` number
```js
let trsType = 11
```
- `assetInfo` object 
```js
const assetInfo = {
            dapp_id: 'bebe3c57d76a5bbe3954bd7cb4b9e381e8a1ba3c78e183478b4f98b9d532f024',// dapp的id
            currency: "DDN",// 充值的资产名
            amount: 10*100000000//充值的数量
}

ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)

{ type: 6,
  amount: 1000000000,
  fee: 10000000,
  recipient_id: null,
  sender_public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  timestamp: 40578327,
  asset: 
   { inTransfer: 
      { dapp_id: 'bebe3c57d76a5bbe3954bd7cb4b9e381e8a1ba3c78e183478b4f98b9d532f024',
        currency: 'DDN' } },
  signature: '6907c1402c702e0fd504a8734a047c1bb216d437e65d5675325846b92ef8b916fc634ea7e33a7c72c60c058d1496d0385c95e39a8291e27b2dceb2f40b6aed02',
  sign_signature: '86de438431c639124a13429e8c6a8c13a5cbbbab3a8323ae08b56f65faeff6d816815d7cdecfdb7287077b14e4d14865637efc9d7fd72d085b0aa9d82f27170c',
  id: '25be71c296430a409cfeaf1ffaa957d18793f3695db07a846c22a7c467c45994' }
```

### **6.3 dapp提现**
#### **6.3.1 创建提现交易,type=13**

`ddnsdk.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)`
`备注` 在主链的交易类型为13，该接口一般由dapp受托人来调用（受托人每隔10秒扫描侧链上由智能合约所创建的提现交易，发现后则在主链创建type=13的提现交易），所以一般情况下开发人员用不到。

- `trsType` number
```js
let trsType = 13
```
- `assetInfo` object 
```js
let assetInfo = {
            recipient_id: 'D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L', // 提现接收者id
            dapp_id: 'bebe3c57d76a5bbe3954bd7cb4b9e381e8a1ba3c78e183478b4f98b9d532f024',// dapp id
            transaction_id: '123b04a6e380500903d8942622d57987661e72b2ae95464066d0af3f02c3c691', // 提现交易id,该交易id是编号为2的智能合约在侧链dapp上所创建的
            currency: 'DDN',// 提现资产名(DDN或者UIA)
            aobAmount: '10000000'// 提现数额
}

 transaction = ddnsdk.transfer.createOutTransfer(recipientId, dappId, transactionId, currency, amount, secret, secondSecret);
{ type: 13,
  amount: 0,
  fee: 10000000,
  recipient_id: 'D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L',
  sender_public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  timestamp: 40668981,
  asset: 
   { outTransfer: 
      { dapp_id: 'bebe3c57d76a5bbe3954bd7cb4b9e381e8a1ba3c78e183478b4f98b9d532f024',
        transaction_id: '123b04a6e380500903d8942622d57987661e72b2ae95464066d0af3f02c3c691',
        currency: 'DDN',
        amount: '10000000' } },
  signature: '432d25e5c5b81fa3a5937adca2dd4a1e2a38e51f8896838601902e0c123a5ccb664bbc8a55344b9fedb773da98e0988e4e8d1ca99dcbc51a80ea3bc9a6b61806',
  signSignature: '8154c1f8305b9b957974e778de1e08dd3f08afcb70f27624d1385dbae9dfa6d0a3aaed6211ed8a40f4015f7e47312f0f205d94518c68e4deec8d76567f56f10f',
  id: '237925a60ccc0abfc1494720aab8c11c74ba61e8ab3ca4bd8ded8c3215c201a7' }

```

#### **6.3.2 受托人对提现交易进行签名**

`transfer.signOutTransfer(transaction, secret)`
`备注` dapp提现交易，需要多个受托人签名后才能生效。受托人签名的最小数量取决于dapp的注册参数：unlockDelegates。受托人每隔10秒扫描侧链上由智能合约所创建的提现交易，发现有交易且签名个数未满足时，会对其进行签名。一般情况下普通开发人员用不到。

- `transaction` transfer.createOutTransfer生成的提现交易
- `secret` 受托人密码

```js
// 沿用上一章节《6.4.1 创建提现交易,type=7》的变量
transaction.signatures = [] // 受托人签名列表

// 第1个受托人对提现交易transaction进行签名
delegate1_secret = 'chalk flame jeans rebuild dutch stone abstract capital lucky pottery raven depend'
 signature1 = ddnsdk.transfer.signOutTransfer(transaction,delegate1_secret);
'ac0ea4c10b911f2134e5adfb3535ffc070ffa8f2858a5a1bc4e9bef442863e117e6bce552bba0d5b0160c4076dd3c657ebc33cbe077a8ef719798a8bb0fac30c'
transaction.signatures.push(signature1) // 将签名加入到transaction的签名列表中
// 第2个受托人对提现交易transaction进行签名
delegate2_secret = 'twist arrange matter twice daughter cave cause never enough scare warfare uncover'
 signature2 = ddnsdk.transfer.signOutTransfer(transaction,delegate2_secret);
'480e0717e4be02e48a27e2323bf6507c4c72d1033b4e7e674651e9e4feced17836f0b81b91ade99b61620a2766ecc901f090d81cc72d22b86807ae981eb2d10c'
transaction.signatures.push(signature2) // 将签名加入到transaction的签名列表中
// 依次类推，多个受托人都对该交易进行签名，当满足最小签名个数时，该提现交易才会真正生效
 transaction
{ type: 13,
  amount: 0,
  fee: 10000000,
  recipient_id: 'D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L',
  sender_public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  timestamp: 40669013,
  asset: 
   { outTransfer: 
      { dapp_id: 'bebe3c57d76a5bbe3954bd7cb4b9e381e8a1ba3c78e183478b4f98b9d532f024',
        transaction_id: '123b04a6e380500903d8942622d57987661e72b2ae95464066d0af3f02c3c691',
        currency: 'DDN',
        amount: '10000000' } },
  signature: '1dfae733408d374cd7be5f4b55183c0c05dc31341f93daaf82c26c80ab11035202502180dd78c5643edcd3bb481a38f352408bc35e44e6c1c53c95612fbca804',
  sign_signature: '8f4f7aa06c02c0a3d637329e1a3b23489b91797b9f3477afd4314b2f78d1e8e8a369a640d75916bd9477e69363cf440c27124db615dced1701a1a934714afe05',
  id: '95a0c4ac9d5397452629b89410413f54ed37caee84a13edf3c9c26d3d0606dab',
  signatures: 
   [ 'ac0ea4c10b911f2134e5adfb3535ffc070ffa8f2858a5a1bc4e9bef442863e117e6bce552bba0d5b0160c4076dd3c657ebc33cbe077a8ef719798a8bb0fac30c',
     '480e0717e4be02e48a27e2323bf6507c4c72d1033b4e7e674651e9e4feced17836f0b81b91ade99b61620a2766ecc901f090d81cc72d22b86807ae981eb2d10c' ]  // 受托人签名数组
    }
```

## **7 存证Evidence**

### **7.1 创建存证交易,type=10**

`assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)`

- `trsType` number
```js
let trsType = 10
```

- `assetInfo` object
```js
let assetInfo = {
  ipid: "IPIDasdf20180501221md",
  title: "Evidencetitle",
  hash: "contenthash",
  author: "author1",
  url: "dat://helloworld/index.html",
  tags: "test, article",
  size: 12,
  type: "html"
}

assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)
{ type: 10,
  amount: 0,
  fee: 10000000,
  recipient_id: null,
  sender_public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  timestamp: 40578932,
  asset: { evidence: {
            ipid: "IPIDasdf20180501221md",
            title: "Evidencetitle",
            hash: "contenthash",
            author: "author1",
            url: "dat://helloworld/index.html",
            tags: "test, article",
            size: 12,
            type: "html"
          } 
        },
  signature: 'd7f3f29549542d6716bdb13e8e1f97e3965c6fbe34f1ee18dbdcad7ba9cbf83ee7cb2b7fcbaab5ffed5d569771731bb5a40efc4fabd142cb30becdad8bc8bb06',
  sign_signature: '38315bf369540cc7a793139b1b6195f4c0e1512514d62bf028d454182a4b7a8912c1b1e6f617f6fb4ff8d80bd141a2ebb9dfcaa8fee68cfc81f8872611bba803',
  id: '4d0b04a6e380500903d8942622d57987661e72b2ae95464066d0af3f02c3c691' }
```

## **8 签名验证相关crypto**

自定义如下已签名的转账交易内容(在主链给D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L转账100DDN)，用于下面章节演示。

```js
 let targetAddress = "D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L";  
 let amount = 100*100000000;   //100 DDN
 let message = 'notethis';
 transaction = ddnsdk.transaction.createTransaction(targetAddress, amount, message, secret, secondSecret)
{ type: 0,
  amount: 10000000000,
  fee: 10000000,
  recipient_id: 'D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L',
  message: 'notethis',
  timestamp: 40566970,
  asset: {},
  sender_public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  signature: '9bef374be100fcfec59d245af59e5646ba5dcb79c6f1399ddd676a617542eeb45cc363822b84410e379f0caa501c25b66e59142353c04d23d1cb95cf64cef306',
  sign_signature: '513e3efdbb65f8e60e85ca98d8d065ec9bd3bfa6f45a1f48cfade9c94d410338ee64bd55938c168b10f0749335c050312785dbf08882ffd0e40a65fde8c2b10b',
  id: '871554a8346d84cab2147324706d8ab5494fde928a7463a68d536ed6c0357897' }
```
### **8.1 根据交易内容获取交易id**

`crypto.getId(transaction)`

- `transaction` 签名后的交易内容

```js
 ddnsdk.crypto.getId(transaction)  
'871554a8346d84cab2147324706d8ab5494fde928a7463a68d536ed6c0357897'  // 返回结果，交易id

```

### **8.2 根据交易内容获取字节Buffer对象**

`crypto.getBytes(transaction, skipSignature, skipSecondSignature)`

- `transaction` 交易内容,可以是签名后也可是未签名的,默认需传入签名后的交易。必传参数
- `skipSignature` 是否跳过签名计算，默认不跳过。非必传参数
- `skipSecondSignature` 是否跳过二级密码签名计算，默认不跳过。非必传参数

```js
// 此时transaction.signature和transaction.signSignature都会计算在内
 ddnsdk.crypto.getBytes(transaction) 
<Buffer 00 ba 00 6b 02 eb d4 c6 2e be 22 55 b7 ad 5e e4 31 20 a9 f9 19 1c 76 e3 09 28 c9 2c d5 36 35 1e 3c c2 c6 26 ed e3 04 2a 6f 3a 08 ae 89 00 e4 0b 54 02 ...    // 返回的字节buffer对象
```

### **8.3 根据交易内容获取Hash Buffer对象**

`crypto.getHash(transaction, skipSignature, skipSecondSignature)`

- `transaction` 交易内容,可以是签名后也可是未签名的,默认需传入签名后的交易。必传参数
- `skipSignature` 是否跳过签名计算，默认不跳过。非必传参数
- `skipSecondSignature` 是否跳过二级密码签名计算，默认不跳过。非必传参数

```js
// 此时transaction.signature和transaction.signSignature都会计算在内
 ddnsdk.crypto.getHash(transaction)
<Buffer 87 15 54 a8 34 6d 84 ca b2 14 73 24 70 6d 8a b5 49 4f de 92 8a 74 63 a6 8d 53 6e d6 c0 35 78 97 // 返回的Hash Buffer
```

### **8.4 对交易Bytes Buffer进行签名**

`crypto.signBytes(bytes, keys)`

- `bytes` 交易的Bytes Buffer，未签名交易或者一级密码签名但二级密码未签名的交易
- `keys` 公钥/私钥 密钥对

```js
// 定义未签名交易
 let trs = { type: 0,  
...   amount: 10000000000,
...   fee: 10000000,
...   recipient_id: 'D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L',
...   message: 'notethis',
...   timestamp: 40566970,
...   asset: {}}

// 根据密码，生成
 keys = ddnsdk.crypto.getKeys(secret)
{ public_key: '084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161',
  private_key: '75716dceb43074b586c1b90f56996b8f53b256c24925585b8b17e10353899d7d084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161' }
 
 trs.sender_public_key = keys.public_key;
'084a61dfb043b5e1b84199f16481512ebe67dc7d8cd52d9aa32f537dfb729161'

// 获取交易的Bytes Buffer
 buf = ddnsdk.crypto.getBytes(trs)

// 通过私钥对交易Bytes Buffer进行签名
 signature = ddnsdk.crypto.signBytes(buf,keys)
'9bef374be100fcfec59d245af59e5646ba5dcb79c6f1399ddd676a617542eeb45cc363822b84410e379f0caa501c25b66e59142353c04d23d1cb95cf64cef306'    // 返回值与上面自定义的已签名交易中的签名一致

```

### **8.5 验证交易签名是否和已存在的签名一致**

`crypto.verifyBytes(bytes, signature, publicKey)` 返回true/false

- `bytes` 交易的Bytes Buffer，未签名交易或者一级密码签名但二级密码未签名的交易
- `signature` 待校验的签名
- `publicKey` 签名者公钥

```js
// 沿用上一章节《对交易Bytes Buffer进行签名》的变量
 ddnsdk.crypto.verifyBytes(buf,transaction.signature,transaction.sender_public_key)
true // 本章最上面自定义的transaction签名一致
```

## **9 其它**

### **9.1 全局参数变量options**

#### **9.1.1 设置变量k/v**
`options.set(key, values)`

- `key` 键名
- `value` 键值

```js
 ddnsdk.options.set('nethash','fl6ybowg')


```


#### **9.1.2 根据key获取value**

`options.get(key)`

- `key` 键名

```js
 ddnsdk.options.get('nethash')
'fl6ybowg'

```


#### **9.1.3 获取所有的k/v**

`options.getAll()`

```js
 ddnsdk.options.getAll()
{ 
  clientDriftSeconds: 5,    // ddn-js内置变量
  nethash: "fl6ybowg",
}

```

### **9.2 时间相关slot.time**

#### **9.2.1 DDN主网创世块生成时间**

`utils.slots.beginEpochTime()`
`备注` 结果为UTC时间,即DDN纪元的开始时间。

```js
ddnsdk.utils.slots.beginEpochTime()
Wed Jun 06 2018 20:20:20 GMT+0800 (中国标准时间) // DDN主网创世块（block heihgt=1）生成时间，但主网正式运行可以延后（主网正式运行的标志是 生成了block heihgt=2的区块）
```


#### **9.2.2 根据unix时间戳获获DDN时间戳**

`utils.slots.getTime(time)` 
`备注` 获得结果叫做EpochTim（DDN时间戳），传入的time相对于DDN纪元经历的秒数

- `time` 如果不传值则取当前时刻的 Unix时间戳*1000 (即单位是毫秒）

```js
// 获取当前DDN时间戳
 ddnsdk.utils.slots.getTime()
13386186 

// 通过unix_timestamp时间戳获取DDN时间戳
let unix_timestamp = 1541672001
let epochTime = ddnsdk.utils.slots.getTime(unix_timestamp * 1000)
13384380    // DDN时间戳

// 通过时间对象获取对应DDN时间戳
 let now = new Date()
 epochTime = ddnsdk.utils.slots.getTime(now)
 13384381
```

#### **9.2.3 根据DDN时间戳获取unix时间戳**

`utils.slots.getRealTime(epochTime)`
`备注` 返回结果是真实的 unix时间戳* 1000

- `epochTime` DDN时间戳，单位是秒

```js
let unix_timestamp = 1541672001  // unix时间戳
let epochTime = ddnsdk.utils.slots.getTime(unix_timestamp * 1000)
13384380    // 通过unix时间戳获取到DDN时间戳
let real_time = ddnsdk.utils.slots.getRealTime(epochTime)
1541672001000 // 通过DDN时间戳获取unix时间戳

 unix_timestamp === real_time/1000
true // 换算结果一致
```

#### **9.2.4 时间格式化**

`utils.format.fullTimestamp(epochTime)`
`备注` 返回结果是真实的 unix时间戳* 1000

- `epochTime` DDN时间戳，单位是秒

```js
 let unix_timestamp = 1507713496  // unix时间戳
 let formattedTime = ddnsdk.utils.format.fullTimestamp(13384380)
"2018/11/08 18:13:20"
```

#### **9.2.5 显示间隔时间**

`utils.format.timeAgo(epochTime)`
`备注` 返回结果是 ... seconds/mins/hours/days ago

- `epochTime` DDN时间戳，单位是秒

```js
let epochTime = 13384380  // unix时间戳
let diffTime = ddnsdk.utils.format.fullTimestamp(13384380)
"33 mins ago"
```
