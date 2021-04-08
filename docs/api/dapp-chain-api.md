---
order: ddn-dapp-chain-api
id: ddn-dapp-chain-api
title: dapp侧链通用 API
sidebar_label: DDN Dapp chain API
---

## **1 区块blocks**

### **1.1 获取 DApp 区块高度**

接口地址：/dapps/dappName/blocks/height
请求方式：GET
支持格式：urlencode

返回参数说明：

|名称  |类型   |说明              |
|------ |-----  |----              |
|success|boole  |是否成功获得response数据      |
|height|integer  |dapp区块高度      |

请求示例：

```bash
curl -k -H "Content-Type: application/json" -X GET http://localhost:8001/dapps/ddn-dapp-demo/blocks/height && echo
```

JSON返回示例：

```json
{
  height: 10,
  success: true
}
```

### **1.2 获取dapp区块数据**

接口地址：/dapps/dappName/blocks
请求方式：GET
支持格式：urlencode
接口说明：不加参数则获取全网区块详情

请求参数说明：

|名称  |类型   |必填 |说明              |
|------ |-----  |---  |----              |
|limit |integer |N    |限制结果集个数，最小值：0,最大值：100   |
|orderBy|string  |N      |根据表中字段排序，如height:desc  |
|offset|integer  |N      |偏移量，最小值0  |
|generatorPublicKey|string  |N      |区块生成者公钥  |
|totalAmount|integer  |N       |交易总额，最小值：0，最大值：10000000000000000 |
|totalFee|integer  |N      |手续费总额，最小值：0，最大值：10000000000000000  |
|previousBlock|string  |N      |上一个区块  |
|height|integer  |N      |区块高度  |

返回参数说明：

|名称  |类型   |说明              |
|------ |-----  |----              |
|success|boole  |是否成功获得response数据      |
|count|integer  |符合条件的总结果数目      |
|blocks|Array  |每个元素是一个block对象，对象里面包含block的id、height、产块受托人公钥等信息|

请求示例：

```bash
curl -k -H "Content-Type: application/json" -X GET http://localhost:8001/dapps/ddn-dapp-demo/blocks?limit=1 && echo
```

JSON返回示例：

```js
{
    "blocks": [
        {
            "id": "47bdaceea328fd73fff08f56668823638c697380d7bed3754755098ab9d0e14a3e20237235cfaef23fa62150e782c57202513cd83a37fbdb375c9568ec8c131c",
            "timestamp": 0,
            "height": 1,
            "payloadLength": 0,
            "payloadHash": "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
            "prevBlockId": null,
            "pointId": null,
            "pointHeight": null,
            "delegate": "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
            "signature": "ac5db66fc28b81ff6a51c80b9c8a98fe113e74926431cd2ea01f5608a1afbdbbad8dd66b2a3fedd7e2eee699027d02393fc7ac4cce6ef1365a5af38653b8f205",
            "count": 0
        }
    ],
    "count": 1761,
    "success": true
}
```

## **2 账户accounts**

### **2.1 根据地址获取dapp内账户信息**

接口地址：/dapps/dappName/accounts/:address
请求方式：GET
支持格式：urlencode
请求参数说明：

|名称  |类型   |必填 |说明              |
|------ |-----  |---  |----              |
|address |string | Y   |ddn地址    |

返回参数说明：

|名称  |类型   |说明              |
|------ |-----  |----              |
|success|boole  |是否成功获得response数据      |
|account|字典  |账户详情，包含dapp内该账户拥有的所有资产及余额，是否受托人，额外信息     |

请求示例：

```bash
curl -k -H "Content-Type: application/json" -X GET http://localhost:8001/dapps/dappName/accounts/DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe && echo
```

JSON返回示例：

```js
{
    "account": {
        "balances": [
            {
                "currency": "DDN",
                "balance": "9980000000"
            }
        ],
        "isDelegate": false
    },
    "success": true
}
```

## **3 事务transactions**

### **3.1 签名交易**

HTTP 接口又分为 signed 和 unsigned，他们的区别是交易在本地还是服务端签名，后者需要将密码通过 HTTP 传输给服务器进行签名。

#### **3.1.1 客户端签名交易(signed)-更安全**

