---
order: 5
id: http-api-delegate
title: 受托人/投票
sidebar_label: Http api delegate
---


## **2.4 受托人delegates** 
   
### **2.4.1 获取受托人总个数**   
接口地址：/api/delegates/count   
请求方式：get   
支持格式：无   
请求参数说明：无   
   
返回参数说明：   
    
|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|count|integer   |受托人总个数      |    
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/delegates/count'   
```   
   
JSON返回示例：   
```js   
{    
	"success": true,    
	"count": 101    
}     
```   
   
### **2.4.2 根据受托人公钥查看哪些人为其投了票**   
接口地址：/api/delegates/voters   
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|publicKey |string |Y    |受托人公钥      |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|accounts|Array  |账户json串组成的数组      |    
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/delegates/voters?publicKey=0095b28997a33bb4f16b62523bcc1902179f2a7b5a3dd83980da5c1cbae854d6'   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "accounts": [{
        "username": "",
        "address": "DPesT3fMLkDVHvqLaXR3YzGkdw16vgKqPj",
        "publicKey": "70d0cbd2c3dccfaaa65acfa5689dbc3656ff0807cd1611e88d854fec07845ac1",
        "balance": 9977192780000000,
        "weight": 98.21503291966083
    }]
}  
```   
   
### **2.4.3 根据公钥或者用户名获取受托人详情**   
接口地址： /api/delegates/get   
请求方式：get   
支持格式：urlencoded   
接口备注：通过公钥或者用户名获取受托人信息   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|publickey |string |二选一    |受托人公钥      |   
|username  |string |二选一    |受托人用户名      |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|delegate|json  |受托人详情      |    
   
   
请求示例：   
```bash   
curl -k -X GET http://127.0.0.1:8001/api/delegates/get?publicKey=0095b28997a33bb4f16b62523bcc1902179f2a7b5a3dd83980da5c1cbae854d6   
curl -k -X GET http://127.0.0.1:8001/api/delegates/get?username=ddn_88   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "delegate": {
        "username": "ddn_88",
        "address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
        "publicKey": "0095b28997a33bb4f16b62523bcc1902179f2a7b5a3dd83980da5c1cbae854d6",
        "balance": 614801267317,
        "vote": 9977192780000000,
        "producedblocks": 1537,
        "missedblocks": 1604,
        "fees": 1267317,
        "rewards": 614800000000,
        "rate": 1,
        "approval": 98.22,
        "productivity": 48.93,
        "forged": "614801267317"
    }
} 
```   
   
### **2.4.4 获取受托人列表**   
接口地址：/api/delegates   
请求方式：get   
支持格式：urlencoded   
接口说明：如果不加参数则会返回全网受托人列表   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|address |string |N    |受托人地址      |   
|limit|int  |N       |限制返回结果数据集的个数       |   
|offset|integer  |N       |偏移量，最小值：0      |   
|orderBy|string  |N       |排序字段:排序规则，如:desc      |   
   
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|delegates|Array  |受托人详情列表      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/delegates?orderby=approval:desc&limit=2' //按照得票率降序排序，取出前2名   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "delegates": [{
        "username": "ddn_88",
        "address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
        "publicKey": "0095b28997a33bb4f16b62523bcc1902179f2a7b5a3dd83980da5c1cbae854d6",
        "balance": 614801267317,
        "vote": 9977192780000000,
        "producedblocks": 1537,
        "missedblocks": 1604,
        "fees": 1267317,
        "rewards": 614800000000,
        "rate": 1,
        "approval": 98.22,
        "productivity": 48.93,
        "forged": "614801267317"
    }, 
    
    {
        "username": "ddn_65",
        "address": "D2zThPTQZDNQqXbe5tikDQ24YyCQTCpbSC",
        "publicKey": "03afab2fff8e10592604db708c57b9d89b96cc5a14a80c805702b8ade8ae6f3b",
        "balance": 1573761742557,
        "vote": 9977192780000000,
        "producedblocks": 3934,
        "missedblocks": 1,
        "fees": 161742557,
        "rewards": 1573600000000,
        "rate": 2,
        "approval": 98.22,
        "productivity": 99.97,
        "forged": "1573761742557"
    }],
    "totalCount": 101
} 
```   
   
   
### **2.4.5 获取受托人设置的转账费**   
接口地址：/api/delegates/fee   
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|publicKey |string |Y    |受托人公钥      |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|fee|integer  |转账费      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/delegates/fee?publicKey=0095b28997a33bb4f16b62523bcc1902179f2a7b5a3dd83980da5c1cbae854d6'   
```   
   
