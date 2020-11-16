---
order: 2
id: evidence-api
title: 数字存证 API
sidebar_label: Evidence api
---

# DDN 区块链数字存证插件


## **1 API使用说明**   
## **1.1 请求过程说明**   
1.1 构造请求数据，用户数据按照DDN提供的接口规则，通过程序生成签名，生成请求数据集合；       
1.2 发送请求数据，把构造完成的数据集合通过POST/GET等提交的方式传递给DDN；       
1.3 DDN对请求数据进行处理，服务器在接收到请求后，会首先进行安全校验，验证通过后便会处理该次发送过来的请求；       
1.4 返回响应结果数据，DDN把响应结果以JSON的格式反馈给用户，每个响应都包含success字段，表示请求是否成功，成功为true, 失败为false。 如果失败，则还会包含一个error字段，表示错误原因；       
1.5 对获取的返回结果数据进行处理；       
   
---   
   
## **2 接口**   
## **2.1 资产数据相关交易** 
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
var secondSecret = 'ddnaobtest001'
```

### **2.1.1 上传资产数据**
请求参数说明：

|名称 |类型   |说明        |必填       |   
|------ |-----  |---  |----              |   
|transaction|json|DdnJS.evidence.createEvidence根据资产信息、一级密码、二级密码生成的交易数据|true

返回参数说明：

|名称|类型|说明|
|------|-----|----|
|success|boolean|是否成功获得response数据。|
|transactionId|string|交易id|

   
请求示例：   
```js   
(async () => {
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
  // var transaction = await ddn.dao.createTransfer('D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by','10000000000',secret)
  console.log(JSON.stringify({ transaction }));
})();
```   
将生成的交易数据以transaction为key，放入json，调用上链接口提交
```sh
curl --location --request POST 'http://localhost:8001/peer/transactions' \
--header 'nethash: 0ab796cd' \
--header 'version: 0' \
--header 'Content-Type: application/json' \
--data-raw '{"transaction":{"type":20,"nethash":"0ab796cd","amount":"0","fee":"10000000","recipientId":null,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","timestamp":93994165,"asset":{"evidence":{"ipid":"ipid3","title":"node.randomUsername()","description":" has been evidence.","hash":"f082022ee664008a1f15d62514811dfd","author":"Evanlai","size":"2448kb","type":"html","url":"dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html","tags":"world,cup,test","ext":"china","ext1":12345,"ext2":"2020-11-12T09:49:50.503Z"}},"signature":"26bd82046495f3dc4b2ed9d4452aa0f25be2a5a542fc52c5561a34c06dc8e1ebec03f6fcdbca115517d898c319c56cb448b35596e61bdd677adf9dfd4a87350f","id":"0ff3ba6dc2ceab676107f9a6a66c60d9ec17745a8cd53e3f25ff0da6829727da7d2fc6d470d43d85bd13923b7bdfe54bca6d4da97b0ac60ccd5b55b6a11b51b6"}}'
```
返回结果
```json
{
    "success": true,
    "transactionId": "0ff3ba6dc2ceab676107f9a6a66c60d9ec17745a8cd53e3f25ff0da6829727da7d2fc6d470d43d85bd13923b7bdfe54bca6d4da97b0ac60ccd5b55b6a11b51b6"
}
```

## **3 根据ipid获取资产详情**

接口地址： /api/evidences/ipid/:ipid<br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
ipid |string|资产id|true

返回参数说明：   

|名称 |类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |资产详情     |  

请求示例：   
```bash   
curl --location --request GET 'http://localhost:8001/api/evidences/ipid/ipid3'
```  

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "0ff3ba6dc2ceab676107f9a6a66c60d9ec17745a8cd53e3f25ff0da6829727da7d2fc6d470d43d85bd13923b7bdfe54bca6d4da97b0ac60ccd5b55b6a11b51b6",
        "transaction_type": 20,
        "timestamp": 93994165,
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
## **4 根据标题获取资产详情**

接口地址： /api/evidences/title/:title<br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
title |string|资产标题|true

返回参数说明：   

|名称 |类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |资产详情     |  

请求示例：   
```bash   
curl --location --request GET 'http://localhost:8001/api/evidences/title/node.randomUsername()'
```  

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "0ff3ba6dc2ceab676107f9a6a66c60d9ec17745a8cd53e3f25ff0da6829727da7d2fc6d470d43d85bd13923b7bdfe54bca6d4da97b0ac60ccd5b55b6a11b51b6",
        "transaction_type": 20,
        "timestamp": 93994165,
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
## **5 获取特定标题的资产列表**

接口地址： /api/evidences/title/:title/all<br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
title |string|资产标题|true
pagesize|string|每页条数|false
pageindex|string|页码|false

返回参数说明：   

|名称 |类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |资产详情     |  

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
                "transaction_id": "0ff3ba6dc2ceab676107f9a6a66c60d9ec17745a8cd53e3f25ff0da6829727da7d2fc6d470d43d85bd13923b7bdfe54bca6d4da97b0ac60ccd5b55b6a11b51b6",
                "transaction_type": 20,
                "timestamp": 93994165,
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
        "total": 1
    }
}
```
## **6 根据数据hash获取资产详情**

