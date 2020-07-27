---
order: 8
id: http-api-multi-signature
title: 多重签名
sidebar_label: Http api multi signature
---


## **2.8 多重签名multisignatures**   
### **2.8.1 设置普通账户为多重签名账户**   
接口地址：/api/multisignatures   
请求方式：put   
支持格式：json   
接口说明：返回结果只是生成交易id，还需要其他人签名后该账户才能成功设置成多重签名账户。注册多重签名账户后任意一笔转账都需要多人签名，签名最少个数为`min`的值（含交易发起人自身）   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|secret |string |Y    |DDN账户密钥       |   
|publicKey|string  |N|公钥      |    
|secondSecret|string|N|DDN账户二级密码，最小长度：1，最大长度：100|   
|min|integer|Y|多重签名交易账户的任意一笔转账都需要多人签名的最少个数，如果是注册多重签名账户操作，这该值不生效（此时需要所有人都签名）。最小值：2，最大值：16,该值需要小于keysgroup.length+1|   
|lifetime|integer|Y|多重签名交易的最大挂起时间，最小值：1，最大值：24，暂时不生效|   
|keysgroup|array|Y|其它签名人的公钥数组，每个公钥前需要加上+或者-号，代表增加/删除多重签名账户，数组最小长度：1，数组最大长度：10|   
   
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transactionId|string  |多重签名交易的id      |    
   
   
请求示例：   
```bash   
curl -k -H "Content-Type: application/json" -X PUT -d '{"secret":"pact october wrap gain amazing spring biology allow skull aware laundry unhappy","min":2,"lifetime":1,"keysgroup":["+ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695","+daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1"]}' 'http://127.0.0.1:8001/api/multisignatures'  
```   
   
JSON返回示例：   
```js  
{
    "success": true,
    "transactionId": "7bfd264cecd77b4522bd905c1b89a59484cb390f6e2353b062…25ce43da5effc6cc8a374c92ee5d7196f91f84a0f58925d12" //返回结果只是生成交易id，还需要其他人签名后该账户才能成功设置成多重签名账户
}  
```   
   
### **2.8.2 根据公钥获取挂起的多重签名交易详情**   
接口地址：/api/multisignatures/pending   
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|publicKey|string  |Y|公钥      |    
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transactions|Array  |交易json组成的数组      |    
   
   
请求示例：   
```bash   
curl -k -X GET http://127.0.0.1:8001/api/multisignatures/pending?publicKey=2cef5711e61bb5361c544077aa08aebc4d962a1d656571901c48d716382ad4fd   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"transactions": [{      //上一步中设置账户为多重签名交易的详情，transactionId: 17620378998277022323   
		"min": 2,   
		"lifetime": 1,   
		"signed": true,   
		"transaction": {   
			"type": 4,      //4代表注册多重签名账户   
			"amount": 0,   
			"senderPublicKey": "2cef5711e61bb5361c544077aa08aebc4d962a1d656571901c48d716382ad4fd",   
			"requesterPublicKey": null,   
			"timestamp": 4879978,   
			"asset": {   
				"multisignature": {   
					"min": 2,   
					"keysgroup": ["+eb48b9ab7c9a34a9b7cdf860265d65b31af774355cabf1b3a387d14a1925dc97",   
					"+d5d7aa157f866c47a2a1e09e2746286ed089fd90976b54fbfa930e87d11609cb"],   
					"lifetime": 1   
				}   
			},   
			"recipientId": null,   
			"signature": "a42feaccd9f2a4940fc0be1a1580e786b360f189db3154328f307988e75484293eae391f2f9eee489913cc6d15984eb1f5f5a0aa1bf78ea745d5c725f161af08",   
			"id": "17620378998277022323",   
			"fee": 1500000000,   
			"senderId": "3855903394839129841"   
		}   
	}]   
}   
   
```   
   