/peer相关的api，在请求时都需要设置一个header

 - key为nethash
 - key为version，value为' '

ddn系统的所有写操作都是通过发起一个交易来完成的。
交易数据通过一个叫做@ddn/node-sdk的库来创建，然后再通过一个POST接口发布出去。
POST接口规格如下：

|事项   |说明  |
|---    |---   |
|接口地址|/peer/transactions  |
|payload|@ddn/node-sdk创建出来的交易数据  |
|请求方式|post/put等 |
|支持格式|json |

##### **3.1.1.1 dapp充值**

接口地址：/peer/transactions
请求方式：POST
支持格式：json
备注：充值时在主链发生type=6的交易（intransfer），dapp内部会自动调用编号为1的智能合约进行dapp内部充值
请求参数说明：

|名称  |类型   |必填 |说明              |
|------ |-----  |---  |----              |
|transaction|json|Y|ddnJS.transfer.createInTransfer生成的交易数据|

返回参数说明：

|名称  |类型   |说明              |
|------ |-----  |----              |
|success|boole  |是否成功获得response数据      |
|transactionId|string  |交易id      |

请求示例：

```bash
var ddnJS = require('@ddn/node-sdk');
 let secret = "enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
  var dappid = "fddb6eff4f17ade6537d887e12574f2fc27af3a85f01460ccfb1d24ed114653dd7fb69dba66b30feb6f71d0a02f15495e6062e6db0cad3bfc9fa0856fd73f1c0";
  var currency = "DDN";
  var amount = "10000000000";
var transaction = ddnJS.transfer.createInTransfer(dappid, currency, amount, secret, secondSecret || undefined);

console.log(JSON.stringify(transaction));
{"transaction":{"type":6,"nethash":"0ab796cd","amount":"10000000000","fee":"10000000","recipientId":null,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","timestamp":106446255,"asset":{"dappIn":{"dapp_id":"fddb6eff4f17ade6537d887e12574f2fc27af3a85f01460ccfb1d24ed114653dd7fb69dba66b30feb6f71d0a02f15495e6062e6db0cad3bfc9fa0856fd73f1c0","currency":"DDN"}},"signature":"9fd14e40a08ac27392d044e6b3d9db3fdc6b323acbd0fbd196eb711e4af7361b832e46629a6d80f64e266c937d7ab582f5f610c37565d448ae9ee25f4f8fd806","id":"47e57fb22744e512e4ee6dea648b49a2b34497d54eeb59c08baccef8f9d2bcdd090036056246c35b2349914db8405c222a3ab8c172670effa9d3bb7d01956385"}}  // type=6表示dapp充值,这里的type指主链的交易类型，非dapp合约编号

// 将上面生成的“充值”交易数据通过post提交给ddn server
curl --location --request POST 'http://localhost:8001/peer/transactions' \
--header 'Content-Type: application/json' \
--header 'nethash: 0ab796cd' \
--header 'version: 0' \
--data-raw '{"transaction":{"type":6,"nethash":"0ab796cd","amount":"10000000000","fee":"10000000","recipientId":null,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","timestamp":106446255,"asset":{"dappIn":{"dapp_id":"fddb6eff4f17ade6537d887e12574f2fc27af3a85f01460ccfb1d24ed114653dd7fb69dba66b30feb6f71d0a02f15495e6062e6db0cad3bfc9fa0856fd73f1c0","currency":"DDN"}},"signature":"9fd14e40a08ac27392d044e6b3d9db3fdc6b323acbd0fbd196eb711e4af7361b832e46629a6d80f64e266c937d7ab582f5f610c37565d448ae9ee25f4f8fd806","id":"47e57fb22744e512e4ee6dea648b49a2b34497d54eeb59c08baccef8f9d2bcdd090036056246c35b2349914db8405c222a3ab8c172670effa9d3bb7d01956385"}}'

```

JSON返回示例：

```js
{
  "success": true,
  "transactionId": "47e57fb22744e512e4ee6dea648b49a2b34497d54eeb59c08baccef8f9d2bcdd090036056246c35b2349914db8405c222a3ab8c172670effa9d3bb7d01956385"
}
```

##### **3.1.1.2 dapp提现,type=2**

