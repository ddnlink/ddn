---
order: 8
id: http-api-multi-signature
title: 多重签名
sidebar_label: Http api multi signature
---


## **2.8 多重签名**   
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
curl -k -H "Content-Type: application/json" -X PUT -d '{"secret":"pact october wrap gain amazing spring biology allow skull aware laundry unhappy","min":2,"lifetime":1,"keysgroup":["+daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","+ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695"]}' 'http://127.0.0.1:8001/api/multisignatures'  
```   
   
JSON返回示例：   
```js  
{
    "success": true,
    "transactionId": "ee9f10aca5f7f610de8d52689c26194a6f807f86144b7761f4a4ee1fd9260a18f21cc06ff12983a0643413a65608177ec6005a9acc75c72b7978ec4ce66f1afe" //返回结果只是生成交易id，还需要其他人签名后该账户才能成功设置成多重签名账户
}  
```   
   
### **2.8.2 根据公钥获取挂起的多重签名交易详情**   
接口地址：/api/multisignatures/pending   
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|publicKey|string  |Y|公钥（签名组里的）      |    
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transactions|Array  |交易json组成的数组      |    
   
   
请求示例：   
```bash   
curl -k -X GET http://127.0.0.1:8001/api/multisignatures/pending?publicKey=ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "transactions": [
        {
            "min": 2,
            "lifetime": 1,
            "signed": false,
            "transaction": {
                "type": 4,
                "amount": "0",
                "nethash": "0ab796cd",
                "senderPublicKey": "d14d63c0e8055dad426ea616318825ead9993329c353f521faaf23d0d33e1fd3",
                "requester_public_key": null,
                "timestamp": 89084827,
                "asset": {
                    "multisignature": {
                        "min": 2,
                        "keysgroup": [
                            "+daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
                            "+ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695"
                        ],
                        "lifetime": 1
                    }
                },
                "recipientId": null,
                "signature": "04feef88931dbc09cfc6a8d72e3733f53fcd55063dd370bedba32a7137641de81153c72a8137489c615403deac670d7a130029311d4a9576585260a45668ae05",
                "id": "ee9f10aca5f7f610de8d52689c26194a6f807f86144b7761f4a4ee1fd9260a18f21cc06ff12983a0643413a65608177ec6005a9acc75c72b7978ec4ce66f1afe",
                "fee": "1500000000",
                "senderId": "DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh"
            }
        }
    ]
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
// 首先，公钥为 ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695 的用户进行签名
curl -k -H "Content-Type: application/json" -X POST -d '{"secret":"grunt grain siege churn chicken phrase shell arrange fox recipe scan tube","transactionId":"ee9f10aca5f7f610de8d52689c26194a6f807f86144b7761f4a4ee1fd9260a18f21cc06ff12983a0643413a65608177ec6005a9acc75c72b7978ec4ce66f1afe"}' 'http://127.0.0.1:8001/api/multisignatures/sign'      
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"transactionId": "ee9f10aca5f7f610de8d52689c26194a6f807f86144b7761f4a4ee1fd9260a18f21cc06ff12983a0643413a65608177ec6005a9acc75c72b7978ec4ce66f1afe"   
}   

// 此时再次获取pending   
curl -k -X GET http://127.0.0.1:8001/api/multisignatures/pending?publicKey=ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695   
{
    "success": true,
    "transactions": [
        {
            "min": 2,
            "lifetime": 1,
            "signed": true, // 改变为 true
            "transaction": {
                "type": 4,
                "amount": "0",
                "nethash": "0ab796cd",
                "senderPublicKey": "d14d63c0e8055dad426ea616318825ead9993329c353f521faaf23d0d33e1fd3",
                "requester_public_key": null,
                "timestamp": 89084827,
                "asset": {
                    "multisignature": {
                        "min": 2,
                        "keysgroup": [
                            "+daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
                            "+ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695"
                        ],
                        "lifetime": 1
                    }
                },
                "recipientId": null,
                "signature": "04feef88931dbc09cfc6a8d72e3733f53fcd55063dd370bedba32a7137641de81153c72a8137489c615403deac670d7a130029311d4a9576585260a45668ae05",
                "id": "ee9f10aca5f7f610de8d52689c26194a6f807f86144b7761f4a4ee1fd9260a18f21cc06ff12983a0643413a65608177ec6005a9acc75c72b7978ec4ce66f1afe",
                "fee": "1500000000",
                "senderId": "DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh",
                "signatures": [
                    "f7ca97fdfaf9667a3fa0ea5eade3f0c2d836b6a9e65af7bddf3dc64f1baf12e89bb56d29449b1b6132c4bd5a99e16227a6bedd532c913e25c6315aa332cd3f0e" // 新生成的签名
                ]
            }
        }
    ]
}

