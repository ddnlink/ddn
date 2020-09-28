---
order: 4
id: ddn-dapp-api
title: 4. 智能合约（Dapp） API
sidebar_label: DDN Dapp API
---


## **1 API使用说明**
### **1.1 请求过程说明**

1.1.1 构造请求数据，用户数据按照DDN提供的接口规则，通过程序生成签名，生成请求数据集合；

1.1.2 发送请求数据，把构造完成的数据集合通过POST/GET等提交的方式传递给DDN；

1.1.3 DDN对请求数据进行处理，服务器在接收到请求后，会首先进行安全校验，验证通过后便会处理该次发送过来的请求；

1.1.4 返回响应结果数据，DDN把响应结果以JSON的格式反馈给用户，每个响应都包含success字段，表示请求是否成功，成功为true, 失败为false。 如果失败，则还会包含一个error字段，表示错误原因；

1.1.5 对获取的返回结果数据进行处理；

---

## **2 接口**
### **2.1 DAPP相关交易**
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
DdnJS.init('0ab796cd');

// 一级密码，通过DdnJS.crypto.generateSecret();获取
var secret = 'affair master wheat flock copy velvet gain heavy rabbit master pet refuse'；
// 公钥，通过DdnJS.crypto.getKeys(phaseKey).publicKey;获取
var publicKey = '1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c';
// 钱包地址，通过DdnJS.crypto.generateAddress(publicKey);获取
var address = 'DPrkKtui3u57MPrbz6uRKj7RQdqi2rXo37' }
```

开始前，得把要使用的钱包 注册到链上(登录一下即可)

请求参数说明：

|名称 |类型|必填 |说明|
|------ |-----|---|----|
|secret|string|Y|私钥|

返回参数说明：

|名称 |类型   |说明|
|------ |-----  |----|
|success|boolean|是否成功 |
|account|json|账户信息 |

请求事例
```sh
curl --location --request POST 'http://106.15.227.133:8001/api/accounts/open' \
--header 'Content-Type: application/json' \
--data-raw '{
    "secret": "affair master wheat flock copy velvet gain heavy rabbit master pet refuse"
}'
```

返回事例
```json
{
    "success": true,
    "account": {
        "address": "DPrkKtui3u57MPrbz6uRKj7RQdqi2rXo37",
        "unconfirmed_balance": 139980000000,
        "balance": 139980000000,
        "publicKey": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c",
        "unconfirmed_signature": 0,
        "second_signature": 0,
        "second_public_key": null,
        "multisignatures": [],
        "u_multisignatures": [],
        "lock_height": 0
    }
}
```


接下来向此钱包地址转账主链币，有币才能注册DAPP

请求参数说明：

|名称 |类型|必填 |说明|
|------ |-----|---|----|
|address|string|Y|收钱地址|
|amount|string|Y|数量|
|desc|string|Y|描述|
|secret|string|Y|私钥|

返回参数说明：

|名称 |类型   |说明|
|------ |-----  |----|
|success|boolean|是否成功 |
|transactionId|string|交易id|

```js
// 收钱地址
var address = "DPrkKtui3u57MPrbz6uRKj7RQdqi2rXo37";
// 数量
var amount = '1000000';
var desc = '转账到测试账号';
// secret假设有很多主链币，可以给新钱包转账
var secret = "suit leisure cushion narrow cabbage hold post fashion message gauge series keen";
var transaction = await DdnJS.transaction.createTransaction(address, amount, desc, secret);
```
返回事例
```json
{
  "type": 0,
  "nethash": "0ab796cd",
  "amount": "1000000",
  "fee": "10000000",
  "recipientId": "DPrkKtui3u57MPrbz6uRKj7RQdqi2rXo37",
  "message": "转账到测试账号",
  "timestamp": 84306805,
  "asset": {},
  "senderPublicKey": "e0fc50c695dd80fdcc68fad608cdc14855958580e145a60db6c9338a51d53b30",
  "signature": "ab2d02181e85ca4e0a1f201ca1446663b81a85fc19ec1ed6c9ab87858b728fc20028bcc716e65067d8a5cd4f22f81d3cc54a17a7fb018c8b1786038d1704b00e",
  "id": "519afc3131b08d450093cc07375f86830e19b841403c9e4eafea7785fc940dfc0735d8e5be969a751f147e932d653d7342ae2b395519931f50860f54aef15731"
}
```

将其以transaction为key，放入json，调用上链接口提交
```sh
curl --location --request POST 'http://106.15.227.133:8001/peer/transactions' \
--header 'Content-Type: application/json' \
--header 'nethash: 0ab796cd' \
--header 'version: ' \
--data-raw '{
    "transaction": {
        "type": 0,
        "nethash": "0ab796cd",
        "amount": "1000000",
        "fee": "10000000",
        "recipientId": "DPrkKtui3u57MPrbz6uRKj7RQdqi2rXo37",
        "message": "转账到测试账号",
        "timestamp": 84306805,
        "asset": {},
        "senderPublicKey": "e0fc50c695dd80fdcc68fad608cdc14855958580e145a60db6c9338a51d53b30",
        "signature": "ab2d02181e85ca4e0a1f201ca1446663b81a85fc19ec1ed6c9ab87858b728fc20028bcc716e65067d8a5cd4f22f81d3cc54a17a7fb018c8b1786038d1704b00e",
        "id": "519afc3131b08d450093cc07375f86830e19b841403c9e4eafea7785fc940dfc0735d8e5be969a751f147e932d653d7342ae2b395519931f50860f54aef15731"
    }
}'
```
返回结果
```json
{
    "success": true,
    "transactionId": "519afc3131b08d450093cc07375f86830e19b841403c9e4eafea7785fc940dfc0735d8e5be969a751f147e932d653d7342ae2b395519931f50860f54aef15731"
}
````


