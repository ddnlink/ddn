---
order: 2
id: evidence-api
title: 1.数字存证 API
sidebar_label: Evidence api
---

# DDN 区块链数字存证插件

## 1 上传存证信息

接口地址：/peer/transactions<br/>
请求方式：POST<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
|transaction|json|交易信息|true

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transactionId|string |交易id      |  

请求示例：   
```js 

// eslint-disable-next-line strict
(async () => {
  const ddn = require('@ddn/node-sdk').default;
  const secret = 'enter boring shaft rent essence foil trick vibrant fabric quote indoor output';
  const evidencee = {
    ipid: 'ipid2',
    title: 'node.randomUsername()',
    description: ' has been evidence.',
    hash: 'f082022ee664008a1f15d62514811dfd',
    author: 'Evanlai',
    size: '2448kb',
    type: 'html',
    url: 'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
    tags: 'world,cup,test',
    ext: 'china',
    ext1: 12345,
    ext2: new Date(),
  };
  const transaction = await ddn.evidence.createEvidence(evidencee, secret, null);
  console.log(JSON.stringify({ transaction }));
})();

打印结果：
{"transaction":{"type":20,"nethash":"0ab796cd","amount":"0","fee":"10000000","recipientId":null,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","timestamp":91910185,"asset":{"evidence":{"ipid":"ipid2","title":"node.randomUsername()","description":" has been evidence.","hash":"f082022ee664008a1f15d62514811dfd","author":"Evanlai","size":"2448kb","type":"html","url":"dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html","tags":"world,cup,test","ext":"china","ext1":12345,"ext2":"2020-10-19T06:56:50.891Z"}},"signature":"b357dbf0e88c00f17f2a5b763c652d0455c849c885a7f854213acf4e36732ab3d7cdaa0baec296e7eb04d61ffbc677d29921ff327a264e1a25490f925e4d4100","id":"bf1e36605a970af966b8dfcf1551a578cdf83447bab214699d9f07d8b83dae49c0272355456b64741633288407710c92cc9f0f06d54b91097f410e5b7059bb57"}}
 
 //将上面的交易信息通过post请求"peer/transactions"接口传到链上
 curl --location --request POST 'http://localhost:8001/peer/transactions' \
--header 'nethash: 0ab796cd' \
--header 'version: 0' \
--header 'Content-Type: application/json' \
--data-raw '{"transaction":{"type":20,"nethash":"0ab796cd","amount":"0","fee":"10000000","recipientId":null,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","timestamp":91910185,"asset":{"evidence":{"ipid":"ipid2","title":"node.randomUsername()","description":" has been evidence.","hash":"f082022ee664008a1f15d62514811dfd","author":"Evanlai","size":"2448kb","type":"html","url":"dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html","tags":"world,cup,test","ext":"china","ext1":12345,"ext2":"2020-10-19T06:56:50.891Z"}},"signature":"b357dbf0e88c00f17f2a5b763c652d0455c849c885a7f854213acf4e36732ab3d7cdaa0baec296e7eb04d61ffbc677d29921ff327a264e1a25490f925e4d4100","id":"bf1e36605a970af966b8dfcf1551a578cdf83447bab214699d9f07d8b83dae49c0272355456b64741633288407710c92cc9f0f06d54b91097f410e5b7059bb57"}}'
```  

JSON返回示例：

```js
{
    "success": true,
    "transactionId": "bf1e36605a970af966b8dfcf1551a578cdf83447bab214699d9f07d8b83dae49c0272355456b64741633288407710c92cc9f0f06d54b91097f410e5b7059bb57"
}
```
## 1.1 根据ipid获取存证详情

接口地址：/api/evidences/ipid/:ipid<br/>
请求方式：GET<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
ipid |string|存证唯一id|true

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果      | 

