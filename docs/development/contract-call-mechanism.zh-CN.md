# DDN智能合约调用机制详解

本文档详细介绍了DDN区块链中智能合约调用的原理、流程和实现机制，帮助开发者更好地理解和使用DDN智能合约系统。

## 目录

- [合约调用概述](#合约调用概述)
- [合约调用类型](#合约调用类型)
- [合约调用流程](#合约调用流程)
- [合约执行环境](#合约执行环境)
- [Gas计量机制](#gas计量机制)
- [合约调用上下文](#合约调用上下文)
- [合约调用交易处理](#合约调用交易处理)
- [合约调用API接口](#合约调用api接口)
- [开发建议与最佳实践](#开发建议与最佳实践)

## 合约调用概述

DDN智能合约系统支持两种类型的合约调用：

1. **只读调用（Readonly Call）**：不修改合约状态，仅查询合约数据
2. **状态修改调用（State-Changing Call）**：修改合约状态，需要通过交易进行

合约调用的核心组件包括：

- **DVM（DDN Virtual Machine）**：合约执行引擎，负责加载和执行合约代码
- **合约沙箱（Contract Sandbox）**：提供隔离的执行环境，防止恶意代码影响主系统
- **合约运行时（Contract Runtime）**：管理合约的状态和执行上下文
- **Gas计量器（Gas Counter）**：计量合约执行的资源消耗

## 合约调用类型

### 1. 只读调用

只读调用不需要创建交易，可以直接通过API接口调用合约的常量方法（使用`@readonly`装饰器标记的方法）。

**特点**：
- 不消耗能量（Energy）
- 不修改区块链状态
- 不需要签名
- 立即返回结果

**适用场景**：
- 查询合约状态
- 获取合约数据
- 预览操作结果

### 2. 状态修改调用

状态修改调用需要创建交易，通过区块链网络广播，并经过共识确认后执行。

**特点**：
- 消耗能量（Energy）
- 修改区块链状态
- 需要签名
- 需要等待交易确认

**适用场景**：
- 修改合约状态
- 执行业务逻辑
- 转移资产

## 合约调用流程

### 只读调用流程

1. 客户端通过API接口发送调用请求
2. 节点接收请求并验证参数
3. 节点调用DVM的`callReadonly`方法
4. DVM加载合约并执行指定方法
5. 返回执行结果给客户端

```
客户端 ---> API接口(/api/contracts/call) ---> DVM.callReadonly() ---> 合约方法执行 ---> 返回结果
```

### 状态修改调用流程

1. 客户端构造合约调用交易（使用SDK的`contract.transfer`或`contract.pay`方法）
2. 客户端签名交易并广播到网络
3. 节点验证交易并添加到未确认交易池
4. 交易被打包进区块并确认
5. 节点执行交易，调用DVM的`callContract`或`payContract`方法
6. DVM加载合约并执行指定方法
7. 更新合约状态并记录执行结果

```
客户端 ---> 构造交易 ---> 签名 ---> 广播 ---> 交易验证 ---> 区块确认 ---> 
DVM.callContract() ---> 合约方法执行 ---> 状态更新 ---> 记录结果
```

## 合约执行环境

DDN智能合约在隔离的沙箱环境中执行，确保合约代码不会影响主系统的安全性和稳定性。

### 沙箱实现

DDN合约沙箱基于Node.js的子进程（`child_process.spawn`）和VM模块实现：

1. **子进程隔离**：每个合约沙箱在独立的Node.js子进程中运行
2. **IPC通信**：主进程与沙箱进程通过IPC（进程间通信）交换消息
3. **VM模块**：为每个合约提供独立的JavaScript执行环境

### 合约VM

合约VM（ContractVM）负责加载和执行合约代码：

1. 创建沙箱环境
2. 执行合约代码
3. 实例化合约类
4. 提供合约方法的调用接口

```javascript
// 创建合约实例
createContractInstance() {
  // 创建沙箱环境
  const sandbox = this.createSandbox();
  
  try {
    // 执行合约代码
    this.executeCode(sandbox);
    
    // 创建合约实例
    return new sandbox[this._className]();
  } catch (error) {
    this._log.error(`Failed to create contract instance for ${this._contractName}`, error);
    throw error;
  }
}
```

## Gas计量机制

DDN智能合约使用Gas机制计量合约执行的资源消耗，防止无限循环和资源滥用。

### Gas计量原理

1. **Gas限制**：每次合约调用都有Gas限制，超过限制将终止执行
2. **Gas消耗**：不同操作消耗不同数量的Gas
3. **Gas计价**：不同操作的Gas价格由系统预设

### Gas计量器

Gas计量器（GasCounter）负责跟踪和控制Gas消耗：

```javascript
// 消耗Gas
consume(amount) {
  this.gasUsed += amount;
  if (this.gasUsed > this.gasLimit) {
    throw new Error(`Gas limit exceeded: ${this.gasUsed} > ${this.gasLimit}`);
  }
}
```

### 能量消耗

合约调用消耗的Gas会转换为能量（Energy）消耗，从调用者的能量账户中扣除：

1. 检查能量是否足够
2. 计算Gas消耗
3. 扣除相应的能量

## 合约调用上下文

合约调用上下文（Context）包含调用者信息、交易数据和区块信息，为合约执行提供必要的环境信息。

### 上下文内容

- **调用者地址**：交易发送者的地址
- **交易数据**：当前交易的ID、时间戳等信息
- **区块数据**：当前区块的高度、ID等信息
- **合约信息**：合约ID、名称等

### 上下文创建

```javascript
// 创建合约调用上下文
async function makeContext(senderAddress, transaction, sender, block) {
  return {
    sender: {
      address: senderAddress
    },
    transaction: {
      id: transaction.id,
      timestamp: transaction.timestamp
    },
    block: {
      height: block.height,
      id: block.id,
      timestamp: block.timestamp
    }
  };
}
```

## 合约调用交易处理

合约调用交易（类型12）的处理流程与普通交易类似，但有特定的验证和执行逻辑。

### 交易验证

1. 验证交易格式和签名
2. 验证合约是否存在
3. 验证Gas限制是否足够
4. 验证调用者能量是否足够

### 交易执行

1. 创建合约调用上下文
2. 调用DVM执行合约方法
3. 处理执行结果
4. 记录状态变更和转账记录

```javascript
// 合约调用交易处理
async function apply(trs, block, sender) {
  const { name, method, gasLimit, args } = JSON.parse(trs.args);
  
  // 验证合约是否存在
  const contractInfo = await app.sdb.load('Contract', { name });
  assert(contractInfo !== undefined, `Contract '${name}' not found`);
  
  // 检查能量是否足够
  const checkResult = await checkGasPayment(sender.address, gasLimit);
  assert(checkResult.enough, 'Insufficient Energy');
  
  // 创建上下文
  const context = await makeContext(sender.address, trs, sender, block);
  
  // 调用合约
  const callResult = await app.contract.callContract(gasLimit, context, name, method, ...args);
  
  // 处理结果
  await handleContractResult(contractInfo.id, callResult, trs, block.height);
}
```

## 合约调用API接口

DDN提供了多种接口用于合约调用：

### 1. SDK接口

```javascript
// 调用合约方法（状态修改）
const tx = await DdnJS.contract.transfer({
  id: 'contract-123',
  gasLimit: 500000,
  method: 'transfer',
  args: ['recipient-address', '1000']
}, 'your secret passphrase');

// 向合约转账
const tx = await DdnJS.contract.pay({
  id: 'contract-123',
  gasLimit: 500000,
  method: 'deposit',
  amount: '1000',
  currency: 'DDN',
  args: []
}, 'your secret passphrase');
```

### 2. HTTP API接口

```
// 调用只读方法
POST /api/contracts/call
{
  "id": "contract-123",
  "method": "balanceOf",
  "args": ["address-1"]
}

// 获取合约信息
GET /api/contracts/get?id=contract-123

// 获取合约代码
GET /api/contracts/code?id=contract-123

// 获取合约元数据
GET /api/contracts/meta?id=contract-123
```

## 开发建议与最佳实践

### 合约调用优化

1. **合理设置Gas限制**：根据方法复杂度设置合适的Gas限制
2. **减少状态修改**：尽量减少状态修改操作，降低Gas消耗
3. **批量处理**：将多个操作合并为一个交易，减少交易费用

### 错误处理

1. **捕获合约异常**：在合约中妥善处理异常，避免整个交易失败
2. **检查返回结果**：调用合约后检查返回结果，确认操作是否成功
3. **日志记录**：使用合约日志记录关键操作，便于调试和审计

### 安全建议

1. **输入验证**：验证所有输入参数，防止恶意输入
2. **权限控制**：实现严格的权限控制，限制关键操作的访问
3. **避免重入攻击**：防止合约重入攻击，确保状态一致性
