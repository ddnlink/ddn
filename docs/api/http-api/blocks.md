---
order: 4
id: http-api-block
title: 区块
sidebar_label: Http api block
---


## **2.3 区块blocks**   
### **2.3.1 获取指定区块的详情**   
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
curl -k -X GET 'http://127.0.0.1:8001/api/blocks/get?id=6076474715648888747'   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"block": {   
		"id": "6076474715648888747",   
		"version": 0,   
		"timestamp": 4734070,   
		"height": 140538,   
		"previousBlock": "16033230167082515105",    //上一个区块id   
		"numberOfTransactions": 0,  //交易数   
		"totalAmount": 0,   //交易额   
		"totalFee": 0,   
		"reward": 500000000,    //奖励   
		"payloadLength": 0,   
		"payloadHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",   
		"generatorPublicKey": "1d352950c8141e1b35daba4a974a604519d7a2ef3a1ec0a503ce2653646aa052",   
		"generatorId": "6656029629904254066",   
		"blockSignature": "a53de66922cdc2f431acd0a474beec7cf7c420a8460b7b7caf84999be7caebb59fb7fbb7166c2c7013dbb431585ea7294722166cb08bf9663abf50b6bd81cd05",   
		"confirmations": "2",   
		"totalForged": 500000000   
	}   
}   
```   
   
### **2.3.2 获取区块数据**   
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
	"blocks": [{   
		"id": "12634047624004615059",   
		"version": 0,   
		"timestamp": 4708080,   
		"height": 137986,   
		"previousBlock": "3498191422350401106",   
		"numberOfTransactions": 0,  // 交易数   
		"totalAmount": 0,   // 金额   
		"totalFee": 0,  // 手续费   
		"reward": 500000000,    // 奖励   
		"payloadLength": 0,   
		"payloadHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",   
		"generatorPublicKey": "44db7bec89ef289d0def257285675ca14f2a947dfd2b70e6b1cff4392ce42ada",   
		"generatorId": "4925169939071346193",   
		"blockSignature": "83a2124e3e8201c1a6099b2ac8ab1c117ad34867978add3a90d41a64df9d2ad8fabc9ec14d27a77cd34c08a6479ef684f247c11b1cbbcb0e9767dffc85838600",   
		"confirmations": "1",   
		"totalForged": 500000000   
	},   
	{   
		"id": "3498191422350401106",   
		"version": 0,   
		"timestamp": 4708070,   
		"height": 137985,   
		"previousBlock": "14078155423801039323",   
		"numberOfTransactions": 0,   
		"totalAmount": 0,   
		"totalFee": 0,   
		"reward": 500000000,   
		"payloadLength": 0,   
		"payloadHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",   
		"generatorPublicKey": "500b1ec025cd64d36008341ed8d2508473ecf559be213ca5f9580620a21a592c",   
		"generatorId": "16006295608945777169",   
		"blockSignature": "a0b5ed6c94b1f33c4d0f017f21a08357061493392b19e34eeedf274b77c751e3f86c92443280de09ea1754d62fe7ef00e02acbdc3bc0c1063cef344bacaa4f07",   
		"confirmations": "2",   
		"totalForged": 500000000   
	}],   
	"count": 137986   
}   
```   
   
### **2.3.3 获取区块链高度**   
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
{"success":true,"height":317044}   
```   
   
### **2.3.4 获取普通转账手续费**   
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
{"success":true,"fee":10000000}     //手续费为0.1 DDN   
```   
   
### **2.5 获取里程碑**   
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
{"success":true,"milestone":0}   
```   
   
### **2.3.6 查看单个区块奖励**   
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
{"success":true,"reward":500000000} //每个生成一个block奖励5 DDN   
```   
   
### **2.3.7 获取COIN当前供应值**   
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
{"success":true,"supply":10158519000000000} //当前testnet共有101585190DDN   
```   
   
### **2.3.8 区块链状态**   
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
	"height": 317044,   
	"fee": 10000000,   
	"milestone": 0,   
	"reward": 500000000,   
	"supply": 10158519000000000   
}   
```   
   

### **2.3.9 获取指定区块的交易信息**   
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
curl -k -X GET 'http://127.0.0.1:8001/api/blocks/full?height=6666'   
```   
   
JSON返回示例：   
```js   
{
	"success": true,
	"block": {
		"id": "846e29249dff5d62bb577dd7f8f9043ac473e71fc1281c6f0ca0248cd46d35df",
		"version": 0,
		"timestamp": 91140,
		"height": 6666,
		"previousBlock": "6c1027ce7b177e9ed4f9d36695789babba4526ee04dfbf894dd7616e2a9d3b81",
		"numberOfTransactions": 0,
		"totalAmount": 0,
		"totalFee": 0,
		"reward": 500000000,
		"payloadLength": 0,
		"payloadHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		"generatorPublicKey": "4649a8d705d32c0ebef1ad799ce7757387a6357de930a2b75f1fdd441d901567",
		"generatorId": "DLzgMhdRTDn6bEYtzxi8JM86vAv1HkEvD4",
		"blockSignature": "241a94e226d6d32e44ca641e22996e545c5ffba18eb54963ca17eb166b3901c22b9ad437766a58753454e07ef0e716c7410d20483457cff2048f76ea7354bb08",
		"totalForged": 500000000,
		"transactions": []
	}
}
``` 