请求示例：   
```bash   
curl --location --request GET 'http://localhost:8001/api/evidences/ipid/ipid2'
``` 

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "bf1e36605a970af966b8dfcf1551a578cdf83447bab214699d9f07d8b83dae49c0272355456b64741633288407710c92cc9f0f06d54b91097f410e5b7059bb57",
        "transaction_type": 20,
        "timestamp": 91910185,
        "ipid": "ipid2",
        "title": "node.randomUsername()",
        "description": " has been evidence.",
        "hash": "f082022ee664008a1f15d62514811dfd",
        "tags": "world,cup,test",
        "author": "Evanlai",
        "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
        "type": "html",
        "size": "2448kb"
    }
}
```

## 2 根据title获取一条存证详情

接口地址：/api/evidences/title/:title<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
title |string|标题|true

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果      | 

请求示例：  

```bash   
curl --location --request GET 'http://localhost:8001/api/evidences/title/node.randomUsername()'
``` 

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "bf1e36605a970af966b8dfcf1551a578cdf83447bab214699d9f07d8b83dae49c0272355456b64741633288407710c92cc9f0f06d54b91097f410e5b7059bb57",
        "transaction_type": 20,
        "timestamp": 91910185,
        "ipid": "ipid2",
        "title": "node.randomUsername()",
        "description": " has been evidence.",
        "hash": "f082022ee664008a1f15d62514811dfd",
        "tags": "world,cup,test",
        "author": "Evanlai",
        "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
        "type": "html",
        "size": "2448kb"
    }
}
```
## 3 根据title获取所有存证数据列表

接口地址： /api/evidences/title/:title/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明|required
-|-|-|-|
title |string|资产标题|true


返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果      | 
|rows|array |返回结果列表     | 
|total|number |总条数     | 

请求示例：

```bash
curl --location --request GET 'http://localhost:8001/api/evidences/title/node.randomUsername()/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "bf1e36605a970af966b8dfcf1551a578cdf83447bab214699d9f07d8b83dae49c0272355456b64741633288407710c92cc9f0f06d54b91097f410e5b7059bb57",
                "transaction_type": 20,
                "timestamp": 91910185,
                "ipid": "ipid2",
                "title": "node.randomUsername()",
                "description": " has been evidence.",
                "hash": "f082022ee664008a1f15d62514811dfd",
                "tags": "world,cup,test",
                "author": "Evanlai",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "type": "html",
                "size": "2448kb"
            },
            {
                "transaction_id": "c48781e81ec82bc7b2c3cf88767d94178641d845a86d4b2e607e0026a4f17666152481d107c9b09e58914029be1408a0e816ca6a43f8694670b95d8fef2cd91b",
                "transaction_type": 20,
                "timestamp": 91927612,
                "ipid": "ipid3",
                "title": "node.randomUsername()",
                "description": " has been evidence.",
                "hash": "f082022ee664008a1f15d62514811dfd",
                "tags": "world,cup,test",
                "author": "Evanlai",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "type": "html",
                "size": "2448kb"
            }
        ],
        "total": 2
    }
}
```

## 4 根据数据has获取存证详情（返回命中的第一条）
接口地址： /api/evidences/hash/:hash<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
hash |string|哈希|true

返回参数说明：

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果  

