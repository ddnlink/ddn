---
order: 3
id: dao-api
title: 2.自治组织DAO Api
sidebar_label: Decenter Auto Organization
---

# DAO 自治组织API

## 1 注册组织号

接口地址：/api/dao/orgs<br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
org_id |string|组织唯一id(长度大于等4小于等于20)|true
name |string |组织名称|true
state|number|组织号状态|true
url |string |地址|true
tags |string|标签|true

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transactionId|string |交易id      |  

请求示例：   
```bash   
curl --location --request PUT 'http://localhost:8001/api/dao/orgs' \
--header 'Content-Type: application/json' \
--data-raw '{
    "org_id":"qwertsyuasaa",
    "name":"xaASDFA",
    "url":"dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
    "tags":"world,cup,test",
    "state":0,
    "secret":"enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
}'  
```  

JSON返回示例：

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

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果      | 
|org|object|返回数据|

请求示例：   
```bash   
curl --location --request GET 'http://localhost:8001/api/dao/orgs/qwertsyuasaa' \
--header 'Content-Type: application/json' \
--data-raw '{
    "org_id":"qwertsyuasaa",
    "name":"xaAssSDFA",
    "url":"dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
    "tags":"world,cup,test",
    "state":0,
    "secret":"enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
}'
``` 

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "org": {
            "transaction_id": "c0af0db4ddaddf9f1b558b3a22dd5907a6d7008c5053cf217808b6486a883c5886160351630e42be186ec46e9edd352775e0c7480a30ffc4c4768073e0345cba",
            "org_id": "qwertsyuasaa",
            "name": "xaASDFA",
            "address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
            "tags": "world,cup,test",
            "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
            "state": 0,
            "timestamp": 89935723
        }
    }
}
```

## 2 根据组织号id获取组织号

接口地址：/api/dao/orgs/:org_id<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
org_id |string|组织唯一id|true

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果      | 
|org|object|返回数据|

请求示例：  

```bash   
curl --location --request GET 'http://localhost:8001/api/dao/orgs/qwertsyuasaa'
``` 

JSON返回示例：

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


返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果  
|org|object|返回数据|

请求示例：

```bash
curl --location --request GET 'http://localhost:8001 /api/dao/orgs/address/DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "org": {
            "transaction_id": "c0af0db4ddaddf9f1b558b3a22dd5907a6d7008c5053cf217808b6486a883c5886160351630e42be186ec46e9edd352775e0c7480a30ffc4c4768073e0345cba",
            "org_id": "qwertsyuasaa",
            "name": "xaASDFA",
            "address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
            "tags": "world,cup,test",
            "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
            "state": 0,
            "timestamp": 89935723
        }
    }
}
```

## 4 根据标签获取组织号
接口地址： /api/dao/orgs/tags/:tags<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
tags |string|标签|true

返回参数说明：

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果  
|org|object|返回数据｜

请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/orgs/tags/world,cup,test'
```

JSON返回示例：

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
返回参数说明：

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果  
|org|object|返回数据列表|
|total|number|数据条数

请求示例：

```bash
curl --location --request GET 'http://localhost:8001/api/dao/orgs/tags/world,cup,test/all'
```

JSON返回示例：

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

返回参数说明：

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果  

