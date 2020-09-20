---
order: 3
id: http-api-transaction
title: 交易
sidebar_label: Http api transaction
---


## **2.2 交易**   
### **2.2.1 获取交易信息**   

接口地址：/api/transactions   
请求方式：get   
支持格式：urlencoded   
接口备注：如果请求不加参数则会获取全网所有交易   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|and|integer|N|取值范围0和1，默认值0。select查询时下面这些条件都是or的关系，and=1时select是and的关系  | 
|blockId |string |N    |区块id      |   
|limit |integer |N    |限制结果集个数，最小值：0,最大值：100   |   
|type|integer  |N      |交易类型,0:普通转账，1:设置二级密码，2:注册受托人，更多说明请查阅 [`交易类型`](../docs/asset-types)  |   
|orderBy|string  |N      |根据表中字段排序，senderPublicKey:desc  |   
|offset|integer  |N      |偏移量，最小值0  |   
|senderPublicKey|string|N|发送者公钥|   
|ownerPublicKey|string|N||   
 ownerAddress|string|N||   
|senderId|string|N|发送者地址|   
|recipientId|string|N|接收者地址,最小长度：1|   
|amount|integer|N|金额|   
|fee|integer|N|手续费|   
|aob|integer|N|是否aob，0：不是，1：是|   
|currency|string|N|资产名|   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transactions|列表  |多个交易详情json构成的列表      |    
|count|int|获取到的交易总个数|   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/transactions?recipientId=DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh&orderBy=t_timestamp:desc&limit=3'   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "transactions": [
        {
            "id": "63b3019d9d35e8dd336f732c3132a08d6d8476d391262463e3b7b6ab6cef28daba3fa4ca47f0a9ab103a4bebb4c815f4b6862f884e402ee0bb9235999561f251",
            "height": "7",
            "block_id": "23d5ae161f2ba8fcf3fdb4ebcb76c311b4c5e379c79199cccef3964cfa3145ecb44589c7dca8042206a234c4ffd14b8aec4f575f97eace7129b825583cf2824e",
            "type": 0,
            "timestamp": 89142766,
            "senderPublicKey": "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
            "senderId": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
            "recipientId": "DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh",
            "amount": "50000000000",
            "fee": "10000000",
            "signature": "b4c7c5a86df20b94afb7787c2fdc6153da12d4fa569b117dd537c47c7e11fb0ab2f77c665580796bd16e0f35de22174aa2b32afeb8a6f4e9aaf4274937a28804",
            "sign_signature": null,
            "signatures": null,
            "confirmations": 141,
            "args": null,
            "message": null,
            "asset": {}
        },
        {
            "id": "f5e06b1193295da852eca3a7d5d8ef5c7cb848aa3b5cbb3b21a06e1e9f3c457999946e9ca6064650953c47379abb06d7604367f1b611d2937810de7c612b8962",
            "height": "7",
            "block_id": "23d5ae161f2ba8fcf3fdb4ebcb76c311b4c5e379c79199cccef3964cfa3145ecb44589c7dca8042206a234c4ffd14b8aec4f575f97eace7129b825583cf2824e",
            "type": 0,
            "timestamp": 89142765,
            "senderPublicKey": "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
            "senderId": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
            "recipientId": "DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh",
            "amount": "50000000000",
            "fee": "10000000",
            "signature": "9a85b1a7043e801bd0e2d158041fb3301500f222e69d9f5242b4b6ce5d7b1b3008da111f7709fdb73c7651c44f17ce35c4b377c0f1e6dac5f859cf56394ffe04",
            "sign_signature": null,
            "signatures": null,
            "confirmations": 141,
            "args": null,
            "message": null,
            "asset": {}
        }
    ],
    "count": 2
} 
```   
### **2.2.2 根据交易id查看交易详情**   
接口地址：/api/transactions/get   
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|Id |string |Y    |交易id      |   
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transactions|json  |交易详情      |    
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/transactions/get?id=f5e06b1193295da852eca3a7d5d8ef5c7cb848aa3b5cbb3b21a06e1e9f3c457999946e9ca6064650953c47379abb06d7604367f1b611d2937810de7c612b8962'   
```   
   