JSON返回示例：   
```js   
{"success":true,"fee":10000000000}  //0.1 DDN   
```   
   
### **2.4.6 根据公钥查看其锻造情况**   
接口地址：/api/delegates/forging/getForgedByAccount   
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|generatorPublicKey |string |Y    |区块生成者公钥      |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|fees|integer  |收取的手续费      |    
|rewards|integer|已获得奖励|   
|forged|integer|锻造获得的总奖励|   
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/delegates/forging/getForgedByAccount?generatorPublicKey=0095b28997a33bb4f16b62523bcc1902179f2a7b5a3dd83980da5c1cbae854d6'   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"fees": 12589307065,   
	"rewards": 285600000000,   
	"forged": 298189307065   
}   
```   
   
### **2.4.7 注册受托人**   
接口地址：/api/delegates   
请求方式：put   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|secret |string |Y    |DDN账户密钥       |   
|publicKey|string  |N      |公钥|    
|secondSecret|string|N|DDN账户二级密码，最小长度：1，最大长度：100|   
|username|string|N|受托人名字|   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transaction|json  |注册受托人交易详情      |    
   
   
请求示例：   
```bash   
curl -k -H "Content-Type: application/json" -X PUT -d '{"secret":"unaware label emerge fancy concert long fiction report affair appear decide twenty","username":"delegate_0821"}' 'http://127.0.0.1:8001/api/delegates'   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"transaction": {   
		"type": 2,  //注册受托人的交易类型为2   
		"amount": 0,   
		"senderPublicKey": "3b64f1833e6328043e1f2fee31e638bdaa6dfff5c7eb9c8577a5cefcf11261f2",   
		"requesterPublicKey": null,   
		"timestamp": 4737615,   
		"asset": {   
			"delegate": {   
				"username": "delegate_0821",   
				"publicKey": "3b64f1833e6328043e1f2fee31e638bdaa6dfff5c7eb9c8577a5cefcf11261f2"   
			}   
		},   
		"recipientId": null,   
		"signature": "7f8417e8db5f58ddff887c86c789c26b32fd3f01083ef1e3c8d4e18ed16622bf766492d78518c6c7a07aada1c98b1efc36d40c8e09394989dbde229d8e3f8103",   
		"id": "16351320834453011577",   
		"fee": 10000000000,   
		"senderId": "250438937633388106"   
	}   
}   
```   
   
### **2.4.8 受托人开启锻造**   
接口地址：/api/delegates/forging/enable   
请求方式：post   
支持格式：urlencoded   // url必须是受托人所在服务器  
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|secret |string |Y    |DDN账户密钥       |   
|publicKey|string  |N      |公钥|    

   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|address|string  |受托人地址      |    
   
   
请求示例：   
```bash   
curl -k -H "Content-Type: application/json" -X POST -d '{"secret":"pact october wrap gain amazing spring biology allow skull aware laundry unhappy"}' 'http://localhost:8001/api/delegates/forging/enable'   
```   
   
JSON返回示例：   
```js   
{"success":true,"address":"DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh"}   
```      

### **2.4.9 受托人关闭锻造**   
接口地址：/api/delegates/forging/disable   
请求方式：post   
支持格式：urlencoded   // url必须是受托人所在服务器  
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|secret |string |Y    |DDN账户密钥       |   
|publicKey|string  |N      |公钥|    

   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|address|string  |受托人地址      |    
   
   
请求示例：   
```bash   
curl -k -H "Content-Type: application/json" -X POST -d '{"secret":"pact october wrap gain amazing spring biology allow skull aware laundry unhappy"}' 'http://localhost:8001/api/delegates/forging/disable'   
```   
   
JSON返回示例：   
```js   
{"success":true,"address":"DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh"}     
```     

### **2.4.10 受托人锻造状态查看**   
接口地址：/api/delegates/forging/status      
请求方式：get     
支持格式：urlencoded    
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|publicKey|string  |Y      |公钥|    

   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|enabled|string  |锻造是否开启      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/delegates/forging/status?publicKey=fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575'        
```   
   
JSON返回示例：   
```js   
{"success":true,"enabled":false}    
```     

## **2.4 投票Vote**

### **2.1.6 根据地址获取我的投票列表**   
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
   
### **2.1.7 获取受托人手续费设置**   
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

### **2.1.8 给受托人投票**   
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