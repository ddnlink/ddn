---
order: 3
id: aob-api
title: 3. 链上资产AOB Api
sidebar_label: Assets on blockchain
---

## **1 API使用说明**   
## **1.1 请求过程说明**   
1.1 构造请求数据，用户数据按照DDN提供的接口规则，通过程序生成签名，生成请求数据集合；       
1.2 发送请求数据，把构造完成的数据集合通过POST/GET等提交的方式传递给DDN；       
1.3 DDN对请求数据进行处理，服务器在接收到请求后，会首先进行安全校验，验证通过后便会处理该次发送过来的请求；       
1.4 返回响应结果数据，DDN把响应结果以JSON的格式反馈给用户，每个响应都包含success字段，表示请求是否成功，成功为true, 失败为false。 如果失败，则还会包含一个error字段，表示错误原因；       
1.5 对获取的返回结果数据进行处理；       
   
---   
   
## **2 接口**   
## **2.1 AOB相关交易** 
DDN系统的所有写操作都是通过发起一个交易来完成的。 
交易数据通过一个叫做@ddn/node-sdk的库来构建，然后再通过一个POST接口发布出去。

POST接口规格如下：
payload为@ddn/node-sdk创建出来的交易数据
接口地址：/peer/transactions  
请求方式：post   
支持格式：json  
公用变量：
```
var DdnJS = require('@ddn/node-sdk').default;
// 一级密码
var secret = 'wild corn coil lizard runway flower outside vicious diesel aim slight become'
<!-- address: DNz4hQjV1KWo8LJwhQya9WANZsrhaziABG -->
// 二级密码
var secondSecret = 'ddnaobtest001'
```

### **2.1.1 注册资产发行商**
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|DdnJS.aob.createIssuer根据发行商名字、描述、一级密码、二级密码生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  

   
请求示例：   
```js   
// 发行商名称,唯一标识
var name = 'IssuerName'
// 发行商描述
var desc = 'IssuerDesc'
// 构造交易数据
var trs = DdnJS.aob.createIssuer(name, desc, secret, secondSecret)
console.log(JSON.stringify(trs))
{"type":9,"amount":0,"fee":10000000,"recipientId":null,"senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19395607,"asset":{"aobIssuer":{"name":"IssuerName","desc":"IssuerDesc"}},"signature":"c6ed2a4bafe2b8aa31f4aaceacc2a96cb028abbabb2ed062937498c58e24ca5467a340ddd63b67f809a680ff91b83e685c64991eb695494ddb2fdc57e5761607","signSignature":"8eceacbd47c2b8ed335145ced19d7a3a51f99bdd6631d16ed214180c6f80e29bd6d572f45e7c7d685584e55cb5c303cf340406553ece28c9c0a2fa7a777aac0b"}

// 将生成的交易数据通过post发送给server，注册资产发行商IssuerName
curl -H "Content-Type: application/json" -H "nethash:gar0fktt" -H "version:''" -k -X POST -d '{"transaction":{"type":60,"nethash":"gar0fktt","amount":"0","fee":"10000000000","recipientId":null,"senderPublicKey":"1e18845d5fbbdf0a6820610e042dcb9a250205964b8075a395453b4a1d1ed10c","timestamp":84671055,"message":null,"asset":{"aobIssuer":{"name":"rcpDa","desc":"资产描述"}},"signature":"f8f8bb32e84fda67bdbf6cef27b83ae13684e5e9b4cf1ea3d22e4c1c1d013d10028422ffa199717fe55b4e73470b9f0d33f0a7123059a2fe628f8e58c824900f"}}' 'http://120.221.161.39:8001/peer/transactions' && echo
```   
   
JSON返回示例：   
```js  
{"success":true}		
```

### **2.1.2 注册资产** 
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|DdnJS.aob.createAsset根据资产名字、描述、上限、精度、策略、一级密码、二级密码生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  

   
请求示例：   
```js   
// 资产名称，发行商名.资产名，唯一标识
var name = 'IssuerName.CNY'
var desc = '资产描述'
// 上限
var maximum = '1000000'
// 精度，小数点的位数，这里上限是1000000，精度为3，代表资产IssuerName.CNY的最大发行量为1000.000
var precision = 3
// 策略
var strategy = ''
// 构造交易数据
var trs = DdnJS.aob.createAsset(name, desc, maximum  , precision, strategy, secret, secondSecret)
console.log(JSON.stringify(trs))
{"type":10,"amount":0,"fee":10000000,"recipientId":null,"senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19397444,"asset":{"aobAsset":{"name":"IssuerName.CNY","desc":"资产描述","maximum":"1000000","precision":3,"strategy":""}},"signature":"c755587d331dd2eb62ef91dce1511d83a3e603c7cdc7548a16052519c21ea89c78364e35e5d46da0e2103fa2fb7f037eec55a5deba18826fa13e4252422d750e","signSignature":"1b7ed4c21c477b8ff3d2acfdfd7ff85617093f4c21de70938c46b61c9704b037dbcf7f9e5f5dd1a5dc8f22cf473aaa459e6e5b15ced388b8a1da1e307987a509"}

// 将生成的交易数据通过post发送给server，注册资产IssuerName.CNY
curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":10,"amount":0,"fee":10000000,"recipientId":null,"senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19397444,"asset":{"aobAsset":{"name":"IssuerName.CNY","desc":"资产描述","maximum":"1000000","precision":3,"strategy":""}},"signature":"c755587d331dd2eb62ef91dce1511d83a3e603c7cdc7548a16052519c21ea89c78364e35e5d46da0e2103fa2fb7f037eec55a5deba18826fa13e4252422d750e","signSignature":"1b7ed4c21c477b8ff3d2acfdfd7ff85617093f4c21de70938c46b61c9704b037dbcf7f9e5f5dd1a5dc8f22cf473aaa459e6e5b15ced388b8a1da1e307987a509"}}' 'http://localhost:8001/peer/transactions' && echo
```   
   
