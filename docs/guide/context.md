---
id: ddn-context
title: 上下文
sidebar_label: DDN Context
toc: menu
---

## 1. 上下文说明

上下文是贯穿于区块链系统的对象，上下文对象中包含了所有区块链链相关的设置信息和方法对象，在区块链代码、扩展资产包等场景都可以正常获取和使用。在任何地方都可以使用this._context获取到上下文，如下面的代码可以获取到系统运行的根目录：

```
var a = this._context.baseDir;
```

为了方便使用，精简代码，在所有上下文场景中，上下文对象的所有内容都被注入到了当前this指针中，因此，下面的代码也能正确得到系统运行根目录：

```
var a = this.baseDir;
```

## 2. 上下文内容

名称 | 类型 | 描述
-|-|-
baseDir | 属性 | 系统运行根目录
config | 对象 | 系统配置信息
genesisblock | 对象 | 创世区块数据
logger | 对象 | 日志操作类
bus | 对象 | 订阅/广播类类
oneoff | 对象 | Key/Value操作类
balanceCache | 对象 | 余额缓存类
ddnSchema | 对象 | 数据校验类
assetPlugins | 对象 | 扩展资产配置对象
protobuf | 对象 | Protobuf序列化对象
sequence | 对象 | 业务操作队列
dbSequence | 对象 | 数据库操作队列
balancesSequence | 对象 | 余额操作队列
dao | 对象 | 数据库操作对象
dbParams | 对象 | 数据库参数操作对象，Key/Value型
tokenSetting | 对象 | Token相关设置
runtime | 对象 | 运行时核心业务处理模块

## 3. 运行时核心业务处理模块内容

名称 | 类型 | 描述
-|-|-
block | 对象 | 区块相关操作类
transaction | 对象 | 交易相关操作类
account | 对象 | 账户相关操作类
delegate | 对象 | 受托人相关操作类
dataquery | 对象 | 交易/区块数据查询类

## 4. 区块相关操作类

### 查询指定条件的区块数量

```
> getCount(where)
```

### 返回配置文件中的默认交易手续费

```
> calculateFee()
```

### 区块状态计算类（计算节点奖励、供应量等信息）getBlockStatus()

### 设置最后区块数据对象

```
> setLastBlock(block)
```

### 返回最后一个区块数据对象

```
> getLastBlock()
```

### 计算并返回区块数据的字节信息

```
> getBytes(block)
```

### 获取区块数据的Hash计算结果

```
> getHash(block)
```

### 使用传入的密钥对区块数据进行签名操作，并返回签名内容供后续操作验证

```
> sign(block, keypair)
```

### 根据区块数据，通过Hash计算得到区块对应Id

```
> getId(block)
```

### 验证区块数据格式、类型等的正确性

```
> objectNormalize(block)
```

### 处理创世区块数据（系统初次运行时调用）

```
> handleGenesisBlock()
```

### 将区块数据保存到数据库（仅是区块数据本身，不包含其中的交易数据）

```
> serializeBlock2Db(block, dbTrans)
```

### 将数据库查询的数据序列化成JSON格式的区块对象

```
> serializeDbData2Block(raw)
```

### 将区块数据保存到数据库（包括区块数据记录和所有包含的交易易数据记录）

```
> saveBlock(block, dbTrans)
```

### 根据传入的数据创建一个区块对象（不包含任何交易）

```
> createBlock(data)
```

### 接收其他节点广播的新区块数据，并进行处理

```
> receiveNewBlock(block, votes)
```

### 接收其他节点反馈的投票数据，并进行处理

```
> receiveVotes(votes)
```

### 接收其他节点广播的投票申请，并进行处理

```
> receiveNewPropose(propose)
```

### 应用区块数据，执行交易逻辑，并保存区块和交易数据到数据库中

```
> applyBlock(block, votes, broadcast, saveBlock)
```

### 验证区块签名正确性

```
> verifySignature(block)
```

### 验证区块数据的合法性（包括验证区块签名）

```
> verifyBlock(block, votes)
```

### 验证投票数据的合法性