接口地址： /api/evidences/hash/:hash<br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
hash |string|数据哈希|true

返回参数说明：   

|名称 |类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |资产详情     |  

请求示例：   
```bash   
curl --location --request GET 'http://localhost:8001/api/evidences/hash/f082022ee664008a1f15d62514811dfd'
```  

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "0ff3ba6dc2ceab676107f9a6a66c60d9ec17745a8cd53e3f25ff0da6829727da7d2fc6d470d43d85bd13923b7bdfe54bca6d4da97b0ac60ccd5b55b6a11b51b6",
        "transaction_type": 20,
        "timestamp": 93994165,
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

## **7 获取某个作者的资产列表**

接口地址： /api/evidences/author/:author/all<br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
author |author|作者|true
pagesize|string|每页条数|false
pageindex|string|页码|false

返回参数说明：   

|名称 |类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |资产详情     |  

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
                "transaction_id": "0ff3ba6dc2ceab676107f9a6a66c60d9ec17745a8cd53e3f25ff0da6829727da7d2fc6d470d43d85bd13923b7bdfe54bca6d4da97b0ac60ccd5b55b6a11b51b6",
                "transaction_type": 20,
                "timestamp": 93994165,
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
        "total": 1
    }
}
```
## **8 根据数据交易id获取资产详情**

接口地址： /api/evidences/transaction/:trs_id <br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
trs_id |string|交易id|true

返回参数说明：   

|名称 |类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |资产详情     |  

请求示例：   
```bash   
curl --location --request GET 'http://localhost:8001/api/evidences/transaction/0ff3ba6dc2ceab676107f9a6a66c60d9ec17745a8cd53e3f25ff0da6829727da7d2fc6d470d43d85bd13923b7bdfe54bca6d4da97b0ac60ccd5b55b6a11b51b6'
```  

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "0ff3ba6dc2ceab676107f9a6a66c60d9ec17745a8cd53e3f25ff0da6829727da7d2fc6d470d43d85bd13923b7bdfe54bca6d4da97b0ac60ccd5b55b6a11b51b6",
        "transaction_type": 20,
        "timestamp": 93994165,
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
## **9 获取所有资产列表**

接口地址： /api/evidences/alll<br/>
请求方式：PUT<br/>
请求参数：<br/>

名称 | 类型 | 说明 |required
-|-|-|-
pagesize|string|每页条数|false
pageindex|string|页码|false

返回参数说明：   

|名称 |类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|result|object |资产详情     |  

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
                "transaction_id": "0ff3ba6dc2ceab676107f9a6a66c60d9ec17745a8cd53e3f25ff0da6829727da7d2fc6d470d43d85bd13923b7bdfe54bca6d4da97b0ac60ccd5b55b6a11b51b6",
                "transaction_type": 20,
                "timestamp": 93994165,
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
        "total": 1
    }
}
```

## 10 根据数据类型获取这一类存证列表
接口地址： /api/evidences/type/:type/all<br/>
请求方式：get<br/>
请求参数：<br/>

名称 | 类型 | 说明|required
-|-|-|-|
type |string|数据类型|true

返回参数说明：
|名称 |类型   |说明              |   
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