JSON返回示例：   
```js  
{"success":true}		
```

### **2.1.3 资产设置acl模式** 
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|DdnJS.aob.createFlags根据资产名、流通状态、黑白名单模式、一级密码、二级密码生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  

   
请求示例：   
```js   
var currency = 'IssuerName.CNY'
// 资产是否注销，1：流通，2：注销
var flagType = 1
// 访问控制列表的类型，0：黑名单， 1：白名单，资产创建后默认为黑名单模式
var flag = 1
var trs = DdnJS.aob.createFlags(currency, flagType, flag, secret, secondSecret)
console.log(JSON.stringify(trs))
{"type":11,"amount":0,"fee":10000000,"recipientId":null,"senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19400996,"asset":{"aobFlags":{"currency":"IssuerName.CNY","flagType":1,"flag":1}},"signature":"b96fb3d1456e1f26357109cc24d82834eb9a4687f29e69c374bbb1d534568336e148cac52f213aa4d2a69185092f8e1143b49ec4b8048cd9b3af4e20f6ba0b08","signSignature":"b37c77ebebe90341346be2aefe1e12bd7403e5d8f4d6e8f04630190b3e09494a28820da0ffd5f9ff011033aa6d70fc9bb4c159a4493be3b18fd7ff470103570d"}

// 将生成的交易数据通过post发送给server，将acl改为白名单模式
curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":11,"amount":0,"fee":10000000,"recipientId":null,"senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19400996,"asset":{"aobFlags":{"currency":"IssuerName.CNY","flagType":1,"flag":1}},"signature":"b96fb3d1456e1f26357109cc24d82834eb9a4687f29e69c374bbb1d534568336e148cac52f213aa4d2a69185092f8e1143b49ec4b8048cd9b3af4e20f6ba0b08","signSignature":"b37c77ebebe90341346be2aefe1e12bd7403e5d8f4d6e8f04630190b3e09494a28820da0ffd5f9ff011033aa6d70fc9bb4c159a4493be3b18fd7ff470103570d"}}' 'http://localhost:8001/peer/transactions' && echo
```   
   
JSON返回示例：   
```js  
{"success":true}		
```

### **2.1.4 更新访问控制列表（acl）** 
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|DdnJS.aob.createAcl根据资产名字、列表操作方法、黑名单还是白名单、地址列表、一级密码、二级密码生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  

   
请求示例：   
```js   
var currency = 'IssuerName.CNY'
// '+'表示增加列表， ‘-’表示删除列表
var operator = '+'
var list = ['15745540293890213312']
// 访问控制列表的类型，0：黑名单， 1：白名单
var flag =1
var trs = DdnJS.aob.createAcl(currency, operator, flag, list, secret, secondSecret)
console.log(JSON.stringify(trs))
{"type":12,"amount":0,"fee":20000000,"recipientId":null,"senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19403125,"asset":{"aobAcl":{"currency":"IssuerName.CNY","operator":"+","flag":1,"list":["15745540293890213312"]}},"signature":"ad4060e04c1a12256de114e34499f8add24326753f1f8362991ee14aefc4c0fe90ff394d2db97e83770855a5688d463de00656fdd2d04604605cf3c04fdaca0e","signSignature":"63129c58b1b9fcce88cbe829f3104a10ab06037253e9b65feb50ce0d2bb988533b93e8edcad016a85675f9027758fc318cf899ca7ef161a95a8d8a055ae83a02"}

// 将生成的交易数据通过post发送给server，把地址列表['15745540293890213312']增加到该白名单中，只修改名单列表，不修改acl模式，手续费0.2DDN
curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":12,"amount":0,"fee":20000000,"recipientId":null,"senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19403125,"asset":{"aobAcl":{"currency":"IssuerName.CNY","operator":"+","flag":1,"list":["15745540293890213312"]}},"signature":"ad4060e04c1a12256de114e34499f8add24326753f1f8362991ee14aefc4c0fe90ff394d2db97e83770855a5688d463de00656fdd2d04604605cf3c04fdaca0e","signSignature":"63129c58b1b9fcce88cbe829f3104a10ab06037253e9b65feb50ce0d2bb988533b93e8edcad016a85675f9027758fc318cf899ca7ef161a95a8d8a055ae83a02"}}' 'http://localhost:8001/peer/transactions' && echo
```   
   
