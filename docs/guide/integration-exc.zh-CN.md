---
id: ddn-integration-exchange
title: 交易平台对接
sidebar_label: integration exchange
---

# DDN与交易平台对接文档

## 1 DDN基本信息

代币名称：DDN<br>
英文标识：DDN<br>
主网上线时间：2017-12-20 12:00:00<br>
发行总量：1亿，目前总的供应量为134287466个DDN（有一个动态变化的通胀率,发行时间越长,通胀率越低）<br>
共识算法：DPoS <br>
交易模式：账户余额模式，非UTXO<br>
官网：http://www.ddn.net/<br>
在线钱包：http://wallet.ddn.net/，基本功能可以在这里进行体验<br>
区块链浏览器：http://mainnet.ddn.net/<br>
地址格式：字母数字混合，base58格式且以大写字母D开头且长度不低于10，比如DFbgKEUeYTkwEShjBjqFe2L3awJUHjWMw8<br>

DDN 不是 BTC 源码的山寨，而是用 Node.js 全新开发的，目前都是纯 HTTP API，所以对接的时候请勿用 BTC 模板的交易网站代码去生拉硬套，目前有  Node.js 版本的 SDK，交易平台可以直接用，其它开发语言，需要自己封装 HTTP API。<br>
DDN 没有钱包的概念，每个密码对应一个账户地址，也就是说一个“钱包”中只包含一个地址(实质为脑钱包)，与BTC、ETH等区别较大。<br>
DDN 的精度是小数点后8位，但后台处理的时候都是按照整数来处理，比如想转0.1DDN，后台实际处理的是0.1 * 100000000。<br>
DDN http接口文档-中文版：http://docs.ddn.net/zh-CN/api<br>
DDN http接口文档-英文版：http://docs.ddn.net/api<br>
该文档包含大部分的DDN接口，比如查询余额、转账、交易详情等，调用api返回结果为 JSON 数据。<br>

## 2 建议交易平台在局域网内搭建一个DDN全节点

节点安装文档：

中文：http://docs.ddn.net/zh-CN/guide/peer-install-mainnet<br>
英文：http://docs.ddn.net/guide/peer-install-mainnet

## 3 用户充值DDN

DDN支持转账备注，交易平台可以有下面充值方案。

- `为每个用户生成一个充值地址`

### 3.1 方案1-为每个用户生成一个充值地址

#### 3.1.1 为用户生成充值地址

用户UserA登陆交易平台，进入DDN充值页面，平台通过调用下面的代码生成充值地址、写入数据库，并在页面上展示给用户。
通过下面的代码为UserA生成一个DDN充值地址：DHGWRfh7ieEr8MjiGBrvdB2A96avvgqHV1，该充值地址的密码是'ask wild interest shoe decide stone average holiday mirror sleep rough burger'，这里只是举例，数据非真实。

##### 3.1.1.1 调用 HTTP 接口生成地址

```bash
> curl --location --request GET 'http://47.94.144.216:8000/api/accounts/new'
// JSON返回示例如下
{
    "success": true,
    "secret": "ask wild interest shoe decide stone average holiday mirror sleep rough burger",
    "publicKey": "a93b86583868cb9b653556358f56cbe8004813923118f912d87b8d08a60061ca",
    "privateKey": "59c6d2447dc33e94a48e2a8594801f2dfc52df2d80fa0845b99c238fcd34ba2ea93b86583868cb9b653556358f56cbe8004813923118f912d87b8d08a60061ca",
    "address": "DHGWRfh7ieEr8MjiGBrvdB2A96avvgqHV1"
}
```

##### 3.1.1.2 nodejs代码生成地址

