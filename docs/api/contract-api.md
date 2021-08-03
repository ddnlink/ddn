---
order: 8
id: contract-api
title: 智能合约(Contract) API
sidebar_label: Smart Contract
---

## **1 API使用说明**
## **1.1 请求过程说明**
1.1 构造请求数据，用户数据按照DDN提供的接口规则，通过程序生成签名，生成请求数据集合；
1.2 发送请求数据，把构造完成的数据集合通过POST/GET等提交的方式传递给DDN；
1.3 DDN对请求数据进行处理，服务器在接收到请求后，会首先进行安全校验，验证通过后便会处理该次发送过来的请求；
1.4 返回响应结果数据，DDN把响应结果以JSON的格式反馈给用户，每个响应都包含success字段，表示请求是否成功，成功为true, 失败为false。 如果失败，则还会包含一个error字段，表示错误原因；
1.5 对获取的返回结果数据进行处理；

---

## **2 接口**
## **2.1 Contract相关交易**

DDN智能合约是DDN区块链系统级的一类区块链资产，其内置的交易类型是11，只需要按照该类型的交易格式组织数据，并广播到区块链节点，即可部署合约。

合约代码将在链上由DVM(DDN virtual machine)进行编译，编译成功，合约部署成功，合约代码及合约元数据等保存在链上。编译失败，则该交易被拒绝。

### 合约交易格式

- 与其他资产类似，合约是链上的一种资产类型，类型编码是11；
- 交易体的asset字段是一个对象，其内容是{ contract: { name: '', desc: '', ...}}；
- name, version, gas_limit, code为必填字段；
- 合约代码由ts语法书写，具体语法请参考[智能合约参考](../guide/contract.zh-CN.md)：

```
// contract: 'HelloWorld.ts'
class HelloWorld extends SmartContract {
    ...
}

```

DDN系统的所有写操作都是通过发起一个交易来完成的。
交易数据通过一个叫做@ddn/node-sdk的库来构建，然后再通过一个POST接口发布出去。

POST接口规格如下：
payload为@ddn/node-sdk创建出来的交易数据
接口地址：/peer/transactions
请求方式：post
支持格式：json
公用变量：
```js
var DdnJS = require('@ddn/node-sdk').default;
// 一级密码
var secret = 'wild corn coil lizard runway flower outside vicious diesel aim slight become'
// address: DNz4hQjV1KWo8LJwhQya9WANZsrhaziABG
// 二级密码
// var secondSecret = 'ddnaobtest001'
```
或
```js
import DdnJS from '@ddn/node-sdk';
// 一级密码
const secret = 'wild corn coil lizard runway flower outside vicious diesel aim slight become'

```