JSON返回示例：   
```js  
{"success":true}
// 查询更新后的列表（acl/1代表白名单）
curl -X GET -H "Content-Type: application/json" 'http://localhost:8001/api/aob/assets/IssuerName.CNY/acl/1?limit=10&offset=0' && echo
{
	"success": true,
	"list": [{
		"address": "15745540293890213312"
	}],
	"count": 1
}
```


### **2.1.5 资产发行** 
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|DdnJS.aob.createIssuer根据发行商名字、描述、一级密码、二级密码生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  

   
请求示例：   
```js   
var currency = 'IssuerName.CNY'
// 本次发行量=真实数量（100）*10**精度（3），所有发行量之和需 <= 上限*精度
var amount = '100000'
var trs = DdnJS.aob.createIssue(currency, amount, secret, secondSecret)
console.log(JSON.stringify(trs))
{"type":13,"amount":0,"fee":10000000,"recipientId":null,"senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19475744,"asset":{"aobIssue":{"currency":"IssuerName.CNY","amount":"100000"}},"signature":"32b01a18eca2b0dc7e2ce77ba4e758eaae2532f60844760a762cc20918e7439ac6ca585b921db6ede833ed0bf1c62e30cec545a928abafe0b679183a6ad02202","signSignature":"4fc290d7d7d788e9112a56233df0fe796cba39be3efa0cebf00cbc7e5bc5fd1369fad49e5698d967845b5c02e427926049cab25845d4d385e4a395791906f909"}

curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":13,"amount":0,"fee":10000000,"recipientId":null,"senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19475744,"asset":{"aobIssue":{"currency":"IssuerName.CNY","amount":"100000"}},"signature":"32b01a18eca2b0dc7e2ce77ba4e758eaae2532f60844760a762cc20918e7439ac6ca585b921db6ede833ed0bf1c62e30cec545a928abafe0b679183a6ad02202","signSignature":"4fc290d7d7d788e9112a56233df0fe796cba39be3efa0cebf00cbc7e5bc5fd1369fad49e5698d967845b5c02e427926049cab25845d4d385e4a395791906f909"}}' 'http://localhost:8001/peer/transactions' && echo
```   
   
JSON返回示例：   
```js  
{"success":true}			
```

### **2.1.6 资产转账** 
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|DdnJS.aob.createTransfer根据资产名字、数量、接收者地址、一级密码、二级密码生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  

   
请求示例：   
```js   
var currency = 'IssuerName.CNY'
// 本次转账数（10000）=真实数量（10）*10**精度（3），需 <= 当前资产发行总量
var amount = '10000'
// 接收地址，需满足前文定义好的acl规则
var recipientId = 'AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a'
var message = 'xxxxx(交易所ID)'

var trs = DdnJS.aob.createTransfer(currency, amount, recipientId, message, secret, secondSecret)
console.log(JSON.stringify(trs))
{"type":14,"amount":0,"fee":10000000,"recipientId":"AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a","senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19481489,"asset":{"aobTransfer":{"currency":"IssuerName.CNY","amount":"10000"}},"signature":"77789071a2ad6d407b9d1e0d654a9deb6d85340a3d2a13d786030e26ac773b4e9b5f052589958d2b8553ae5fc9449496946b5c225e0baa723e7ddecbd89f060a","signSignature":"f0d4a000aae3dd3fa48a92f792d4318e41e3b56cdbaf98649261ae34490652b87645326a432d5deb69f771c133ee4b67d2d22789197be34249e6f7f0c30c1705"}

// 给AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a发送10.000 IssuerName.CNY资产
curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":14,"amount":0,"fee":10000000,"recipientId":"AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a","senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19481489,"asset":{"aobTransfer":{"currency":"IssuerName.CNY","amount":"10000"}},"signature":"77789071a2ad6d407b9d1e0d654a9deb6d85340a3d2a13d786030e26ac773b4e9b5f052589958d2b8553ae5fc9449496946b5c225e0baa723e7ddecbd89f060a","signSignature":"f0d4a000aae3dd3fa48a92f792d4318e41e3b56cdbaf98649261ae34490652b87645326a432d5deb69f771c133ee4b67d2d22789197be34249e6f7f0c30c1705"}}' 'http://localhost:8001/peer/transactions' && echo
```   
   
JSON返回示例：   
```js  
{"success":true}		
```
 