```bash
// 以下为nodejs编程语言的demo（目前DDN SDK支持nodejs，其它语言后续会支持，当前需开发者自行编码）

// 建议用ubuntu 16.04，nodejs 8.x最新版
// 安装nodejs的版本管理工具nvm
> curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
// 上面命令执行完成后再开一个os shell窗口执行下面的命令，安装nodejs 8.x
> nvm install 8

// 安装依赖库（ ddn-js )，在os shell中运行
> npm install ddn-js --save

// 以下在node中运行
var DdnJS = require('ddn-js');
const data=DdnJS.crypto.generateAccount();
console.log(data)
{ 
  secret: 'begin confirm cage midnight weird write tomorrow wagon flavor congress robot insect', // 密码
  address: 'D74GXsrkt84cJndnXn2UY8QSQmor54Z2iC', // 钱包地址
  publicKey: '6f0229c05056b144b54c5c3f69c6e89306498f2e1e60b38f4de87d6fdd3309d9', //公匙
  privateKey: 'e65169e6ceedb713a61b2d1a2dfd8afa09a60fe4f775d31c5b34c59738a01e816f0229c05056b144b54c5c3f69c6e89306498f2e1e60b38f4de87d6fdd3309d9' // 私匙
}
```

#### 3.1.2 用户进行充值

用户UserA在DDN钱包（比如http://wallet.ddn.net/#/user/login）往充值地址转DDN,比如转0.8DDN。

#### 3.1.3 交易平台确认用户充值

交易平台检测每个新的区块，可以每隔10秒(也可以是30秒或者一分钟，技术上都没有问题，只是用户体验不一样)检测一次，每次检查时区块高度加1，检查的高度建议持久化存储并增加一个标记位“是否已检查”。
如果区块里面交易详情的接收地址是平台的充值地址，则该笔充值记录需要显示到前端页面上并入库。

##### 3.1.3.1 检测最新区块是否包含交易

```bash
// 通过区块高度获去检查该区块是否有交易并取到区块id，每个新区块都要检查
// height=2604表示区块高度
> curl -k -X GET 'http://47.94.144.216:8000/api/blocks/get?height=2604'
// 返回结果如下,保存到变量res中，下面会用到
{
	"success": true,
	"block": {
		"id": "7c345d7f3f5594f76e5fff0e647186719010600d6b612d33140082dcdd6eb0fd",
		"version": 0,
		"timestamp": 28770,
		"height": 2604,
		"previousBlock": "a97fa96fda5221af2caacdfa1d92500fb5bb663e37ab89f62c1bb98f7f6c844a",
		"numberOfTransactions": 5,
		"totalAmount": 25000000000,
		"totalFee": 50000000,
		"reward": 500000000,
		"payloadLength": 905,
		"payloadHash": "c60ed2b71e17caf60d5d5c75e4f9a5ab0252d8520bd311bcf74864c46d7cc53c",
		"generatorPublicKey": "7f2e3da415156d329b4cd2708ed5846f60ae895d7d7181d3a872f0c6d266e906",
		"generatorId": "D7Pq7YhK8WVyHJsFVLfiXbYFN8hTy7cx1q",
		"blockSignature": "d3dfbfd3381554b06313d368e2651fe1e50cf41c93c17da9853dfb19e2f6a4b730d4c1ace2b53985621c7f3c5747a08b2ad879b4ec6e4b102c478fdc2ee43601",
		"confirmations": "8446423",
		"totalForged": 550000000
	}
}
```

##### 3.1.3.2 根据区块id查询交易详情

