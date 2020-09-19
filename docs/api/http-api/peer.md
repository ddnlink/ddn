---
order: 6
id: http-api-peer
title: 节点
sidebar_label: Http api peer
---

## **2.5 节点**   
   
### **2.5.1 获取本机连接的所有节点信息**   
接口地址：/api/peers   
请求方式：get   
支持格式：urlencoded   
备注：展示节点只是和本机有连接的节点，并不是全网所有的节点    
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|state |integer |N    |节点状态,0: ,1:,2:,3:     |   
|os|string|N|内核版本|   
|version|string|N|DDN版本号|   
|limit |integer |N    |限制结果集个数，最小值：0,最大值：100   |   
|orderBy|string|N||   
|offset|integer  |N      |偏移量，最小值0  |   
|port|integer|N|端口，1~65535|   
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|peers|Array  |节点信息json构成的数组     |    
|totalCount|integer|当前正在运行的节点个数|   
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/peers?limit=1'   
```   
   
JSON返回示例：   
```js   
{
    "success": true,
    "peers": [
        {
            "ip": "127.0.0.1",
            "port": 8001,
            "state": 2,
            "os": "darwin19.5.0",
            "version": "3.7.5"
        }
    ],
    "totalCount": 1
}  
```   
   
### **2.5.2 获取本节点版本号等信息**   
接口地址：/api/peers/version   
请求方式：get   
支持格式：无   
请求参数说明：无参数   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|version|string  |版本号      |    
|build  |timestamp |构建时间     |    
|net    |string  |主链或者测试链     |   
   
   
请求示例：   
```bash   
curl -k -X GET http://127.0.0.1:8001/api/peers/version   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"version": "1.0.0",   
	"build": "07:11:01 07/07/2020",   
	"net": "testnet"   
}   
```   
   
### **2.5.3 获取指定ip节点信息**   
接口地址：/api/peers/get   
请求方式：get   
支持格式：urlencoded   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|ip |string |Y    |待查询节点ip      |   
|port|integer|Y|待查询节点端口，1~65535|   
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|peer|json  |      |    
   
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/peers/get?ip=127.0.0.1&port=8001'   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"peer": {   
	}   
}   
```   


## **2.6 同步和加载**   
### **2.6.1 查看本地区块链加载状态**   
接口地址：/api/loader/status   
请求方式：get   
支持格式：无   
请求参数说明：无参数   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|loaded |boolean    |          |   
|blocksCount|integer||   
   
请求示例：   
```bash   
curl -k http://127.0.0.1:8001/api/loader/status -X GET   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"loaded": true,  
	"now": 4727, 
	"blocksCount": 4727   
}   
```   
   
### **2.6.2 查看区块同步信息**   
接口地址：/api/loader/status/sync   
请求方式：get   
支持格式：无   
请求参数说明：无参数   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|height |int    |区块高度          |   
   
请求示例：   
```bash   
curl -k http://127.0.0.1:8001/api/loader/status/sync -X GET   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"syncing": false,  // 如果同步中则为true，没有数据可以同步则为false；如果是本地节点，默认不需要同步，同样为 false  
	"blocks": 0,   
	"height": 5257   
}   
```   