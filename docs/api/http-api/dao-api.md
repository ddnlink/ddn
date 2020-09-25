---
order: 4
id: ddn-dao-api
title: 4. 自治组织（Dao） API
sidebar_label: DDN Dao API
---
# 组织号
## 1 注册组织号

接口地址：/api/dao/orgs<br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
org_id |string|组织唯一id|true
name |string |组织名称|true
state|number|组织号状态|true
url |string |地址|true
tags |string|标签|true

返回结果：

```js
{
    "success": true,
    "transactionId": "dc2e8551fbe586f05e36dbbf026c0f70d23abb35493a50da1c9a5f7724d561c5e666b9ecd893ab30d2ba0349adb0ff69ed94c592b44be6bd302893319281d074"
}
```
## 1.1 根据组织号id修改组织号

接口地址：/api/dao/orgs<br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
org_id |string|组织唯一id|true
name |string |组织名称|true
state|number|组织号状态，为1允许修改|true
url |string |地址|true
tags |string|标签|true

返回结果：

```js
{
    "success": true,
    "transactionId": "dc2e8551fbe586f05e36dbbf026c0f70d23abb35493a50da1c9a5f7724d561c5e666b9ecd893ab30d2ba0349adb0ff69ed94c592b44be6bd302893319281d074"
}
```

## 2 根据组织号id获取组织号

接口地址：/api/dao/orgs/:org_id<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
org_id |string|组织唯一id|true

返回结果：

```js
{
    "success": true,
    "result": {
        "org": {
            "transaction_id": "8836860db4ac579332e742c922a28a8e202da256f933f9b86401a39e8718bfe9d8b3e5dc6e8763e9df81b5166e7e38c0fb86d53a6cff08830a70016c088d5397",
            "org_id": "qwertsyuasa",
            "name": "xaASDFA",
            "address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
            "tags": "world,cup,test",
            "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
            "state": 0,
            "timestamp": 89753649
        }
    }
}
```
## 3 根据钱包地址获取组织号

接口地址： /api/dao/orgs/address/:address<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
address |string|用户的钱包地址

返回结果：

```js
{
    "success": true,
    "result": {
        "org": {
            "transaction_id": "61e8975b8e1768e7507add6fe0ddfc57648337d26b90eb7b514a00b98a23cf17fb2f547843d4cdff34ae543a74670786943435785d364eb74bca5d7d7d7834ac",
            "org_id": "dao1mnjjefwtnnm",
            "name": "ealY7U7LaLukCOnB",
            "address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
            "tags": "world,cup,test, add",
            "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
            "state": 1,
            "timestamp": 89734602
        }
    }
}
```

## 4 根据标签获取组织号
接口地址： /api/dao/orgs/tags/:tags<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
tags |string|标签

返回结果：

```js
{
    "success": true,
    "result": {
        "org": {
            "transaction_id": "61e8975b8e1768e7507add6fe0ddfc57648337d26b90eb7b514a00b98a23cf17fb2f547843d4cdff34ae543a74670786943435785d364eb74bca5d7d7d7834ac",
            "org_id": "dao1mnjjefwtnnm",
            "name": "ealY7U7LaLukCOnB",
            "address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
            "tags": "world,cup,test, add",
            "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
            "state": 1,
            "timestamp": 89734602
        }
    }
}
```

## 5 根据标签获取组织号列表

接口地址： /api/dao/orgs/tags/:tags/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
tags |string|标签

返回结果：