```
> verifyBlockVotes(block, votes)
```

### 检查区块数据并对数据进行预处理，为后续应用区块数据做准备

```
> processBlock(block, votes, broadcast, save, verifyTrs)
```

### 生成区块数据并铸造区块

```
> generateBlock(keypair, timestamp)
```

### 删除指定Id的区块数据，用于区块数据异常数据回滚时

```
> deleteBlock(blockId, dbTrans)
```

### 删除指定区块之前的区块数据，用于区块数据异常数据回滚时

```
> deleteBlocksBefore(block)
```

### 删除指定Id区块之后的区块数据，用于区块数据异常数据回滚时

```
> simpleDeleteAfterBlock(blockId)
```

### 从其他节点查询并同步区块数据，本地区块数据不完整时调用

```
> loadBlocksOffset(limit, offset, verify)
```

### 分页查询区块数据（不包含交易信息）

```
> queryBlockData(where, sorts, offset, limit, returnTotal)
```

### 根据id、height、hash任一属性，查询对应的区块数据，不包含交易数据

```
> querySimpleBlockData(query)
```

## 5. 交易相关操作类
### 根据资产配置名称获取资产实例

```
> getAssetInstanceByName(assetName)
```

### 挂载扩展资产Api

```
> mountAssetApis(expressApp)
```

### 根据传入的数据创建一个交易对象

```
> create(data)
```

### 使用传入的密钥对交易数据进行签名操作，并返回签名内容供后续操作验证

```
> sign(keypair, trs)
```

### 计算并返回交易数据的字节信息

```
> getBytes(trs, skipSignature, skipSecondSignature)
```

### 验证交易数据格式、类型的正确性

```
> objectNormalize(trs)
```

### 将交易数据存储到数据库

```
> serializeTransaction2Db(trs, dbTrans)
```

### 将数据库读取的数据序列化为JSON格式的交易对象

```
> serializeDbData2Transaction(raw)
```

### 根据Id查询未确认交易

```
> getUnconfirmedTransaction(trsId)
```

### 查询未确认交易列表

```
> getUnconfirmedTransactionList(reverse, limit)
```

### 应用未确认交易，锁定待转账金额

```
> applyUnconfirmed(trs, sender, dbTrans)
```

### 回滚应用未确认交易

```
> undoUnconfirmed(transaction, dbTrans)
```

### 回滚所有未确认交易的应用操作

```
> undoUnconfirmedList()
```

### 判断交易对象是否已就绪，是否可参与区块铸造

```
> ready(trs, sender)
```

### 应用交易数据，金额转账操作最终此时进行

```
> apply(trs, block, sender, dbTrans)
```

### 回滚应用交易操作

```
> undo(trs, block, sender, dbTrans)
```

### 将指定Id的交易从未确认交易列表中移除

```
> removeUnconfirmedTransaction(id)
```

### 将指定交易加入未确认交易列表

```
> addUnconfirmedTransaction(transaction, sender)
```

### 判断指定交易是否在未确认交易中是否存在

```
> hasUnconfirmedTransaction(transaction)
```

### 获取交易数据的Hash计算结果

```
> getHash(trs)
```

### 根据交易数据，通过Hash计算得到交易对应Id

```
> getId(trs)
```

### 交易预处理

```
> process(trs, sender, requester)
```

### 将新交易进行处理并加入未确认交易列表

```
> processUnconfirmedTransaction(transaction, broadcast)
```

### 接收交易数据并处理，等待进行区块铸造

```
> receiveTransactions(transactions)
```

### 根据交易字节流和公钥验证签名是否正确

```
> verifyBytes(bytes, signature, publicKey)
```

### 验证交易签名的正确性

```
> verifySignature(trs, signature, publicKey)
```

### 对交易进行多重签名

```
> multisign(trs, keypair)
```

### 验证交易的合法性（包括签名、二级密码等）

```
> verify(trs, sender, requester)
```

### 验证交易二级密码正确性

```
> verifySecondSignature(trs, signature, publicKey)
```

## 6. 账户相关操作类
### 初始化账户信息及账户余额数据

