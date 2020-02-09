---
title: DDN Blockchain Asset Plugin # 课程标题
challengeType: 0               # 课程类型，默认为0：理论， 1： 实验
order: 1                       # 序号，以此为当前单元的课程排序
time:  5个小时                  # 学习时长
videoUrl: ''                   # 视频链接地址
prjectUrl: 'https://github.com/' # 源码地址
localeTitle: DDN资产扩展       # 本地化标题
---

# DDN资产扩展

## 资产类型

DDN资产，包括3种基本类型，第一种是简单的数字积分、代币等数字资产类型，我们定义为链上资产，即AoB，Asset on Blockchain, 这种资产与自身业务耦合较低，多用于业务积分等，只要直接申请即可，无需另行开发。

第二种是与自身业务耦合度较高，需要提供一些额外的数据字段用于存证，这类资产，我们可以通过扩展的方式定义成为DDN区块链的资产交易类型，我们称之为“资产扩展交易类”。

第三种是与自身业务耦合度高，不是简单地提供一些额外的数据字段就能解决的，我们建议开发Dapp应用，详见DAPP开发章节。

## 扩展方法

DDN资产基类AssetBase定义了一种资产接入区块链需要实现的方法和遵循的规范，所有自定义的扩展资产都必须继承自该基类。

但不必事先实现所有的方法，除了propsMapping方法必须实现以外，其他方法都可以直接使用基类的方法。请参考基类包含的方法。

### 1. 扩展规范

扩展包名称，建议使用`ddn-asset-`作为前缀开头，比如：`asset-dapp`，当然这并非必须的，仅仅是一种编码规范；

扩展包文件，必须包含`.ddnrc.js`配置文件，用于设置该扩展里提供的交易配置；如果有新的数据表，还需要`define-models.js`文件用于定义模型；

入口文件（main字段的值），我们建议统一使用 `lib/index.js` 文件，当然，你也可以定义其他名字的文件，只不过，如果你的入口文件不在`src`（编译后是`lib`)，那么，应该是这样：

```
// main: 'index.js'
module.exports = {
    Evidence: require('./lib/evidence').default // 必须是default
}
```

### 2. 扩展方法

基类包括的方法如下：

```
/**
 * transaction创建时调用，用来对输入参数根据资产进行个性化处理
 * @param {*} data 资产数据
 * @param {*} trs 交易对象
 */
async create(data, trs)

/**
 * 计算该类型资产交易的手续费（方法内不允许使用context对象内容）
 * @param {*} trs 交易对象
 * @param {*} sender 交易发起者
 */
async calculateFee(trs, sender)

/**
 * 定义资产属性和字段的对应关系
 * 基本属性最多支持定义15个属性
 * 字符串类型10个，名称分别是str1,str2,str3...str10，长度分别是32,64,64,128,128,256,256,512,512,1024，前4个有索引
 * 整数类型3个，名称分别是int1,int2,int3，类型为INT，前2个有索引
 * 时间戳类型2个，分别是timestamp1,timestamp2
 * 扩展属性理论上无上限，名称使用str_ext, int_ext, timestamp_ext，分别定义不同类型
 * 
 * 以下属于系统属性，不可使用
 * amount：转账金额，默认为0，字符串类型
 * recipient_id：收款地址，默认为null
 * message：备注信息
 */
async propsMapping()

/**
 * 基于业务逻辑的输入数据校验
 * @param {*} trs 交易对象
 * @param {*} sender 交易发起者
 */
async verify(trs, sender)

/**
 * 交易加入未确认列表前的预处理方法
 * @param {*} trs 交易对象
 * @param {*} sender 交易发起者
 */
async process(trs, sender)

/**
 * 获取资产的字节格式数据，用于签名计算
 * @param {*} trs 交易对象
 */
async getBytes(trs)

/**
 * 应用未确认交易，锁定转账金额
 * @param {*} trs 交易对象
 * @param {*} sender 交易发起者
 * @param {*} dbTrans 数据库事务对象
 */
async applyUnconfirmed(trs, sender, dbTrans)

/**
 * 回滚未确认交易，解锁转账金额
 * @param {*} trs 交易对象
 * @param {*} sender 交易发起者
 * @param {*} dbTrans 数据库事务对象
 */
async undoUnconfirmed(trs, sender, dbTrans)

/**
 * 应用交易业务金额，进行转账操作
 * @param {*} trs 交易对象
 * @param {*} block 区块对象
 * @param {*} sender 交易发起者
 * @param {*} dbTrans 数据库事务对象
 */
async apply(trs, block, sender, dbTrans)

/**
 * 回滚交易业务金额，进行退回操作
 * @param {*} trs 交易对象
 * @param {*} block 区块对象
 * @param {*} sender 交易发起者
 * @param {*} dbTrans 数据库事务对象
 */
async undo(trs, block, sender, dbTrans)

/**
 * 校验交易传入数据是否符合规范，从数据格式、数据长度、是否必须角度进行
 * @param {*} trs 交易对象
 */
async objectNormalize(trs)

/**
 * 读取数据库数据并反序列成交易对象体
 * @param {*} raw 数据库查询返回对象
 */
async dbRead(raw)
    
/**
 * 将交易存储到数据库中
 * @param {*} trs 交易对象
 * @param {*} dbTrans 数据库事务对象
 */
async dbSave(trs, dbTrans)

/**
 * 确认交易当前状态是否可以打包进当前区块
 * @param {*} trs 交易对象
 * @param {*} sender 交易发起者
 */
async ready(trs, sender)

/**
 * 区块链启动成功后执行
 */
async onBlockchainReady()

/**
 * 自定义资产Api
 * @param {*} router Express路由对象
 */
async attachApi(router)
```

### 3. 数据交互

由于扩展资产独立于区块链系统，为了和区块链系统进行交互，基类中提供了一些对象和方法，供用户使用。

```
/**
 * 上下文属性，其中包含区块链中所有可操作对象，如区块对象、交易对象等等
 * context详细内容请查看相关文档
 */
this._context

/**
 * 获取资产所属包名
 */
async getPackageName()

/**
 * 获取资产配置名称
 */
async getTransactionName()

/**
 * 获取资产配置类型值
 */
async getTransactionType()

/**
 * 查询规定条件的资产数据
 * @param {*} where 查询条件，遵循sequelize规则，使用prop的名称定义
 * @param {*} orders 排序条件，遵循sequelize规则，使用prop的名称定义
 * @param {*} returnTotal 是否返回总条数，true/false
 * @param {*} pageIndex 查询的页码，从1开始
 * @param {*} pageSize 分页的大小，每页的返回的最大记录条数
 */
async queryAsset(where, orders, returnTotal, pageIndex, pageSize)

/**
 * 查询规定条件的资产数据的个数
 * @param {*} where 查询条件，遵循sequelize规则，使用prop的名称定义
 */
async queryAssetCount(where)

/**
 * 获取资产在交易对象中的名称
 * @param {*} type 资产在配置文件中的类型值
 */
async getAssetJsonName(type)

/**
 * 获得交易信息中的当前资产对象
 * @param {*} trs 交易对象
 */
async getAssetObject(trs)

/**
 * 根据资产配置名称获取资产对应实例
 * @param {*} assetName 资产类名，也即配置文件中的名称
 */
async getAssetInstanceByName(assetName)
```

更多有关扩展资产的信息，请查看ddn-docs中的Extend Assets部分