### **2.1.7 资产注销** 
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|DdnJS.aob.createFlags根据资产名字、注销状态、黑白名单模式、一级密码、二级密码生成的交易数据|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  

   
请求示例：   
```js   
var currency = 'IssuerName.CNY'
// flagType为资产是否注销，1：流通，2：注销
var flagType = 2
// flag为黑、白名单模式
var flag =1
var trs = DdnJS.aob.createFlags(currency, flagType, flag, secret, secondSecret)
console.log(JSON.stringify(trs))
{"type":11,"amount":0,"fee":10000000,"recipientId":null,"senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19488690,"asset":{"aobFlags":{"currency":"IssuerName.CNY","flagType":2,"flag":1}},"signature":"cbd656552417604704703e1236ec2bbed8eba6a2ccfcb54cc0b2d629c0a9d1335a264fc9f6dee1705f4a86c36a5ce2ba8e039d913a189b7c273c8ac0d9e3780c","signSignature":"3c7b91d03efeed2dc86e1f2301da60789751c1be8850460d8c66c0ae8f55ea27d26f0bc79541d74b4777d9b85c518c1c73c0284dbf3e826db0a686560e57a80b"}

curl -H "Content-Type: application/json" -H "nethash:0ab796cd" -H "version:''" -k -X POST -d '{"transaction":{"type":11,"amount":0,"fee":10000000,"recipientId":null,"senderPublicKey":"fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575","timestamp":19488690,"asset":{"aobFlags":{"currency":"IssuerName.CNY","flagType":2,"flag":1}},"signature":"cbd656552417604704703e1236ec2bbed8eba6a2ccfcb54cc0b2d629c0a9d1335a264fc9f6dee1705f4a86c36a5ce2ba8e039d913a189b7c273c8ac0d9e3780c","signSignature":"3c7b91d03efeed2dc86e1f2301da60789751c1be8850460d8c66c0ae8f55ea27d26f0bc79541d74b4777d9b85c518c1c73c0284dbf3e826db0a686560e57a80b"}}' 'http://localhost:8001/peer/transactions' && echo
```   
   
JSON返回示例：   
```js  
{"success":true}		
```  


### **2.1.8 其它接口**  
get /peer/all  //查找dapp peer   
get /peer/blocks/common //查找common block   
...    



## **2.2 用户自定义资产aob**  

### **2.2.1 创建资产**   
接口地址：/api/aob/transfers   
请求方式：PUT   
支持格式：json   
接口备注：   
请求参数说明：   

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|secret |string |Y    |发送者密码,最大长度100       |   
|currency |string |Y    |资产名，最大长度22       |   
|amount |string |Y    |转账金额，最大长度50       |   
|recipientId |string |Y    |接收地址，最小长度1       |  
|publicKey|string|N|发送者公钥，格式必须符合公钥格式|  
|secondSecret|string|N|发送者二级密码，最小长度1，最大长度：100|   
|multisigAccountPublicKey|string|N|多签账户公钥，格式必须符合公钥格式|   
|message|string|N|转账备注，最大长度256| 

   
返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功获得response数据。|    
|transactionId|string  |交易id      |    
   
   
请求示例：   
```bash   
// 转0.01 absorb.YLB给D2zThPTQZDNQqXbe5tikDQ24YyCQTCpbSC
curl -k -H "Content-Type: application/json" -X PUT -d '{"secret":"found knife gather faith wrestle private various fame cover response security predict","amount":"1000000","recipientId":"D2zThPTQZDNQqXbe5tikDQ24YyCQTCpbSC","currency":"absorb.YLB"}' 'http://localhost:8001/api/aob/transfers' && echo   
```   
   
JSON返回示例：   
```js   
{   
	"success": true,   
	"transactionId": "3cb6d97534a3b90cf7fc883927f0a9a7c7f4878a9df526c2906ca97e250fcaba"   
}   
```  

### **2.2.2 获取全网所有发行商**  
接口地址：/api/aob/issuers  
请求方式：get   
支持格式：urlencoded 

请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|limit|integer|N|限制结果集个数，最小值：0,最大值：100|
|offset|integer|N|偏移量，最小值0|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|issuers|list|元素为字典，每个字典代表一个发行商，包含发行商名字、描述、id（Ddn地址）|
|count|integer|发行商总个数|

请求示例：   
```js   
curl -X GET -H "Content-Type: application/json"  'http://loc:8001/api/aob/issuers?offset=0&limit=1' && echo
```   
   
JSON返回示例：   
```js  
{
	"success": true,
	"issuers": [{
		"name": "huoding",
		"desc": "注册资产发行商-测试",
		"issuerId": "AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a"
	},
	{
		"name": "speedtest",
		"desc": "speedtest",
		"issuerId": "AEVWQWAq3TEJkCPSDxXMP2uCRrL2xbQnsy"
	}],
	"count": 6
}		
``` 

### **2.2.3 查询指定发行商的信息** 
接口地址：/api/aob/issuers/:name  
请求方式：get   
支持格式：urlencoded 