请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/evidences/hash/f082022ee664008a1f15d62514811dfd'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "bf1e36605a970af966b8dfcf1551a578cdf83447bab214699d9f07d8b83dae49c0272355456b64741633288407710c92cc9f0f06d54b91097f410e5b7059bb57",
        "transaction_type": 20,
        "timestamp": 91910185,
        "ipid": "ipid2",
        "title": "node.randomUsername()",
        "description": " has been evidence.",
        "hash": "f082022ee664008a1f15d62514811dfd",
        "tags": "world,cup,test",
        "author": "Evanlai",
        "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
        "type": "html",
        "size": "2448kb"
    }
}
```

## 5 获取存证hash为同一个的数据列表

接口地址： /api/evidences/hash/:hash/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明|required
-|-|-|-
hash |string|哈希|true
返回参数说明：

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果  
|rows|array|返回数据列表|
|total|number|数据条数

请求示例：

```bash
curl --location --request GET 'http://localhost:8001/api/evidences/hash/f082022ee664008a1f15d62514811dfd/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "bf1e36605a970af966b8dfcf1551a578cdf83447bab214699d9f07d8b83dae49c0272355456b64741633288407710c92cc9f0f06d54b91097f410e5b7059bb57",
                "transaction_type": 20,
                "timestamp": 91910185,
                "ipid": "ipid2",
                "title": "node.randomUsername()",
                "description": " has been evidence.",
                "hash": "f082022ee664008a1f15d62514811dfd",
                "tags": "world,cup,test",
                "author": "Evanlai",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "type": "html",
                "size": "2448kb"
            },
            {
                "transaction_id": "c48781e81ec82bc7b2c3cf88767d94178641d845a86d4b2e607e0026a4f17666152481d107c9b09e58914029be1408a0e816ca6a43f8694670b95d8fef2cd91b",
                "transaction_type": 20,
                "timestamp": 91927612,
                "ipid": "ipid3",
                "title": "node.randomUsername()",
                "description": " has been evidence.",
                "hash": "f082022ee664008a1f15d62514811dfd",
                "tags": "world,cup,test",
                "author": "Evanlai",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "type": "html",
                "size": "2448kb"
            }
        ],
        "total": 2
    }
}
```
## 6 根据作者获取存证数据详情，只返回命中的第一条
接口地址：/api/evidences/author/:author<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明|required
-|-|-|-
author|string|作者|true

返回参数说明：

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果  

请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/evidences/author/Evanlai'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "bf1e36605a970af966b8dfcf1551a578cdf83447bab214699d9f07d8b83dae49c0272355456b64741633288407710c92cc9f0f06d54b91097f410e5b7059bb57",
        "transaction_type": 20,
        "timestamp": 91910185,
        "ipid": "ipid2",
        "title": "node.randomUsername()",
        "description": " has been evidence.",
        "hash": "f082022ee664008a1f15d62514811dfd",
        "tags": "world,cup,test",
        "author": "Evanlai",
        "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
        "type": "html",
        "size": "2448kb"
    }
}
```
## 7 根据作者获取存证数据列表
接口地址： /api/evidences/author/:author/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明|required
-|-|-|-
author |string|作者|true

返回参数说明：
|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果  
|rows|array|返回数据列表|
|total|number|数据条数

请求示例：

```bash
curl --location --request GET 'http://localhost:8001/api/evidences/author/Evanlai/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "bf1e36605a970af966b8dfcf1551a578cdf83447bab214699d9f07d8b83dae49c0272355456b64741633288407710c92cc9f0f06d54b91097f410e5b7059bb57",
                "transaction_type": 20,
                "timestamp": 91910185,
                "ipid": "ipid2",
                "title": "node.randomUsername()",
                "description": " has been evidence.",
                "hash": "f082022ee664008a1f15d62514811dfd",
                "tags": "world,cup,test",
                "author": "Evanlai",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "type": "html",
                "size": "2448kb"
            },
            {
                "transaction_id": "c48781e81ec82bc7b2c3cf88767d94178641d845a86d4b2e607e0026a4f17666152481d107c9b09e58914029be1408a0e816ca6a43f8694670b95d8fef2cd91b",
                "transaction_type": 20,
                "timestamp": 91927612,
                "ipid": "ipid3",
                "title": "node.randomUsername()",
                "description": " has been evidence.",
                "hash": "f082022ee664008a1f15d62514811dfd",
                "tags": "world,cup,test",
                "author": "Evanlai",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "type": "html",
                "size": "2448kb"
            }
        ],
        "total": 2
    }
}
```

## 8 根据数据类型获取这一类存证列表
接口地址： /api/evidences/type/:type/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明|required
-|-|-|-|
type |string|数据类型|true