```bash
// 如果res.block.numberOfTransactions > 0,则说明该区块包含交易。
// 然后根据res.block.id并利用下面的接口去查询该区块包含的交易详情
> curl -k -X GET 'http://47.94.144.216:8000/api/transactions?blockId=7c345d7f3f5594f76e5fff0e647186719010600d6b612d33140082dcdd6eb0fd'
// 返回结果如下，保存为变量trs
{
	"success": true,
	"transactions": [{
		"id": "4a3a02ae2b84b600e2e3c6ccc5b53a03857b6034242b9fe685ecc6bd7c82bb55",
		"height": "2604",
		"blockId": "7c345d7f3f5594f76e5fff0e647186719010600d6b612d33140082dcdd6eb0fd",
		"type": 0,
		"timestamp": 28763,
		"senderPublicKey": "08688d68bc95c215e1746e6cee80f50497dbf76ca0865325071451db73da603c",
		"senderId": "D12h3kxho2kUiuq57q6nWhp9xBaLpShPcp",
		"recipientId": "DPNkfqCsmeBvENa4jqE5TS2xZ91V5xzC8",
		"amount": 5000000000,
		"fee": 10000000,
		"signature": "564f9ac4e40ef28ebbf73d285520b21e4892ba9672b1b6a0a7884104cc5de618002db409ea149484de0797b9c469daac5ad9b4fc72d613130aec2b4b4961330e",
		"signSignature": "",
		"signatures": null,
		"confirmations": "8446445",
		"args": [],
		"message": "亿书王者归来，大奖送送送！",
		"asset": {}
	}],
	"count": 1
}

// 如果数组trs.transactions.length>0，则循环遍历trs.transactions得到元素i，如果(i.type == 0 and i.recipientId是平台的地址)，那么前端页面就要展示该充值记录并将该记录（充值id、充值地址、数量、确认数、发送时间、充值状态、交易id）写入到本地数据库中。

// 充值状态是由确认数决定的，具体是几，由平台自己定，如果入库时确认数未满足平台标准，则充值状态是“未确认”，否则就是“已确认”.（目前DDN网络认为6个确认就是安全的，交易平台可适当增大该值。）

// 每隔1分钟对本地数据库中所有的“未确认”充值记录进行再次确认，根据数据库中的“交易id”利用下面的接口去检查交易详情
> curl -k -X GET 'http://47.94.144.216:8000/api/transactions/get?id=4a3a02ae2b84b600e2e3c6ccc5b53a03857b6034242b9fe685ecc6bd7c82bb55'
{
	"success": true,
	"transaction": {
		"id": "5a61b58b75a70a42a6d51deba4dba560{
	"success": true,
	"transaction": {
		"id": "4a3a02ae2b84b600e2e3c6ccc5b53a03857b6034242b9fe685ecc6bd7c82bb55",
		"height": "2604",
		"blockId": "7c345d7f3f5594f76e5fff0e647186719010600d6b612d33140082dcdd6eb0fd",
		"type": 0,
		"timestamp": 28763,
		"senderPublicKey": "08688d68bc95c215e1746e6cee80f50497dbf76ca0865325071451db73da603c",
		"senderId": "D12h3kxho2kUiuq57q6nWhp9xBaLpShPcp",
		"recipientId": "DPNkfqCsmeBvENa4jqE5TS2xZ91V5xzC8",
		"amount": 5000000000, // 转账金额
		"fee": 10000000,
		"signature": "564f9ac4e40ef28ebbf73d285520b21e4892ba9672b1b6a0a7884104cc5de618002db409ea149484de0797b9c469daac5ad9b4fc72d613130aec2b4b4961330e",
		"signSignature": "",
		"signatures": null,
		"confirmations": "8446462", //确认数
		"args": [],
		"message": "亿书王者归来，大奖送送送！", //备注信息
		"asset": {}
	}
}
// 当"confirmations"达到平台要求后，更改数据库中的“充值状态”为“已确认”并显示在前端页面，最后用户UserA的DDN余额做相应的增加。

```

至此用户UserA完成了充值流程。

#### 3.1.4 交易平台将用户充值的DDN转到一个总账户中

充值完成后，交易平台再将这些分散的用户DDN转账到交易平台自己的总账户中（请一定保存好密码）。<br>
总账户：可以做为平台的DDN冷钱包或者热钱包供用户提现。<br>
举例，平台DDN总账户地址：DAC5SfCL7Evvm8PChTRJvXr2AQ7UUoyXXe<br>
DDN提供了下面2种方式进行转账操作。

##### 3.1.4.1 通过不安全的api进行转账

这种方式是把密钥放到请求里面并且明文发送给服务器进行交易的生成和签名，不安全，不建议使用。如果非要使用这种方式，务必在局域网内搭建一台DDN节点服务器，用来提供API服务。

- 汇总前通过查询本地数据库将DDN余额大于0的账户找到

