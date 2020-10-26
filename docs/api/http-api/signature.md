---
order: 8
id: http-api-second-password
title: 7.二次密码
sidebar_label: Http api second password
---

# **二级密码**

对应的就是签名（signature） 功能

## **1 设置二级密码**
接口地址：/api/signatures   
请求方式：put   
支持格式：json   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|secret |string |Y    |DDN账户密钥       |   
|publicKey|string  |N|公钥      |    
|secondSecret|string|Y|DDN账户二级密码，最小长度：1，最大长度：100|   
|multisigAccountPublicKey|string|N|多重签名账户公钥|   
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|transaction|json  |设置二级密码产生的交易详情      |    
   
   
请求示例：   
```bash   
curl -k -H "Content-Type: application/json" -X PUT -d '{"secret":"grunt grain siege churn chicken phrase shell arrange fox recipe scan tube","secondSecret":"excuse purpose cousin weasel false attitude dutch lunar enemy soul tongue promote"}' 'http://127.0.0.1:8001/api/signatures'    
```
   
JSON返回示例：   
```js  
{
    "success": true,
    "transaction": {
        "type": 1, // 交易类型为1
        "amount": "0",
        "nethash": "0ab796cd",
        "senderPublicKey": "ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695",
        "requester_public_key": null,
        "timestamp": 82927778,
        "asset": {
            "signature": {
                "publicKey": "860d7173d5d6fb61e243bc24ca9c275bde2cfd705ccfa8464362409c5b9c9636"
            }
        },
        "recipientId": null,
        "signature": "521552ffefca10eb9ee2cc34f50d6c897ecbc764da494a560f52ab5fdd0b628b41118f94e9e814160620fe16862894cc4be7b20ca36253a5c6909fdbb2fe5101",
        "id": "f1e39bb3a3973ff46e6a2d79af48b5f8ebc66943f054593f6183fb93f39de129ecfa89e320d4afd19a4557c3aa139593047f86cc73495ad883acaeef8b0093ff",
        "fee": "500000000",
        "senderId": "DJWuENme5xJUJTjWiQEjfuLYRGtABfwhjz"
    }
} 
```
   
## **2 获取二级密码设置手续费**
接口地址：/api/signatures/fee   
请求方式：get   
支持格式：无   
请求参数说明：无   
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|fee|integer  |费用      |    
   
   
请求示例：   
```bash   
curl -k http://127.0.0.1:8001/api/signatures/fee -X GET   
```
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"fee": "500000000"         //5 DDN   
}     
```
