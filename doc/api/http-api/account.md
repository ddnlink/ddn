---
order: 2
id: http-api-account
title: 账户
sidebar_label: Http api account
---

## **2.1 账户accounts**   
   
### **2.1.1 登录**   
#### **2.1.1.1 本地加密后再登陆（推荐使用）**   
接口地址：/api/accounts/open2/   
请求方式：post   
支持格式：json   
接口备注：根据用户密码在本地客户端用js代码生成公钥    

请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|publicKey |string |Y    |DDN账户公钥      |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否登陆成功      |    
|account|json   |账户信息          |    
请求示例：   
  
```js
var secret = 'DDN账户密钥'  //在浏览器内存中保留
var DdnJS = require('@ddn/node-sdk');  //ddn-js具体安装方法见附录 
var publicKey = DdnJS.crypto.getKeys(secret).publicKey;  //根据密码生成公钥 

// 将上面生成的数据通过post提交到DDN server   
curl -X POST -H "Content-Type: application/json" -k -d '{"publicKey":"bd1e78c5a10fbf1eca36b28bbb8ea85f320967659cbf1f7ff1603d0a368867b9"}' http://127.0.0.1:8001/api/accounts/open2/   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "account": {
        "address": "DFnE3t47A6h56w32iBritp1jBuYTGB9Siy", //DDN地址 
        "unconfirmed_balance": 0, //未确认和已确认的余额之和，该值大于等于balance 
        "balance": 0, //余额
        "publicKey": "bd1e78c5a10fbf1eca36b28bbb8ea85f320967659cbf1f7ff1603d0a368867b9", //公钥
        "unconfirmed_signature": "",
        "second_signature": "",
        "second_public_key": "",
        "multisignatures": "",
        "u_multisignatures": "",
        "lock_height": 0
    },
    "latestBlock": {
        "height": "4129", //当前节点最新区块高度
        "timestamp": 82911570
    },
    "version": "3.7.5" //当前节点版本号
} 
```   
   
##### **2.1.1.2 本地不加密直接登陆**   
接口地址：/api/accounts/open/   
请求方式：post   
支持格式：json   
接口备注：将密码传入到server端，根据生成的地址去查询账户信息。不推荐在公网坏境使用！ 
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|secret |string |Y    |DDN账户密钥       |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否登陆成功      |    
|account|json   |账户信息          |    
   
请求示例：   
```bash   
curl -X POST -H "Content-Type: application/json" -k -d '{"secret":"excuse purpose cousin weasel false attitude dutch lunar enemy soul tongue promote"}' http://127.0.0.1:8001/api/accounts/open/   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "account": {
        "address": "DQJXarv8yZgyy6NMfTQSKDyE9W7BBThuCq",
        "unconfirmed_balance": 0,
        "balance": 0,
        "publicKey": "845e2330b1aa660289bd3d7611d3f78eb0937607d4432a525f316ae80b0ed579",
        "unconfirmed_signature": "",
        "second_signature": "",
        "second_public_key": "",
        "multisignatures": "",
        "u_multisignatures": "",
        "lock_height": 0
    }
}  
```   
### **2.1.2 根据地址获取账户信息**   
接口地址：/api/accounts   
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|address |string |Y    |用户地址,最小长度：1      |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|account|json  |账户信息      |    
|latestBlock|json  |该节点最新的区块信息      |    
|version|json  |版本相关信息      |    
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/accounts?address=DQJXarv8yZgyy6NMfTQSKDyE9W7BBThuCq'   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "account": {
        "address": "DQJXarv8yZgyy6NMfTQSKDyE9W7BBThuCq",
        "unconfirmed_balance": 0,
        "balance": 0,
        "publicKey": "",
        "username": "",
        "unconfirmed_signature": "",
        "second_signature": "",
        "second_public_key": "",
        "multisignatures": "",
        "u_multisignatures": "",
        "lock_height": "0"
    },
    "latestBlock": {
        "height": "4330",
        "timestamp": 82913580
    },
    "version": "3.7.5"
}  
```   
### **2.1.3 获取账户余额**   
接口地址：/api/accounts/getBalance   
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|address |string |Y    |用户地址,最小长度：1      |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|balance|integer  |余额      |    
|unconfirmedBalance|integer|未确认和已确认的余额之和，该值大于等于balance|   
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/accounts/getBalance?address=DQ9vRnmaZACJ43vnhZyZmCX6dfksvMaqFR'   
```   
   