请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|name|string|Y|可以为发行商名称或Ddn账户地址|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|issuers|dict|包含发行商名字、描述、id（Ddn地址）|
   
请求示例：   
```js   
curl -X GET -H "Content-Type: application/json"  'http://localhost:8001/api/aob/issuers/D9qa6bvWASFZrGDXm4DxDsVMr2jx8LwATx' && echo
```   
   
JSON返回示例：   
```js  
{
    "success": true,
    "result": {
        "transaction_id": "d09b391710b4b9a608a6357bee57193b9a34c1b1b8198a8fa2d3a42bbb7fe2305fe3953ef63b2329bd90719333fe3d5ffcbf617b3a28c2e7a062dce90cfa45b1",
        "transaction_type": 60,
        "timestamp": 82989248,
        "name": "YgdXSOvacD",
        "issuer_id": "D9qa6bvWASFZrGDXm4DxDsVMr2jx8LwATx",
        "desc": "valid desc"
    }
}		
``` 

### **2.2.4 查看指定发行商的资产** 
接口地址：/api/aob/assets/issuers/:name/assets  
请求方式：get   
支持格式：urlencoded 

请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|name|string|Y|可以为发行商名称或Ddn账户地址|
|limit|integer|N|限制结果集个数，最小值：0,最大值：100|
|offset|integer|N|偏移量，最小值0|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|assets|list|每个元素是一个字典，每个字典是一个资产详情，包含资产名字、描述、上限（最大发行量=真实发行量*10**精度）、精度、策略、当前发行量、发行高度、发行商id，acl模式（0：黑名单，1：白名单）、是否注销|
|count|interger|该发行商注册的资产总个数（包含已注销的）|

   
   
请求示例：   
```js   
curl -X GET -H "Content-Type: application/json"  'http://localhost:8001/api/aob/assets/issuers/huoding/assets?offset=0&limit=2' && echo
```   
   
JSON返回示例：   
```js  
{
	"success": true,
	"assets": [{
		"name": "huoding.AOB",
		"desc": "注册资产-测试",
		"maximum": "10000000",
		"precision": 3,
		"strategy": "",
		"quantity": "1000000",
		"height": 301,
		"issuerId": "AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a",
		"acl": 0,
		"writeoff": 1
	}],
	"count": 1
}		
``` 

### **2.2.5 获取全网所有资产信息** 
接口地址：/api/aob/assets/  
请求方式：get   
支持格式：urlencoded 

请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|limit|integer|N|限制结果集个数，最小值：0,最大值：100|
|offset|integer|N|偏移量，最小值0|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|assets|list|每个元素是一个字典，每个字典是一个资产详情，包含资产名字、描述、上限、精度、策略、当前发行量、发行高度、发行商id，acl、是否注销|
|count|integer|所有资产的个数|

   
   
请求示例：   
```js   
curl -X GET -H "Content-Type: application/json"  'http://localhost:8001/api/aob/assets?offset=0&limit=2' && echo
```   
   
JSON返回示例：   
```js  
{
	"success": true,
	"assets": [{
		"name": "huoding.AOB",
		"desc": "注册资产-测试",
		"maximum": "10000000",
		"precision": 3,
		"strategy": "",
		"quantity": "1000000",
		"height": 301,
		"issuerId": "AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a",
		"acl": 0,
		"writeoff": 1
	},
	{
		"name": "speedtest.SPEED",
		"desc": "测速",
		"maximum": "10000",
		"precision": 1,
		"strategy": "",
		"quantity": "10000",
		"height": 380,
		"issuerId": "AEVWQWAq3TEJkCPSDxXMP2uCRrL2xbQnsy",
		"acl": 0,
		"writeoff": 0
	}],
	"count": 13
}		
``` 

### **2.2.6 获取指定资产信息** 
接口地址：/api/aob/assets/:name  
请求方式：get   
支持格式：urlencoded 

请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|name|string|Y|资产名|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|assets|dict|包含资产名字、描述、上限、精度、策略、当前发行量、发行高度、发行商id，acl、是否注销|
   
请求示例：   
```js   
curl -X GET -H "Content-Type: application/json"  'http://localhost:8001/api/aob/assets/huoding.AOB' && echo
```   
   
JSON返回示例：   
```js  
{
	"success": true,
	"asset": {
		"name": "huoding.AOB",
		"desc": "注册资产-测试",
		"maximum": "10000000",
		"precision": 3,
		"strategy": "",
		"quantity": "1000000",
		"height": 301,
		"issuerId": "AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a",
		"acl": 0,
		"writeoff": 1
	}
}		
``` 

### **2.2.7 获取指定资产的访问控制列表（acl）** 
接口地址：/api/aob/assets/:name/acl/flag  
请求方式：get   
支持格式：urlencoded 

