---
order: 5
id: http-api-delegate
title: 受托人/投票
sidebar_label: Http api delegate
---


## **2.4 受托人** 
   
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
curl -k -X GET 'http://127.0.0.1:8001/api/delegates/voters?publicKey=d2155304db26fc893c4ba41ae230bd8bb4241bb8e3fccb4d234594e7c70496d2'   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "accounts": [
        {
            "address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
            "balance": 999999801160000000,
            "publicKey": "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
            "username": null,
            "weight": "0.00999999650160052826"
        }
    ]
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
curl -k -X GET 'http://127.0.0.1:8001/api/delegates/get?publicKey=0d820478d627db1fd3c4d832b27e3094f25a4e93dd33e759fc2f5adf1a6f33c8'   
curl -k -X GET 'http://127.0.0.1:8001/api/delegates/get?username=DDN_88'   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "delegate": {
        "username": "DDN_88",
        "address": "DJuXPWRQSbWTtNVXhyAUB3e8NsWyK5pTAJ",
        "publicKey": "0d820478d627db1fd3c4d832b27e3094f25a4e93dd33e759fc2f5adf1a6f33c8",
        "vote": 1000000000000000000,
        "missedblocks": 0,
        "producedblocks": 4,
        "fees": 12752474,
        "rewards": 800000000,
        "balance": 812752474,
        "rate": 6,
        "approval": 100,
        "productivity": 100,
        "forged": "812752474"
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
    "delegates": [
        {
            "username": "DDN_37",
            "address": "DKAFh8rvU83iGWsBF96PVzGFeKctvxWgH8",
            "publicKey": "025724b6a9d32ba8a118e6776fa8ed2f12e1b6a7189513c2297991e959733094",
            "vote": 1000000000000000000,
            "missedblocks": 0,
            "producedblocks": 4,
            "fees": 12752543,
            "rewards": 800000000,
            "balance": 812752543,
            "rate": 1,
            "approval": 100,
            "productivity": 100,
            "forged": "812752543"
        },
        {
            "username": "DDN_93",
            "address": "D14LesCgYXhL1ag73R3GX9xj5pSX8fuRjH",
            "publicKey": "08ff2dd684c25e68655fd62a154120a9278baaa345e23e69bacd430219f08e60",
            "vote": 1000000000000000000,
            "missedblocks": 0,
            "producedblocks": 4,
            "fees": 12752474,
            "rewards": 800000000,
            "balance": 812752474,
            "rate": 2,
            "approval": 100,
            "productivity": 100,
            "forged": "812752474"
        }
    ],
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
curl -k -X GET 'http://127.0.0.1:8001/api/delegates/fee?publicKey=0d820478d627db1fd3c4d832b27e3094f25a4e93dd33e759fc2f5adf1a6f33c8'   
```   
   
JSON返回示例：   
```js   
{"success":true,"fee":"10000000000"}  //0.1 DDN   
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
curl -k -X GET 'http://127.0.0.1:8001/api/delegates/forging/getForgedByAccount?generatorPublicKey=0d820478d627db1fd3c4d832b27e3094f25a4e93dd33e759fc2f5adf1a6f33c8'   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "fees": "12752474",
    "rewards": "1200000000",
    "forged": "1212752474"
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
curl -k -H "Content-Type: application/json" -X PUT -d '{"secret":"attract motion canal change horror dose waste hub team horse half tiny","username":"delegate_test"}' 'http://127.0.0.1:8001/api/delegates'   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "transaction": {
        "type": 2,
        "amount": "0",
        "nethash": "0ab796cd",
        "senderPublicKey": "9a9058fba208ab7fb3d9b2c521b1c6dabf38583fc18f1779d61d2266487cf744",
        "requester_public_key": null,
        "timestamp": 89234984,
        "asset": {
            "delegate": {
                "username": "delegate_test",
                "publicKey": "9a9058fba208ab7fb3d9b2c521b1c6dabf38583fc18f1779d61d2266487cf744"
            }
        },
        "recipientId": null,
        "signature": "01aed2938c3cb3e6cdbf592d90ce36f8568d8dd514627dd521b15de6e4510cfb51d974838313711669a49091d288e9beba09189a2bbfc1da36f4760bf6f0ff08",
        "id": "181ddb912bb991c954add535decadebfc039f4c1723ef7d03b80f389036308fec82d0ac830ef9a1a1bc35e5a3a0ca39ae199d5145cdc3a7b3b2f327f70e3f948",
        "fee": "10000000000",
        "senderId": "D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by"
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
curl -k -H "Content-Type: application/json" -X POST -d '{"secret":"attract motion canal change horror dose waste hub team horse half tiny"}' 'http://localhost:8001/api/delegates/forging/enable'   
```   
   
JSON返回示例：   
```js   
{"success":true,"address":"D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by"}   
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
curl -k -H "Content-Type: application/json" -X POST -d '{"secret":"attract motion canal change horror dose waste hub team horse half tiny"}' 'http://localhost:8001/api/delegates/forging/disable'   
```   
   
JSON返回示例：   
```js   
{"success":true,"address":"D61gSRn1ko2NiEYLutPxnBDXU4MBJ2b4by"}     
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
curl -k -X GET 'http://127.0.0.1:8001/api/delegates/forging/status?publicKey=9a9058fba208ab7fb3d9b2c521b1c6dabf38583fc18f1779d61d2266487cf744'        
```   
   
JSON返回示例：   
```js   
{"success":true,"enabled":false}    
```     