```js
{
    "success": true,
    "result": {
        "rows": [
           
            {
                "transaction_id": "5b7e759183dd28ca133afd14ab8671258d2556fb86fa8eebf515aeb434b323a58a17f2a576ae0270779beb5ec4618b0b7822a919a807697cf826364f94c404dd",
                "transaction_type": 40,
                "timestamp": 89734853,
                "org_id": "dao1dzdysxfc4nm",
                "name": "OXFCyaCZ5vAVIil1",
                "address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "tags": "world,cup,test",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "state": 0
            },
            {
                "transaction_id": "ec48383c859624db5203b5b5ad6bc6697c16fc02d8dd698301ed7c4001e364ead9e2b0d76996bba7c67a30b639d0e3805f59aebfbb8f5a0b4b47ecb5680d2ba4",
                "transaction_type": 40,
                "timestamp": 89734872,
                "org_id": "dao1l8w7vwqalfm",
                "name": "TQjwCBe6L4h_waqF",
                "address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "tags": "world,cup,test",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "state": 1
            },
            
        ],
        "total": 2
    }
}
```
## 6 根据state取组织号，只返回命中的第一条
接口地址： /api/dao/orgs/state/:state<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
state|number|状态

返回结果：

```js
{
    "success": true,
    "result": {
        
                "transaction_id": "5b7e759183dd28ca133afd14ab8671258d2556fb86fa8eebf515aeb434b323a58a17f2a576ae0270779beb5ec4618b0b7822a919a807697cf826364f94c404dd",
                "transaction_type": 40,
                "timestamp": 89734853,
                "org_id": "dao1dzdysxfc4nm",
                "name": "OXFCyaCZ5vAVIil1",
                "address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "tags": "world,cup,test",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "state": 0
          
    }
}
```
## 7 根据state取组织号列表
接口地址： /api/dao/orgs/state/:state/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
state |number|状态

返回结果：

```js
{
    "success": true,
    "result": {
        "rows": [
           
            {
                "transaction_id": "5b7e759183dd28ca133afd14ab8671258d2556fb86fa8eebf515aeb434b323a58a17f2a576ae0270779beb5ec4618b0b7822a919a807697cf826364f94c404dd",
                "transaction_type": 40,
                "timestamp": 89734853,
                "org_id": "dao1dzdysxfc4nm",
                "name": "OXFCyaCZ5vAVIil1",
                "address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "tags": "world,cup,test",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "state": 0
            },
            {
                "transaction_id": "ec48383c859624db5203b5b5ad6bc6697c16fc02d8dd698301ed7c4001e364ead9e2b0d76996bba7c67a30b639d0e3805f59aebfbb8f5a0b4b47ecb5680d2ba4",
                "transaction_type": 40,
                "timestamp": 89734872,
                "org_id": "dao1l8w7vwqalfm",
                "name": "TQjwCBe6L4h_waqF",
                "address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "tags": "world,cup,test",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "state": 1
            },
            
        ],
        "total": 2
    }
}
```

## 8 根据state取组织号，只返回命中的第一条
接口地址： /api/dao/orgs/state/:state<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
trs_id |string|交易id

返回结果：

```js
{
    "success": true,
    "result": {
        
                "transaction_id": "5b7e759183dd28ca133afd14ab8671258d2556fb86fa8eebf515aeb434b323a58a17f2a576ae0270779beb5ec4618b0b7822a919a807697cf826364f94c404dd",
                "transaction_type": 40,
                "timestamp": 89734853,
                "org_id": "dao1dzdysxfc4nm",
                "name": "OXFCyaCZ5vAVIil1",
                "address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "tags": "world,cup,test",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "state": 0
          
    }
}
```
## 9 获取所有组织号
接口地址： /api/dao/orgs<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
pagesize|string｜每页条数
pageindex|string|页码


返回结果：

```js
{
    "success": true,
    "result": {
        "rows": [
           
            {
                "transaction_id": "5b7e759183dd28ca133afd14ab8671258d2556fb86fa8eebf515aeb434b323a58a17f2a576ae0270779beb5ec4618b0b7822a919a807697cf826364f94c404dd",
                "transaction_type": 40,
                "timestamp": 89734853,
                "org_id": "dao1dzdysxfc4nm",
                "name": "OXFCyaCZ5vAVIil1",
                "address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "tags": "world,cup,test",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "state": 0
            },
            {
                "transaction_id": "ec48383c859624db5203b5b5ad6bc6697c16fc02d8dd698301ed7c4001e364ead9e2b0d76996bba7c67a30b639d0e3805f59aebfbb8f5a0b4b47ecb5680d2ba4",
                "transaction_type": 40,
                "timestamp": 89734872,
                "org_id": "dao1l8w7vwqalfm",
                "name": "TQjwCBe6L4h_waqF",
                "address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "tags": "world,cup,test",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "state": 1
            },
            
        ],
        "total": 2
    }
}
```