// 然后，公钥为 daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1 的账户对该注册交易进行签名   
curl -k -H "Content-Type: application/json" -X POST -d '{"secret":"enter boring shaft rent essence foil trick vibrant fabric quote indoor output","transactionId":"ee9f10aca5f7f610de8d52689c26194a6f807f86144b7761f4a4ee1fd9260a18f21cc06ff12983a0643413a65608177ec6005a9acc75c72b7978ec4ce66f1afe"}' 'http://127.0.0.1:8001/api/multisignatures/sign'   

// 获得结果
{"success":true,"transactionId":"ee9f10aca5f7f610de8d52689c26194a6f807f86144b7761f4a4ee1fd9260a18f21cc06ff12983a0643413a65608177ec6005a9acc75c72b7978ec4ce66f1afe"}   

// 此时再次获取pending，结果为空   
curl -k -X GET http://127.0.0.1:8001/api/multisignatures/pending?publicKey=ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695   
{"success":true,"transactions":[]}   

// 查看该注册交易详情（该交易已广播并写入blockchain）,此时该账户已成功注册成为多重签名账户   
curl -k -X GET http://127.0.0.1:8001/api/transactions/get?id=ee9f10aca5f7f610de8d52689c26194a6f807f86144b7761f4a4ee1fd9260a18f21cc06ff12983a0643413a65608177ec6005a9acc75c72b7978ec4ce66f1afe   
  
{
    "success": true,
    "transaction": {
        "id": "ee9f10aca5f7f610de8d52689c26194a6f807f86144b7761f4a4ee1fd9260a18f21cc06ff12983a0643413a65608177ec6005a9acc75c72b7978ec4ce66f1afe",
        "height": "311",
        "block_id": "25186ac66f99e144312d305795658c5c5df16c487e3bf22578a3f4ec467bb703e9681da4a37cd9bb579c48086cc8efd751eac7c281d32a9f72c3cf28febaac87",
        "type": 4,
        "timestamp": 89084827,
        "senderPublicKey": "d14d63c0e8055dad426ea616318825ead9993329c353f521faaf23d0d33e1fd3",
        "senderId": "DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh",
        "recipientId": null,
        "amount": "0",
        "fee": "1500000000",
        "signature": "04feef88931dbc09cfc6a8d72e3733f53fcd55063dd370bedba32a7137641de81153c72a8137489c615403deac670d7a130029311d4a9576585260a45668ae05",
        "sign_signature": null,
        "signatures": null,
        "confirmations": 8,
        "args": null,
        "message": null,
        "asset": {
            "multisignature": {
                "min": 2,
                "lifetime": 1,
                "keysgroup": [
                    "+daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
                    "+ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695"
                ]
            }
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
curl -k -X GET http://127.0.0.1:8001/api/multisignatures/accounts?publicKey=ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "accounts": [
        {
            "address": "DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh", //多重签名账户地址
            "balance": 121790000000, //多重签名账户余额
            "multisignatures": [
                "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
                "ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695"
            ],
            "multilifetime": 1,
            "multimin": 2, //最少签名个数
            "delegates": [],
            "u_delegates": [],
            "u_multisignatures": [ //多重签名账户公钥
                "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
                "ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695"
            ],
            "multisigaccounts": [ //签名者账户详情 
                {
                    "address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
                    "publicKey": "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
                    "balance": 999999776570000000,
                    "delegates": [],
                    "u_delegates": [],
                    "multisignatures": [],
                    "u_multisignatures": []
                },
                {
                    "address": "DJWuENme5xJUJTjWiQEjfuLYRGtABfwhjz",
                    "publicKey": "ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695",
                    "balance": 50090000000,
                    "delegates": [],
                    "u_delegates": [],
                    "multisignatures": [],
                    "u_multisignatures": []
                }
            ]
        }
    ]
}
``` 