#### **2.1.1 注册DAPP**
请求参数说明：

|名称 |类型|必填 |说明|
|------ |-----|---|----|
|secret|string|Y|私钥|
|category|string|Y|DAPP分类  Common: 1,Business: 2,Social: 3,Education: 4,Entertainment: 5,News: 6,Life: 7,Utilities: 8,Games: 9|
|type|string|Y| Dapp类型，DAPP: 0, FILE: 1|
|name|string|Y|Dapp名称|
|description|string|Y|描述|
|tags|string|Y|标签，空格分隔|
|delegates|string|Y|Dapp 受托人公钥串，多个用逗号分隔|
|unlock_delegates|string|Y|转出操作需要的最小受托人确认数|
|link|string|Y|Dapp程序包链接|
|icon|string|Y|Dapp Logo链接|

返回参数说明：

|名称|类型|说明|
|------ |-----|----|
|success|boolean|是否成功|


请求示例：
```js
{
    "secret": "affair master wheat flock copy velvet gain heavy rabbit master pet refuse", // 私钥
    "category": 1,
    "type": 0,
    "name": "genal",
    "description": "A dapp that should not be added",
    "tags": "tag1 tag2 tag3",
    "delegates": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c,c33a9b7a6e51a3fe650fc33d954a56032f722f084442d7aa788cb30ee8fcce5a,dbc795a7359cd301dade11d218e0e2ab4171bde0978e902261f9ffc4d729df04,035b5cdffa3d844108ac1bb1da24b0417ec7803905fda3c19290c03fe6376c48,d07967b16f5af45453dab2c6b832dcc7b9120d88da9b032c96d4680c580002e9",
    "unlock_delegates": 3,
    "link": "https://github.com/ddnlink/ddn-dapp-demo/archive/v0.1.0.zip",
    "icon": "http://ebookchain.org/static/media/logo.5e78d8c2.png"
}
```

将其放入json，调用创建DAPP接口
```sh
curl --location --request PUT 'http://106.15.227.133:8001/api/dapps' \
--header 'Content-Type: application/json' \
--data-raw '{
    "secret": "affair master wheat flock copy velvet gain heavy rabbit master pet refuse",
    "category": 1,
    "type": 0,
    "name": "genal",
    "description": "A dapp that should not be added",
    "tags": "handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate",
    "delegates": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c,c33a9b7a6e51a3fe650fc33d954a56032f722f084442d7aa788cb30ee8fcce5a,dbc795a7359cd301dade11d218e0e2ab4171bde0978e902261f9ffc4d729df04,035b5cdffa3d844108ac1bb1da24b0417ec7803905fda3c19290c03fe6376c48,d07967b16f5af45453dab2c6b832dcc7b9120d88da9b032c96d4680c580002e9",
    "unlock_delegates": 3,
    "link": "https://github.com/ddnlink/ddn-dapp-demo/archive/v0.1.0.zip",
    "icon": "http://ebookchain.org/static/media/logo.5e78d8c2.png"
}'
```

