# DDN合约调用指南

## 1. 合约调用概述

在DDN区块链中，合约调用是通过创建特定类型的交易来实现的。合约调用有两种主要方式：

1. **普通调用（send）**：调用合约的状态修改方法，不包含资产转移
2. **支付调用（pay）**：向合约转账并调用方法，通常用于可支付（payable）方法

## 2. 合约调用交易结构

合约调用交易（type 12）的正确结构如下：

```javascript
{
  type: 12,                    // 合约调用交易类型
  timestamp: 12345678,         // 时间戳
  senderPublicKey: '...',      // 发送者公钥
  amount: '0',                 // 交易金额（通常为0）
  fee: '10000000',             // 交易费用
  recipientId: null,           // 接收者ID（通常为null）
  signature: '...',            // 交易签名
  id: '...',                   // 交易ID
  args: [                      // 合约调用参数数组
    'CONTRACT_ID',             // 合约ID
    'GAS_LIMIT',               // Gas限制
    'METHOD',                  // 方法名
    'ARGS_JSON'                // 方法参数（JSON字符串）
  ],
  nethash: '...'               // 网络标识
}
```

对于支付调用（pay），args数组结构为：

```javascript
args: [
  'CONTRACT_ID',               // 合约ID
  'GAS_LIMIT',                 // Gas限制
  'AMOUNT',                    // 支付金额
  'CURRENCY',                  // 货币类型
  'METHOD',                    // 方法名
  'ARGS_JSON'                  // 方法参数（JSON字符串）
]
```

## 3. 正确的合约调用方式

### 3.1 使用SDK创建合约调用交易

**普通调用（send）**：

```javascript
const DdnJS = require('@ddn/js-sdk').default;

// 初始化SDK
DdnJS.init({ nethash: 'm66gcvle' });

// 创建合约调用交易
async function callContract() {
  const options = {
    id: 'CONTRACT_ID',         // 合约ID
    gasLimit: 10000000,        // Gas限制
    method: 'methodName',      // 方法名
    args: ['param1', 'param2'] // 方法参数
  };
  
  const transaction = await DdnJS.contract.transfer(options, 'your_secret');
  return transaction;
}
```

**支付调用（pay）**：

```javascript
const DdnJS = require('@ddn/js-sdk').default;

// 初始化SDK
DdnJS.init({ nethash: 'm66gcvle' });

// 创建合约支付交易
async function payToContract() {
  const options = {
    id: 'CONTRACT_ID',         // 合约ID
    gasLimit: 10000000,        // Gas限制
    method: 'payableMethod',   // 方法名
    amount: '1000',            // 支付金额
    currency: 'DDN',           // 货币类型
    args: ['param1', 'param2'] // 方法参数
  };
  
  const transaction = await DdnJS.contract.pay(options, 'your_secret');
  return transaction;
}
```

### 3.2 广播交易到区块链网络

```javascript
const axios = require('axios');

// 广播交易
async function broadcastTransaction(transaction) {
  const response = await axios.post('http://localhost:8001/api/transactions', {
    transaction
  }, {
    headers: {
      'nethash': 'm66gcvle',
      'version': '1.0.0',
      'Content-Type': 'application/json'
    }
  });
  
  return response.data;
}
```

## 4. 常见错误和解决方案

### 4.1 交易规范化错误

**错误信息**：`Failed to normalize transaction: #/additionalProperties should NOT have additional properties`

**原因**：交易对象包含了schema中未定义的额外属性，或者缺少必要的属性。

**错误示例**：
```javascript
// 错误的方式，不要这样做！
const incorrectTransaction = {
  type: 12,
  fee: 0,
  args: [5000, true, "ThirdCrowdFundging/CrowdFundging", 10, "DDN"],
  secret: "your_secret"  // secret不应该直接包含在交易对象中
};

// 直接发送到API
axios.post('http://localhost:8001/', incorrectTransaction);
```

**解决方案**：
- 使用SDK的`DdnJS.contract.transfer`或`DdnJS.contract.pay`方法创建交易
- 不要直接构造交易对象
- 确保交易对象符合schema定义

### 4.2 参数格式错误

**错误信息**：`Invalid args format: args must be an array`

**原因**：合约调用参数格式不正确。

**解决方案**：
- 确保args参数是数组格式
- 对于复杂参数，使用JSON.stringify()转换为字符串

### 4.3 Gas不足

**错误信息**：`Gas is not enough`

**原因**：指定的Gas限制不足以执行合约操作。

**解决方案**：
- 增加gasLimit参数的值
- 确保账户有足够的能量

## 5. 最佳实践

1. **始终使用SDK**：使用`@ddn/js-sdk`创建和签名交易，而不是手动构造交易对象
2. **正确处理参数**：确保方法参数格式正确，复杂对象应转换为JSON字符串
3. **设置足够的Gas**：为复杂操作设置足够的Gas限制
4. **错误处理**：实现完善的错误处理机制，捕获并处理可能的异常
5. **测试**：在提交到主网前，在测试网络上测试合约调用

## 6. 示例代码

完整的合约调用示例可以在以下位置找到：
- `examples/contract-call-example.js`
- `examples/crowdfunding-contract-call.js`

这些示例展示了如何正确调用合约方法和处理可能的错误。
