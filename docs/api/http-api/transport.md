---
order: 9
id: http-api-transport
title: 点对点传输
sidebar_label: Http api transport
---

## **2.9 点对点传输tansport[安全的api]**   
### **2.9.1 说明**   
/peer相关的api，在请求时都需要设置一个header  

 - key为magic，testnet value:0ab796cd, mainnet value:5f5b3cf5  
 - key为version，value为''  

### **2.9.2 普通交易**   
ddn系统的所有写操作都是通过发起一个交易来完成的。 
交易数据通过一个叫做ddn-js的库来创建，然后再通过一个POST接口发布出去

POST接口规格如下：
payload为ddn-js创建出来的交易数据
接口地址：/peer/transactions  
请求方式：post   
支持格式：json  

#### **2.9.2.1 设置二级密码**   
请求参数说明： 

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|ddn-js.signature.createSignature生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
   
   
请求示例：   
```js   
var ddn = require('@ddn/node-sdk');  
var password = 'measure bottom stock hospital calm hurdle come banner high edge foster cram';  
var secondPassword  = 'erjimimashezhi001';  
var transaction = ddn.signature.createSignature(password,secondPassword);       
console.log(JSON.stringify(transaction))  
{"type":1,"amount":0,"fee":500000000,"recipientId":null,"senderPublicKey":"3e6e7c90571b9f7dabc0abc2e499c2fcee8e436af3a9d5c8eadd82ac7aeae85f","timestamp":5328943,"asset":{"signature":{"publicKey":"27116db89cb5a8c02fb559712e0eabdc298480d3c79a089b803e35bc5ef7bb7b"}},"signature":"71ef98b1600f22f3b18cfcf17599db3c40727c230db817f610e86454b62df4fb830211737ff0c03c6a61ecfd4a9fcb68a30b2874060bb33b87766acf800e820a","id":"15605591820551652547"}   

// 将上面生成的设置二级密码的交易数据通过post提交给DDN server
curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":1,"amount":0,"fee":500000000,"recipientId":null,"senderPublicKey":"3e6e7c90571b9f7dabc0abc2e499c2fcee8e436af3a9d5c8eadd82ac7aeae85f","timestamp":5328943,"asset":{"signature":{"publicKey":"27116db89cb5a8c02fb559712e0eabdc298480d3c79a089b803e35bc5ef7bb7b"}},"signature":"71ef98b1600f22f3b18cfcf17599db3c40727c230db817f610e86454b62df4fb830211737ff0c03c6a61ecfd4a9fcb68a30b2874060bb33b87766acf800e820a","id":"15605591820551652547"}}' http://127.0.0.1:8001/peer/transactions   
```   
   
JSON返回示例：   
```js  
{
    "success":true  //二级密码设置成功
}	
``` 

#### **2.9.2.2 转账**   
请求参数说明：  

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|ddn-js.transaction.createTransaction生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
   
   
请求示例：   
```js   
var ddn = require('@ddn/node-sdk');   
var targetAddress = "DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh";  
var amount = 100*100000000;   //100 DDN
var password = 'measure bottom stock hospital calm hurdle come banner high edge foster cram';  
var secondPassword  = 'erjimimashezhi001';  
var message = ''; // 转账备注

// 其中password是在用户登录的时候记录下来的，secondPassword需要每次让用户输入
// 可以通过user.secondPublicKey来判断用户是否有二级密码，如果没有，则不必输入，以下几个交易类型类似
var transaction = ddn.transaction.createTransaction(targetAddress, amount, message, password, secondPassword || undefined);       
JSON.stringify(transaction)
'{"type":0,"amount":10000000000,"fee":10000000,"recipientId":"DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh","message":"","timestamp":37002975,"asset":{},"senderPublicKey":"8065a105c785a08757727fded3a06f8f312e73ad40f1f3502e0232ea42e67efd","signature":"bd0ed22abf09a13c1778ebfb96fc8584dd209961cb603fd0d818d88df647a926795b5e3c51e23f6ed38648169f4e4c912dd854725c22cce9bbdc15ec51c23008","id":"de72b89312c7d128db28611ed36eab2ff0136912c4a67f97342417c942b055cf"}'

// 将上面生成的转账操作的交易数据通过post提交给DDN server
curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":0,"amount":10000000000,"fee":10000000,"recipientId":"DDr1KLYLRos6iZ55HvNrKo2X8Zpg2mT1oh","message":"","timestamp":37002975,"asset":{},"senderPublicKey":"8065a105c785a08757727fded3a06f8f312e73ad40f1f3502e0232ea42e67efd","signature":"bd0ed22abf09a13c1778ebfb96fc8584dd209961cb603fd0d818d88df647a926795b5e3c51e23f6ed38648169f4e4c912dd854725c22cce9bbdc15ec51c23008","id":"de72b89312c7d128db28611ed36eab2ff0136912c4a67f97342417c942b055cf"}}' http://127.0.0.1:8001/peer/transactions
```   
   