请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/orgs/state/0'
```

JSON返回示例：

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

返回参数说明：
|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果  
|org|object|返回数据列表|
|total|number|数据条数

请求示例：

```bash
curl --location --request GET 'http://localhost:8001/api/dao/orgs/state/0/all'
```

JSON返回示例：

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

## 8 根据交易id获取组织号详情
接口地址： /api/dao/orgs/transaction/:trs_id<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
trs_id |string|交易id

返回参数说明：
|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果 

请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/orgs/transaction/c0af0db4ddaddf9f1b558b3a22dd5907a6d7008c5053cf217808b6486a883c5886160351630e42be186ec46e9edd352775e0c7480a30ffc4c4768073e0345cba'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "c0af0db4ddaddf9f1b558b3a22dd5907a6d7008c5053cf217808b6486a883c5886160351630e42be186ec46e9edd352775e0c7480a30ffc4c4768073e0345cba",
        "transaction_type": 40,
        "timestamp": 89935723,
        "org_id": "qwertsyuasaa",
        "name": "xaASDFA",
        "address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
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
pagesize|string|每页条数
pageindex|string|页码

返回参数说明：
|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果  
|org|object|返回数据列表|
|total|number|数据条数

请求示例：

```bash
curl --location --request GET 'http://localhost:8001/api/dao/orgs'
```

JSON返回示例：

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
|transaction|json|true

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|transactionId|string |交易id | 

请求示例：

```js
(async () => {
    (async () => {
        const ddn = require('@ddn/node-sdk').default;
        let senderAddress='DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe',reciveAddress='D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by';
        let secret='enter boring shaft rent essence foil trick vibrant fabric quote indoor output'
        let exchange = {
        org_id: 'qwertsyuasaa',
        price: '700000000',
        state: 0,//状态
        exchange_trs_id: '',
        received_address: reciveAddress,
        sender_address: senderAddress
      }
       var transaction = await ddn.dao.createExchange(null,exchange,secret)       
       console.log(JSON.stringify({transaction}))   
})();

 打印结果：
      {"transaction":{"type":41,"nethash":"0ab796cd","amount":"0","fee":"10000000",     "recipientId":null,     "senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","timestamp":89941614,"asset":{"daoExchange":{"org_id":"qwertsyuasaa","price":"700000000","state":0,"exchange_trs_id":"","received_address":"D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by","sender_address":"DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe"}},"signature":"9d899fcfda6d1d7af351d0ea1257fec81d8414426c9bf3d590850486e101c0719d32f1a36c5ba064b6cb1641b7753e77bd20f31701b01f2518d309af8e1f2a04","id":"c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377"}}

 //将上面的交易信息通过post请求"peer/transactions"接口传到链上

 curl --location --request POST 'http://localhost:8001/peer/transactions' \
 --header 'nethash: 0ab796cd' \
 --header 'version: 0' \
 --header 'Content-Type: application/json' \
 --data-raw '{"transaction":{"type":41,"nethash":"0ab796cd","amount":"0","fee":"10000000","recipientId":null,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","timestamp":89941614,"asset":{"daoExchange":{"org_id":"qwertsyuasaa","price":"700000000","state":0,"exchange_trs_id":"","received_address":"D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by","sender_address":"DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe"}},"signature":"9d899fcfda6d1d7af351d0ea1257fec81d8414426c9bf3d590850486e101c0719d32f1a36c5ba064b6cb1641b7753e77bd20f31701b01f2518d309af8e1f2a04","id":"c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377"}}'
```

JSON返回示例：

```js
{
    "success": true,
    "transactionId": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377"
}
```
## 1.1 确认买交易（交易体的生成请查看node-sdk）

接口地址：/peer/transactions<br/>
请求方式：POST<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
transaction|json|交易数据|true

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|transactionId|string |交易id | 

请求示例：
```js
  (async () => {
    const ddn = require('@ddn/node-sdk').default;
    let senderAddress='DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe',reciveAddress='D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by';
    let secret='enter boring shaft rent essence foil trick vibrant fabric quote indoor output'
    let reciveAddressSecret='attract motion canal change horror dose waste hub team horse half tiny'
    let exchange = {
        org_id: 'qwertsyuasaa',
        price: '700000000',
        state: 1,//状态为1
        amount:'700000000',
        sender_address: reciveAddress,
        received_address: senderAddress,
        recipientId:senderAddress,
        exchange_trs_id:'c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377'
      }
    var transaction = await ddn.dao.createExchange(null,exchange,reciveAddressSecret)       
    console.log(JSON.stringify({transaction}))  
})()

    输出结果：
    {"transaction":{"type":41,"nethash":"0ab796cd","amount":"0","fee":"10000000","recipientId":"DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe","senderPublicKey":"9a9058fba208ab7fb3d9b2c521b1c6dabf38583fc18f1779d61d2266487cf744","timestamp":89944388,"asset":{"daoExchange":{"org_id":"qwertsyuasaa","price":"700000000","state":1,"amount":"700000000","sender_address":"D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by","received_address":"DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe","recipientId":"DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe","exchange_trs_id":"c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377"}},"signature":"b63fa239e1b2c013200b94865abd43c3573bfba4bb9ac72991763072f3e1dffb157a022d44315bb60ce6bd0b965cfdab79ccf4393cb8956d2e51173f60e95904","id":"2caecea55d30bc18dd25bd1906760e4ff4f391b21fdf6af0160162adf2176a3082efe5dce36fd0b4cf5f272f53e2cf156fd487c20758fc10f6cf43474c832101"}}

   // 将上面的交易信息通过post请求"peer/transactions"接口传到链上

   curl --location --request POST 'http://localhost:8001/peer/transactions' \
   --header 'nethash: 0ab796cd' \
   --header 'version: 0' \
   --header 'Content-Type: application/json' \
   --data-raw '{"transaction":{"type":41,"nethash":"0ab796cd","amount":"0","fee":"10000000","recipientId":"DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe","senderPublicKey":"9a9058fba208ab7fb3d9b2c521b1c6dabf38583fc18f1779d61d2266487cf744","timestamp":89944388,"asset":{"daoExchange":{"org_id":"qwertsyuasaa","price":"700000000","state":1,"amount":"700000000","sender_address":"D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by","received_address":"DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe","recipientId":"DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe","exchange_trs_id":"c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377"}},"signature":"b63fa239e1b2c013200b94865abd43c3573bfba4bb9ac72991763072f3e1dffb157a022d44315bb60ce6bd0b965cfdab79ccf4393cb8956d2e51173f60e95904","id":"2caecea55d30bc18dd25bd1906760e4ff4f391b21fdf6af0160162adf2176a3082efe5dce36fd0b4cf5f272f53e2cf156fd487c20758fc10f6cf43474c832101"}}'
```

JSON返回示例：

```js
{
    "success": true,
    "transactionId": "dc2e8551fbe586f05e36dbbf026c0f70d23abb35493a50da1c9a5f7724d561c5e666b9ecd893ab30d2ba0349adb0ff69ed94c592b44be6bd302893319281d074"
}
```
## 1.2 接口发起交易  未测试 

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

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 

请求示例:
```bash
curl --location --request GET 'http://localhost:8001/api/dao/exchanges/org_id/qwertsyuasaa'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
        "transaction_type": 41,
        "timestamp": 89941614,
        "org_id": "qwertsyuasaa",
        "sender_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
        "received_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
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

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 
|rows|array|结果数组|
|total|number|总条数|


请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/exchanges/org_id/qwertsyuasaa/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
                "transaction_type": 41,
                "timestamp": 89941614,
                "org_id": "qwertsyuasaa",
                "sender_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "received_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
            },
            {
                "transaction_id": "2caecea55d30bc18dd25bd1906760e4ff4f391b21fdf6af0160162adf2176a3082efe5dce36fd0b4cf5f272f53e2cf156fd487c20758fc10f6cf43474c832101",
                "transaction_type": 41,
                "timestamp": 89944388,
                "org_id": "qwertsyuasaa",
                "sender_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "received_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "exchange_trs_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
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

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 

请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/exchanges/sender_address/D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "2caecea55d30bc18dd25bd1906760e4ff4f391b21fdf6af0160162adf2176a3082efe5dce36fd0b4cf5f272f53e2cf156fd487c20758fc10f6cf43474c832101",
        "transaction_type": 41,
        "timestamp": 89944388,
        "org_id": "qwertsyuasaa",
        "sender_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
        "received_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
        "exchange_trs_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
        "price": "700000000",
        "state": 1
    }
}
```
## 4 根据发送者钱包地址查询所有组织号的交易记录列表
接口地址： /api/dao/exchanges/sender_address/:sender_address/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
sender_address |string|钱包地址

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 
|rows|array|结果数组|
|total|number|总条数|


请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/exchanges/sender_address/D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "2caecea55d30bc18dd25bd1906760e4ff4f391b21fdf6af0160162adf2176a3082efe5dce36fd0b4cf5f272f53e2cf156fd487c20758fc10f6cf43474c832101",
                "transaction_type": 41,
                "timestamp": 89944388,
                "org_id": "qwertsyuasaa",
                "sender_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "received_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "exchange_trs_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
                "price": "700000000",
                "state": 1
            }
        ],
        "total": 1
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

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 

请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/exchanges/received_address/DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "2caecea55d30bc18dd25bd1906760e4ff4f391b21fdf6af0160162adf2176a3082efe5dce36fd0b4cf5f272f53e2cf156fd487c20758fc10f6cf43474c832101",
        "transaction_type": 41,
        "timestamp": 89944388,
        "org_id": "qwertsyuasaa",
        "sender_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
        "received_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
        "exchange_trs_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
        "price": "700000000",
        "state": 1
    }
}
```
## 6 根据接受者钱包地址查询所有组织号的交易记录列表
接口地址：  /api/dao/exchanges/received_address/:received_address/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
received_address |string|钱包地址

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 
|rows|array|结果数组|
|total|number|总条数|