返回结果
```json
{
    "success": true,
    "transactionId": "8c70ba13ddac0a3d6d1d4abf5d7cc1af43c4cc3a1c96c6b04ccf0e604b88f64115b8a57245318da424dd6daf6dbf3b41eebe529f464e0cceea045587246d8f9c"
}
````

#### **2.1.2 查看所有DAPP**

```sh
curl --location --request GET 'http://106.15.227.133:8001/api/dapps/all'
```

返回结果
```json
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e",
                "transaction_type": 5,
                "timestamp": 84403639,
                "name": "genal",
                "description": "A dapp that should not be added",
                "tags": "handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate",
                "link": "https://github.com/ddnlink/ddn-dapp-demo/archive/v0.1.0.zip",
                "type": 0,
                "category": 1,
                "icon": "http://ebookchain.org/static/media/logo.5e78d8c2.png",
                "delegates": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c,c33a9b7a6e51a3fe650fc33d954a56032f722f084442d7aa788cb30ee8fcce5a,dbc795a7359cd301dade11d218e0e2ab4171bde0978e902261f9ffc4d729df04,035b5cdffa3d844108ac1bb1da24b0417ec7803905fda3c19290c03fe6376c48,d07967b16f5af45453dab2c6b832dcc7b9120d88da9b032c96d4680c580002e9",
                "unlock_delegates": 3
            }
        ],
        "total": 1
    }
}
```

#### **2.1.3 检索DAPP**

limit: 查询数量

```sh
curl --location --request GET 'http://106.15.227.133:8001/api/dapps?limit=10'
```

返回结果
```json
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e",
                "transaction_type": 5,
                "timestamp": 84403639,
                "name": "genal",
                "description": "A dapp that should not be added",
                "tags": "handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate",
                "link": "https://github.com/ddnlink/ddn-dapp-demo/archive/v0.1.0.zip",
                "type": 0,
                "category": 1,
                "icon": "http://ebookchain.org/static/media/logo.5e78d8c2.png",
                "delegates": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c,c33a9b7a6e51a3fe650fc33d954a56032f722f084442d7aa788cb30ee8fcce5a,dbc795a7359cd301dade11d218e0e2ab4171bde0978e902261f9ffc4d729df04,035b5cdffa3d844108ac1bb1da24b0417ec7803905fda3c19290c03fe6376c48,d07967b16f5af45453dab2c6b832dcc7b9120d88da9b032c96d4680c580002e9",
                "unlock_delegates": 3
            }
        ],
        "total": 1
    }
}
```

#### **2.1.4 按名称检索DAPP**
```sh
curl --location --request GET 'http://106.15.227.133:8001/api/dapps/name/:app_name/all'
```

返回结果:
```json
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e",
                "transaction_type": 5,
                "timestamp": 84403639,
                "name": "genal",
                "description": "A dapp that should not be added",
                "tags": "handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate",
                "link": "https://github.com/ddnlink/ddn-dapp-demo/archive/v0.1.0.zip",
                "type": 0,
                "category": 1,
                "icon": "http://ebookchain.org/static/media/logo.5e78d8c2.png",
                "delegates": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c,c33a9b7a6e51a3fe650fc33d954a56032f722f084442d7aa788cb30ee8fcce5a,dbc795a7359cd301dade11d218e0e2ab4171bde0978e902261f9ffc4d729df04,035b5cdffa3d844108ac1bb1da24b0417ec7803905fda3c19290c03fe6376c48,d07967b16f5af45453dab2c6b832dcc7b9120d88da9b032c96d4680c580002e9",
                "unlock_delegates": 3
            }
        ],
        "total": 1
    }
}
```

#### **2.1.5 按type检索DAPP**
```sh
curl --location --request GET 'http://106.15.227.133:8001/api/dapps/name/:type/all'
```

返回结果:
```json
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e",
                "transaction_type": 5,
                "timestamp": 84403639,
                "name": "genal",
                "description": "A dapp that should not be added",
                "tags": "handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate",
                "link": "https://github.com/ddnlink/ddn-dapp-demo/archive/v0.1.0.zip",
                "type": 0,
                "category": 1,
                "icon": "http://ebookchain.org/static/media/logo.5e78d8c2.png",
                "delegates": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c,c33a9b7a6e51a3fe650fc33d954a56032f722f084442d7aa788cb30ee8fcce5a,dbc795a7359cd301dade11d218e0e2ab4171bde0978e902261f9ffc4d729df04,035b5cdffa3d844108ac1bb1da24b0417ec7803905fda3c19290c03fe6376c48,d07967b16f5af45453dab2c6b832dcc7b9120d88da9b032c96d4680c580002e9",
                "unlock_delegates": 3
            }
        ],
        "total": 1
    }
}
```

#### **2.1.6 按id(交易id)检索DAPP**
```sh
curl --location --request GET 'http://106.15.227.133:8001/api/dapps/dappId/6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e'
```

返回结果:
```json
{
    "success": true,
    "dapp": {
        "transaction_id": "6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e",
        "transaction_type": 5,
        "timestamp": 84403639,
        "name": "genal",
        "description": "A dapp that should not be added",
        "tags": "handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate",
        "link": "https://github.com/ddnlink/ddn-dapp-demo/archive/v0.1.0.zip",
        "type": 0,
        "category": 1,
        "icon": "http://ebookchain.org/static/media/logo.5e78d8c2.png",
        "delegates": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c,c33a9b7a6e51a3fe650fc33d954a56032f722f084442d7aa788cb30ee8fcce5a,dbc795a7359cd301dade11d218e0e2ab4171bde0978e902261f9ffc4d729df04,035b5cdffa3d844108ac1bb1da24b0417ec7803905fda3c19290c03fe6376c48,d07967b16f5af45453dab2c6b832dcc7b9120d88da9b032c96d4680c580002e9",
        "unlock_delegates": 3
    }
}
```

#### **2.1.7 安装DAPP**
请求参数说明：

|名称 |类型|必填 |说明|
|------ |-----|---|----|
|id|string|Y|dapp id|
|master|string|Y|密码|

返回参数说明：

|名称|类型|说明|
|------ |-----|----|
|success|boolean|是否成功|

```sh
curl --location --request POST 'http://106.15.227.133:8001/api/dapps/install' \
--header 'Content-Type: application/json' \
--data-raw '{
    "id": "6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e",
    "master": "xS5XaSoHsTEL"
}'
```

返回结果:
```json
{
    "success": true,
    "path": "/var/www/ddn-starter/current/dapps/6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e"
}
```

#### **2.1.8 检索已安装的DAPP**

返回参数说明：

|名称|类型|说明|
|------ |-----|----|
|success|boolean|是否成功|
|result|Object|日安装的DAPP|

```sh
curl --location --request GET 'http://106.15.227.133:8001/api/dapps/installed' \
--data-raw ''
```

返回结果:
```json
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e",
                "transaction_type": 5,
                "timestamp": 84403639,
                "name": "genal",
                "description": "A dapp that should not be added",
                "tags": "handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate",
                "link": "https://github.com/ddnlink/ddn-dapp-demo/archive/v0.1.0.zip",
                "type": 0,
                "category": 1,
                "icon": "http://ebookchain.org/static/media/logo.5e78d8c2.png",
                "delegates": "1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c,c33a9b7a6e51a3fe650fc33d954a56032f722f084442d7aa788cb30ee8fcce5a,dbc795a7359cd301dade11d218e0e2ab4171bde0978e902261f9ffc4d729df04,035b5cdffa3d844108ac1bb1da24b0417ec7803905fda3c19290c03fe6376c48,d07967b16f5af45453dab2c6b832dcc7b9120d88da9b032c96d4680c580002e9",
                "unlock_delegates": 3
            }
        ]
    }
}
```

#### **2.1.9 检索已安装的DAPP的id**

返回参数说明：

|名称|类型|说明|
|------ |-----|----|
|success|boolean|是否成功|
|ids|Array|已安装的DAPP的id|

```sh
curl --location --request GET 'http://106.15.227.133:8001/api/dapps/installedIds' \
--data-raw ''
```

返回结果:
```json
{
    "success": true,
    "ids": [
        "6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e"
    ]
}
```

#### **2.1.10 运行DAPP**

返回参数说明：

|名称|类型|说明|
|------ |-----|----|
|success|boolean|是否成功|

```sh
curl --location --request POST 'http://106.15.227.133:8001/api/dapps/launch' \
--header 'Content-Type: application/json' \
--data-raw '{
    "id": "6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e",
    "master": "xS5XaSoHsTEL"
}'
```

返回结果:
```json
{
    "success": true
}
```

#### **2.1.11 停止DAPP**

返回参数说明：

|名称|类型|说明|
|------ |-----|----|
|success|boolean|是否成功|

```sh
curl --location --request POST 'http://106.15.227.133:8001/api/dapps/stop' \
--header 'Content-Type: application/json' \
--data-raw '{
    "id": "6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e",
    "master": "xS5XaSoHsTEL"
}'
```

返回结果:
```json
{
    "success": true
}
```

#### **2.1.11 DAPP类别检索**

此接口可以查看有哪里DAPP类别

返回参数说明：

|名称|类型|说明|
|------ |-----|----|
|success|boolean|是否成功|

```sh
curl --location --request GET 'http://106.15.227.133:8001/api/dapps/categories'
```

返回结果:
```json
{
    "success": true,
    "categories": {
        "Common": 1,
        "Business": 2,
        "Social": 3,
        "Education": 4,
        "Entertainment": 5,
        "News": 6,
        "Life": 7,
        "Utilities": 8,
        "Games": 9
    }
}
```

#### **2.1.12 卸载DAPP**

返回参数说明：

|名称|类型|说明|
|------ |-----|----|
|success|boolean|是否成功|

```sh
curl --location --request POST 'http://106.15.227.133:8001/api/dapps/uninstall' \
--header 'Content-Type: application/json' \
--data-raw '{
    "id": "6efbd41f9afce5132e87a0ff6c2e6a42adb72dc5bc1028a37f5e159251350688ca996e796dbb8d90ac20d1039020ea33020f542cf2623805a71acc529270c69e",
    "master": "xS5XaSoHsTEL"
}'
```

返回结果:
```json
{
    "success": true
}
```