接口地址：/dapps/dappName/transactions/signed
请求方式：PUT
支持格式：json
请求参数说明：

|名称  |类型   |必填 |说明              |
|------ |-----  |---  |----              |
|dappID|string|Y|dapp的id  |
|transaction|json|Y|ddnJS.dapp.createInnerTransaction生成的交易数据|

返回参数说明：

|名称  |类型   |说明              |
|------ |-----  |----              |
|success|boole  |是否成功获得response数据      |
|transactionId|string  |提币交易id      |

请求示例：

```bash
var ddnJS = require('@ddn/node-sdk');
let secret = "enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
  var type = 2;
  var options = { fee: '1000000', type: type, args: '["rcp.RNC","1000000"]' };
  const transaction = await DdnJS.dapp.createInnerTransaction(options, secret)
  console.log(JSON.stringify({ transaction }))

{"transaction":{"fee":"1000000","timestamp":105910809,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","type":2,"args":"[\"rcp.RNC\",\"1000000\"]","signature":"eb4401fb671cec3617b7ccd443053023b5cbdc7fa80316b0719c3c4032e318e6f3807aa84cfd199c9af7ea1de695d4ce37913ac3d9859d04bedf72cfea96da01"}}

// 将上面生成的“提现”交易数据通过post提交给ddn server
curl --location --request PUT 'http://localhost:8001/dapps/ddn-dapp-demo/transactions/signed' \
--header 'Content-Type: application/json' \
--data-raw '{"transaction":{"fee":"1000000","timestamp":105910809,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","type":2,"args":"[\"rcp.RNC\",\"1000000\"]","signature":"eb4401fb671cec3617b7ccd443053023b5cbdc7fa80316b0719c3c4032e318e6f3807aa84cfd199c9af7ea1de695d4ce37913ac3d9859d04bedf72cfea96da01"}}' && echo

```

JSON返回示例：

```js
{
  "success": true,
  "transactionId": "47e57fb34556fgd33223449a2b34497d54eeb59c08baccef8f9d2bcdd090036056246c35b2349914db8405c222a3ab8c172670effa9d3bb7d01956385"
}
```

##### **3.1.1.3 dapp内部转账,type=3**

接口地址：/dapps/dappName/transactions/signed
请求方式：PUT
支持格式：json
请求参数说明：

|名称  |类型   |必填 |说明              |
|------ |-----  |---  |----              |
|dappID|string|Y|dapp的id  |
|transaction|json|Y|ddnJS.dapp.createInnerTransaction生成的交易数据|

返回参数说明：

|名称  |类型   |说明              |
|------ |-----  |----              |
|success|boole  |是否成功获得response数据      |
|transactionId|string  |内部转账交易id      |

请求示例：

```bash
var ddnJS = require('@ddn/node-sdk');
var fee = String(0.1 * 100000000);
 let secret = "enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
  var type = 3;
  var options = {fee: '1000000', type: type, args: '["DDN","10000000","D8BVJ2MH1wjfJpyXeFHRo2j9Ddbgh6uFcA"]'};
  const transaction = await DdnJS.dapp.createInnerTransaction(options,secret)
  console.log(JSON.stringify({ transaction }))

{"transaction":{"fee":"1000000","timestamp":105910942,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","type":3,"args":"[\"DDN\",\"10000000\",\"D8BVJ2MH1wjfJpyXeFHRo2j9Ddbgh6uFcA\"]","signature":"2c6ea0a4cf2932ab5d4524ab5432e6cacb7fed08578184a2048009a5c7232b2b75cf8b4a7bc0d5cc0cf5c06840f86c81432afe21633906ae4f9b491fb2c9cb07"}}
{"transaction":{"fee":"1000000","timestamp":105910942,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","type":2,"args":"[\"rcp.RNC\",\"1000000\"]","signature":"bc35522510cdca9b5f2343f54bae5fb7a0a7b76eae19c34008f4854740d617d22baef86ff1f51a26a7611d73c918ef16ca50486e170a48ff3bd5afb3116ab50d"}}

// 将上面生成的“提现”交易数据通过post提交给ddn server
curl --location --request PUT 'http://localhost:8001/dapps/ddn-dapp-demo/transactions/signed' \
--header 'Content-Type: application/json' \
--data-raw '{"transaction":{"fee":"1000000","timestamp":105910942,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","type":3,"args":"[\"DDN\",\"10000000\",\"D8BVJ2MH1wjfJpyXeFHRo2j9Ddbgh6uFcA\"]","signature":"2c6ea0a4cf2932ab5d4524ab5432e6cacb7fed08578184a2048009a5c7232b2b75cf8b4a7bc0d5cc0cf5c06840f86c81432afe21633906ae4f9b491fb2c9cb07"}}
{"transaction":{"fee":"1000000","timestamp":105910942,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","type":2,"args":"[\"rcp.RNC\",\"1000000\"]","signature":"bc35522510cdca9b5f2343f54bae5fb7a0a7b76eae19c34008f4854740d617d22baef86ff1f51a26a7611d73c918ef16ca50486e170a48ff3bd5afb3116ab50d"}}' && echo

```