请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/exchanges/received_address/DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "2caecea55d30bc18dd25bd1906760e4ff4f391b21fdf6af0160162adf2176a3082efe5dce36fd0b4cf5f272f53e2cf156fd487c20758fc10f6cf43474c832101",
                "transaction_type": 41,
                "timestamp": 89944388,
                "org_id": "qwertsyuasaa",
                "sender_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "received_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "exchange_trs_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
                "price": "700000000",
                "state": 1
            }
        ],
        "total": 1
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

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 

请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/exchanges/price/700000000'
```

JSON返回示例：

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

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 
|rows|array|结果数组|
|total|number|总条数|


请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/exchanges/price/700000000/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
                "transaction_type": 41,
                "timestamp": 89941614,
                "org_id": "qwertsyuasaa",
                "sender_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "received_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
            },
            {
                "transaction_id": "2caecea55d30bc18dd25bd1906760e4ff4f391b21fdf6af0160162adf2176a3082efe5dce36fd0b4cf5f272f53e2cf156fd487c20758fc10f6cf43474c832101",
                "transaction_type": 41,
                "timestamp": 89944388,
                "org_id": "qwertsyuasaa",
                "sender_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "received_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "exchange_trs_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
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

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 

请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/exchanges/state/1'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "2caecea55d30bc18dd25bd1906760e4ff4f391b21fdf6af0160162adf2176a3082efe5dce36fd0b4cf5f272f53e2cf156fd487c20758fc10f6cf43474c832101",
        "transaction_type": 41,
        "timestamp": 89944388,
        "org_id": "qwertsyuasaa",
        "sender_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
        "received_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
        "exchange_trs_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
        "price": "700000000",
        "state": 1
    }
}
```
## 10 根据交易金额查询所有组织号的交易记录列表
接口地址：  /api/dao/exchanges/state/:state/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
state |string|状态

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 
|rows|array|结果数组|
|total|number|总条数|


