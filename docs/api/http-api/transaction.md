---
order: 3
id: http-api-transaction
title: 交易
sidebar_label: Http api transaction
---


## **2.2 交易transactions**   
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
curl -k -X GET 'http://127.0.0.1:8001/api/transactions?recipientId=D2zThPTQZDNQqXbe5tikDQ24YyCQTCpbSC&orderBy=t_timestamp:desc&limit=3'   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"transactions": [{   
		"id": "17192581936339156329",   
		"height": "105951",   
		"blockId": "15051364118100195665",   
		"type": 0,   
		"timestamp": 4385190,   
		"senderPublicKey": "d39d6f26869067473d685da742339d1a9117257fe14b3cc7261e3f2ed5a339e3",   
		"senderId": "15745540293890213312",   
		"recipientId": "D2zThPTQZDNQqXbe5tikDQ24YyCQTCpbSC",   
		"amount": 10000000000,   
		"fee": 10000000,   
		"signature": "98d65df3109802c707eeed706e90a907f337bddab58cb4c1fbe6ec2179aa1c85ec2903cc0cf44bf0092926829aa5a0a6ec99458f65b6ebd11f0988772e58740e",   
		"signSignature": "",   
		"signatures": null,   
		"confirmations": "31802",   
		"asset": {   
			   
		}   
	},   
	{   
		"id": "7000452951235123088",   
		"height": "105473",   
		"blockId": "11877628176330539727",   
		"type": 0,   
		"timestamp": 4380147,   
		"senderPublicKey": "fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",   
		"senderId": "DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh",   
		"recipientId": "D2zThPTQZDNQqXbe5tikDQ24YyCQTCpbSC",   
		"amount": 10000000000,   
		"fee": 10000000,   
		"signature": "dc84044d4f6b4779eecc3a986b6507e458cc5964f601ebeb4d3b68a96129813f4940e14de950526dd685ca1328b6e477e6c57e95aeac45859a2ea62a587d0204",   
		"signSignature": "",   
		"signatures": null,   
		"confirmations": "32280",   
		"asset": {   
			   
		}   
	},   
	{   
		"id": "14093929199102906687",   
		"height": "105460",   
		"blockId": "2237504897174225512",   
		"type": 0,   
		"timestamp": 4380024,   
		"senderPublicKey": "fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",   
		"senderId": "DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh",   
		"recipientId": "D2zThPTQZDNQqXbe5tikDQ24YyCQTCpbSC",   
		"amount": 10000000000,   
		"fee": 10000000,   
		"signature": "73ceddc3cbe5103fbdd9eee12f7e4d9a125a3bcf2e7cd04282b7329719735aeb36936762f17d842fb14813fa8f857b8144040e5117dffcfc7e2ae88e36440a0f",   
		"signSignature": "",   
		"signatures": null,   
		"confirmations": "32293",   
		"asset": {   
			   
		}   
	}],   
	"count": 3   
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
curl -k -X GET 'http://127.0.0.1:8001/api/transactions/get?id=14093929199102906687'   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"transaction": {   
		"id": "14093929199102906687", // 交易id  
		"height": "105460",// 该交易所在区块高度   
		"blockId": "2237504897174225512",// 所在区块id   
		"type": 0,// 交易类型，0：普通DDN转账   
		"timestamp": 4380024,// 距离阿希创世块的timestamp   
		"senderPublicKey": "fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575", // 发送者公钥   
		"senderId": "DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh",// 发送者地址   
		"recipientId": "D2zThPTQZDNQqXbe5tikDQ24YyCQTCpbSC",// 接收者地址   
		"amount": 10000000000,// 交易额，100DDN   
		"fee": 10000000, // 手续费0.1DDN  
		"signature": "73ceddc3cbe5103fbdd9eee12f7e4d9a125a3bcf2e7cd04282b7329719735aeb36936762f17d842fb14813fa8f857b8144040e5117dffcfc7e2ae88e36440a0f",   
		"signSignature": "",   
		"signatures": null,   
		"confirmations": "34268",// 确认数   
		"asset": {   
		}   
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
curl -k -X GET http://127.0.0.1:8001/api/transactions/unconfirmed/get?id=7557072430673853692  // 正常情况，该未确认交易存在时间极短0~10秒   
```   
   
JSON返回示例：   
```js   
{
	"success": true,
	"transaction": {
		"type": 0,
		"amount": 10000,
		"senderPublicKey": "3ec1c9ec08c0512641deba37c0e95a0fe5fc3bdf58424009f594d7d6a4e28a2a",
		"requesterPublicKey": null,
		"timestamp": 5082322,
		"asset": {
			
		},
		"recipientId": "D2zThPTQZDNQqXbe5tikDQ24YyCQTCpbSC",
		"signature": "3a97f8d63509ef964bda3d816366b8e9e2d9b5d4604a660e7cbeefe210cb910f5de9a51bece06c32d010f55502c62f0f59b8224e1c141731ddfee27206a88d02",
		"id": "7557072430673853692",
		"fee": 10000000,
		"senderId": "15238461869262180695"
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
curl -k -H "Content-Type: application/json" -X PUT -d '{"secret":"unaware label emerge fancy concert long fiction report affair appear decide twenty","amount":1000000,"recipientId":"D2zThPTQZDNQqXbe5tikDQ24YyCQTCpbSC"}' 'http://127.0.0.1:8001/api/transactions'    
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"transactionId": "16670272591943275531"   
}   
```  