---
order: 4
id: http-api-block
title: 3.区块
sidebar_label: Http api block
---


# **区块**
## **1 获取指定区块的详情**
接口地址：/api/blocks/get   
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|id |string |参数3选1    |区块id      |   
|height|string|参数3选1|区块高度|   
|hash|string|参数3选1|区块hash|   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|block|json  |区块详情      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/blocks/get?id=ad6cb4628195dc1fd4051a41f8564bdfb11b28fe30b11232fd8061d564ef6b6494cb36fb9beb317919eebe710c910f9f69e3f2f65f0045ac160c14c1a69e466e'   
```
   
JSON返回示例：   
```js   
{
    "success": true,
    "block": {
        "id": "ad6cb4628195dc1fd4051a41f8564bdfb11b28fe30b11232fd8061d564ef6b6494cb36fb9beb317919eebe710c910f9f69e3f2f65f0045ac160c14c1a69e466e",
        "version": 0,
        "timestamp": 89233520,
        "height": "270",
        "previous_block": "428e8c03ffc163bf7b3699a4bc083686629f01f38c8891831653f8d118a93a496648065655d43659c1792a810f6056c3aa444540fd400b26576f3a75ec345443",
        "number_of_transactions": 0,
        "total_amount": "0",
        "total_fee": "0",
        "reward": "500000000",
        "payload_length": 0,
        "generator_public_key": "ae66e8768a3a94e61daf8cd64e914494a632f022284f7eb364b49269df7b3742",
        "generator_id": "DDYPEgjmJCoTauEsnAWzgAsehd1owCZnhT",
        "block_signature": "234db7e977a2b2806ac946f2991372e1c022fd3918eac5260db9feaedf4282e5f535ce725ee3a4d6bb4ecf53ca5b7f8d0f93876ee17efe6b6823869851224400",
        "confirmations": 10,
        "totalForged": "500000000"
    }
}
```
   
## **2 获取区块数据**
接口地址：/api/blocks   
请求方式：get   
支持格式：urlencoded   
接口说明：不加参数则获取全网区块详情   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|limit |integer |N    |限制结果集个数，最小值：0,最大值：100   |   
|orderBy|string  |N      |根据表中字段排序，如height:desc  |   
|offset|integer  |N      |偏移量，最小值0  |   
|generatorPublicKey|string  |N      |区块生成者公钥  |   
|totalAmount|integer  |N       |交易总额，最小值：0，最大值：10000000000000000 |   
|totalFee|integer  |N      |手续费总额，最小值：0，最大值：10000000000000000  |   
|reward|integer  |N      |奖励金额，最小值：0  |   
|previousBlock|string  |N      |上一个区块  |   
|height|integer  |N      |区块高度  |   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|blocks|Array  |由区块详情json串构成的数组 |    
|count|integer|区块链高度|   
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/blocks?limit=2&offset=0&orderBy=height:desc'   
```
   
JSON返回示例：   
```js   
{
    "success": true,
    "blocks": [
        {
            "id": "ad6cb4628195dc1fd4051a41f8564bdfb11b28fe30b11232fd8061d564ef6b6494cb36fb9beb317919eebe710c910f9f69e3f2f65f0045ac160c14c1a69e466e",
            "version": 0,
            "timestamp": 89233520,
            "height": "270",
            "previous_block": "428e8c03ffc163bf7b3699a4bc083686629f01f38c8891831653f8d118a93a496648065655d43659c1792a810f6056c3aa444540fd400b26576f3a75ec345443",
            "number_of_transactions": 0,
            "total_amount": "0",
            "total_fee": "0",
            "reward": "500000000",
            "payload_length": 0,
            "generator_public_key": "ae66e8768a3a94e61daf8cd64e914494a632f022284f7eb364b49269df7b3742",
            "generator_id": "DDYPEgjmJCoTauEsnAWzgAsehd1owCZnhT",
            "block_signature": "234db7e977a2b2806ac946f2991372e1c022fd3918eac5260db9feaedf4282e5f535ce725ee3a4d6bb4ecf53ca5b7f8d0f93876ee17efe6b6823869851224400",
            "confirmations": 1,
            "totalForged": "500000000"
        },
        {
            "id": "428e8c03ffc163bf7b3699a4bc083686629f01f38c8891831653f8d118a93a496648065655d43659c1792a810f6056c3aa444540fd400b26576f3a75ec345443",
            "version": 0,
            "timestamp": 89233510,
            "height": "269",
            "previous_block": "ddc20bd2cd8ad8be240bb881906e291d4f5f29e1a01559956808a00fcef7279978913852bd87c8931b2d279ac8dcdbe9d7d0fa0ad92cd66970a4496320069533",
            "number_of_transactions": 0,
            "total_amount": "0",
            "total_fee": "0",
            "reward": "500000000",
            "payload_length": 0,
            "generator_public_key": "1fa0bab7f5459f87d8dd411c4b80f910ca904355113b2c448a33b670a84e9415",
            "generator_id": "D733ZXoCPKvUj3L2J8v9YmuHiVwhCWz4Ef",
            "block_signature": "e874057a5d34732505889792c50e3ec87b901f2664ccb875c930b62094bc02ab006b0dbc32266116a10393eb7fa58e6b982874de24fca754de564a40f7738b0e",
            "confirmations": 2,
            "totalForged": "500000000"
        }
    ],
    "count": 270
}
```
   