请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/exchanges/state/1/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "2caecea55d30bc18dd25bd1906760e4ff4f391b21fdf6af0160162adf2176a3082efe5dce36fd0b4cf5f272f53e2cf156fd487c20758fc10f6cf43474c832101",
                "transaction_type": 41,
                "timestamp": 89944388,
                "org_id": "qwertsyuasaa",
                "sender_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "received_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "exchange_trs_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
                "price": "700000000",
                "state": 1
            }
        ],
        "total": 1
    }
}
```
## 11 根据交易id获取组织号的交易记录
接口地址：  /api/dao/exchanges/transaction/:trs_id<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
trs_id |string|交易id

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 

请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/exchanges/transaction/2caecea55d30bc18dd25bd1906760e4ff4f391b21fdf6af0160162adf2176a3082efe5dce36fd0b4cf5f272f53e2cf156fd487c20758fc10f6cf43474c832101'
```

JSON返回示例：
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

## 12 查询所有组织号的所有交易记录列表
接口地址：  /api/dao/exchanges/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明
-|-|-
pagesize|string｜每页条数
pageindex|string|页码

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 
|rows|array|结果数组|
|total|number|总条数|


请求示例：

```bash
curl --location --request GET 'http://localhost:8001/api/dao/exchanges/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
                "transaction_type": 41,
                "timestamp": 89941614,
                "org_id": "qwertsyuasaa",
                "sender_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "received_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "exchange_trs_id": "",
                "price": "700000000",
                "state": 0
            },
            {
                "transaction_id": "2caecea55d30bc18dd25bd1906760e4ff4f391b21fdf6af0160162adf2176a3082efe5dce36fd0b4cf5f272f53e2cf156fd487c20758fc10f6cf43474c832101",
                "transaction_type": 41,
                "timestamp": 89944388,
                "org_id": "qwertsyuasaa",
                "sender_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "received_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "exchange_trs_id": "c56b4c85d61c41a08be58476efa202e883408bfa378fd7ad0b8576e6607225de45f45c1fa480f19a5beb266930d84651eb92b26a1837bc7e024f77df16702377",
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
transaction|json|交易体|true

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|transactionId|string |交易id | 

请求是示例：
```js
(async () => {
   const ddn = require('@ddn/node-sdk').default;  
    let senderAddress='DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe',reciveAddress='D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by';
    let secret='enter boring shaft rent essence foil trick vibrant fabric quote indoor output'
    let reciveAddressSecret='attract motion canal change horror dose waste hub team horse half tiny'
    let contribution = {
        title: 'sssss',
        sender_address: senderAddress,
        received_address: reciveAddress,
        url:
          'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
        price: '0'
      }
    var transaction = await ddn.dao.createContribution(contribution,secret)       
    console.log(JSON.stringify({transaction}))  
})()