JSON返回示例：

```js
{
  "success": true,
  "transactionId": "47e57fb34556fgd33223449a2b3dffaw2334ffssbaccef8f9d2bcdd090036056246c35b2349914db8405c222a3ab8c172670effa9d3bb7d01956385"
}
```


### **3.2 获取未确认的交易**

接口地址：/dapps/dappName/transactions/unconfirmed
请求方式：GET
支持格式：urlencode

返回参数说明：

|名称  |类型   |说明              |
|------ |-----  |----              |
|success|boole  |是否成功获得response数据      |
|transactions|array  |未确认交易列表      |

请求示例：

```bash
curl -k -X GET http://localhost:8001/dapps/dappName/transactions/unconfirmed && echo
```

JSON返回示例：

```js
{
  "transactions": [],
  "success": true
}
```

### **3.3 获取已确认的交易**

接口地址：/dapps/dappName/transactions
请求方式：GET
支持格式：urlencode
请求参数说明：

|名称  |类型   |必填 |说明              |
|------ |-----  |---  |----              |
|senderId |string |N |发送者地址 |
|type |interger |N |合约编号 |
|limit |interger |N    |限制返回的条数,默认值是100    |
|offset |interger |N |偏移量 |

返回参数说明：

|名称  |类型   |说明              |
|------ |-----  |----              |
|success|boole  |是否成功获得response数据      |
|transactions|array  |交易列表      |
|count|integer  |符合查询条件的总交易条数      |

请求示例：

```bash
curl -k -X GET http://localhost:8001/dapps/ddn-dapp-demo/transactions?senderId=DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe && echo
```

JSON返回示例：

```js
{
    "transactions": [
        {
            "id": "a9424b580b1338486b768f36bb26a96fef5783383a736e488bbf7c8f953cf152f76b7ffca406996c96fb7129cc5c3e0845dfc79547cc09fa25f72df0f0af8eec",
            "timestamp": 150296221,
            "senderId": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
            "senderPublicKey": "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
            "fee": "10000000",
            "signature": "57193a03e687a3dfb4f4044c626c8624e222758cfdc6548abd5c12aca63de4c01647766b054b85e042fb6e8293aac8b3cc0c933a565d658a3151abf92a93ff06",
            "type": 1000,
            "args": "[\"test\",\"你好啊\"]",
            "height": 3
        },
        {
            "id": "1ace1291d8be46de633f5457041ef440db4dd1f2851239b812e3b0685f861bb2438a9939469ff15d80abe67473a582daa2c7a9bab3d5fab939394488217d5625",
            "timestamp": 150296275,
            "senderId": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
            "senderPublicKey": "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
            "fee": "10000000",
            "signature": "8aa0fdcf112b0e01346c527b669911a3add16cf2b54907297a4f16aeb49c96048b278de4e3004f4bd202c7954c878ae761c0d89c72457d076a8b226b16519501",
            "type": 1001,
            "args": "[\"test\",\"你好啊haha\"]",
            "height": 9
        }
    ],
    "count": 2,
    "success": true
}
```

### **3.4 根据交易id获取交易详情**

接口地址：/dapps/dappName/transactions/:id
请求方式：GET
支持格式：urlencode
请求参数说明：

