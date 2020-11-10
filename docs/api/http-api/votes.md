---
order: 7
id: http-api-vote
title: 6.投票
sidebar_label: Http api vote
---

# **投票**

## **1 根据地址获取我的投票列表**
接口地址：/api/votes  
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|address |string |Y    |投票人地址      |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|delegates|Array  |已投票的受托人详情数组      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/votes?address=DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe'   
```
   
JSON返回示例：   
```js   
{
    "success": true,
    "delegates": [
        {
            "username": "DDN_1",
            "address": "Dr5PY37BP1DYLxfAkMoieg2NvcgjY8Eo4",
            "publicKey": "94988eb3fd0f5085acac3d3c5ee13db380ceb98743e99e624d9a6ccdb6b777b7",
            "vote": 1999999979980000000,
            "missedblocks": 0,
            "producedblocks": 33,
            "delegates": [],
            "u_delegates": [],
            "multisignatures": [],
            "u_multisignatures": [],
            "rate": 1,
            "approval": "19995.66",
            "productivity": "100.00"
        },
        {
            "username": "DDN_37",
            "address": "DKAFh8rvU83iGWsBF96PVzGFeKctvxWgH8",
            "publicKey": "025724b6a9d32ba8a118e6776fa8ed2f12e1b6a7189513c2297991e959733094",
            "vote": 1000000000000000000,
            "missedblocks": 0,
            "producedblocks": 33,
            "delegates": [],
            "u_delegates": [],
            "multisignatures": [],
            "u_multisignatures": [],
            "rate": 2,
            "approval": "9997.83",
            "productivity": "100.00"
        },
        {
            "username": "DDN_93",
            "address": "D14LesCgYXhL1ag73R3GX9xj5pSX8fuRjH",
            "publicKey": "08ff2dd684c25e68655fd62a154120a9278baaa345e23e69bacd430219f08e60",
            "vote": 1000000000000000000,
            "missedblocks": 0,
            "producedblocks": 34,
            "delegates": [],
            "u_delegates": [],
            "multisignatures": [],
            "u_multisignatures": [],
            "rate": 3,
            "approval": "9997.83",
            "productivity": "100.00"
        },
       ...
    ]
}
```
   
## **2 获取受托人手续费设置**
接口地址：/api/votes/fee   
请求方式：get   
支持格式：无   
请求参数说明：无  

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|fee|integer  |手续费      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/votes/fee  
```
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"fee": 100000000  // 0.1 DDN   
}   
```
   
<!-- The follow is doing -->

## **3 给受托人投票**
接口地址：/api/votes  
请求方式：put   
支持格式：json   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|secret |string |Y    |DDN账户密钥       |   
|publicKey|string  |N|公钥      |    
|secondSecret|string|N|DDN账户二级密码，最小长度：1，最大长度：100|   
|delegates|Array|受托人公钥数组，每个公钥前需要加上+或者-号，代表增加/取消对其的投票|   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transaction|json  |投票交易详情      |    
   
   
请求示例：   
```bash   
curl -k -H "Content-Type: application/json" -X PUT -d '{"secret":"call scissors pupil water friend timber spend brand vote obey corn size","publicKey":"3ec1c9ec08c0512641deba37c0e95a0fe5fc3bdf58424009f594d7d6a4e28a2a","delegates":["+fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575"]}' 'http://127.0.0.1:8001/api/votes'     
```
   
JSON返回示例：   
```js   
 {
	"success": true,
	"transaction": {
		"type": 3,  //投票的交易类型为3
		"amount": 0,
		"senderPublicKey": "3ec1c9ec08c0512641deba37c0e95a0fe5fc3bdf58424009f594d7d6a4e28a2a",
		"requesterPublicKey": null,
		"timestamp": 5056064,
		"asset": {
			"vote": {
				"votes": ["+fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575"]
			}
		},
		"recipientId": null,
		"signature": "0bff58c7311fc59b3c8b3ffc236bbfece9850c334fb0c292ab087f78cf9a6c0f4d3e541c501887a2c2ec46294c777e8f7bf7dea9cb7c9a175fdec641bb684f08",
		"id": "5630629337798595849",
		"fee": 10000000,
		"senderId": "15238461869262180695"
	}
}  
```