//输出结果
{"transaction":{"type":42,"nethash":"0ab796cd","amount":"0","fee":"100000000","recipientId":null,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","timestamp":89946294,"asset":{"daoContribution":{"title":"sssss","sender_address":"DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe","received_address":"D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by","url":"dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html","price":"0"}},"signature":"633451aa7e360dcce555419626cdd4739d523a619b9fae8d72fde13bf46a85c9bee997acb3cf22d91ca9cfe9cac312a82a20ba532340fd691b090e23df1ace07","id":"722946019ca08fb3e5cc08ee5cfc8d71e1f23e16db8829873a707de6d29ed09baf9f9627ba815b2ce59ddd48a1282ba6dc3c4f2d5adbed335d3c433bba2d6176"}}

 // 将上面的交易信息通过post请求"peer/transactions"接口传到链上
curl --location --request POST 'http://localhost:8001/peer/transactions' \
--header 'nethash: 0ab796cd' \
--header 'version: 0' \
--header 'Content-Type: application/json' \
--data-raw '{"transaction":{"type":42,"nethash":"0ab796cd","amount":"0","fee":"100000000","recipientId":null,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","timestamp":89946294,"asset":{"daoContribution":{"title":"sssss","sender_address":"DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe","received_address":"D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by","url":"dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html","price":"0"}},"signature":"633451aa7e360dcce555419626cdd4739d523a619b9fae8d72fde13bf46a85c9bee997acb3cf22d91ca9cfe9cac312a82a20ba532340fd691b090e23df1ace07","id":"722946019ca08fb3e5cc08ee5cfc8d71e1f23e16db8829873a707de6d29ed09baf9f9627ba815b2ce59ddd48a1282ba6dc3c4f2d5adbed335d3c433bba2d6176"}}'
```
JSON返回示例：

```js
{
    "success": true,
    "transactionId": "722946019ca08fb3e5cc08ee5cfc8d71e1f23e16db8829873a707de6d29ed09baf9f9627ba815b2ce59ddd48a1282ba6dc3c4f2d5adbed335d3c433bba2d6176"
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

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|transactionId|string |交易id | 

请求示例：
```bash
curl --location --request PUT 'http://localhost:8001/api/dao/contributions/qwertsyuasaa' \
--header 'Content-Type: application/json' \
--data-raw '{
        "title": "sssss",
        "sender_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
        "received_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
        "url":
          "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
        "price": "0",
        "secret":"enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
      }'
```

JSON返回示例：

```js
{
    "success": true,
    "transactionId": "23681a024f3e3c650850ce3bb5b86c89cd3c2f6926fdfc6a40dadcda56c54cc1f123d676aa2c12abb2ae2ff77a1554380830b511422759b8a8ebe792dccc3eaf"
}
```
## 3 根据组织号id获取所有贡献记录

接口地址： /api/dao/contributions/:org_id/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
org_id｜string｜组织号id｜true

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 
|rows|array|结果数组|
|total|number|总条数|


请求示例：

```bash
curl --location --request GET 'http://localhost:8001/api/dao/contributions/qwertsyuasaa/all'
```


JSON返回示例：

```js
{
    "success": true,
    "state": 0,
    "result": {
        "rows": [
            {
                "transaction_id": "722946019ca08fb3e5cc08ee5cfc8d71e1f23e16db8829873a707de6d29ed09baf9f9627ba815b2ce59ddd48a1282ba6dc3c4f2d5adbed335d3c433bba2d6176",
                "transaction_type": 42,
                "timestamp": 89946294,
                "title": "sssss",
                "received_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "sender_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "price": "0"
            },
            {
                "transaction_id": "23681a024f3e3c650850ce3bb5b86c89cd3c2f6926fdfc6a40dadcda56c54cc1f123d676aa2c12abb2ae2ff77a1554380830b511422759b8a8ebe792dccc3eaf",
                "transaction_type": 42,
                "timestamp": 89946858,
                "title": "sssss",
                "received_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "sender_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "price": "0"
            }
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
trs_id|string|贡献的交易id|true

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 

请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/contributions/transaction/722946019ca08fb3e5cc08ee5cfc8d71e1f23e16db8829873a707de6d29ed09baf9f9627ba815b2ce59ddd48a1282ba6dc3c4f2d5adbed335d3c433bba2d6176'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "722946019ca08fb3e5cc08ee5cfc8d71e1f23e16db8829873a707de6d29ed09baf9f9627ba815b2ce59ddd48a1282ba6dc3c4f2d5adbed335d3c433bba2d6176",
        "transaction_type": 42,
        "timestamp": 89946294,
        "title": "sssss",
        "received_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
        "sender_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
        "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
        "price": "0"
    }
}
```
## 5 获取所有贡献列表

接口地址： /api/dao/contributions/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|objecet |返回结果 | 
|rows|array|结果数组|
|total|number|总条数|


请求示例：

```bash
curl --location --request GET 'http://localhost:8001/api/dao/contributions/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "722946019ca08fb3e5cc08ee5cfc8d71e1f23e16db8829873a707de6d29ed09baf9f9627ba815b2ce59ddd48a1282ba6dc3c4f2d5adbed335d3c433bba2d6176",
                "transaction_type": 42,
                "timestamp": 89946294,
                "title": "sssss",
                "received_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "sender_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "price": "0"
            },
            {
                "transaction_id": "23681a024f3e3c650850ce3bb5b86c89cd3c2f6926fdfc6a40dadcda56c54cc1f123d676aa2c12abb2ae2ff77a1554380830b511422759b8a8ebe792dccc3eaf",
                "transaction_type": 42,
                "timestamp": 89946858,
                "title": "sssss",
                "received_address": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by",
                "sender_address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "price": "0"
            }
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
transaction|json|交易体|true

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|transactionId|string |交易id | 

请求示例：

```js
(async () => {
    const ddn = require('@ddn/node-sdk').default;
    // var ddn = require('./packages/node-sdk/lib/index').default;   
    let senderAddress='DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe',reciveAddress='D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by';
    let secret='enter boring shaft rent essence foil trick vibrant fabric quote indoor output'
    let reciveAddressSecret='attract motion canal change horror dose waste hub team horse half tiny'
    let confirmation = {
        sender_address: reciveAddress,
        received_address: senderAddress,
        url:
          'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
        contribution_trs_id:'23681a024f3e3c650850ce3bb5b86c89cd3c2f6926fdfc6a40dadcda56c54cc1f123d676aa2c12abb2ae2ff77a1554380830b511422759b8a8ebe792dccc3eaf', 
        state:0,
        amount:  '0',
        recipientId: reciveAddress
      }
    
    // 其中password是在用户登录的时候记录下来的，secondPassword需要每次让用户输入
    // 可以通过user.secondPublicKey来判断用户是否有二级密码，如果没有，则不必输入，以下几个交易类型类似
    var transaction = await ddn.dao.createConfirmation('10',confirmation,secret)       
    // var transaction = await ddn.dao.createTransfer('D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by','10000000000',secret)       
    console.log(JSON.stringify({transaction}))  
})()

//输出结果
{"transaction":{"type":43,"nethash":"0ab796cd","amount":"0","fee":"0","recipientId":"","senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","timestamp":89947432,"asset":{"daoConfirmation":{"sender_address":"D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by","received_address":"DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe","url":"dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html","contribution_trs_id":"23681a024f3e3c650850ce3bb5b86c89cd3c2f6926fdfc6a40dadcda56c54cc1f123d676aa2c12abb2ae2ff77a1554380830b511422759b8a8ebe792dccc3eaf","state":0,"amount":"0","recipientId":"D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by"}},"signature":"73a6f96f4a50b4eaddf3966bbedc9192f4fb36153ed21e77c456dba5e38f441d2b18b470bad333a787f5d9644de47a936a60947a0668de9c33fb8abf2b063f0c","id":"b45954aef79459ef43908e478ad930497da27b0ed771dcd022965afba9b1611bca49f9035461447b3e6347ad6e91a8774c55e6f176185bbb2b4bd556ea9a2cc1"}}
 // 将上面的交易信息通过post请求"peer/transactions"接口传到链上

 curl --location --request POST 'http://localhost:8001/peer/transactions' \
--header 'nethash: 0ab796cd' \
--header 'version: 0' \
--header 'Content-Type: application/json' \
--data-raw '{"transaction":{"type":43,"nethash":"0ab796cd","amount":"0","fee":"0","recipientId":"","senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","timestamp":89947432,"asset":{"daoConfirmation":{"sender_address":"D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by","received_address":"DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe","url":"dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html","contribution_trs_id":"23681a024f3e3c650850ce3bb5b86c89cd3c2f6926fdfc6a40dadcda56c54cc1f123d676aa2c12abb2ae2ff77a1554380830b511422759b8a8ebe792dccc3eaf","state":0,"amount":"0","recipientId":"D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by"}},"signature":"73a6f96f4a50b4eaddf3966bbedc9192f4fb36153ed21e77c456dba5e38f441d2b18b470bad333a787f5d9644de47a936a60947a0668de9c33fb8abf2b063f0c","id":"b45954aef79459ef43908e478ad930497da27b0ed771dcd022965afba9b1611bca49f9035461447b3e6347ad6e91a8774c55e6f176185bbb2b4bd556ea9a2cc1"}}'
```
JSON返回示例：
```bash
{
    "success": true,
    "transactionId": "b45954aef79459ef43908e478ad930497da27b0ed771dcd022965afba9b1611bca49f9035461447b3e6347ad6e91a8774c55e6f176185bbb2b4bd556ea9a2cc1"
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

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|transactionId|string |交易id | 

请求示例：
```bash
curl --location --request GET 'http://localhost:8001 /api/dao/confirmations' \
--header 'Content-Type: application/json' \
--data-raw '{
    "contribution_trs_id":"722946019ca08fb3e5cc08ee5cfc8d71e1f23e16db8829873a707de6d29ed09baf9f9627ba815b2ce59ddd48a1282ba6dc3c4f2d5adbed335d3c433bba2d6176",
    "title":"test",
    "state":0,
    "url":"dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
    "secret":"enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
}'
```

JSON返回示例：

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

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|object |返回结果 | 
|rows|array|结果列表|
|count|number|确认交易总数量|

请求示例
```bash
curl --location --request GET 'http://localhost:8001/api/dao/confirmations/qwertsyuasaa/all'
```

JSON返回示例：

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

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|object |返回结果 | 

请求示例：
```bash
curl --location --request GET '{{url}/api/dao/confirmations/transaction/dc2e8551fbe586f05e36dbbf026c0f70d23abb35493a50da1c9a5f7724d561c5e666b9ecd893ab30d2ba0349adb0ff69ed94c592b44be6bd302893319281d074'
```

JSON返回示例：

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

返回参数说明：   

|名称	|类型   |说明   |   
|------ |-----  |---- |   
|success|boolean  |是否成功 |
|result|object |返回结果 | 
|rows|array|结果列表|
|count|number|确认交易总数量|

请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/dao/confirmations/all'
```

JSON返回示例：

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