# 交易媒体号

## 1 发起出售交易（交易体的生成请查看node-sdk）

接口地址：/peer/transactions<br/>
请求方式：POST<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-


返回结果：

```js
let senderAddress='H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p',reciveAddress='HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU';
let secret='suit leisure cushion narrow cabbage hold post fashion message gauge series keen'
let exchange = {
        org_id: 'dao1l8w7vwqalfm',
        price: '700000000',
        state: 0,//状态
        exchange_trs_id: '',
        received_address: reciveAddress,
        sender_address: senderAddress
      }
    // 请用node-sdk生成交易体
     const transaction = await DdnJS.assetPlugin.createPluginAsset(41, exchange, secret) // 41
{
    "success": true,
    "transactionId": "dc2e8551fbe586f05e36dbbf026c0f70d23abb35493a50da1c9a5f7724d561c5e666b9ecd893ab30d2ba0349adb0ff69ed94c592b44be6bd302893319281d074"
}
```
## 1.1 确认买交易（交易体的生成请查看node-sdk）

接口地址：/peer/transactions<br/>
请求方式：POST<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-


返回结果：

```js
let senderAddress='H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p',reciveAddress='HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU';
let secret='suit leisure cushion narrow cabbage hold post fashion message gauge series keen'
let exchange = {
        org_id: 'dao1l8w7vwqalfm',
        price: '700000000',
        state: 1,//状态为1
        exchange_trs_id: '',
        sender_address: reciveAddress,
        received_address: senderAddress
      }
    // 请用node-sdk生成交易体
     const transaction = await DdnJS.assetPlugin.createPluginAsset(41, exchange, secret) // 41
{
    "success": true,
    "transactionId": "dc2e8551fbe586f05e36dbbf026c0f70d23abb35493a50da1c9a5f7724d561c5e666b9ecd893ab30d2ba0349adb0ff69ed94c592b44be6bd302893319281d074"
}
```
## 1.2 未测试 发起交易 

接口地址：/api/dao/exchanges<br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-


返回结果：

```js

{
    "success": true,
    "transactionId": "dc2e8551fbe586f05e36dbbf026c0f70d23abb35493a50da1c9a5f7724d561c5e666b9ecd893ab30d2ba0349adb0ff69ed94c592b44be6bd302893319281d074"
}
```

## 2 根据组织号id查询组织号交易详情
接口地址： /api/dao/exchanges/org_id/:org_id<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
org_id |string|组织号id

返回结果：

```js
{
    "success": true,
    "result": {
        "transaction_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
        "transaction_type": 41,
        "timestamp": 89758037,
        "org_id": "dao1dzdysxfc4nm",
        "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
        "received_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
        "exchange_trs_id": "",
        "price": "700000000",
        "state": 0
    }
}
```
## 2 根据组织号id查询所有组织号的交易记录
接口地址： /api/dao/exchanges/org_id/:org_id/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
org_id |string|组织号id

