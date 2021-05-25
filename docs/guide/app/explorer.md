---
order: 1
id: explorer
title: 浏览器开发
sidebar_label: explorer development
---

# 浏览器开发

## 1. 什么是区块链浏览器

所谓区块链浏览器，就是指提供用户浏览与查询区块链所有信息的工具，因为区块链公开透明的特质，它需要有一个媒介能够让区块链用户（包括矿工、监管者、开发者、交易者）看到或查询链上的数据及链的运行情况，比如区块链上的某个交易、某块区块、某个账户，当前区块高度等等。

## 2. 常见区块链浏览器分析

### BTC区块链浏览器
btc.com是比特币浏览器之一，该浏览器包含了比特币的区块信息，矿池信息，算力排行，区块统计及比特币生态相关的一些工具及应用。

访问地址:  [https://btc.com/](https://btc.com/)

### ETH区块链浏览器
etherscan.io是比较常用的ETH浏览器，包含了以太坊的价格走势，区块信息，交易信息,智能合约信息，合约token信息，账户信息及以太坊生态相关资源等，详情可通过网站了解

访问地址: [https://etherscan.io](https://etherscan.io/)

### DDN区块链浏览器
DDN区块链浏览器包含了链上数据统计，区块信息，交易信息，账户信息，节点信息及DDN相关资源等。稍后会对这些功能做详细的讲解

访问地址::  [http://mainnet.ddn.net/](http://mainnet.ddn.net/)

从以上几个主流浏览器可以看出，区块链浏览器有很多共通的地方，同时不同的链也会有不同的功能模块和数据展示方式，甚至同一个链也会有多个不同的浏览器。比如以太坊浏览器也有很多，DDN区块链的代码也是在github上开源的，大家可以用不同的技术去实现，也可以添加更多的功能。


## 3. 区块链浏览器的功能

虽然浏览器的功能和模式各种各样，但开发区块链浏览器过程中也是有迹可询的，基本区块链浏览器的产品设计要则：原始数据、衍生数据、链核心指标。区块链浏览器首先需要摸清你所设计的区块链想要解决的问题，找到能够衡量区块链的核心指标。区块链浏览器的产品架构为：Chain - Block - Transaction - Account - Contract，依据该产品架构，我们可以获得在链上的原始数据。区块链浏览器在展示原始数据的同时，也必须找到这些数据能够衍生的其他数据，并根据自身建构的核心数据指标向用户有层次地展示。所以，一个基本区块链浏览的本质是是根据链核心指标，合理地向各类用户展示原生数据与衍生数据。


## 4. DDN区块链浏览器分析？
根据上节的区块链浏览器产品架构，我们以DDN区块链浏览器为例进行分析可知，DDN区块链浏览器的功能现阶段包含如下功能

- Chain-链上信息
     总市值
     Token总存量，
     区块高度，
     已运行天数，
     节点分布图，节点状态信息
     投票信息
     统计数据

- Block-区块信息，
     当前区块高度
     最新区块
     区块列表
     区块详情
     区块交易列表

- Transaction-交易信息
     最新交易
     交易列表
     交易详情
     子模块交易（如存证交易，AOB交易，DAO交易，DAPP交易）

- Account-账户
     用户总数，
     前100名账户
     账户详情

- Contract
     AOB数字资产
     DAO资产
     Dapp注册
     自定义动态合约（待开发）

还有些衍生数据：如数据查询，关联查询，数据统计，数据分析结果等
根据DDN区块链社区的开发计划，未来还会增加Dapp市场，Dapp子模块，AOB子模块, DAO子模块等，区块链技术的发展日新月异，区块链浏览器包含的信息也会越来越多，越来越复杂。


### 区块链浏览器开发框架

#### React简介
React 起源于 Facebook 的内部项目，因为该公司对市场上所有 JavaScript MVC 框架，都不满意，就决定自己写一套，用来架设 Instagram 的网站。做出来以后，发现这套东西很好用，就在2013年5月开源了。现在Facebook, WhatsApp, Instagram, Yahoo, Khan Academy等公司均在使用React框架开发。由于 React 的设计思想极其独特，属于革命性创新，性能出众，代码逻辑却非常简单。所以，越来越多的人开始关注和使用，认为它可能是将来 Web 开发的主流工具。
优点：速度快，性能好，组件化，模块化，代码重用，易维护，兼容性好

#### 虚拟DOM概念
在Web开发中，我们总需要将变化的数据实时反应到UI上，这时就需要对DOM进行操作。而复杂或频繁的DOM操作通常是性能瓶颈产生的原因（如何进行高性能的复杂DOM操作通常是衡量一个前端开发人员技能的重要指标）。

React为此引入了虚拟DOM（Virtual DOM）的机制：在浏览器端用Javascript实现了一套DOM API。基于React进行开发时所有的DOM构造都是通过虚拟DOM进行，每当数据变化时，React都会重新构建整个DOM树，然后React将当前整个DOM树和上一次的DOM树进行对比，得到DOM结构的区别，然后仅仅将需要变化的部分进行实际的浏览器DOM更新。而且React能够批处理虚拟DOM的刷新，在一个事件循环（Event Loop）内的两次数据变化会被合并，例如你连续的先将节点内容从A变成B，然后又从B变成A，React会认为UI不发生任何变化，而如果通过手动控制，这种逻辑通常是极其复杂的。尽管每一次都需要构造完整的虚拟DOM树，但是因为虚拟DOM是内存数据，性能是极高的，而对实际DOM进行操作的仅仅是Diff部分，因而能达到提高性能的目的。这样，在保证性能的同时，开发者将不再需要关注某个数据的变化如何更新到一个或多个具体的DOM元素，而只需要关心在任意一个数据状态下，整个界面是如何Render的。

#### Jsx语法:
JSX 允许直接在模板插入 JavaScript 变量。允许 HTML 与 JavaScript 的混写遇到 HTML 标签（以 < 开头），就用 HTML 规则解析；遇到代码块（以 { 开头），就用 JavaScript 规则解析。

#### 组件化
虚拟DOM(virtual-dom)不仅带来了简单的UI开发逻辑，同时也带来了组件化开发的思想，所谓组件，即封装起来的具有独立功能的UI部件。React推荐以组件的方式去重新思考UI构成，将UI上每一个功能相对独立的模块定义成组件，然后将小的组件通过组合或者嵌套的方式构成大的组件，最终完成整体UI的构建。例如，Facebook的instagram.com整站都采用了React来开发，整个页面就是一个大的组件，其中包含了嵌套的大量其它组件。

对于MVC开发模式来说，开发者将三者定义成不同的类，实现了表现，数据，控制的分离。开发者更多的是从技术的角度来对UI进行拆分，实现松耦合。

对于React而言，则完全是一个新的思路，开发者从功能的角度出发，将UI分成不同的组件，每个组件都独立封装。

在React中，你按照界面模块自然划分的方式来组织和编写你的代码，对于评论界面而言，整个UI是一个通过小组件构成的大组件，每个组件只关心自己部分的逻辑，彼此独立。

更多React相关资料可以参考React官网

### Umi简介
Umi是插件化的企业级前端应用框架, 具有可扩展，易使用，生态完备，支持企业级应用等特点。Umi 是蚂蚁金服的底层前端框架，已直接或间接地服务了 3000+ 应用。DDN社区采用umi作为前端开发框架，可以大大减小开发流程中的重复性工作，增加开发效率，同时采用统一框架方便社区开发人员之间的配合。

### Umi目录
Umi 项目的目录结构大致如下：
```js
.
├── package.json   // 使用的依赖包，包含插件和插件集
├── .umirc.ts      // 配置文件，包含 umi 内置功能和插件的配置。
├── .env           // 环境变量
├── dist           // 执行 umi build 后，编译后的文件默认会存放在这里
├── mock           // 存储 mock 文件，模拟测试数据
├── public         // 此目录下所有文件会被 copy 到输出路径。
└── src            // 项目代码主目录
    ├── .umi
    ├── layouts/index.tsx   // 约定式路由时的全局布局文件。
    ├── pages               // 所有路由组件存放在这里
        ├── index.less
        └── index.tsx
    └── app.ts              // 运行时配置文件，可以在这里扩展运行时的能力，比如修改路由、修改 render 方法等。
```
Umi相关语法及使用可以参考umi官网文档 [umijs.org](https://umijs.org/zh-CN/docs/)

## 5. 采用umi框架，5分钟运行一个网站项目

### 环境准备
```js
// 查看node版本
$ node -v
v10.13.0
```
推荐使用 yarn 管理 npm 依赖，若网络不稳定可以使用国内源

```js
// 国外源
$ npm i yarn -g

// 国内源，若使用国内源，后面文档里的 yarn 换成 tyarn
$ npm i yarn tyarn -g

// 查看yarn版本
$ yarn -v

```

### 创建项目
#### 先找个地方建个空目录。
```js
$ mkdir myapp && cd myapp
```
#### 安装Umi脚手架
```js
$ yarn create @umijs/umi-app

Copy:  .editorconfig
Write: .gitignore
Copy:  .prettierignore
Copy:  .prettierrc
Write: .umirc.ts
Copy:  mock/.gitkeep
Write: package.json
Copy:  README.md
Copy:  src/pages/index.less
Copy:  src/pages/index.tsx
Copy:  tsconfig.json
Copy:  typings.d.ts

```
#### 安装依赖
```js
$ yarn
yarn install v1.21.1
[1/4] 🔍  Resolving packages...
success Already up-to-date.
Done in 0.71s.
```
#### 启动项目
```js
$ yarn start
Starting the development server...
✔ Webpack
  Compiled successfully in 17.84s
 DONE  Compiled successfully in 17842ms                                       8:06:31 PM
  App running at:
  - Local:   http://127.0.0.1:8000 (copied to clipboard)
  - Network: http://192.168.12.34:8000
```
在浏览器里打开 http://127.0.0.1:8000/，能看到界面


#### 编译项目
```js
$ yarn build
```

### DDN区块链数据的获取
区块链浏览器上显示的数据都是从链上获取的，区块链的数据都是公开的，具体的请求API及使用可以参照官方文档，下面通过几个案例看看如何获取DDN区块链上的公开数据

在服务器或者后台测试时我们可以用curl命令来获取数据，如
```js
curl -k -X GET 'http://127.0.0.1:8001/api/blocks/getStatus'
```
但在前端项目中，我们一般通过ajax的方式来获取远程的数据，然后展示在浏览器页面上，在获取数据之前，需要提前引入获取数据的npm包，在浏览器环境中可以直接使用fetch, request来获取数据, 而在js测试环境中, 可以用axios来获取服务端数据

```js
// 引入数据获取npm包
const axios = require("axios");

// 设置连接的主网节点
const peer = "http://peer.ddn.link:8000"
...
```

### 获取区块链状态
接口地址：/api/blocks/getStatus

```js
...
/** 获取DDN区块链链当前状态 */
async function getStatus(){
    let resource = `${peer}/api/blocks/getStatus`
  　let response = await axios.get(resource)
    const statusData = response.data
    console.log("statusData",statusData)
}

// 运行该方法
getTopAddress()

// 获得的输出结果
statusData:
   { success: true,
     height: 8106417,    //当前区块高度
     fee: 10000000,      //当前网络的交易费用
     milestone: 2,       //当前网络所处的开发阶段里程碑
     reward: 300000000,  //当前网络的奖励
     supply: 13331907800000000 }    //当前网络积分总数
...
```
#### 获取区块列表
接口地址：/api/blocks

请求示例：
```js
/** 获取DDN区块链链区块链列表 */
async function getBlocks(){
    let resource = `${peer}/api/blocks`
    let params = {
        limit: 2,
        offset: 0,
        orderBy: 'height:desc'
    }
  　let response = await axios.get(resource, { params })
    const blocksData = response.data
    console.log("blocksData",blocksData)
}

// 运行该方法
getBlocks()

// 获得的输出结果
blocksData { success: true,
  blocks:
   [ { id:
        'ff607dfe7cbec765303094a643abb3c6c059db2b9e9d86b4b8997f16055afb70',
       version: 0,
       timestamp: 86498640,
       height: 8106526,
       previousBlock:
        '19ffd68519cd2902c4b0ecd5b180e9a642351eb48340b07340a0cfed0891a488',
       numberOfTransactions: 0,
       totalAmount: 0,
       totalFee: 0,
       reward: 300000000,
       payloadLength: 0,
       payloadHash:
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
       generatorPublicKey:
        '7f6fea5797a9a52d25ed6d42c228bafdb0bbbb6a1f6f65c5c94306d499625c69',
       generatorId: 'D4x4gx4NBT8yw2jy6VDaV6GXXJCL94JFjp',
       blockSignature:
        'b1275194ab825b67c0698299295e67d8e9201e5f593b6fc162da5b05b6081a28bf63cdb03eaa0f9189a1fa0b5f1cc7df9f55e36f64d2bd62dfebcede88f14b02',
       confirmations: '1',
       totalForged: 300000000 },
     { ...  } ],
  count: 8106526 }
```

#### 获取当前区块详情
接口地址：/api/blocks/get

```js
/** 获取DDN区块链链区块链列表 */
async function getBlockDetail(){
    let resource = `${peer}/api/blocks/get`
    let params = {
        height: 8106526
    }
  　let response = await axios.get(resource, { params })
    const blockData = response.data
    console.log("blockData",blockData)
}

// 运行该方法
getBlockDetail()

// 获得的输出结果
blockData { success: true,
  block:
   { id:
      'ff607dfe7cbec765303094a643abb3c6c059db2b9e9d86b4b8997f16055afb70',
     version: 0,
     timestamp: 86498640,
     height: 8106526,
     previousBlock:
      '19ffd68519cd2902c4b0ecd5b180e9a642351eb48340b07340a0cfed0891a488',
     numberOfTransactions: 0,
     totalAmount: 0,
     totalFee: 0,
     reward: 300000000,
     payloadLength: 0,
     payloadHash:
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
     generatorPublicKey:
      '7f6fea5797a9a52d25ed6d42c228bafdb0bbbb6a1f6f65c5c94306d499625c69',
     generatorId: 'D4x4gx4NBT8yw2jy6VDaV6GXXJCL94JFjp',
     blockSignature:
      'b1275194ab825b67c0698299295e67d8e9201e5f593b6fc162da5b05b6081a28bf63cdb03eaa0f9189a1fa0b5f1cc7df9f55e36f64d2bd62dfebcede88f14b02',
     confirmations: '48',
     totalForged: 300000000 } }
...
```
#### 链上时间戳换算
由于每台服务器所在的时间及本地时间会存在误差，故区块链上的时间不是一个固定的时间数值，而是一个以网络初始运行时间为起点，在创建交易和区块打包所记录的时间戳timestamp是指当前时间离区块链网络初始运行时间的秒数。当我们要在浏览器中渲染时需要经过一定的时间换算
以上面获取到的时间时间戳 `timestamp: 86498640` 为例, 如何获得对应的本地时间呢？

我们可以通过DDN-sdk来换算，DDN-SDK中有配置好的网络运行时间
```js
// 引入DDN的node-sdk
const DdnJS = require("@ddn/node-sdk").default;

// 获取网络的初始运行时间
const beginEpochTime = DdnJS.utils.slots.beginEpochTime()
console.log("beginEpochTime", beginEpochTime)

// 获取当前时间的毫秒数获取链上时间戳
const now = new Date().getTime()
const timestamp = DdnJS.utils.slots.getTime(now)
console.log("timestamp", timestamp)

// 通过链上返回的时间戳获取网络时间毫秒数
const block_timestamp = 86498640
var real_time = DdnJS.utils.slots.getRealTime(block_timestamp)
console.log("real_time", real_time)

```

通过以上3个数据获取案例，结合DDN区块链开发文档，我们可以知道如何获取区块链上的所有信息，更多的数据获取API，参照[DDN API 文档](http://docs.ddn.net/api)，下一节我们将学习把获取到的数据渲染到区块链浏览器的页面上