JSON返回示例：   
```js   
{
	"success": true,
	"balance": 0,
	"unconfirmedBalance": 0
}  
```   
   
### **2.1.4 根据地址获取账户公钥**   
接口地址：/api/accounts/getPublickey   
请求方式：get   
支持格式：urlencoded   
请求参数说明：只有给别人转过账，系统才会存取公钥，否则是查不到的。

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|address |string |Y    |用户地址,最小长度：1      |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|publicKey|string  |公钥      |    
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/accounts/getPublickey?address=DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe'   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"publicKey": "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1"   
}   
```   
   

### **2.1.5 生成公钥**   
接口地址：/api/accounts/generatePublickey   
请求方式：post   
支持格式：json   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|secret |string |Y    |DDN账户密钥      |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|publicKey|string  |公钥      |    
   
请求示例：   
```bash   
curl -k -H "Content-Type: application/json" -X POST -d '{"secret":"this is a key expand music basket purse later educate follow ride"}' 'http://127.0.0.1:8001/api/accounts/generatePublickey'   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"publicKey": "85868d2e6afd76034cd5faa6bc53def2facd6e47afac51d6429df78ce41c3b57"   
}   
```   

### **2.1.6 生成新账户**   
接口地址：/api/accounts/new   
请求方式：get   
支持格式：无   
请求参数：无   

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|secret|string  |密码      |    
|publicKey|string  |公钥      |    
|privateKey|string  |私钥      |    
|address|string  |地址      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/accounts/new'   
```   
   
JSON返回示例：   
```js  
{
	"success": true,
    "secret": "grunt grain siege churn chicken phrase shell arrange fox recipe scan tube", // 密钥
    "publicKey": "ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695", // 公钥
    "privateKey": "4d60989a5243752478f2cca33935c4f9cfa12b230dff785504eebc1589a49f21ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695",
    "address": "DJWuENme5xJUJTjWiQEjfuLYRGtABfwhjz" // 地址
}
```    

### **2.1.7 获取账户排行榜前100名**   
接口地址：/api/accounts/top   
请求方式：get   
支持格式：无   
请求参数说明：如果不加请求参数则返回持币量前100名账户信息  

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|limit |integer |N    |限制结果集个数，最小值：0,最大值：100   |  
|offset|integer  |N      |偏移量，最小值0  |  

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|accounts|json  |账户信息元组，每个元素包含地址、余额、公钥      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/accounts/top?limit=5&offset=0'  //返回前5名账户信息
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "accounts": [
        {
            "address": "DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe",
            "balance": 999997288206621600,
            "publicKey": "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1"
        },
        {
            "address": "DAaVSVimgyKL25uuu32Uz3Bu8ErUUT94oe",
            "balance": 888171213949,
            "publicKey": null
        },
        {
            "address": "DAgjTrdqdpaBSdUfqSDUsyY65E6M7T75Ex",
            "balance": 770898971875,
            "publicKey": null
        },
        {
            "address": "DKGFAugmT1iY9NesL9PeB29kHxCwELamZX",
            "balance": 730633192576,
            "publicKey": null
        },
        {
            "address": "DQJXarv8yZgyy6NMfTQSKDyE9W7BBThuCq",
            "balance": 100000000000,
            "publicKey": null
        }
    ]
} 
```   

### **2.1.8 获取当前链上账户总个数**   
接口地址：/api/accounts/count   
请求方式：get   
支持格式：无   
请求参数：无    

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|count|integer  |当前链上账户总个数     |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/accounts/count'    
```   
   
JSON返回示例：   
```js   
{
	success: true,
	count: 110
}
```    