JSON返回示例：   
```js  
{
    "success":true,  //转账成功
    "transactionId":"a95c3a5bda15f3fd38295950268c234e922aae97cf803dd8c38c73a6ccf7c561"
}		
``` 

#### **2.9.2.3 注册受托人**   
请求参数说明： 

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|ddn-js.delegate.createDelegate生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
   
   
请求示例：   
```js   
var ddn = require('@ddn/node-sdk');   
var password = 'measure bottom stock hospital calm hurdle come banner high edge foster cram';
var secondPassword  = 'erjimimashezhi001';
var userName = 'huoding_test';  

var transaction = ddn.delegate.createDelegate(userName, password, secondPassword || undefined);   
JSON.stringify(transaction)  
'{"type":2,"amount":0,"fee":10000000000,"recipientId":null,"senderPublicKey":"3e6e7c90571b9f7dabc0abc2e499c2fcee8e436af3a9d5c8eadd82ac7aeae85f","timestamp":5334485,"asset":{"delegate":{"username":"huoding_test","publicKey":"3e6e7c90571b9f7dabc0abc2e499c2fcee8e436af3a9d5c8eadd82ac7aeae85f"}},"signature":"a12ce415d2d21ab46e4c1b918b8717b1d351dd99abd6f2f94d9a1a7e1f32b697f843a05b1851cb857ea45a2476dce592f5ddd612c00cd44488b8b610c57d7f0a","signSignature":"35adc9f1f37d14458e8588f9b4332eedf1151c02480159f64a287a4b0cbb59bfe82040dfec96a4d9560bae99b8eaa1799a7023395db5ddc640d95447992d6e00","id":"12310465407307249905"}'

// 将上面生成的注册受托人的交易数据通过post提交给DDN server
curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":2,"amount":0,"fee":10000000000,"recipientId":null,"senderPublicKey":"3e6e7c90571b9f7dabc0abc2e499c2fcee8e436af3a9d5c8eadd82ac7aeae85f","timestamp":5334485,"asset":{"delegate":{"username":"huoding_test","publicKey":"3e6e7c90571b9f7dabc0abc2e499c2fcee8e436af3a9d5c8eadd82ac7aeae85f"}},"signature":"a12ce415d2d21ab46e4c1b918b8717b1d351dd99abd6f2f94d9a1a7e1f32b697f843a05b1851cb857ea45a2476dce592f5ddd612c00cd44488b8b610c57d7f0a","signSignature":"35adc9f1f37d14458e8588f9b4332eedf1151c02480159f64a287a4b0cbb59bfe82040dfec96a4d9560bae99b8eaa1799a7023395db5ddc640d95447992d6e00","id":"12310465407307249905"}}' http://127.0.0.1:8001/peer/transactions
```   
   
JSON返回示例：   
```js  
{
    "success":true  //注册受托人成功
}		
``` 

#### **2.9.2.4 投票 & 取消投票**  