### **2.1.1 注册智能合约**
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
// 控制台输出生成的交易体：
{
    nethash: '0ab796cd',
    type: 11,
    amount: '0',
    fee: '10000000000',
    recipientId: null,
    senderPublicKey:
    '55de4e63127573eae71e5a649c00c39153339e3094d158f77f5f9b07ede17d43',
    timestamp: 110234025,
    asset:
    { 
        contract:
        { 
            name: 'test contract',
            gas_limit: '100000',
            owner: 'DM3j18U3zmW87HcwGPZviaRrnmZfhJmYoG',
            desc: 'test',
            version: 'v1.0',
            code: ...
        }
    }
    signature: 'b120e62f81ee0166553cdb999a90f4b204a84f1ce354a74073e180fb9ec54ed4a327fed9662e0436b66ded65fd421309b27c3a0608829acc622181da1b32c208',
    id: '7e5ef90f7e5e7839c2d7276ccb3e690b758fb1f52c647d2de311bd29612975ce2fe9b24134692af770716519023611708f716a2157c36eedd43d30e2acfb103e'
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
        "type": 11,
        "nethash": "0ab796cd",
        "amount": "0",
        "fee": "10000000000",
        "recipientId": null,
        "senderPublicKey": "55de4e63127573eae71e5a649c00c39153339e3094d158f77f5f9b07ede17d43",
        "timestamp": 84314217,
        "message": null,
        "asset": {
            "contract": {
				"name": "test contract",
				"gas_limit": 10000,
				"owner": "DM3j18U3zmW87HcwGPZviaRrnmZfhJmYoG",
				"desc": "合约描述",
				"version": "1.0.0",
				"code": "合约代码"
            }
        },
        "signature": "b120e62f81ee0166553cdb999a90f4b204a84f1ce354a74073e180fb9ec54ed4a327fed9662e0436b66ded65fd421309b27c3a0608829acc622181da1b32c208"
    }
}'
```
返回结果
```json
{
    "success": true,
    "transactionId": "7e5ef90f7e5e7839c2d7276ccb3e690b758fb1f52c647d2de311bd29612975ce2fe9b24134692af770716519023611708f716a2157c36eedd43d30e2acfb103e"
}
```

### **2.1.2 调用pay方法，向合约转账**
请求参数说明：

|名称	|类型   |必填 |说明              |
|------ |-----  |---  |----              |
|transaction|json|Y|交易数据|

返回参数说明：

|名称|类型|说明|
|------|-----|----|
|success|boolean|是否成功获得response数据。|
|transactionId|string|交易id|


请求示例：
```js

const options = {
    id: 'xxxxxx',         // 合约地址，唯一标识
    gas_limit: 10000,     // 本次调用最大可消耗的gas，不填默认为100000
    method: 'pay',   // 合约方法名，合约代码中确实存在的方法
    amount: '1000',   // 金额，字符串类型的数字
    currency: 'DDN', // token类型
}

// 构造交易数据
const trs = DdnJS.contract.pay({
		id, gas_limit, method, amount, currency
	}, secret, secondSecret)
console.log(JSON.stringify(trs))
{ 
    nethash: '0ab796cd',
    amount: '0',
    fee: '10000000',
    recipientId: null,
    timestamp: 113882476,
    senderPublicKey:
    '55de4e63127573eae71e5a649c00c39153339e3094d158f77f5f9b07ede17d43',
    type: 12,
    args:
    [ { id: 'DAGatZMriKaUA7p3FzwHRamHMusdZ9Q8WS',
        gas_limit: '10000000',
        amount: 1000,
        currency: 'DDN',
        method: 'pay',
        args: '[]' } ],
    signature:
    '9d335b514864d2615ed787828450136f2cf39d135e44b205a8bf0d3f1cf60d67fabbba9168ba81eebfc0dbfacb9a5c3d5eaa080e351e9993ce627be5d443130f',
    id:
    'e0853763f6ff19e9d4ddd2263aacc918ff8038b29ecdd53b522012af5a29cb3e7c651666218c6caa9bb0ac2410714863d09a1d95c5cd2f882b047e0f64d78e50' 
}

```
将生成的交易数据以transaction为key，放入json，调用上链接口提交
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
		"args": "[{id: 'DAGatZMriKaUA7p3FzwHRamHMusdZ9Q8WS', method: 'pay', currency: 'ddn', amount: '1000', args:[]}]",
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

### **2.1.2 调用send方法，修改合约状态**
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
const trs = DdnJS.contract.send({
		id, gas_limit, method, args
	}, secret, secondSecret)
console.log(JSON.stringify(trs))
{
    "type": DdnUtils.assetTypes.CONTRACT_TRANSFER, // 12
    "nethash": "0ab796cd",
    "amount": "0",
    "fee": "50000000000",
    "args": "['DKAzdDnLnB6TcgwfTCGfEQ7pTE94a5FW1C', 'transfer', '10000', [200, 'ddn']]",
    "recipientId": null,
    "senderPublicKey": "55de4e63127573eae71e5a649c00c39153339e3094d158f77f5f9b07ede17d43",
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