- 可以利用如下api将充值的DDN转入到平台总账户中，该操作消耗0.1DDN手续费

```bash
> curl --location --request POST 'http://47.94.144.216:8000/api/transactions' \
--header 'Content-Type: application/json' \
--data-raw '{
    "secret": "enter boring shaft rent essence foil trick vibrant fabric quote indoor output",
    "amount":70000000,
    "recipientId":"D74GXsrkt84cJndnXn2UY8QSQmor54Z2iC",
    "message":"转账备注"
}'
// 返回结果如下
{
	"success": true,    // 转账状态，成功
	"transactionId": "6d9b9338ea71ca74a41995458959250e16e49f52b31f4887ac28d3cc3586b1a1" // 交易id
}
```

##### 3.1.4.2 通过安全的api进行转账

建议使用这种安全的方法进行转账，此种方法是在本地生成交易信息并签名，然后广播到区块链网络中，这里对DDN Server没有安全性要求。

```js
const ddnJs = require('ddn-js')
ddnJs.options.set('nethash',"0ab796cd") // 这里的nathash是测试解节点的nethash，正式节点请切换成正式的nethash
const recipientId = "DqLGmWLxtawABxgBrcn5Zmg86v3Aq9Jnb"
const amount = 70000000
const secret = "horse dinosaur brand october spoon news install tongue token pig napkin leg"
const message = "转账备注"
const secondSecret = null
const transaction = DdnJs.transaction.createTransaction(recipientId, amount, message, secret, secondSecret)
console.log(JSON.stringify({ transaction }))

{"transaction":{"type":0,"nethash":"0ab796cd","amount":70000000,"fee":10000000,"recipientId":"DqLGmWLxtawABxgBrcn5Zmg86v3Aq9Jnb","message":"转账备注","timestamp":93899389,"asset":{},"senderPublicKey":"70d0cbd2c3dccfaaa65acfa5689dbc3656ff0807cd1611e88d854fec07845ac1","signature":"c1a14df95219abf95c9181bf8cfab9abf7e92e43aa1bf09689add0753daf95098a7551002fffdf975224f22fe5c47e3d4c92039fbb628a5f556f0fc62672e400","id":"31bc6250a2269ec7ab23d860b8aec2cd116cb6634a739ead5681e4aca30e785b"}}

提交结果

curl --location --request POST 'http://l47.94.144.216:8000/peer/transactions' \
--header 'nethash: 0ab796cd' \
--header 'version: 0' \
--header 'Content-Type: application/json' \
--data-raw '{"transaction":{"type":0,"nethash":"0ab796cd","amount":70000000,"fee":10000000,"recipientId":"DqLGmWLxtawABxgBrcn5Zmg86v3Aq9Jnb","message":"转账备注","timestamp":93899389,"asset":{},"senderPublicKey":"70d0cbd2c3dccfaaa65acfa5689dbc3656ff0807cd1611e88d854fec07845ac1","signature":"c1a14df95219abf95c9181bf8cfab9abf7e92e43aa1bf09689add0753daf95098a7551002fffdf975224f22fe5c47e3d4c92039fbb628a5f556f0fc62672e400","id":"31bc6250a2269ec7ab23d860b8aec2cd116cb6634a739ead5681e4aca30e785b"}}'

返回结果
{
    "success": true,
    "transactionId": "31bc6250a2269ec7ab23d860b8aec2cd116cb6634a739ead5681e4aca30e785b"
}
```

## 4 提币DDN

提现操作就是转账，把平台的币转给用户。

### 4.1 用户绑定提币地址

用户登陆DDN提现页面，参考其它代币，让用户可以自行绑定提现地址。

### 4.2 用户进行提币

输入提币数量，手机短信验证，点击确认。

### 4.3 平台执行提币操作

参考“3.1.4”章节，有2种转账方式，请自行决定用哪一种。接口会返回，提币的交易id，记录到数据库中并展示到前端页面，更新提币状态为“成功”。

### 4.4 用户确认

用户自行确认提币结果，如有疑问，可以拿着交易id来平台这里进行查询验证。