请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|ddn-js.vote.createVote生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
   
   
请求示例：   
```js   
var ddn = require('@ddn/node-sdk');   
var password = 'measure bottom stock hospital calm hurdle come banner high edge foster cram';
var secondPassword  = 'erjimimashezhi001';
// 投票内容是一个列表，列表中的每一个元素是一个符号加上所选择的受托人的公钥，符号为+表示投票，符号为-表示取消投票
var voteContent = [
    '-0095b28997a33bb4f16b62523bcc1902179f2a7b5a3dd83980da5c1cbae854d6',
    '+c292db6ea14d518bc29e37cb227ff260be21e2e164ca575028835a1f499e4fe2'
];

var transaction = ddn.vote.createVote(voteContent, password, secondPassword || undefined);
JSON.stringify(transaction)
{"type":3,"amount":0,"fee":10000000,"recipientId":null,"senderPublicKey":"3e6e7c90571b9f7dabc0abc2e499c2fcee8e436af3a9d5c8eadd82ac7aeae85f","timestamp":5334923,"asset":{"vote":{"votes":["-0095b28997a33bb4f16b62523bcc1902179f2a7b5a3dd83980da5c1cbae854d6","+c292db6ea14d518bc29e37cb227ff260be21e2e164ca575028835a1f499e4fe2"]}},"signature":"6036c2066a231c452a1c83aafd3bb9db3842ee05d5f17813f8264a4294cdec761faa89edf4a95f9b2e2451285807ab18aa9f989ad9a3165b95643179b8e4580f","signSignature":"a216ca739112e6f65986604b9467ccc8058138a7077faf134d6c4d673306cd1c514cc95bd54a036f7c602a56c4b4f2e4e59f6aa7c376cb1429e89054042e050b","id":"17558357483072606427"}

// 将上面生成的投票的交易数据通过post提交给ddn server
curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":3,"amount":0,"fee":10000000,"recipientId":null,"senderPublicKey":"3e6e7c90571b9f7dabc0abc2e499c2fcee8e436af3a9d5c8eadd82ac7aeae85f","timestamp":5334923,"asset":{"vote":{"votes":["-0095b28997a33bb4f16b62523bcc1902179f2a7b5a3dd83980da5c1cbae854d6","+c292db6ea14d518bc29e37cb227ff260be21e2e164ca575028835a1f499e4fe2"]}},"signature":"6036c2066a231c452a1c83aafd3bb9db3842ee05d5f17813f8264a4294cdec761faa89edf4a95f9b2e2451285807ab18aa9f989ad9a3165b95643179b8e4580f","signSignature":"a216ca739112e6f65986604b9467ccc8058138a7077faf134d6c4d673306cd1c514cc95bd54a036f7c602a56c4b4f2e4e59f6aa7c376cb1429e89054042e050b","id":"17558357483072606427"}}' http://127.0.0.1:8001/peer/transactions
```   
   
JSON返回示例：   
```js  
{
    "success":true  //投票&取消投票 成功
}		
``` 

#### **2.9.2.5 账户锁仓**  
备注：锁仓后且区块高度未达到锁仓高度，则该账户不能执行如下操作：

|交易类型type|备注|
|----|----|
|0|主链DDN转账|
|6|Dapp充值|
|7|Dapp提现|
|8|存储小文件|
|9|发行商注册|
|10|资产注册|
|13|资发行产|
|14|主链aob转账|

请求参数说明：  

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|ddn-js.transaction.createLock生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|transactionId|string|交易id|
   
   
请求示例：   
```js   
var ddn = require('@ddn/node-sdk');   
var height = 3500;  // 锁仓高度
var password = 'found knife gather faith wrestle private various fame cover response security predict';
var secondPassword  = '';


// 其中password是在用户登录的时候记录下来的，secondPassword需要每次让用户输入
// 可以通过user.secondPublicKey来判断用户是否有二级密码，如果没有，则不必输入，以下几个交易类型类似
var transaction = ddn.transaction.createLock(height, password, secondPassword || undefined);       
JSON.stringify(transaction)
'{"type":100,"amount":0,"fee":10000000,"recipientId":null,"args":["3500"],"timestamp":39615653,"asset":{},"senderPublicKey":"2856bdb3ed4c9b34fd2bba277ffd063a00f703113224c88c076c0c58310dbec4","signature":"46770ea4ba48ebb0abbaae95b7931dd9f6cc0d178ff22ec50b9e97f3f31126b8d0c9c47f7d2e4479124530f7d36d9e1aac72da598330cda3b7404cd48fb10e0c","id":"b71187f59e2a7f6dd68f18b4ddd0bb87f20394473f0388952f0ceedf49596811"}'

// 将上面生成的转账操作的交易数据通过post提交给ddn server
curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":100,"amount":0,"fee":10000000,"recipientId":null,"args":["3500"],"timestamp":39615653,"asset":{},"senderPublicKey":"2856bdb3ed4c9b34fd2bba277ffd063a00f703113224c88c076c0c58310dbec4","signature":"46770ea4ba48ebb0abbaae95b7931dd9f6cc0d178ff22ec50b9e97f3f31126b8d0c9c47f7d2e4479124530f7d36d9e1aac72da598330cda3b7404cd48fb10e0c","id":"b71187f59e2a7f6dd68f18b4ddd0bb87f20394473f0388952f0ceedf49596811"}}' http://localhost:8001/peer/transactions && echo 
```   
   
JSON返回示例：   
```js  
{
    "success":true,  // 锁仓成功
    "transactionId":"b71187f59e2a7f6dd68f18b4ddd0bb87f20394473f0388952f0ceedf49596811"
}		
``` 