|名称  |类型   |必填 |说明              |
|------ |-----  |---  |----              |
|id |string |Y    |交易id    |

返回参数说明：

|名称  |类型   |说明              |
|------ |-----  |----              |
|success|boole  |是否成功获得response数据      |
|transaction|dict  |该交易id对应的交易详情      |

请求示例：

```bash
curl -k -X GET http://localhost:8001/dapps/dappName/transactions/1ace1291d8be46de633f5457041ef440db4dd1f2851239b812e3b0685f861bb2438a9939469ff15d80abe67473a582daa2c7a9bab3d5fab939394488217d5625 && echo
```

JSON返回示例：

```js
{
  "transaction": {
            "id": "1ace1291d8be46de633f5457041ef440db4dd1f2851239b812e3b0685f861bb2438a9939469ff15d80abe67473a582daa2c7a9bab3d5fab939394488217d5625",
            "timestamp": 150296275,
            "senderId": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
            "senderPublicKey": "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
            "fee": "10000000",
            "signature": "8aa0fdcf112b0e01346c527b669911a3add16cf2b54907297a4f16aeb49c96048b278de4e3004f4bd202c7954c878ae761c0d89c72457d076a8b226b16519501",
            "type": 1001,
            "args": "[\"test\",\"你好啊haha\"]",
            "height": 9
        },
  "success": true
}
```

### **3.5 根据查询条件获取dapp转帐记录**

接口地址：/dapps/dappName/transfers
请求方式：GET
支持格式：urlencode
请求参数说明：

|名称  |类型   |必填 |说明              |
|------ |-----  |---  |----              |
|ownerId |string |N |发送者地址，ownerId和currency必须有一个或者两个都存在 |
|currency |string |N |代币名称，ownerId和currency必须有一个或者两个都存在 |
|limit |interger |N    |限制返回的条数,默认值是10    |
|offset |interger |N |偏移量，默认0 |

返回参数说明：

|名称  |类型   |说明              |
|------ |-----  |----              |
|success|boole  |是否成功获得response数据      |
|transfers|array  |符合查询条件的交易列表      |
|count|integer  |符合查询条件的条数      |

请求示例：

```bash
curl -k -X GET http://localhost:8001/dapps/ddn-dapp-demo/transfers?ownerid=DGJepzhD9FkjhQVmyVTphwJAYn7HuqRdJc && echo
```

JSON返回示例：

```js
{
  "count": 1,
  "transfers": [{
    "tid": "8aa0fdcf112b0e01346c527b669911a3add16cf2b54907297a4f16aeb49c96048b278de4e3004f4bd202c7954c878ae761c0d89c72457d076a8b226b16519501",
    "senderId": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
    "recipientId": "DGJepzhD9FkjhQVmyVTphwJAYn7HuqRdJc",
    "currency": "CNY",
    "amount": "100000000000000",
    "t_timestamp": 0,
    "t_type": 3,
    "t_height": 1
  }],
  "success": true
}
```

## **4 智能合约contracts**

### **4.1 获取dapp内的所有智能合约**

接口地址：/dapps/dappName/contracts
请求方式：GET
支持格式：urlencode

返回参数说明：

|名称  |类型   |说明              |
|------ |-----  |----              |
|success|boole  |是否成功获得response数据      |
|contracts|array  |每个元素都是一个字典，由合约编号、合约名字组成，其中core开头的合约为每个dapp通用的内置合约      |

请求示例：

```bash
// 下面是
curl -k -H "Content-Type: application/json" -X GET http://localhost:8001/dapps/dappName/contracts && echo
```

JSON返回示例：

```js
{
  contracts: [{
    type: "1",
    name: "core.deposit" // 系统内置合约，充值(从主链往dapp内进行资产充值)，普通用户不能直接调用（受托人可以调用但不能通过其它节点的校验），当主链有type=9（intransfer）的交易类型发生时会自动调用该智能合约进行dapp充值
  },
  {
    type: "2",
    name: "core.withdrawal" // 系统内置合约，提现(将资产从dapp内转出到主链上)
  },
  {
    type: "3",
    name: "core.transfer" // 系统内置合约，dapp内部转账，包括DDN和UIA
  },
  ],
  success: true
}
```
