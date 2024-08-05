---
order: 2
id: evidence-api
title: 1.数字存证 API
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

| 名称        | 类型 | 说明                                                                        | 必填 |
| ----------- | ---- | --------------------------------------------------------------------------- | ---- |
| transaction | json | DdnJS.evidence.createEvidence根据资产信息、一级密码、二级密码生成的交易数据 | true |

返回参数说明：

| 名称          | 类型    | 说明                       |
| ------------- | ------- | -------------------------- |
| success       | boolean | 是否成功获得response数据。 |
| transactionId | string  | 交易id                     |


请求示例：
```js
(async () => {
  const evidencee = {
    sourceAddress: '资源地址', // string 
    title: '标题', // string length: 128
    description: '描述', // string  length: 512
    hash: 'md5Values', // string length:128
    shortHash: 'md5SliceValues', // string length:64
    author: '作者', // string tring length:20
    size: '大小', // string tring length:64
    type: '类型', // string tring length:32
    time: "", // string tring length:64
    tags: 'evidence', // string tring length:128
    metadata: '{userId:11,photourl:"xxx"}' // string tring length:1024
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
curl --location --request POST 'http://127.0.0.1:8001/peer/transactions' \
--header 'nethash: 0ab796cd' \
--header 'version: 0' \
--header 'Content-Type: application/json' \
--data-raw '{"transaction":{"type":20,"nethash":"0ab796cd","amount":"0","fee":"10000000","recipientId":null,"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","timestamp":113220399,"asset":{"evidence":{"sourceAddress":"资源地址","title":"标题","description":"描述","hash":"md5Values","shortHash":"md5SliceValues","author":"作者","size":"大小","type":"类型","time":"","tags":"evidence","metadata":"{userId:11,photourl:\"xxx\"}"}},"signature":"39e1c751fec7336ef32905d4579e5e95e9d7df51a72e348e6742a4440d338df24445041399273281f2990229af29b2511f65a4899e5872c0b6137f57d44e9d06","id":"774c908cb1d18ac128acae27c1d0c1f2331e0b0afc58cba584b4c816f7e013ee8c8d857db6b039df5eee063bf10c12b09b77c4a31c03b6c7fe1549dfbacf5e61"}}'
```
返回结果
```json
{
    "success": true,
    "transactionId": "16d22ebb8135ccd45cbe2242c7fac649f8d876be8f66ba9331cdf338c58b3b6946149de41a5430bf65b7b45d315d9430498dd055f098b45c8404c4f2a187b826"
}
```

## **3 根据shortHash获取资产详情**

接口地址： /api/evidences/shortHash/:shortHash<br/>
请求方式：GET<br/>
请求参数：<br/>

| 名称      | 类型   | 说明 | required |
| --------- | ------ | ---- | -------- |
| shortHash | string | 哈希 | true     |

返回参数说明：

| 名称    | 类型    | 说明         |
| ------- | ------- | ------------ |
| success | boolean | 请求是否成功 |
| result  | object  | 资产详情     |

请求示例：
```bash
curl --location --request GET 'http://127.0.0.1:8001/api/evidences/shortHash/hmd5SliceValues'
```

JSON返回示例：

```js
{
    "transaction_id": "774c908cb1d18ac128acae27c1d0c1f2331e0b0afc58cba584b4c816f7e013ee8c8d857db6b039df5eee063bf10c12b09b77c4a31c03b6c7fe1549dfbacf5e61",
    "transaction_type": 20,
    "timestamp": 113220399,
    "shortHash": "md5SliceValues",
    "title": "标题",
    "description": "描述",
    "hash": "md5Values",
    "tags": "evidence",
    "author": "作者",
    "sourceAddress": "资源地址",
    "type": "类型",
    "size": "大小",
    "metadata": "{userId:11,photourl:\"xxx\"}",
    "time": ""
}
```
<!-- ## **4 根据标题获取资产详情**

接口地址： /api/evidences/title/:title<br/>
请求方式：PUT<br/>
请求参数：<br/>

