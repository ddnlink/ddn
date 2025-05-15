# DDN 智能合约验证与提交接口开发文档

本文档详细说明了 DDN 区块链中智能合约验证和提交的内部接口和实现机制，主要面向 DDN 平台开发者。

## 1. 合约验证流程

DDN 智能合约在部署和执行过程中会经过多层验证，确保合约的安全性和正确性。

### 1.1 合约验证器 (Validator)

合约验证器位于 `packages/peer/src/kernal/consensus/validator/contract.js`，负责验证合约交易的基本格式和内容。

**主要验证内容**：

- 合约名称格式是否正确
- 合约代码是否存在
- 合约版本格式是否正确
- Gas 限制是否在合理范围内

**示例代码**：

```javascript
async validate(trs) {
  // 验证合约基本信息
  if (!trs.asset.contract) {
    throw new Error('Invalid contract asset');
  }

  const { name, code, version, gasLimit } = trs.asset.contract;

  // 验证合约名称
  if (!name || typeof name !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error('Invalid contract name');
  }

  // 验证合约代码
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid contract code');
  }

  // 验证合约版本
  if (!version || typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('Invalid contract version');
  }

  // 验证 Gas 限制
  if (!gasLimit || typeof gasLimit !== 'number' || gasLimit <= 0) {
    throw new Error('Invalid gas limit');
  }

  return trs;
}
```

### 1.2 合约处理器 (Process)

合约处理器位于 `packages/peer/src/kernal/consensus/transaction-pool/process.js`，负责处理合约交易的提交和验证。

**主要处理步骤**：

1. 验证交易签名
2. 验证交易格式
3. 验证合约代码
4. 计算合约 ID
5. 验证合约是否已存在

**示例代码**：

```javascript
async processUnconfirmedTransaction(trs) {
  // 验证交易签名
  const valid = await this.runtime.transaction.verifySignature(trs);
  if (!valid) {
    throw new Error('Invalid transaction signature');
  }

  // 验证交易格式
  await this.runtime.transaction.verify(trs);

  // 如果是合约交易，进行额外验证
  if (trs.type === DdnUtils.assetTypes.CONTRACT) {
    // 验证合约代码
    await this.runtime.dvm.validateContractCode(trs.asset.contract.code);
    
    // 计算合约 ID
    const contractId = this.runtime.dvm.calculateContractId(trs);
    trs.asset.contract.id = contractId;
    
    // 验证合约是否已存在
    const existingContract = await this.dao.findOneByPrimaryKey('contract', contractId);
    if (existingContract) {
      throw new Error(`Contract with ID ${contractId} already exists`);
    }
  }

  // 添加到未确认交易池
  await this.runtime.transaction.addUnconfirmedTransaction(trs);
  
  return trs;
}
```

### 1.3 合约验证方法 (Verify)

合约验证方法位于 `packages/peer/src/kernal/consensus/transaction/verify.js`，负责验证合约交易的详细内容。

**主要验证内容**：

- 交易发送者是否有效
- 交易费用是否足够
- 合约代码是否可编译
- 合约是否符合安全规范

**示例代码**：

```javascript
async verify(trs, sender) {
  // 验证交易发送者
  if (!sender) {
    throw new Error('Invalid sender');
  }

  // 验证交易费用
  if (trs.fee < this.runtime.config.minFee) {
    throw new Error(`Fee not enough: ${trs.fee}`);
  }

  // 如果是合约交易，进行额外验证
  if (trs.type === DdnUtils.assetTypes.CONTRACT) {
    // 验证合约代码是否可编译
    try {
      await this.runtime.dvm.compileContract(trs.asset.contract.code);
    } catch (err) {
      throw new Error(`Contract compilation failed: ${err.message}`);
    }
    
    // 验证合约是否符合安全规范
    const securityIssues = await this.runtime.dvm.checkContractSecurity(trs.asset.contract.code);
    if (securityIssues.length > 0) {
      throw new Error(`Contract security issues: ${securityIssues.join(', ')}`);
    }
  }

  return true;
}
```

## 2. 合约提交流程

### 2.1 合约交易创建

合约交易创建通过 JS SDK 完成，位于 `@ddn/js-sdk` 包中。

**示例代码**：

```javascript
// 客户端代码
const DdnJS = require('@ddn/js-sdk').default;

// 创建合约部署交易
const contractTransaction = await DdnJS.contract.createContract({
  name: 'MyContract',
  desc: 'My first smart contract',
  version: '1.0.0',
  gasLimit: 1000000,
  code: contractCode
}, secret);

// 发送交易到节点
const response = await fetch('http://localhost:8001/api/transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'nethash': 'm66gcvle',
    'version': '1.0.0'
  },
  body: JSON.stringify({ transaction: contractTransaction })
});

const result = await response.json();
console.log(result);
```

### 2.2 合约交易处理

合约交易提交到节点后，由 `TransactionService` 处理，位于 `packages/peer/src/network/service/api/transactions/index.js`。