```
> initAccountsAndBalances()
```

### 检查账户地址是否合法

```
> isAddress(address)
```

### 根据公钥信息生成账户地址

```
> generateAddressByPublicKey(publicKey)
```

### 设置账户信息（有则修改，没有则新增）

```
> setAccount(data, dbTrans)
```

### 根据账户地址查询详细账户信息

```
> getAccountByAddress(address)
```

### 根据公钥查询详细账户信息

```
> getAccountByPublicKey(publicKey)
```

### 查询账户详细信息

```
> getAccount(filter, fields)
```

### 分页查询账户列表

```
> getAccountList(filter, fields)
```

### 将所有账户余额缓存到本地缓存

```
> cacheAllAccountBalances()
```

### 重建账户和余额信息（根据已有区块信息）

```
> repairAccounts(count, verify)
```

### 检查钱包账户数据完整性

```
> checkAccounts(count)
```

### 合并账户信息

```
> merge(address, diff, dbTrans)
```

### 更新指定账户信息

```
> updateAccount(data, where, dbTrans)
```

## 7. 受托人相关操作类
### 受托人信息初始化

```
> prepare()
```

### 判断当前节点是否允许进行区块铸造

```
> isForgeEnabled()
```

### 判断当前节点是否存在有效的受托人配置

```
> hasValidDelegates()
```

### 将密钥对应的账户放入当前节点的受托人配置列表中

```
> enableForged(keypair)
```

### 将公钥对应的账户从当前节点的受托人配置中移除

```
> disableForgedByPublicKey(publicKey)：
```

### 返回当前节点配置的所有密钥信息

```
> getMyDelegateByPublicKey(publicKey)
```

### 检查账户投票情况的合法性

```
> checkDelegates(publicKey, votes)
```

### 分页查询受托人列表

```
> getDelegates(query)
```

### 返回排序过得前101个受托人的公钥列表

```
> getDelegatePublickKeysSortByVote()
```

### 返回乱序处理过的受托人公钥列表

```
> getDisorderDelegatePublicKeys(height)
```

### 返回当前所有受托人列表中在本地节点配置中存在的私钥信息

```
> getActiveDelegateKeypairs(height)
```

### 返回当前时间当前节点接下来可以进行铸造区块的受托人信息和时间戳

```
> getForgeDelegateWithCurrentTime(curSlot, height)
```

### 验证区块信息和当前时间槽是否匹配

```
> validateBlockSlot(block)
```

### 验证投票提议和当前时间槽是否匹配

```
> validateProposeSlot(propose)
```

## 8. 交易/区块数据查询类
### 分页查询区块数据列表

```
> loadSimpleBlocksData(where, limit, offset, orders)
```

### 根据区块Id数组查询其包含的所有交易信息

```
> loadTransactionsWithBlockIds(blockIds)
```

### 查询交易Id数组包含的所有受托人交易信息

```
> loadDelegatesWithTransactionIds(transactionIds)
```

### 查询交易Id数组包含的所有投票交易信息

```
> loadVotesWithTransactionIds(transactionIds)
```

### 查询交易Id数组包含的所有扩展资产交易信息

```
> loadAssetsWithTransactionIds(transactionIds)
```

### 查询交易Id数组包含的所有扩展资产交易的扩展属性信息

```
> loadAssetExtsWithTransactionIds(transactionIds)
```

### 查询交易Id数组包含的所有签名交易信息

```
> loadSignaturesWithTransactionIds(transactionIds)
```

### 查询交易Id数组包含的所有多重签名交易信息

```
> loadMultiSignaturesWithTransactionIds(transactionIds)
```

### 分页查询区块信息列表（完整区块信息，包含交易数据）

```
> queryFullBlockData(where, limit, offset, orders)
```

### 分页查询交易信息列表（仅包含交易数据本身，不包含附着的业务数据）

```
> loadSimpleTransactionData(where, limit, offset, orders,returnTotal)
```


### 分页查询完整的交易信息列表（除交易数据外，还包含完整的业务数据）
> ```
queryFullTransactionData(where, limit, offset, orders, returnTotal)```
