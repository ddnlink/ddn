
# 安装

在package/peer中安装
```bash
npm install @ddn/asset-supervise --save
```
# 使用
 
 在.ddnrc.js文件中配置如下

```bash
 assets: [
  ...
    "@ddn/asset-supervise",
  ...
  ],
```

# 屏蔽违规内容

## 上传屏蔽交易
请求参数说明：

|名称	|类型   |必填 |说明              |   
|------ |-----  |---  |----              |   
|transaction|json|Y|DdnJs.supervise.createSupervise根据txHash(对应交易id）、op:管控指令：destroy（过滤整个内容）、harmless(从滤敏感词转标记为无害)|

返回参数说明：

|名称|类型|说明|
|------|-----|----|
|success|boolean|是否成功获得response数据。|
|transactionId|string|交易id|

   
请求示例：   
```js   
let supervise={
  txHash:"2b6865011739b3b7e7a564a06609ba3a937cea718f873c0f650bcfe8cac96f34fc8e796da0c0161e911d7c5d6e5c8c9deedfd156beff2438fd185392a1fe4b8f",//交易id
  op:"destroy" // 屏蔽类型
}
 let transaction=await DdnJs.supervise.createSupervise(supervise,Eaccount.password)
 console.log(JSON.stringify({transaction}))
}
结果

{"transaction":{"type":90,"nethash":"0ab796cd","amount":"0","fee":"0","recipientId":null,"senderPublicKey":"155a780f875a3c384c1a0856e36b2de7e145a9738e72f9a75a85d26a16471757","timestamp":95972015,"asset":{"supervise":{"txHash":"2b6865011739b3b7e7a564a06609ba3a937cea718f873c0f650bcfe8cac96f34fc8e796da0c0161e911d7c5d6e5c8c9deedfd156beff2438fd185392a1fe4b8f","op":"destroy"}},"signature":"75b46d7d3143d30547151b98307f9b135edef731380dbdebcb685da44e0f274e645153538268172e93e521fe6d4546a786dd7c6860878005238e834d38cdff08","id":"732afc1de17b16b57774b9ea6b98de0a54841fd3ea309f27115adb63a81a690c0b54f3b4f51708f3877d92108571f88b6266ea2b22b2355f8ee6582fdfaa53da"}}

发送交易
curl --location --request POST 'http://localhost:8001/peer/transactions' \
--header 'nethash: 0ab796cd' \
--header 'version: ""' \
--header 'Content-Type: application/json' \
--data-raw '{"transaction":{"type":90,"nethash":"0ab796cd","amount":"0","fee":"0","recipientId":null,"senderPublicKey":"155a780f875a3c384c1a0856e36b2de7e145a9738e72f9a75a85d26a16471757","timestamp":95971335,"asset":{"supervise":{"txHash":"2b6865011739b3b7e7a564a06609ba3a937cea718f873c0f650bcfe8cac96f34fc8e796da0c0161e911d7c5d6e5c8c9deedfd156beff2438fd185392a1fe4b8f","op":"destroy"}},"signature":"c1cae6624a38081d65183e2eb4a2d8ad251456aead1c0ce8840710eb9021960211ec1823fcc5873413696b316f94e149400ca52a2ecec7ff434f7897506a6602","id":"13a9d70bedefac6f9690fac087e5972bd5da2b1d2491a2b7838b2211de5ae84043b49dba9f375c4ff58da025ab201a2890dc839bc73b4eee8e0e0e652759dd96"}}'
```
## 查询屏蔽结果

```bash
curl --location --request GET 'http://localhost:8001/api/transactions/get?id=2b6865011739b3b7e7a564a06609ba3a937cea718f873c0f650bcfe8cac96f34fc8e796da0c0161e911d7c5d6e5c8c9deedfd156beff2438fd185392a1fe4b8f' \
--header 'nethash: 0ab796cd' \
--header 'version: '
```

# 监管接口说明

# 1 链上监管-下达巡检指令
方向：监管系统 -> 受监管链 
对受监管链下达巡检指令，受监管链接受该指令后返回响应表示接受该任务，并异步进行巡检，巡检完成后调用接口1003汇报巡检结果。

对于受监管链而言：可以设置一个阈值，在该阈值时间内最多只接受一个活跃的巡检任务，以避免监管系统错误的频繁请求导致受监管链消耗大量的资源用于响应巡检需求（由于巡检任务会触发关键词检测，这个设计也同样保护监管系统的关键词服务）。

 巡检：指全盘检测区块链上每一笔交易(例如遍历创世块到最新区块的每一笔交易)，并对交易内容做敏感词检测[(3.1 1000 敏感词检测)](#3.1 1000 敏感词检测)，命中敏感词的交易进行上报[(3.4 1003 链上监管-上报巡检结果)](#3.4 1003 链上监管-上报巡检结果) 。

请求
POST /v1/sys/inspection

```JSON
{
  "taskId": "a55d649f3fc8464a7d32193d04a7e7"
}
```
参数说明

|名称	|类型 |必填 |说明|   
|------|-----|---|----              |   
taskId|string|是任务id，在接口1003会用到

响应
成功响应
```JSON
{
  "success": true,
  "message": "ok"
}
```
失败响应
```JSON
{
  "success": false,
  "message": "失败原因"
}
```

## 2  下发管控指令
方向：监管系统 -> 受监管链 
监管系统可以对接口1001和接口1003的内容下发管控指令，由监管系统对业务链包含敏感词的交易下达监管及屏蔽操作，业务链收到指令后需要安装指令对相关交做出屏蔽或过滤，防止其在公众领域进行传播。

此接口需要受监管链进行实现，监管平台将根据受监管链IP：端口号或域名向受监管链发送该请求。

若重复下达命令则幂等处理。

请求
POST /v1/sys/cmd    

```JSON
{
  "txHash": "0x128acf9e443f371b8ebfb1082384ed2b64eade57fe6611ff5c5ccf697461ddc4",
  "op": "destroy"
}
```
参数说明



|名称	|类型 |必填 |说明|   
|------|-----|---|----              |  
txHash|string|是|交易哈希|
op|String|是|管控指令：destroy（过滤整个内容）、harmless(从滤敏感词转标记为无害)

不同类型op对应的处理方式：

destroy: 对该交易全部内容过滤，可以用内容违反相关法规，不予显示替代
harmless:对已过滤敏感词，转标记为无害
响应
成功响应
```JSON
{
  "success": true,
  "message": "ok",
  "data": {
    "reviewType": "browser",
    "reviewUrl": "http://browser.blockchain.org/tx/128acf9e443f371b8"
  }
}
```
参数说明


|名称	|类型 |必填 |说明|   
|------|-----|---|---- |  
reviewType|enum|是|核验类型：browser（浏览器跳转核验）、api（接口请求核验）
reviewUrl|string|是|触发获取改管控后的交易信息，用于核验不同类型的reviewType对应的含义：browser: 通过浏览器来核验，一般是受监管链有一个类似区块链浏览器的访问界面，并且无需登录即可访问；监管系统可以通过reviewUrl访问该界面对管控后的结果进行核验；api: 通过api来核验，一般是受监管链因为业务限制，无法提供一个无需登录即可访问的界面，此时受监管链应该根据实际业务逻辑，返回一个同应用层读取该交易时结果一致的接口，监管系统可以通过reviewUrl的方式访问该接口（带鉴权）进行核验；
失败响应
```JSON
{
  "success": false,
  "message": "失败原因"
}
```

## 3 心跳检测
方向：监管系统 -> 受监管链 
受监管链通过监督管理节点和监管系统连接，由于链前监管上报和链上监管指令都是非定期行为，为了能及时感知所有受监管链的健康状态，需要在监管系统和受监管链设计一种心跳机制，保证监管系统有能力监控受监管链的存活状态。因此受监管链需要提供心跳检测接口由监管系统主动发起调用请求。

流程
心跳包由监管系统定期向受监管链发起，一次心跳包的往返流程如下所示：

Plain  Text
监管系统                                                受监管链
---------------------------------------
[send hearbeat]
   |
     |          
     |----- (old checkpoint) ---->> |
                                                                    |
                                                  [receive & check]
                                                            |
     |<<-(new checkpoint, txs info)-|
     |
     |
[save]
   

        

这一过程的细节是：

监管系统向受监管链发送一次心跳包，包内包含上一次的检查点信息，例如区块高度；
受监管链收到心跳包后确认检查点信息，并搜集从该检查点之后产生的区块和交易信息[checkpoint,checkpint+n)(心跳检测属于同步响应请求，n自己定义，响应时间要在5秒内)；
受监管链以checkpint+n作为新的检查点，连同区块和交易的摘要信息一起返回；
监管系统接收到信息后进行保存，并更新该受监管链的健康状态。
请求
POST /v1/sys/heartbeat

```JSON
{
  "taskId":"0x2345678abc12",
  "checkpoint": 0
}
```
参数说明

|名称	|类型 |必填 |说明|   
|------|-----|---|---- |  
taskId|string|是|心跳任务Id
checkpoint|int|是|监管系统本地保存的最新检查点，受监管链应该根据该信息确认需返回的结果集合边界。集合边界应为[chekpoint, checkpoint+n)（左闭右开），因为checkpoint初始值为0，不同的受监管链区块链特性不同，可能不存在0区块的概念，则可用1来代替0

响应
成功响应
```JSON
{
  "success": true,
  "message": "ok",
  "data": {
    "taskId":"0x123456acb",
    "checkpoint": 12,
    "blocks": [
      {
        "height": 11,
        "hash": "0x128acf9e443f371b8ebfb1082384ed2b64eade57fe6611ff5c5ccf697461ddc4",
        "parentHash": "0xec8e43d184e799695e723038eaf1acd7964547b65b1507c910e11e01da9bbe16",
        "createdAt": 1585387890,
        "txs": [
          {
            "hash": "0x128acf9e443f371b8ebfb1082384ed2b64eade57fe6611ff5c5ccf697461ddc4",
            "fromAcct": "0xa55d649f3fc8464a7d32193d04a7e7eb30cc6bb7",
            "toAcct": "0xa55d649f3fc8464a7d32193d04a7e7eb30cc6bb7"
          }
        ]
      }
    ]
  }
}
```
参数说明



|名称	|类型 |必填 |说明|   
|------|-----|---|----   
taskId|string|是|心跳任务Id
checkpoint|int|是|最新的检查点
blocks|array|是|包含的区块集合
 -- height|int|是|区块高度
|-- hash|string|是|区块哈希
 -- parentHash|string|是|父区块哈希，创世区块则为空字符串
|-- createdAt|long|是|区块创建时间（秒）
|-- txs|array|是|区块包含的交易集合
｜｜-- hash|string|是|交易哈希
｜｜-- fromAcct|string|是|交易发起方账号
｜｜-- toAcct|string|是|交易接收方账号

失败响应
```JSON
{
  "success": false,
  "message": "失败原因"
}
```
如果是业务级失败，则返回失败原因。

如果是其他原因失败（网络超时、网络中断），则由系统根据具体原因进行记录。

Plain  Text
类似这样：
假设你当前最高块高是57，
我发起心跳检测，checkpoint=1
然后要返回 blocks [1,1+n) ,如果n=10 则[1,11) checkpoint=11
然后我收到之后记录checkpoint=11
下次发起心跳检测，则checkpoint=11
然后要返回 blocks [1,1+n) ,如果n=10 则[1,21) checkpoint=21
.....

一直到最高块高

## 4 链上监管-下达取消巡检指令
方向：监管系统 -> 受监管链 
对受监管链下达取消巡检指令，受监管链接受该指令后返回响应表示取消巡检指令任务。

请求
DELETE /v1/sys/inspection/{taskId}

参数说明

|名称	|类型 |必填 |说明|   
|------|-----|---|---- |  
taskId|string|是|任务id，从1002获取任务Id

响应
成功响应
```JSON
{
  "success": true,
  "message": "ok"
}
```
失败响应
```JSON
{
  "success": false,
  "message": "失败原因"
}
```
## 5 链上监管-下达获取巡检状态
方向：监管系统 -> 受监管链 
对受监管链下达获取巡检状态，受监管链获取巡检状态。

请求
GET /v1/sys/inspection/{taskId}

参数说明

|名称	|类型 |必填 |说明|   
|------|-----|---|---- |  
taskId|string|是|任务id，从1002获取任务Id

响应
成功响应
```JSON
{
  "success": true,
  "message": "ok",
  "data":{
    "status": "complete",
    "height": 100,
    "offset": 0
  }
}
```
失败响应
```JSON
{
  "success": false,
  "message": "失败原因"
}
```
参数说明

status:  complete表示巡检完成，failure表示巡检失败，processing表示巡检执行中，none表示巡检任务已取消
height：表示下达巡检任务时刻的最高块高度
offset：表示当前已经巡检的块高；例如：比如下达巡检任务时区块链最高块高度1000，当前已巡检到的块高度为56，这时 height=1000，offset=56