| 名称  | 类型   | 说明     | required |
| ----- | ------ | -------- | -------- |
| title | string | 资产标题 | true     |

返回参数说明：

| 名称    | 类型    | 说明         |
| ------- | ------- | ------------ |
| success | boolean | 请求是否成功 |
| result  | object  | 资产详情     |

请求示例：
```bash
curl --location --request GET 'http://127.0.0.1:8001/api/evidences/title/标题'
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

| 名称      | 类型   | 说明     | required |
| --------- | ------ | -------- | -------- |
| title     | string | 资产标题 | true     |
| pagesize  | string | 每页条数 | false    |
| pageindex | string | 页码     | false    |

返回参数说明：

| 名称    | 类型    | 说明         |
| ------- | ------- | ------------ |
| success | boolean | 请求是否成功 |
| result  | object  | 资产详情     |

请求示例：
```bash
curl --location --request GET 'http://127.0.0.1:8001/api/evidences/title/node.randomUsername()/all'
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
``` -->
## **4 根据数据hash获取资产详情**

接口地址： /api/evidences/hash/:hash<br/>
请求方式：PUT<br/>
请求参数：<br/>

| 名称 | 类型   | 说明     | required |
| ---- | ------ | -------- | -------- |
| hash | string | 数据哈希 | true     |

返回参数说明：

| 名称    | 类型    | 说明         |
| ------- | ------- | ------------ |
| success | boolean | 请求是否成功 |
| result  | object  | 资产详情     |

请求示例：
```bash
curl --location --request GET 'http://127.0.0.1:8001/api/evidences/hash/md5Values'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "transaction_id": "774c908cb1d18ac128acae27c1d0c1f2331e0b0afc58cba584b4c816f7e013ee8c8d857db6b039df5eee063bf10c12b09b77c4a31c03b6c7fe1549dfbacf5e61",
        "transaction_type": 20,
        "timestamp": 113220399,
        "shortHash": "md5SliceValues",
        "title": "标题",
        "description": "描述",
        "hash": "md5Values",
        "tags": "evidence",
        "author": "作者",
        "sourceAddress": "资源地址",
        "type": "类型",
        "size": "大小",
        "metadata": "{userId:11,photourl:\"xxx\"}",
        "time": ""
    }
}
```

<!-- ## **7 获取某个作者的资产列表**

接口地址： /api/evidences/author/:author/all<br/>
请求方式：PUT<br/>
请求参数：<br/>

| 名称      | 类型   | 说明     | required |
| --------- | ------ | -------- | -------- |
| author    | author | 作者     | true     |
| pagesize  | string | 每页条数 | false    |
| pageindex | string | 页码     | false    |

返回参数说明：

| 名称    | 类型    | 说明         |
| ------- | ------- | ------------ |
| success | boolean | 请求是否成功 |
| result  | object  | 资产详情     |

请求示例：
```bash
curl --location --request GET 'http://127.0.0.1:8001/api/evidences/author/Evanlai/all'
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
``` -->
## **5 根据数据交易id获取资产详情**

接口地址： /api/evidences/transaction/:trs_id <br/>
请求方式：PUT<br/>
请求参数：<br/>

| 名称   | 类型   | 说明   | required |
| ------ | ------ | ------ | -------- |
| trs_id | string | 交易id | true     |

返回参数说明：

| 名称    | 类型    | 说明         |
| ------- | ------- | ------------ |
| success | boolean | 请求是否成功 |
| result  | object  | 资产详情     |

请求示例：
```bash
curl --location --request GET 'http://127.0.0.1:8001/api/evidences/transaction/774c908cb1d18ac128acae27c1d0c1f2331e0b0afc58cba584b4c816f7e013ee8c8d857db6b039df5eee063bf10c12b09b77c4a31c03b6c7fe1549dfbacf5e61'
```

JSON返回示例：

```js
{
    "transaction_id": "774c908cb1d18ac128acae27c1d0c1f2331e0b0afc58cba584b4c816f7e013ee8c8d857db6b039df5eee063bf10c12b09b77c4a31c03b6c7fe1549dfbacf5e61",
    "transaction_type": 20,
    "timestamp": 113220399,
    "shortHash": "md5SliceValues",
    "title": "标题",
    "description": "描述",
    "hash": "md5Values",
    "tags": "evidence",
    "author": "作者",
    "sourceAddress": "资源地址",
    "type": "类型",
    "size": "大小",
    "metadata": "{userId:11,photourl:\"xxx\"}",
    "time": ""
}
```
## **6 获取所有资产列表**

接口地址： /api/evidences/alll<br/>
请求方式：PUT<br/>
请求参数：<br/>

| 名称      | 类型   | 说明     | required |
| --------- | ------ | -------- | -------- |
| pagesize  | string | 每页条数 | false    |
| pageindex | string | 页码     | false    |

返回参数说明：

| 名称    | 类型    | 说明         |
| ------- | ------- | ------------ |
| success | boolean | 请求是否成功 |
| result  | object  | 资产详情     |

请求示例：
```bash
curl --location --request GET 'http://127.0.0.1:8001/api/evidences/all'
```

JSON返回示例：

```js
{
    "success": true,
    "result": {
        "rows": [
            {
                "transaction_id": "ed05a076f26e67143739b3671a1b18f6f33859f443772f0e940566ab9c5ea37b80ec9cfcf36a3e2585c5531c93a5cf8ac5175bbe0aac5e2b4d92625af1ca3a06",
                "transaction_type": 20,
                "timestamp": 113220073,
                "shortHash": "md5SliceValue",
                "title": "ddn online evidence",
                "description": "description",
                "hash": "md5Value",
                "tags": "evidence",
                "author": "Online",
                "sourceAddress": "资源地址",
                "type": "text",
                "size": "12KB",
                "metadata": "{userId:11,photourl:\"xxx\"}",
                "time": "",
                "timex": "1626962107472"
            },
            {
                "transaction_id": "774c908cb1d18ac128acae27c1d0c1f2331e0b0afc58cba584b4c816f7e013ee8c8d857db6b039df5eee063bf10c12b09b77c4a31c03b6c7fe1549dfbacf5e61",
                "transaction_type": 20,
                "timestamp": 113220399,
                "shortHash": "md5SliceValues",
                "title": "标题",
                "description": "描述",
                "hash": "md5Values",
                "tags": "evidence",
                "author": "作者",
                "sourceAddress": "资源地址",
                "type": "类型",
                "size": "大小",
                "metadata": "{userId:11,photourl:\"xxx\"}",
                "time": ""
            }
        ],
        "total": 2
    }
}
```

## 7 根据数据类型获取这一类存证列表
接口地址： /api/evidences/type/:type/all<br/>
请求方式：get<br/>
请求参数：<br/>

| 名称 | 类型   | 说明     | required |
| ---- | ------ | -------- | -------- |
| type | string | 数据类型 | true     |

返回参数说明：
| 名称    | 类型    | 说明         |
| ------- | ------- | ------------ |
| success | boolean | 请求是否成功 |
| result  | object  | 返回结果     |
| rows    | array   | 返回结果列表 |
| total   | number  | 总条数       |


请求示例：
```bash
curl --location --request GET 'http://127.0.0.1:8001/api/evidences/type/text/all'
```

JSON返回示例：

```js
"success": true,
"result": {
    "rows": [
        {
            "transaction_id": "ed05a076f26e67143739b3671a1b18f6f33859f443772f0e940566ab9c5ea37b80ec9cfcf36a3e2585c5531c93a5cf8ac5175bbe0aac5e2b4d92625af1ca3a06",
            "transaction_type": 20,
            "timestamp": 113220073,
            "shortHash": "md5SliceValue",
            "title": "ddn online evidence",
            "description": "description",
            "hash": "md5Value",
            "tags": "evidence",
            "author": "Online",
            "sourceAddress": "资源地址",
            "type": "text",
            "size": "12KB",
            "metadata": "{userId:11,photourl:\"xxx\"}",
            "time": "",
            "timex": "1626962107472"
        }
    ],
    "total": 1
}
}
```