请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|name|string|Y|资产名|
|flag|boolean|Y|取值0和1，0表示黑名单，1表示白名单|
|limit|integer|N|限制结果集个数，最小值：0,最大值：100|
|offset|integer|N|偏移量，最小值0|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|list|list|符合规则的账户列表|
|count|integer|符合规则账户总数|

   
请求示例：   
```js   
// 获取资产huoding.AOB白名单中的地址列表
curl -X GET -H "Content-Type: application/json"  'http://localhost:8001/api/aob/assets/huoding.AOB/acl/1' && echo
```   
   
JSON返回示例：   
```js  
{
	"success": true,
	"list": [{
		"address": "15745540293890213312"
	},
	{
		"address": "AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a"
	}],
	"count": 2
}		
``` 

### **2.2.8 获取指定账户所有aob的余额** 
接口地址：/api/aob/balances/:address  
请求方式：get   
支持格式：urlencoded 

请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|address|string|Y|账户地址|
|limit|integer|N|限制结果集个数，最小值：0,最大值：100|
|offset|integer|N|偏移量，最小值0|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|balances|list|拥有的资产详情列表，每个元素是一个资产，包含资产名、余额、上限、精度、当前发行量、是否注销（0：未注销，1：已注销）|
|count|integer|当前该地址拥有的资产个数|
   
请求示例：   
```js   
curl -X GET -H "Content-Type: application/json" 'http://localhost:8001/api/aob/balances/AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a' && echo
```   
   
JSON返回示例：   
```js  
{
	"success": true,
	"balances": [{
		"currency": "huoding.AOB",
		"balance": "900000",
		"maximum": "10000000",
		"precision": 3,
		"quantity": "1000000",
		"writeoff": 1
	},
	{
		"currency": "speedtest.SPEED",
		"balance": "400",
		"maximum": "10000",
		"precision": 1,
		"quantity": "10000",
		"writeoff": 0
	}],
	"count": 2
}		
```

### **2.2.9 获取指定账户所有资产相关操作记录** 
接口地址：/api/aob/transfers/my/:address  
请求方式：get   
支持格式：urlencoded  
备注：包含发行商创建以及资产创建、发行、转账等  

请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|address|string|Y|账户地址|
|limit|integer|N|限制结果集个数，最小值：0,最大值：100|
|offset|integer|N|偏移量，最小值0|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|transactions|list|交易列表，每个元素是一个字典代表一次交易，包含交易id、区块高度、区块id、交易类型、时间戳、发送者公钥、发送者id、接收者id（系统为空，如资产注册）、交易数量（资产交易都为0）、手续费0.1DDN、签名、多重签名、确认数、资产信息（包含发行商id、发行商名字、描述）、交易id。|
|count|integer|资产交易总个数|
   
请求示例：   
```js   
curl -X GET -H "Content-Type: application/json"  'http://localhost:8001/api/aob/transfers/my/transactions/16358246403719868041?offset=0&limit=2' && echo
```   
   
JSON返回示例：   
```js  
{
	"success": true,
	"transactions": [{
		"id": "12372526051670720162",   // 交易id
		"height": "286",    // 交易所在区块高度
		"blockId": "14863181420651287815",  // 交易所在区块id
		"type": 9,  // 交易类型，9代表注册发行商
		"timestamp": 17597873,  // 交易时间，距离创世块的offset
		"senderPublicKey": "d39d6f26869067473d685da742339d1a9117257fe14b3cc7261e3f2ed5a339e3",  // 交易发起者公钥
		"senderId": "AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a",   // 交易发起者id
		"recipientId": "",  //  接收者id，如果是系统则为空
		"amount": 0,    //  交易数量，如果是资产或者DDN则为非0，否则为0
		"fee": 10000000,    // 交易费
		"signature": "6a1e66387f610de5a89489105697082037b82bff4fb6f95f9786304176efe59f7d41e8fe9c5501e1b0b34a47e957a38e10e940fdb180f8ebcaf0ac062a63c601", // 交易签名
		"signSignature": "",    // 二级签名，有二级密码时才有
		"signatures": null, // 多重签名，使用多重签名账户时才有
		"confirmations": "155998",  // 交易确认数
		"asset": {
			"aobIssuer": {
				"transactionId": "12372526051670720162",    // 交易id
				"name": "huoding",   // 发行商名字
				"desc": "注册资产发行商-测试"   // 发行商描述
			}
		},
		"t_id": "12372526051670720162"  // 交易id
	},
	{
		"id": "17308768226103450697",
		"height": "371",
		"blockId": "244913990990213995",
		"type": 9,
		"timestamp": 17598730,
		"senderPublicKey": "7bd645f9626820d390311fb28dc30875e8bd26cce2d04ba2809df82e84088020",
		"senderId": "AEVWQWAq3TEJkCPSDxXMP2uCRrL2xbQnsy",
		"recipientId": "",
		"amount": 0,
		"fee": 10000000,
		"signature": "6ea76ff6f58f1bc99d6b40ece45e371948db58a68f6fa41e13b34ff86bbf1f0bea53d6afe982562392861727f879205efc7d1342f6e963028985e243a94e5507",
		"signSignature": "",
		"signatures": null,
		"confirmations": "155913",
		"asset": {
			"aobIssuer": {
				"transactionId": "17308768226103450697",
				"name": "speedtest",
				"desc": "speedtest"
			}
		},
		"t_id": "17308768226103450697"
	}],
	"count": 58
}		
```


