---
order: 10
id: http-api-transport
title: 9.节点传输
sidebar_label: Http api transport
---

# **节点传输**

`/peer` 相关的api，在请求时都需要设置一个header，key包含：

 - nethash：testnet value:0ab796cd  
 - version：value为'3.6.0'  

## **1 接口说明 **
DDN的所有写操作都是通过发起一个交易来完成的。 
交易数据通过 `@ddn/node-sdk`(服务端使用) 或 `@ddn/js-sdk`（前端使用） 的库来创建，然后再通过这个 POST 接口发布出去

POST接口规格如下：

payload为 `sdk` 创建出来的交易数据

接口地址：/peer/transactions  
请求方式：post   
支持格式：json  

## **2 接口调用案例**

这里列举两个请求案例，更多信息，请参考 `@ddn/node-sdk`(服务端使用) 或 `@ddn/js-sdk`（前端使用） 相关文档。

### **2.1 转账**
请求参数说明：  

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|DdnSdk.transaction.createTransaction生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
   
   
请求示例：   
```js   
(async () => {
    var ddn = require('@ddn/node-sdk').default;   
    var targetAddress = "DJWuENme5xJUJTjWiQEjfuLYRGtABfwhjz";  
    var amount = 100*100000000;   //100 DDN
    var password = 'enter boring shaft rent essence foil trick vibrant fabric quote indoor output';  
    var message = ''; // 转账备注
    
    // 其中password是在用户登录的时候记录下来的，secondPassword需要每次让用户输入
    // 可以通过user.secondPublicKey来判断用户是否有二级密码，如果没有，则不必输入，以下几个交易类型类似
    var transaction = await ddn.transaction.createTransaction(targetAddress, amount, message, password);       
    console.log(JSON.stringify(transaction))  
})();

输出结果：
{"type":0,"nethash":"0ab796cd","amount":"10000000000","fee":"10000000","recipientId":"DJWuENme5xJUJTjWiQEjfuLYRGtABfwhjz","message":"","timestamp":89376938,"asset":{},"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","signature":"bd084b04ba085d0198d4fcd6b04e7a556ff917cdfe3038098a759a8434b18ace8a4367c59c36a260676dff0d8bd6047cc010a6608f4dad7d2efb90a58813a802","id":"aafa4d0ca6d45b74b16fb4346583c57485f2d7ef39b38c1a6b902a3bde873b734cd1d70c84cdd6c40e7ec9880e778581b0e7a8bb7282be3205a3680645028d34"}

// 将上面生成的转账操作的交易数据通过post提交给DDN server
curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":0,"nethash":"0ab796cd","amount":"10000000000","fee":"10000000","recipientId":"DJWuENme5xJUJTjWiQEjfuLYRGtABfwhjz","message":"","timestamp":89376938,"asset":{},"senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1","signature":"bd084b04ba085d0198d4fcd6b04e7a556ff917cdfe3038098a759a8434b18ace8a4367c59c36a260676dff0d8bd6047cc010a6608f4dad7d2efb90a58813a802","id":"aafa4d0ca6d45b74b16fb4346583c57485f2d7ef39b38c1a6b902a3bde873b734cd1d70c84cdd6c40e7ec9880e778581b0e7a8bb7282be3205a3680645028d34"}}' http://127.0.0.1:8001/peer/transactions
```
   
JSON返回示例：   
```js  
{
    "success":true,  //转账成功
    "transactionId":"aafa4d0ca6d45b74b16fb4346583c57485f2d7ef39b38c1a6b902a3bde873b734cd1d70c84cdd6c40e7ec9880e778581b0e7a8bb7282be3205a3680645028d34"
}		
```

### **2.2 设置二级密码**
请求参数说明： 

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|DdnSdk.signature.createSignature生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
   
   
请求示例：   
```js   
(async () => {
    var ddn = require('@ddn/node-sdk').default; // DDN开发遵循 ES6 规范，这里调用使用的 commenjs 规范，所以需要有 default 字段。如果使用 ES6 规范，import ddn from '@ddn/node-sdk' 即可
    var password = 'grunt grain siege churn chicken phrase shell arrange fox recipe scan tube';  
    var secondPassword  = 'erjimimashezhi';  
    var transaction = await ddn.signature.createSignature(password,secondPassword);       
    console.log(JSON.stringify(transaction))  
})();

输出结果：
{"type":1,"nethash":"0ab796cd","amount":"0","fee":"500000000","recipientId":null,"senderPublicKey":"ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695","timestamp":89377134,"asset":{"signature":{"publicKey":"17059bce8c510b2a1ca768b6672efe5b3e61c225c35f55ba127b36c108e3da68"}},"signature":"0e41bc889dd2d7516426714263990268d1355a8fc46ecaafc8d40d80d3a6b85fc7404c5410db67a20e448313886e39e46892ff5de63a572c011ddf44940f6c0b","id":"ca68ca9bdd92667a97d88ad7e7af22d62db84fabefcb4e85c72f335d8fefe0f0c173ab48023e3d4f94c0da9789fdf67b85c52cb3d2dae4b6038bb276a6a440c5"}

// 将上面生成的设置二级密码的交易数据通过post提交给DDN server
curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":1,"nethash":"0ab796cd","amount":"0","fee":"500000000","recipientId":null,"senderPublicKey":"ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695","timestamp":89377134,"asset":{"signature":{"publicKey":"17059bce8c510b2a1ca768b6672efe5b3e61c225c35f55ba127b36c108e3da68"}},"signature":"0e41bc889dd2d7516426714263990268d1355a8fc46ecaafc8d40d80d3a6b85fc7404c5410db67a20e448313886e39e46892ff5de63a572c011ddf44940f6c0b","id":"ca68ca9bdd92667a97d88ad7e7af22d62db84fabefcb4e85c72f335d8fefe0f0c173ab48023e3d4f94c0da9789fdf67b85c52cb3d2dae4b6038bb276a6a440c5"}}' http://127.0.0.1:8001/peer/transactions   
```
   
