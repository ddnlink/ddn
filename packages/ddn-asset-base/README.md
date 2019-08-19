# DDN扩展资产基类

&emsp;&emsp;资产基类AssetBase定义了一种资产接入区块链需要实现的方法和遵循的规范，所有自定义的扩展资产都必须继承自基类，但不必事先所有的方法，除了propsMapping方法必须实现以外，其他方法都可以直接使用基类的方法。基类具体包括的方法如下：<br/>
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

### &emsp;c. 数据交互
&emsp;&emsp;由于扩展资产独立于区块链系统，为了和区块链系统进行交互，基类中提供了一些对象和方法，供用户使用。
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