说明：
    注意这里asset内容与type相关，9 <= type <= 14， 根据不同的type从asset中取出不同的值，详情如下：

```
type=9
"asset": {
                "aobIssuer": {
                    "transactionId": "260434858608363290",
                    "name": "issuername",
                    "desc": "issuer1_desc"
                }
            },
展示： 注册了发行商"issuername"
```

```
type=10
"asset": {
                "aobAsset": {
                    "transactionId": "11613326283813789432",
                    "name": "issuername.BTC",
                    "desc": "asset1_desc",
                    "maximum": "10000000000000",
                    "precision": "6",
                    "strategy": ""
                }
            },
展示： 注册了资产"issuername.BTC"
```

```
type=11
"asset": {
                "aobFlags": {
                    "transactionId": "14649028077581400942",
                    "currency": "issuername.BTC",
                    "flagType": "1",
                    "flag": "1"
                }
            },
展示: 
如果$flagType==1 ： 资产issuername.BTC访问控制设置为(flag==0?黑名单：白名单)
如果$flagType==2 ： 资产issuername.BTC被注销
```

```
type=12
"asset": {
                "aobAcl": {
                    "transactionId": "16597707943986371131",
                    "currency": "issuername.BTC",
                    "operator": "+",
                    "flag": "1",
                    "list": [
                        "196751217687897827",
                        "11053997261735317227"
                    ]
                }
            },
展示：资产issuername.BTC更新了访问控制列表
```

```
type=13
"asset": {
                "aobIssue": {
                    "transactionId": "10646196155790595088",
                    "currency": "issuername.BTC",
                    "amount": "10000000000"
                }
            },
展示： 资产issuername.BTC新发行10000000000(实际数量*精度)
```

```
type=14
"asset": {
                "aobTransfer": {
                    "transactionId": "9105235822289198060",
                    "currency": "issuername.BTC",
                    "amount": "10"
                }
            },
展示：转账10个issuername.BTC资产，交易id是9105235822289198060
```


   


### **2.2.10 获取指定账户指定资产的余额** 
接口地址：/api/aob/assets/balances/:address/:currency  
请求方式：get   
支持格式：urlencoded 

请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|address|string|Y|Ddn地址|
|currency|string|Y|资产名字|
|limit|integer|N|限制结果集个数，最小值：0,最大值：100|
|offset|integer|N|偏移量，最小值0|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|balances|dict|包含资产名、余额、最大发行量、精度、当前发行量、是否注销|
   
请求示例：   
```js   
curl -X GET -H "Content-Type: application/json"  'http://localhost:8001/api/aob/assets/balances/16358246403719868041/IssuerName.CNY' && echo
```   
   
JSON返回示例：   
```js  
{
	"success": true,
	"balance": {
		"currency": "IssuerName.CNY",
		"balance": "80000",
		"maximum": "1000000",
		"precision": 3,
		"quantity": "100000",
		"writeoff": 1
	}
}	
```

### **2.2.11 获取指定账户指定资产转账记录** 
接口地址：/api/aob/transfers/my/:address/:currency  
请求方式：get   
支持格式：urlencoded  
备注：只返回资产转账记录  

请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|address|string|Y|Ddn地址|
|currency|string|Y|资产名字|
|limit|integer|N|限制结果集个数，最小值：0,最大值：100|
|offset|integer|N|偏移量，最小值0|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|transactions|list|交易列表，每个元素是一个字典代表一次交易，包含交易id、区块高度、区块id、交易类型、时间戳、发送者公钥、发送者id、接收者id（系统为空，如资产注册）、交易数量（资产交易都为0）、手续费0.1DDN、签名、多重签名、确认数、资产信息（包含发行商id、发行商名字、描述）、交易id。|  
|count|integer|资产交易总个数|  
   
请求示例：   
```js   
curl -X GET -H "Content-Type: application/json"  'http://localhost:8001/api/aob/transfers/my/16358246403719868041/IssuerName.CNY' && echo
```   
   