JSON返回示例：   
```js  
{
    "success":true,  //二级密码设置成功
    "transactionId":"ca68ca9bdd92667a97d88ad7e7af22d62db84fabefcb4e85c72f335d8fefe0f0c173ab48023e3d4f94c0da9789fdf67b85c52cb3d2dae4b6038bb276a6a440c5"
}	
```



### **2.3 账户锁仓**
备注：锁仓后且区块高度未达到锁仓高度，则该账户不能执行如下操作：

|交易类型type|备注|
|----|----|
|0|主链DDN转账|
|6|Dapp充值|
|7|Dapp提现|
|8|多重签名|
|60|发行商注册|
|61|资产注册|
|62|资发行产|
|65|AoB转账|

请求参数说明：  

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|DdnSdk.transaction.createLock生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|transactionId|string|交易id|
   
   
请求示例：   
```js   
(async () => {
    var ddn = require('@ddn/node-sdk').default;   
    var height = 3500;  // 锁仓高度
    var password = 'grunt grain siege churn chicken phrase shell arrange fox recipe scan tube';
    var secondPassword  = 'erjimimashezhi';
    
    // 其中password是在用户登录的时候记录下来的，secondPassword需要每次让用户输入
    // 可以通过user.secondPublicKey来判断用户是否有二级密码，如果没有，则不必输入，以下几个交易类型类似
    var transaction = await ddn.transaction.createLock(height, password, secondPassword || undefined);       
    console.log(JSON.stringify(transaction));
})();

输出结果：
{"type":100,"amount":"0","nethash":"0ab796cd","fee":"10000000","recipientId":null,"args":["3500"],"timestamp":89377929,"asset":{},"senderPublicKey":"ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695","signature":"628ad7d1565af3e2a0558f43b2614ce37c40b9681021ae76c9cb68e17409f716b96b6f12bc646ae7942957c7416e75145c033229b5050f36f6c5a46302a41c0f","sign_signature":"800bafae76152a7ac4988a348a7829d973df0ea7d28fea00557b81a31d3d23e5a27c6fdbda47206fe536fb704b013dc07998ac2d8da91075f74ef3229db4770c","id":"def5c3530ea3aeb227fcce9060d4aedfa358106c792d68f894f8fba5df8ae4bb12c2a57f11463724206406e0a2e4b67901c785e9c49c3fd10571025063a6e3b6"}

// 将上面生成的转账操作的交易数据通过post提交给 DDN 节点
curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":100,"amount":"0","nethash":"0ab796cd","fee":"10000000","recipientId":null,"args":["3500"],"timestamp":89377929,"asset":{},"senderPublicKey":"ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695","signature":"628ad7d1565af3e2a0558f43b2614ce37c40b9681021ae76c9cb68e17409f716b96b6f12bc646ae7942957c7416e75145c033229b5050f36f6c5a46302a41c0f","sign_signature":"800bafae76152a7ac4988a348a7829d973df0ea7d28fea00557b81a31d3d23e5a27c6fdbda47206fe536fb704b013dc07998ac2d8da91075f74ef3229db4770c","id":"def5c3530ea3aeb227fcce9060d4aedfa358106c792d68f894f8fba5df8ae4bb12c2a57f11463724206406e0a2e4b67901c785e9c49c3fd10571025063a6e3b6"}}' http://localhost:8001/peer/transactions && echo 
```
   
JSON返回示例：   
```js  
{
    "success":true,  // 锁仓成功
    "transactionId":"def5c3530ea3aeb227fcce9060d4aedfa358106c792d68f894f8fba5df8ae4bb12c2a57f11463724206406e0a2e4b67901c785e9c49c3fd10571025063a6e3b6"
}		
```