**主要处理步骤**：

1. 验证交易格式
2. 处理未确认交易
3. 广播交易到其他节点
4. 返回处理结果

**示例代码**：

```javascript
async postTransactions(req) {
  const { transaction } = req.body;
  
  // 验证交易格式
  const validateErrors = await this.ddnSchema.validate(
    {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'integer' },
        amount: { type: 'string' },
        fee: { type: 'string' },
        timestamp: { type: 'integer' },
        senderPublicKey: { type: 'string' },
        signature: { type: 'string' },
        asset: { type: 'object' }
      },
      required: ['type', 'amount', 'fee', 'timestamp', 'senderPublicKey', 'signature']
    },
    transaction
  );
  
  if (validateErrors) {
    throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`);
  }
  
  // 处理未确认交易
  try {
    await this.runtime.transaction.processUnconfirmedTransaction(transaction);
  } catch (err) {
    throw new Error(`Failed to process transaction: ${err.message}`);
  }
  
  // 广播交易到其他节点
  this.runtime.peer.broadcast.broadcastTransaction(transaction);
  
  return { success: true, transactionId: transaction.id };
}
```

### 2.3 合约执行

合约交易被确认后，由 DVM (DDN Virtual Machine) 执行，位于 `packages/peer/src/kernal/dvm/index.js`。

**主要执行步骤**：

1. 加载合约代码
2. 创建合约执行环境
3. 执行合约代码
4. 记录执行结果
5. 更新合约状态

**示例代码**：

```javascript
async executeContract(contractId, method, args, sender) {
  // 加载合约
  const contract = await this.dao.findOneByPrimaryKey('contract', contractId);
  if (!contract) {
    throw new Error(`Contract ${contractId} not found`);
  }
  
  // 创建合约执行环境
  const contractEnv = await this.createContractEnvironment(contract, sender);
  
  // 执行合约方法
  try {
    const result = await contractEnv.execute(method, args);
    
    // 记录执行结果
    await this.dao.create('contract_result', {
      contract_id: contractId,
      transaction_id: sender.transaction_id,
      success: true,
      gas: result.gas,
      data: result.data,
      stateChangesHash: result.stateChangesHash
    });
    
    // 更新合约状态
    await this.updateContractState(contractId, result.stateChanges);
    
    return result;
  } catch (err) {
    // 记录执行失败
    await this.dao.create('contract_result', {
      contract_id: contractId,
      transaction_id: sender.transaction_id,
      success: false,
      gas: 0,
      error: err.message
    });
    
    throw err;
  }
}
```

## 3. 合约数据库模型

DDN 智能合约系统使用以下数据库模型存储合约相关信息：

### 3.1 合约表 (contract)

存储合约基本信息。

| 字段名 | 类型 | 描述 |
| ----- | ---- | ---- |
| id | string | 合约 ID，主键 |
| name | string | 合约名称 |
| owner | string | 合约所有者地址 |
| transaction_id | string | 部署合约的交易 ID |
| code | text | 合约代码 |
| version | string | 合约版本 |
| gasLimit | bigint | Gas 限制 |
| timestamp | int | 创建时间戳 |
| desc | string | 合约描述 |
| metadata | text | 合约元数据 |

### 3.2 合约结果表 (contract_result)

存储合约执行结果。

| 字段名 | 类型 | 描述 |
| ----- | ---- | ---- |
| id | string | 结果 ID，主键 |
| contract_id | string | 合约 ID |
| transaction_id | string | 执行合约的交易 ID |
| success | boolean | 执行是否成功 |
| gas | bigint | 消耗的 Gas |
| error | string | 错误信息（如果失败） |
| data | text | 执行结果数据 |
| stateChangesHash | string | 状态变更哈希 |
| timestamp | int | 执行时间戳 |

### 3.3 合约转账表 (contract_call)

存储合约相关的转账记录。

| 字段名 | 类型 | 描述 |
| ----- | ---- | ---- |
| id | string | 转账 ID，主键 |
| transaction_id | string | 交易 ID |
| contract_id | string | 合约 ID |
| sender_id | string | 发送方地址 |
| recipient_id | string | 接收方地址 |
| amount | string | 转账金额 |
| currency | string | 货币类型 |
| block_height | int | 区块高度 |
| timestamp | int | 转账时间戳 |

## 4. 合约 API 接口实现

合约 API 接口实现位于 `packages/peer/src/network/service/api/contracts/index.js`，提供了查询和调用合约的 HTTP API。

### 4.1 合约查询接口

**示例代码**：

```javascript
async getId(req) {
  try {
    const id = req.params.id;
    if (!id) {
      return { success: false, error: 'Contract ID is required' };
    }

    // 查询合约信息
    const contract = await this.dao.findOneByPrimaryKey('contract', id);
    if (!contract) {
      return { success: false, error: `Contract with ID ${id} not found` };
    }

    return { success: true, contract };
  } catch (err) {
    this.logger.error(`Error getting contract by ID: ${err.message}`);
    return { success: false, error: err.message };
  }
}
```

### 4.2 合约结果查询接口

**示例代码**：

```javascript
async getResult(req) {
  const { params, query } = req;
  const id = params.id || query.id;
  const transactionId = params.transactionId || query.transactionId;

  if (!id) {
    return { success: false, error: 'Contract ID is required' };
  }

  // 查询合约信息
  const contract = await this.dao.findOneByPrimaryKey('contract', id);
  if (!contract) {
    return { success: false, error: `Contract with ID ${id} not found` };
  }

  // 查询合约执行结果
  let result;
  if (transactionId) {
    // 如果提供了交易ID，查询指定交易的结果
    result = await this.dao.findOne('contract_result', { where: { transaction_id: transactionId } });
    if (!result) {
      return { success: false, error: `Contract result not found for transaction ID: ${transactionId}` };
    }
  } else {
    // 否则查询最新的结果
    const results = await this.dao.findList('contract_result', {
      where: { contract_id: id },
      order: [['timestamp', 'DESC']],
      limit: 1
    });
    if (!results || results.length === 0) {
      return { success: false, error: `No results found for contract ID: ${id}` };
    }
    result = results[0];
  }

  // 处理结果
  const record = processResult(result);
  const resultWithTransactions = await populateTrs([record], this.dao);

  return { success: true, result: resultWithTransactions[0] };
}
```

### 4.3 合约调用接口

**示例代码**：

```javascript
async postCall(req) {
  const { id, method, args } = req.body;
  if (!id) {
    return { success: false, error: 'Contract ID is required' };
  }
  if (!method) {
    return { success: false, error: 'Method name is required' };
  }

  const methodArgs = args || [];
  if (!Array.isArray(methodArgs)) {
    return { success: false, error: 'Arguments should be array' };
  }

  try {
    // 调用合约只读方法
    const result = await this.runtime.dvm.callReadonly(id, method, ...methodArgs);
    return { success: true, result };
  } catch (err) {
    this.logger.error(`Error calling contract method: ${err.message}`);
    return { success: false, error: err.message };
  }
}
```

## 5. 最佳实践与注意事项

### 5.1 合约验证最佳实践

1. **分层验证**：在不同层次进行验证，包括客户端验证、API 验证、交易池验证和区块验证。

2. **完整性检查**：确保合约代码和参数的完整性，防止恶意代码注入。

3. **资源限制**：通过 Gas 限制机制防止资源滥用，确保合约执行不会消耗过多资源。

4. **安全检查**：对合约代码进行安全检查，防止常见的安全漏洞。

### 5.2 合约开发注意事项

1. **错误处理**：合约代码应该有完善的错误处理机制，确保在异常情况下能够正确回滚状态。

2. **状态管理**：合约状态应该通过合约 API 进行管理，避免直接修改数据库。

3. **Gas 优化**：优化合约代码，减少 Gas 消耗，提高执行效率。

4. **版本兼容**：在升级合约时，确保新版本与旧版本兼容，避免状态丢失。

### 5.3 API 设计注意事项

1. **参数验证**：对所有 API 参数进行严格验证，防止注入攻击。

2. **错误处理**：提供清晰的错误信息，帮助开发者快速定位问题。

3. **性能优化**：优化查询性能，避免大量数据查询导致的性能问题。

4. **安全性**：敏感操作应该需要身份验证和授权。

## 6. 调试与故障排除

### 6.1 常见错误及解决方案

1. **Invalid transaction id**：
   - 原因：在查询合约结果时只提供了合约 ID 而没有提供交易 ID。
   - 解决方案：修改 `getResult` 方法，支持只使用合约 ID 查询最新结果。

2. **Contract compilation failed**：
   - 原因：合约代码存在语法错误或不符合规范。
   - 解决方案：检查合约代码，确保符合 DDN 智能合约规范。

3. **API endpoint not found**：
   - 原因：API 路由配置错误或方法名不符合规范。
   - 解决方案：检查 API 方法名，确保符合 DDN 的路由映射规则。

### 6.2 日志分析

DDN 节点会记录详细的日志，可以通过分析日志来定位问题：

```bash
# 查看节点日志
tail -f logs/debug.log

# 过滤合约相关日志
grep "contract" logs/debug.log

# 过滤错误日志
grep "error" logs/debug.log
```

### 6.3 调试工具

1. **合约调试器**：使用 DDN 提供的合约调试器进行调试。

2. **API 测试工具**：使用 Postman 或 curl 测试 API 接口。

3. **区块浏览器**：使用区块浏览器查看交易和合约状态。

## 7. 总结

DDN 智能合约系统提供了完整的合约验证和提交流程，确保合约的安全性和可靠性。开发者应该遵循最佳实践，编写高质量的合约代码，并使用提供的 API 接口进行合约操作。

通过本文档，开发者可以了解 DDN 智能合约系统的内部实现机制，更好地开发和调试智能合约应用。