JSON返回示例：   
```js  
{
	"success": true,
	"transactions": [{
		"id": "d6102fc30931e4dc449811cbbab705fd64bc79b09de703e8172f7bdd90835abc",
		"height": "173109",
		"blockId": "baa23acd566780e338436b48e4eb79a87d3bdd67caeb3812a663da8f77ae87d9",
		"type": 14,
		"timestamp": 19481489,
		"senderPublicKey": "fafcd01f6b813fdeb3c086e60bc7fa9bfc8ef70ae7be47ce0ac5d06e7b1a8575",
		"senderId": "16358246403719868041",
		"recipientId": "AKKHPvQb2A119LNicCQWLZQDFxhGVEY57a",
		"amount": 0,
		"fee": 10000000,
		"signature": "77789071a2ad6d407b9d1e0d654a9deb6d85340a3d2a13d786030e26ac773b4e9b5f052589958d2b8553ae5fc9449496946b5c225e0baa723e7ddecbd89f060a",
		"signSignature": "f0d4a000aae3dd3fa48a92f792d4318e41e3b56cdbaf98649261ae34490652b87645326a432d5deb69f771c133ee4b67d2d22789197be34249e6f7f0c30c1705",
		"signatures": null,
		"confirmations": "90853",
		"asset": {
			"aobTransfer": {
				"transactionId": "d6102fc30931e4dc449811cbbab705fd64bc79b09de703e8172f7bdd90835abc",
				"currency": "IssuerName.CNY",
				"amount": "10000",
				"amountShow": "10"
			}
		},
		"t_id": "d6102fc30931e4dc449811cbbab705fd64bc79b09de703e8172f7bdd90835abc"
	}],
	"count": 15
}	
```

### **2.2.12 获取指定资产转账记录** 
接口地址：/api/aob/transfers/:currency  
请求方式：get   
支持格式：urlencoded  
备注：只返回指定资产转账记录 

请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|currency|string|Y|资产名字|
|limit|integer|N|限制结果集个数，最小值：0,最大值：100|
|offset|integer|N|偏移量，最小值0|

返回参数说明：   

|名称	|类型   |说明              |   
|------ |-----  |----              |   
|success|boolean  |是否成功 |  
|transactions|list|交易列表，每个元素是一个字典代表一次交易，包含交易id、区块高度、区块id、交易类型、时间戳、发送者公钥、发送者id、接收者id（系统为空，如资产注册）、交易数量（资产交易都为0）、手续费0.1DDN、签名、多重签名、确认数、资产信息（包含发行商id、发行商名字、描述）、交易id。|  
|count|integer|该资产交易总数|  
   
请求示例：   
```js   
// 查询引力波资产absorb.YLB的所有转账记录 
curl -X GET -H "Content-Type: application/json" 'http://127.0.0.1:8001/api/aob/transfers/absorb.YLB' && echo
```   
   
JSON返回示例：   
```js  
{
	success: true,
	transactions: [{
		id: "a1ff79e3f37fd73b41abd293c22171ac7760160ad457e55f028e7a8b527651d3",
		height: "43",
		blockId: "b16b87e79b47edffdc2fd93bd1de70cbe3541684d5dbf8dc1d292903275e03dc",
		type: 14,
		timestamp: 39167334,
		senderPublicKey: "2856bdb3ed4c9b34fd2bba277ffd063a00f703113224c88c076c0c58310dbec4",
		senderId: "ANH2RUADqXs6HPbPEZXv4qM8DZfoj4Ry3M",
		recipientId: "AMzDw5BmZ39we18y7Ty9VW79eL9k7maZPH",
		amount: 0,
		fee: 10000000,
		signature: "a4e6b0e2c265e0d601fdfc9e82d971e7908457383835b801c725cdaac01bd619a435344241c64247599255f43a43b6576e1da3a357eac5bbd7058e013a8aa60e",
		signSignature: "",
		signatures: null,
		confirmations: "809",
		args: null,
		message: "",
		asset: {
			aobTransfer: {
				transactionId: "a1ff79e3f37fd73b41abd293c22171ac7760160ad457e55f028e7a8b527651d3",
				currency: "absorb.YLB",
				amount: "200000000",
				amountShow: "2",
				precision: 8
			}
		}
	},
	{
		id: "7cf50223e12b6eb51096353a066befcf2ef862bdd4d4eddcba28a79aa0249af9",
		height: "809",
		blockId: "278b096893bc028bb79692faec02de8c2f367804485b71f14e46027f3dd3000c",
		type: 14,
		timestamp: 39182041,
		senderPublicKey: "b33b5fc45640cfc414981985bf92eef962c08c53e1a34f90dab039e985bb5fab",
		senderId: "AMzDw5BmZ39we18y7Ty9VW79eL9k7maZPH",
		recipientId: "1",
		amount: 0,
		fee: 10000000,
		signature: "560bd31a4efe103ef9bd92f52cae5cf5a3b2aeb90fc83298498ff4126705e0433f751169bc32a3a7cfe894c7d8586d7182ebc790f2311daf9f02b881dc2aca0e",
		signSignature: "",
		signatures: null,
		confirmations: "43",
		args: null,
		message: "",
		asset: {
			aobTransfer: {
				transactionId: "7cf50223e12b6eb51096353a066befcf2ef862bdd4d4eddcba28a79aa0249af9",
				currency: "absorb.YLB",
				amount: "100000000",
				amountShow: "1",
				precision: 8
			}
		}
	}],
	count: 2
}
```   
