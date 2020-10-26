---
order: 11
id: http-api-network
title: 10.网络
sidebar_label: Http api network
---

# **网络状态**
### **1 说明**

这里提供的几个接口，方便我们掌握DDN区块链网络的状态

### **2 获取网络主要参数信息**

接口地址：/api/network   
请求方式：get   
支持格式：urlencoded   
请求参数说明： 无
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|nethash|string  |DDN网络标识符，不同的区块链具有不同的nethash值，DDN区块链使用该值区分不同的区块链网络     |    
|tokenName|string  |token 名称，用于标识区块链核心数字资产名称     |    
|tokenPrefix|string  |token 简称，用于标识区块链核心数字资产名称     |    
|beginDate|datime  |网络创世时间，时间戳以该时间为准     |    
   
请求示例：   
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/network  
```   
   
JSON返回示例：   
```
{
    "success":true,
    "nethash": "0ab796cd",
    "tokenName": "DDN",
    "tokenPrefix": "D",
    "beginDate": "2017-11-20T12:20:20.020Z"
}
```

### **3 获取所请求节点的状态**

### **3.1 获取所请求节点的加载状态**
接口地址：/api/network/status   
请求方式：get   
支持格式：urlencoded   
请求参数说明： 无
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|ready|boolean  |所请求的节点是否 |    
|height|string  |当前区块链高度 |    
|blocksCount|interger  |当前区块数量 |    

请求示例：
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/network/status
```   

JSON返回示例：
```   
{
    "success": true,
    "ready": true,
    "height": "362",
    "blocksCount": 362
}
```

### **3.2 获取所请求节点的同步状态**
接口地址：/api/network/sync   
请求方式：get   
支持格式：urlencoded   
请求参数说明： 无
   
   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |请求是否成功 |    
|syncing|boolean  |所请求的节点是否在同步 |    
|height|string  |当前区块链高度 |    
|blocksCount|interger  |当前区块数量 |    

请求示例：
```bash   
curl -k -X GET 'http://127.0.0.1:8001/api/network/sync'
```   

JSON返回示例：   
```
{
    "success": true,
    "syncing": true,
    "blocks": "362",
    "height": "362"
}
```