### **2.8.3 非交易发起人对交易进行多重签名**   
接口地址：/api/multisignatures/sign   
请求方式：post   
支持格式：json   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|secret |string |Y    |DDN账户密钥       |   
|secondSecret|string|N|DDN账户二级密码，最小长度：1，最大长度：100|   
|publicKey|string  |N|公钥      |    
|transactionId|string|Y|交易id|   
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transactionId|string  |多重签名交易id      |    
   
   
请求示例：   
```bash   
curl -k -H "Content-Type: application/json" -X POST -d '{"secret":"lemon carpet desk accuse clerk future oyster essay seminar force live dog","transactionId":"17620378998277022323"}' 'http://127.0.0.1:8001/api/multisignatures/sign'   //公钥为eb48b9ab7c9a34a9b7cdf860265d65b31af774355cabf1b3a387d14a1925dc97的用户进行签名   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"transactionId": "17620378998277022323"   
}   
// 此时再次获取pending   
curl -k -X GET http://127.0.0.1:8001/api/multisignatures/pending?publicKey=2cef5711e61bb5361c544077aa08aebc4d962a1d656571901c48d716382ad4fd   
{   
	"success": true,   
	"transactions": [{   
		"min": 2,   
		"lifetime": 1,   
		"signed": true,   
		"transaction": {   
			"type": 4,   
			"amount": 0,   
			"senderPublicKey": "2cef5711e61bb5361c544077aa08aebc4d962a1d656571901c48d716382ad4fd",   
			"requesterPublicKey": null,   
			"timestamp": 4879978,   
			"asset": {   
				"multisignature": {   
					"min": 2,   
					"keysgroup": ["+eb48b9ab7c9a34a9b7cdf860265d65b31af774355cabf1b3a387d14a1925dc97",   
					"+d5d7aa157f866c47a2a1e09e2746286ed089fd90976b54fbfa930e87d11609cb"],   
					"lifetime": 1   
				}   
			},   
			"recipientId": null,   
			"signature": "a42feaccd9f2a4940fc0be1a1580e786b360f189db3154328f307988e75484293eae391f2f9eee489913cc6d15984eb1f5f5a0aa1bf78ea745d5c725f161af08",   
			"id": "17620378998277022323",   
			"fee": 1500000000,   
			"senderId": "3855903394839129841",   
			"signatures": ["b38a161264db2a23e353d3fbc4983562f6343d5ee693144543ca54e2bc67c0f73d1c761b7bfa38b2bb101ac2ab0797b674b1a9964ccd400aaa310746c3494d03"]      //新生成的多重签名   
		}   
	}]   
}   
   
// 公钥为d5d7aa157f866c47a2a1e09e2746286ed089fd90976b54fbfa930e87d11609cb的账户对该注册交易进行签名   
curl -k -H "Content-Type: application/json" -X POST -d '{"secret":"chalk among elbow piece badge try van round quality position simple teach","transactionId":"17620378998277022323"}' 'http://127.0.0.1:8001/api/multisignatures/sign'   
{"success":true,"transactionId":"17620378998277022323"}   
// 此时再次获取pending,结果为空   
curl -k -X GET http://127.0.0.1:8001/api/multisignatures/pending?publicKey=2cef5711e61bb5361c544077aa08aebc4d962a1d656571901c48d716382ad4fd   
{"success":true,"transactions":[]}   
// 查看该注册交易详情（该交易已广播并写入blockchain）,此时该账户已成功注册成为多重签名账户   
curl -k -X GET http://127.0.0.1:8001/api/transactions/get?id=17620378998277022323   
{   
	"success": true,   
	"transaction": {   
		"id": "17620378998277022323",   //注册账户为多重签名用户的交易id   
		"height": "157013",   
		"blockId": "4680888982781013372",   
		"type": 4,   
		"timestamp": 4879978,   
		"senderPublicKey": "2cef5711e61bb5361c544077aa08aebc4d962a1d656571901c48d716382ad4fd",   
		"senderId": "3855903394839129841",   
		"recipientId": "",   
		"amount": 0,   
		"fee": 1500000000,   
		"signature": "a42feaccd9f2a4940fc0be1a1580e786b360f189db3154328f307988e75484293eae391f2f9eee489913cc6d15984eb1f5f5a0aa1bf78ea745d5c725f161af08",   
		"signSignature": "",   
		"signatures": null,   
		"confirmations": "26",   
		"asset": {   
			   
		}   
	}   
}   
   
```   
   
### **2.8.4 获取多重签名账户信息**   
接口地址：/api/multisignatures/accounts   
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|publicKey |string |Y    |多重签名参与者之一的公钥       |   
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|accounts|Array  |多重签名账户详情      |    
   
   
请求示例：   
```bash   
curl -k -X GET http://127.0.0.1:8001/api/multisignatures/accounts?publicKey=eb48b9ab7c9a34a9b7cdf860265d65b31af774355cabf1b3a387d14a1925dc97   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"accounts": [{   
		"address": "3855903394839129841",       //多重签名账户地址   
		"balance": 18500000000,     //多重签名账户余额   
		"multisignatures": ["eb48b9ab7c9a34a9b7cdf860265d65b31af774355cabf1b3a387d14a1925dc97",   
		"d5d7aa157f866c47a2a1e09e2746286ed089fd90976b54fbfa930e87d11609cb"],    //多重签名账户公钥   
		"multimin": 2,  //最少签名个数   
		"multilifetime": 1,   
		"multisigaccounts": [{          //签名者账户详情   
			"address": "13542769708474548631",   
			"publicKey": "eb48b9ab7c9a34a9b7cdf860265d65b31af774355cabf1b3a387d14a1925dc97",   
			"balance": 0   
		},   
		{   
			"address": "4100816257782486230",   
			"publicKey": "d5d7aa157f866c47a2a1e09e2746286ed089fd90976b54fbfa930e87d11609cb",   
			"balance": 0   
		}]   
	}]   
}   
``` 