返回结果：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "transaction_type": 41,
                "timestamp": 89758037,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "received_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
            },
            {
                "transaction_id": "e127f44ed0aa1cf406a2e220b78feb323c179d149d31fdcbdf1e7ad5619ef157c0ac2be81dab0ebbac59252526c1b3d899a607b4b72e63892df2c70a9f56c67d",
                "transaction_type": 41,
                "timestamp": 89758053,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "received_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "exchange_trs_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "price": "700000000",
                "state": 1
            }
        ],
        "total": 2
    }
}
```
## 3 根据发送者钱包地址查询所有组织号的交易记录（返回命中的第一条记录）
接口地址： /api/dao/exchanges/sender_address/:sender_address<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
sender_address |string|钱包地址

返回结果：

```js
{
    "success": true,
    "result": {
       
                "transaction_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "transaction_type": 41,
                "timestamp": 89758037,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "received_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
           
}
```
## 4 根据发送者钱包地址查询所有组织号的交易记录列表
接口地址： /api/dao/exchanges/sender_address/:sender_address/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
sender_address |string|钱包地址

返回结果：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "transaction_type": 41,
                "timestamp": 89758037,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "received_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
            },
            {
                "transaction_id": "e127f44ed0aa1cf406a2e220b78feb323c179d149d31fdcbdf1e7ad5619ef157c0ac2be81dab0ebbac59252526c1b3d899a607b4b72e63892df2c70a9f56c67d",
                "transaction_type": 41,
                "timestamp": 89758053,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "received_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "exchange_trs_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "price": "700000000",
                "state": 1
            }
        ],
        "total": 2
    }
}
```
## 5 根据接受者钱包地址查询所有组织号的交易记录(返回命中的第一条记录)
接口地址：  /api/dao/exchanges/received_address/:received_address<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
received_address |string|钱包地址

返回结果：

```js
{
    "success": true,
    "result": {
        
                "transaction_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "transaction_type": 41,
                "timestamp": 89758037,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "received_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
          
}
```
## 6 根据接受者钱包地址查询所有组织号的交易记录列表
接口地址：  /api/dao/exchanges/received_address/:received_address/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
received_address |string|钱包地址

返回结果：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "transaction_type": 41,
                "timestamp": 89758037,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "received_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
            },
            {
                "transaction_id": "e127f44ed0aa1cf406a2e220b78feb323c179d149d31fdcbdf1e7ad5619ef157c0ac2be81dab0ebbac59252526c1b3d899a607b4b72e63892df2c70a9f56c67d",
                "transaction_type": 41,
                "timestamp": 89758053,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "received_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "exchange_trs_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "price": "700000000",
                "state": 1
            }
        ],
        "total": 2
    }
}
```
## 7 根据交易金额查询所有组织号的交易记录(返回命中的第一条记录)
接口地址：  /api/dao/exchanges/price/:price<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
price |string|交易金额

返回结果：

```js
{
    "success": true,
    "result": {
        
                "transaction_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "transaction_type": 41,
                "timestamp": 89758037,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "received_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
          
}
```
## 8 根据交易金额查询所有组织号的交易记录列表
接口地址：  /api/dao/exchanges/price/:price/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
price |string|交易金额

返回结果：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "transaction_type": 41,
                "timestamp": 89758037,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "received_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
            },
            {
                "transaction_id": "e127f44ed0aa1cf406a2e220b78feb323c179d149d31fdcbdf1e7ad5619ef157c0ac2be81dab0ebbac59252526c1b3d899a607b4b72e63892df2c70a9f56c67d",
                "transaction_type": 41,
                "timestamp": 89758053,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "received_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "exchange_trs_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "price": "700000000",
                "state": 1
            }
        ],
        "total": 2
    }
}
```
## 9 根据state查询所有组织号的交易记录(返回命中的第一条记录)
接口地址：  /api/dao/exchanges/state/:state<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
state |string|状态 0/1

返回结果：

```js
{
    "success": true,
    "result": {
        
                "transaction_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "transaction_type": 41,
                "timestamp": 89758037,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "received_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
          
}
```
## 10 根据交易金额查询所有组织号的交易记录列表
接口地址：  /api/dao/exchanges/state/:state/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
state |string|状态

返回结果：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "transaction_type": 41,
                "timestamp": 89758037,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "received_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
            },
            {
                "transaction_id": "e127f44ed0aa1cf406a2e220b78feb323c179d149d31fdcbdf1e7ad5619ef157c0ac2be81dab0ebbac59252526c1b3d899a607b4b72e63892df2c70a9f56c67d",
                "transaction_type": 41,
                "timestamp": 89758053,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "received_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "exchange_trs_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "price": "700000000",
                "state": 1
            }
        ],
        "total": 2
    }
}
```
## 11 根据交易id湖区组织号的交易记录
接口地址：  /api/dao/exchanges/transaction/:trs_id<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
trs_id |string|交易id

返回结果：

```js
{
    "success": true,
    "result": {
        
                "transaction_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "transaction_type": 41,
                "timestamp": 89758037,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "received_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
          
}
```

## 12 查询所有组织号的交易记录列表
接口地址：  /api/dao/exchanges/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
pagesize|string｜每页条数
pageindex|string|页码

返回结果：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "transaction_type": 41,
                "timestamp": 89758037,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "received_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
            },
            {
                "transaction_id": "e127f44ed0aa1cf406a2e220b78feb323c179d149d31fdcbdf1e7ad5619ef157c0ac2be81dab0ebbac59252526c1b3d899a607b4b72e63892df2c70a9f56c67d",
                "transaction_type": 41,
                "timestamp": 89758053,
                "org_id": "dao1dzdysxfc4nm",
                "sender_address": "HKoFCgb89QUbw9kh6NcrxCuXQK3wGddXux",
                "received_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "exchange_trs_id": "06ecc4516edf6e5edb7054db3bc6bd1e699f86d804df3954351e0843650ffe5fa6b47d76deb2551cfde0edeae1cecaa5da6afd2f65f732cdbfe5578c05a1f4e8",
                "price": "700000000",
                "state": 1
            }
        ],
        "total": 2
    }
}
```

# 贡献（投稿）交易

## 1 用户投稿使用peer/transactions（交易体的生成请查看node-sdk）

接口地址：peer/transactions<br/>
请求方式：POST<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-


返回结果：

```js
let senderAddress='H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p',reciveAddress='HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU';
let secret='suit leisure cushion narrow cabbage hold post fashion message gauge series keen'
let  contribution = {
        title: 'from /transactions',
        sender_address: senderAddress,
        received_address: reciveAddress,
        url:
          'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
        price: '0'
      }
    // 请用node-sdk生成交易体
     const transaction = await DdnJS.assetPlugin.createPluginAsset(42, contribution, secret) // 41
{
    "success": true,
    "transactionId": "dc2e8551fbe586f05e36dbbf026c0f70d23abb35493a50da1c9a5f7724d561c5e666b9ecd893ab30d2ba0349adb0ff69ed94c592b44be6bd302893319281d074"
}
```
## 2 用户投稿使用接口

接口地址： /api/dao/contributions/:org_id<br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
org_id|string|组织号id|true
title|string|标题|true
url|string|链接|true
price|string|奖励|true
secret|string|密匙|true

返回结果：

```js
{
    "success": true,
    "transactionId": "dc2e8551fbe586f05e36dbbf026c0f70d23abb35493a50da1c9a5f7724d561c5e666b9ecd893ab30d2ba0349adb0ff69ed94c592b44be6bd302893319281d074"
}
```
## 3 根据组织号id获取所有贡献记录

接口地址： /api/dao/contributions/:org_id/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
org_id｜string｜组织号id｜true


返回结果：

```js
{
    "success": true,
    "state": 0,
    "result": {
        "rows": [
            {
                "transaction_id": "81b23644b90744d269d75211c8905b71536ccbedfaff75e3720a7f0b7d4ddaa38c281cc1d1d5062d04b7c72900b348221a44076df1e66e9fcd6338bcf30d9bdb",
                "transaction_type": 42,
                "timestamp": 89733302,
                "title": "from /contributions",
                "received_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "sender_address": "HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "price": "9000000000"
            },
            {
                "transaction_id": "96fac49efc9c6269e95150ffc57cfea18a6c29f7e60a3f6940659c3ee7bf6fcdfe40be5c489baf207949ef69a3f78d7fd582bcacd6a7b2afe5826494b5f7317f",
                "transaction_type": 42,
                "timestamp": 89734621,
                "title": "from /contributions",
                "received_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "sender_address": "HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "price": "8300000000"
            },
           
          
        ],
        "total": 2
    }
}
```
## 4 根据交易id获取所有贡献详情

接口地址： /api/dao/contributions/transaction/:trs_id<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
trs_id|string|交易id|true


返回结果：

```js
{
    "success": true,
    "result": {
      
                "transaction_id": "81b23644b90744d269d75211c8905b71536ccbedfaff75e3720a7f0b7d4ddaa38c281cc1d1d5062d04b7c72900b348221a44076df1e66e9fcd6338bcf30d9bdb",
                "transaction_type": 42,
                "timestamp": 89733302,
                "title": "from /contributions",
                "received_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "sender_address": "HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "price": "9000000000"
    }
}
```
## 5 获取所有贡献列表

接口地址： /api/dao/contributions/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-


返回结果：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "81b23644b90744d269d75211c8905b71536ccbedfaff75e3720a7f0b7d4ddaa38c281cc1d1d5062d04b7c72900b348221a44076df1e66e9fcd6338bcf30d9bdb",
                "transaction_type": 42,
                "timestamp": 89733302,
                "title": "from /contributions",
                "received_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "sender_address": "HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "price": "9000000000"
            },
            {
                "transaction_id": "96fac49efc9c6269e95150ffc57cfea18a6c29f7e60a3f6940659c3ee7bf6fcdfe40be5c489baf207949ef69a3f78d7fd582bcacd6a7b2afe5826494b5f7317f",
                "transaction_type": 42,
                "timestamp": 89734621,
                "title": "from /contributions",
                "received_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
                "sender_address": "HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "price": "8300000000"
            },
           
          
        ],
        "total": 2
    }
}
```

# 确认交易

## 1 确认收稿使用peer/transactions（交易体的生成请查看node-sdk）

接口地址：peer/transactions<br/>
请求方式：POST<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-


返回结果：

```js
let senderAddress='H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p',reciveAddress='HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU';
let secret='suit leisure cushion narrow cabbage hold post fashion message gauge series keen'
let state=0
let  confirmation = {
          sender_address: node.Gaccount.address,
          received_address: node.Daccount.address,
          url:
            'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
          contribution_trs_id:'96fac49efc9c6269e95150ffc57cfea18a6c29f7e60a3f6940659c3ee7bf6fcdfe40be5c489baf207949ef69a3f78d7fd582bcacd6a7b2afe5826494b5f7317f', 
          state,
          amount:  '0',
          recipientId: reciveAddress
        }

      cosnt  transaction = await DdnJS.assetPlugin.createPluginAsset(
          43,
          confirmation,
          secret
        )
{
    "success": true,
    "transactionId": "dc2e8551fbe586f05e36dbbf026c0f70d23abb35493a50da1c9a5f7724d561c5e666b9ecd893ab30d2ba0349adb0ff69ed94c592b44be6bd302893319281d074"
}
```
## 2 使用接口确认收稿

接口地址：/api/dao/confirmations<br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
contribution_trs_id|string|贡献的交易id|true
title|string|标题|true
url|string|链接|true
state|number|状态|true
secret|string|密匙|true

返回结果：

```js
{
    "success": true,
    "transactionId": "dc2e8551fbe586f05e36dbbf026c0f70d23abb35493a50da1c9a5f7724d561c5e666b9ecd893ab30d2ba0349adb0ff69ed94c592b44be6bd302893319281d074"
}
```
## 3 根据组织id获取确认记录

接口地址：/api/dao/confirmations/:org_id/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
org_id|string|组织id|true

返回结果：

```js
{
	"success": true,
	"state": 0,
	"result": {
		"rows":  [{
			"transaction_id": "ee21a9c7b12240eaa098dcdb60b8600e06747188daa928e46b92d927814fe900762d493afc4f271ffc1b38c4c7e2a13226ac75e3d289bb24921039cc18caf1b3",
			"transaction_type": 43,
			"timestamp": 89735937,
			"received_address": "HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU",
			"sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
			"url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
			"state": 0,
			"contribution_trs_id": "37cc3797fd1b5fd2df61185871d30e98f5492e408a60dd27b89b37a029741b942d139f16446dc754bd0b425e38514c41c641950bd41a2384310f8657418f2d3f"
		}, {
			"transaction_id": "af064cd763dad6f02d6591063447f965aff744cdeb2d3f87765fa8da14fc57fecc042b66313bc300b950373190531cf215f90afb0aa1a696875ed2e4570043d9",
			"transaction_type": 43,
			"timestamp": 89757190,
			"received_address": "HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU",
			"sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
			"url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
			"state": 0,
			"contribution_trs_id": "c4a0bd5cc7a1db87097422cf390e724d8265c97844ac8fd8d531ad0488fcefc07bc8019f4b62c814bce158c4d6f2c5b96ac38fc66cd91ce46166c1cc87ba8e67"
		}]
		"total": 2
	}
}
```
## 4 根据交易id获取确认详情

接口地址：/api/dao/confirmations/transaction/:trs_id<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
trs_id|string|交易id|true

返回结果：

```js
{
    "success": true,
    "result": {
        "transaction_id": "ee21a9c7b12240eaa098dcdb60b8600e06747188daa928e46b92d927814fe900762d493afc4f271ffc1b38c4c7e2a13226ac75e3d289bb24921039cc18caf1b3",
        "transaction_type": 43,
        "timestamp": 89735937,
        "received_address": "HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU",
        "sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
        "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
        "state": 0,
        "contribution_trs_id": "37cc3797fd1b5fd2df61185871d30e98f5492e408a60dd27b89b37a029741b942d139f16446dc754bd0b425e38514c41c641950bd41a2384310f8657418f2d3f"
    }
}
```

## 5 获取确认记录列表

接口地址：/api/dao/confirmations/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
pagesize|string｜每页条数|false
pageindex|string|页码|false

返回结果：

```js
{
	"success": true,
	"result": {
		"rows":  [{
			"transaction_id": "ee21a9c7b12240eaa098dcdb60b8600e06747188daa928e46b92d927814fe900762d493afc4f271ffc1b38c4c7e2a13226ac75e3d289bb24921039cc18caf1b3",
			"transaction_type": 43,
			"timestamp": 89735937,
			"received_address": "HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU",
			"sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
			"url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
			"state": 0,
			"contribution_trs_id": "37cc3797fd1b5fd2df61185871d30e98f5492e408a60dd27b89b37a029741b942d139f16446dc754bd0b425e38514c41c641950bd41a2384310f8657418f2d3f"
		}, {
			"transaction_id": "af064cd763dad6f02d6591063447f965aff744cdeb2d3f87765fa8da14fc57fecc042b66313bc300b950373190531cf215f90afb0aa1a696875ed2e4570043d9",
			"transaction_type": 43,
			"timestamp": 89757190,
			"received_address": "HHgyYowPzWAc1UKhcJzkTxvHycDJuqPLLU",
			"sender_address": "H9TDMtSGGCUFj7zPi5SKYgoX5zjtUSkU5p",
			"url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
			"state": 0,
			"contribution_trs_id": "c4a0bd5cc7a1db87097422cf390e724d8265c97844ac8fd8d531ad0488fcefc07bc8019f4b62c814bce158c4d6f2c5b96ac38fc66cd91ce46166c1cc87ba8e67"
		}]
		"total": 2
	}
}
```