## **3 获取区块链高度**
接口地址：/api/blocks/getHeight   
请求方式：get   
支持格式：无   
请求参数说明：无   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|height|integer  |区块链高度      |    
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/blocks/getheight'    
```
   
JSON返回示例：   
```js   
{"success":true,"height": "285"}   
```
   
## **4 获取普通转账手续费**
接口地址：/api/blocks/getFee   
请求方式：get   
支持格式：无   
请求参数说明：无   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|fee|integer  |交易手续费      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/blocks/getfee'   
```
   
JSON返回示例：   
```js   
{"success":true,"fee":"10000000"}     // 手续费为0.1 DDN   
```
   
## **5 获取里程碑**
接口地址：/api/blocks/getMilestone   
请求方式：get   
支持格式：无   
请求参数说明：无   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|milestone|integer  |      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/blocks/getMilestone'    
```
   
JSON返回示例：   
```js   
{"success":true,"milestone":"0"}   
```
   
## **6 查看单个区块奖励**
接口地址：/api/blocks/getReward   
请求方式：get   
支持格式：无   
请求参数说明：无   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|reward|integer  |区块奖励，包含受托人奖励和手续费      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/blocks/getReward'   
```
   
JSON返回示例：   
```js   
{"success":true,"reward":"500000000"} //每个生成一个block奖励 5 DDN   
```
   
## **7 获取Token当前供应值**
接口地址：/api/blocks/getSupply   
请求方式：get   
支持格式：无   
请求参数说明：无   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|supply|integer  |全网DDN个数      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/blocks/getSupply'   
```
   
JSON返回示例：   
```js   
{"success":true,"supply":"1000000100500000000"} // 当前testnet共有 10000001005 DDN   
```
   
## **8 区块链状态**
接口地址：/api/blocks/getStatus   
请求方式：get   
支持格式：无   
请求参数说明：无   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|height|integer  |区块链高度      |    
|fee|integer  |交易手续费      |    
|milestone|integer  |      |    
|reward|integer  |区块奖励      |    
|supply|integer  |全网DDN个数      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/blocks/getStatus'   
```
   
JSON返回示例：   
```js   
{
    "success": true,
    "height": "306",
    "fee": "10000000",
    "milestone": "0",
    "reward": "500000000",
    "supply": "1000000151000000000"
} 
```
   

## **9 获取指定区块的交易信息**
接口地址：/api/blocks/full   
请求方式：get   
支持格式：无   
请求参数说明：无  
 
   
请求参数说明：

|名称	|类型   |必填    |说明              |
|------ |-----  |----   |----           |
|id |string |参数2选1    |区块id      |
|height|string|参数2选1|区块高度|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|block|json  |区块详情，包含交易信息transactions      |   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/blocks/full?height=222'   
```
   
JSON返回示例：   
```js   
{
    "success": true,
    "block": {
        "id": "3f1ccd489f80f6a232d7c7c87f11dbbcb0d57ac6c22f3379a65411a2799df863921d3fd85260ba67e883f4106c89962e0c8f45b1b7351834eb41ebe55315036a",
        "version": 0,
        "timestamp": 89233040,
        "height": "222",
        "previous_block": "e4c4caa6dcf01c43e199ecbb9afa12bf0a98316ccfaa1d71b3bdf2985a344f11311332dcc86c25497c105c68385fa14dbf30dcb1659b814c5480a149429d82a0",
        "number_of_transactions": 0,
        "total_amount": "0",
        "total_fee": "0",
        "reward": "500000000",
        "payload_length": 0,
        "payload_hash": "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
        "generator_public_key": "7d2dcf342b8471fd507a008945cadb6d7f7e655dc70bebff890e3cf1025f560d",
        "generator_id": "D7N2TDDe1gbFv4MLsFwNrz3yorTgwBFYac",
        "block_signature": "8aefaa9f19ae99fb21c5f7bc2a38a9a8433d8008abff4f1ddd6bafd5bdc28551c2e60651c17a25472bc869cef7d3b0de37e55c71d3063c96a4fe7d44e2caa20c",
        "totalForged": "500000000",
        "transactions": []
    }
}
```