返回参数说明：
|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果 
|rows|array |返回结果列表
|total|number |总条数 


请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/evidences/type/html/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "bf1e36605a970af966b8dfcf1551a578cdf83447bab214699d9f07d8b83dae49c0272355456b64741633288407710c92cc9f0f06d54b91097f410e5b7059bb57",
                "transaction_type": 20,
                "timestamp": 91910185,
                "ipid": "ipid2",
                "title": "node.randomUsername()",
                "description": " has been evidence.",
                "hash": "f082022ee664008a1f15d62514811dfd",
                "tags": "world,cup,test",
                "author": "Evanlai",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "type": "html",
                "size": "2448kb"
            },
            {
                "transaction_id": "c48781e81ec82bc7b2c3cf88767d94178641d845a86d4b2e607e0026a4f17666152481d107c9b09e58914029be1408a0e816ca6a43f8694670b95d8fef2cd91b",
                "transaction_type": 20,
                "timestamp": 91927612,
                "ipid": "ipid3",
                "title": "node.randomUsername()",
                "description": " has been evidence.",
                "hash": "f082022ee664008a1f15d62514811dfd",
                "tags": "world,cup,test",
                "author": "Evanlai",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "type": "html",
                "size": "2448kb"
            }
        ],
        "total": 2
    }
}
```
## 9 根据交易id获取存证数据详情
接口地址： /api/evidences/transaction/:trs_id<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明|required
-|-|-|-|
trs_id |string|交易id|true

返回参数说明：
|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果 


请求示例：
```bash
curl --location --request GET 'http://localhost:8001/api/evidences/transaction/c48781e81ec82bc7b2c3cf88767d94178641d845a86d4b2e607e0026a4f17666152481d107c9b09e58914029be1408a0e816ca6a43f8694670b95d8fef2cd91b'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "c48781e81ec82bc7b2c3cf88767d94178641d845a86d4b2e607e0026a4f17666152481d107c9b09e58914029be1408a0e816ca6a43f8694670b95d8fef2cd91b",
        "transaction_type": 20,
        "timestamp": 91927612,
        "ipid": "ipid3",
        "title": "node.randomUsername()",
        "description": " has been evidence.",
        "hash": "f082022ee664008a1f15d62514811dfd",
        "tags": "world,cup,test",
        "author": "Evanlai",
        "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
        "type": "html",
        "size": "2448kb"
    }
}
```
## 10 获取所有存证数据
接口地址： /api/dao/orgs<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明|required
-|-|-|-
pagesize|string|每页条数（默认为10）|false
pageindex|string|页码（默认为1）|false

返回参数说明：
|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |返回结果  
|org|object|返回数据列表|
|total|number|数据条数

请求示例：

```bash
curl --location --request GET 'http://localhost:8001/api/evidences/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "bf1e36605a970af966b8dfcf1551a578cdf83447bab214699d9f07d8b83dae49c0272355456b64741633288407710c92cc9f0f06d54b91097f410e5b7059bb57",
                "transaction_type": 20,
                "timestamp": 91910185,
                "ipid": "ipid2",
                "title": "node.randomUsername()",
                "description": " has been evidence.",
                "hash": "f082022ee664008a1f15d62514811dfd",
                "tags": "world,cup,test",
                "author": "Evanlai",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "type": "html",
                "size": "2448kb"
            },
            {
                "transaction_id": "c48781e81ec82bc7b2c3cf88767d94178641d845a86d4b2e607e0026a4f17666152481d107c9b09e58914029be1408a0e816ca6a43f8694670b95d8fef2cd91b",
                "transaction_type": 20,
                "timestamp": 91927612,
                "ipid": "ipid3",
                "title": "node.randomUsername()",
                "description": " has been evidence.",
                "hash": "f082022ee664008a1f15d62514811dfd",
                "tags": "world,cup,test",
                "author": "Evanlai",
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "type": "html",
                "size": "2448kb"
            }
        ],
        "total": 2
    }
}
```

