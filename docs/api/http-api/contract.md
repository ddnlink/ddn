---
order: 12
id: http-api-contract
title: 12.智能合约
sidebar_label: Http api contract
---

# **智能合约**

查询链上的合约代码、执行结果等

## **1 查询合约列表**
接口地址：/api/contracts   
请求方式：get   
支持格式：json   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|limit |number |N    |显示数量       |   
|offset|number  |N|从第几个开始      |    
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|rows|json  |合约数组      |    
|totalCount|number  |结果总数      |    
   
   
请求示例：   
```bash   
curl -k -H "Content-Type: application/json" -X GET -d '{"limit":100,"offset":0}' 'http://127.0.0.1:8001/api/contracts'    
```
   
JSON返回示例：   
```js  
{
    "success": true,
    "rows": [{
        "id": "xxxx", // 交易类型为1
        "name": "test contract",
        ...
    }]
} 
```
   
## **2 获取单个合约**
接口地址：/api/contracts/get   
请求方式：get   
支持格式：无   
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|id |string |Y    |合约id       |   
      
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|contract|json  |合约      |    
   
   
请求示例：   
```bash   
curl -k http://127.0.0.1:8001/api/contracts/get -X GET -d '{"id":"xxxxxx"}'
```
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"contract": {
        "name": "test contract",
        ...
    }         //5 DDN   
}     
```
   
## **3 获取合约代码**
接口地址：/api/contracts/code   
请求方式：get   
支持格式：无   
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|id |string |Y    |合约id       |   
      
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|contract|json  |合约      |    
   
   
请求示例：   
```bash   
curl -k http://127.0.0.1:8001/api/contracts/code -X GET -d '{"id":"xxxxxx"}'   
```
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"code": "..."
}     
```

## **4 获取合约元数据**
接口地址：/api/contracts/meta   
请求方式：get   
支持格式：无   
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|id |string |Y    |合约id       |   
      
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|meta|json  |合约      |    
   
   
请求示例：   
```bash   
curl -k http://127.0.0.1:8001/api/contracts/meta -X GET -d '{"id":"xxxxxx"}'   
```
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"meta": {
        "name": "test contract",
        ...
    }         //5 DDN   
}     
```

## **5 获取合约的所有执行结果**
接口地址：/api/contracts/results   
请求方式：get   
支持格式：无   
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|id |string |Y    |合约id       |   
      
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|rows|json  |结果数组      |    
|count|number  |结果数量      |    
   
   
请求示例：   
```bash   
curl -k http://127.0.0.1:8001/api/contracts/results -X GET -d '{"id":"xxxxxx"}'   
```
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"rows": [{
        "name": "test contract",
        ...
    }],
    "count": 1
}     
```

## **5 获取交易的合约执行结果**
接口地址：/api/contracts/result  
请求方式：get   
支持格式：无   
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|id |string |N    |合约id       |   
|transactionId |string |Y    |交易id       |   
      
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|rows|json  |结果数组      |    
|count|number  |结果数量      |    
   
   
请求示例：   
```bash   
curl -k http://127.0.0.1:8001/api/contracts/results -X GET -d '{"id":"xxxxxx"}'   
```
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"rows": [{
        "name": "test contract",
        ...
    }],
    "count": 1
}     
```

## **6 获取合约转账**
接口地址：/api/contracts/transfers   
请求方式：get   
支持格式：无   
请求参数说明：

|名称	      |类型   |必填 |说明              |   
|------      |-----  |---  |----              |   
|id          |string |N    |合约id       |   
|senderId    |string |N    |发送人地址    |   
|recipientId |string |N    |接收人地址    |   
      
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|rows|json  |结果数组      |    
|count|number  |结果数量      |    
   
   
请求示例：   
```bash   
curl -k http://127.0.0.1:8001/api/contracts/transfers -X GET -d '{"id":"xxxxxx"}'   
```
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"rows": [{
        "name": "test contract",
        ...
    }],
    "count": 1
}     
```

## **7 调用合约查询方法**
接口地址：/api/contracts/call   
请求方式：post   
支持格式：无   
请求参数说明：

|名称	      |类型   |必填 |说明              |   
|------      |-----  |---  |----              |   
|id          |string |N    |合约id       |   
|method    |string |N    |查询方法    |   
|methodArgs |string[] |N    |方法参数    |   
      
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|rows|json  |结果数组      |    
|count|number  |结果数量      |    
   
   
请求示例：   
```bash   
curl -k http://127.0.0.1:8001/api/contracts/transfers -X POST -d '{"id":"xxxxxx", method:"hello", methodArgs:["world"]}'   
```
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"result": ...,
}     
```