JSON返回示例：   
```js  
{
    "success": true,
    "transaction": {
        "id": "f5e06b1193295da852eca3a7d5d8ef5c7cb848aa3b5cbb3b21a06e1e9f3c457999946e9ca6064650953c47379abb06d7604367f1b611d2937810de7c612b8962",
        "height": "7",
        "block_id": "23d5ae161f2ba8fcf3fdb4ebcb76c311b4c5e379c79199cccef3964cfa3145ecb44589c7dca8042206a234c4ffd14b8aec4f575f97eace7129b825583cf2824e",
        "type": 0, // 交易类型，0：普通DDN转账
        "timestamp": 89142765, // 距离创世块的timestamp
        "senderPublicKey": "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
        "senderId": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe", // 发送者地址  
        "recipientId": "DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh", // 接收者地址
        "amount": "50000000000",
        "fee": "10000000", // 手续费0.1DDN 
        "signature": "9a85b1a7043e801bd0e2d158041fb3301500f222e69d9f5242b4b6ce5d7b1b3008da111f7709fdb73c7651c44f17ce35c4b377c0f1e6dac5f859cf56394ffe04",
        "sign_signature": null,
        "signatures": null,
        "confirmations": 151,
        "args": null,
        "message": null,
        "asset": {}
    }
} 
```   
   
### **2.2.3 根据未确认交易id查看详情**   
接口地址：/api/transactions/unconfirmed/get   
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|id|string |Y    |未确认交易id      |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transaction|json  |未确认交易详情      |   
   
   
请求示例：   
```bash   
curl -k -X GET http://127.0.0.1:8001/api/transactions/unconfirmed/get?id=bc7e2c9ad4da35f21bedd16363ac3981d1b665395b99f54c433bd2365e16632116748c08c4344758c26cc67a5e6723e2e14401f5aa2b94739d9e7619bc5703d3  // 正常情况，该未确认交易存在时间极短0~10秒   
```   
   
JSON返回示例：   
```js   
{
	"success": true,
	"transaction": {
		"type": 0,
		"amount": 10000,
		"senderPublicKey": "ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695",
		"requesterPublicKey": null,
		"timestamp": 5082322,
		"asset": {
			
		},
		"recipientId": "DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh",
		"signature": "3a97f8d63509ef964bda3d816366b8e9e2d9b5d4604a660e7cbeefe210cb910f5de9a51bece06c32d010f55502c62f0f59b8224e1c141731ddfee27206a88d02",
		"id": "bc7e2c9ad4da35f21bedd16363ac3981d1b665395b99f54c433bd2365e16632116748c08c4344758c26cc67a5e6723e2e14401f5aa2b94739d9e7619bc5703d3",
		"fee": 10000000,
		"senderId": "DJWuENme5xJUJTjWiQEjfuLYRGtABfwhjz"
	}
}
```   
   
   
### **2.2.4 获取[全网所有]未确认的交易详情**   
接口地址：/api/transactions/unconfirmed   
请求方式：get   
支持格式：urlencoded   
接口说明：如果不加参数，则会获取全网所有未确认交易
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|senderPublicKey |string |N    |发送者公钥      |   
|address |string |N    |地址      |   
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transactions|Array  |未确认交易列表      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/transactions/unconfirmed'   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"transactions": []      //全网目前不存在未确认的交易   
}   
```   
   
### **2.2.5 创建交易并广播**   
接口地址：/api/transactions   
请求方式：PUT   
支持格式：json   
接口备注：接收者账户需在web端钱包登陆过   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|secret |string |Y    |DDN账户密钥       |   
|amount|integer|Y|金额，最小值：1，最大值：10000000000000000|   
|recipientId|string|Y|接收者地址,最小长度：1|   
|publicKey|string|N|发送者公钥|   
|secondSecret|string|N|发送者二级密码，最小长度1，最大长度：100|   
|multisigAccountPublicKey|string|N|多重签名账户公钥|   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transactionId|string  |交易id      |    
   
   
请求示例：   
```bash   
curl -k -H "Content-Type: application/json" -X PUT -d '{"secret": "grunt grain siege churn chicken phrase shell arrange fox recipe scan tube","amount":"1000000","recipientId":"DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh"}' 'http://127.0.0.1:8001/api/transactions'    
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"transactionId": "bc7e2c9ad4da35f21bedd16363ac3981d1b665395b99f54c433bd2365e16632116748c08c4344758c26cc67a5e6723e2e14401f5aa2b94739d9e7619bc5703d3"   
}   
```  