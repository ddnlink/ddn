# DDN交易提交接口使用指南

本文档详细介绍了如何使用DDN区块链的交易提交接口，包括如何通过SDK创建交易体以及如何通过POST方法提交交易。本指南适用于前端和后台开发环境。

## 目录

- [概述](#概述)
- [前置条件](#前置条件)
- [交易创建与提交流程](#交易创建与提交流程)
- [使用SDK创建交易](#使用sdk创建交易)
- [提交交易到节点](#提交交易到节点)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 概述

DDN区块链支持多种类型的交易，包括转账交易、资产发行交易、智能合约交易等。所有交易都需要经过创建、签名和提交三个步骤才能被区块链网络接受和处理。

## 前置条件

在开始之前，请确保：

1. 已安装DDN JavaScript SDK：`npm install @ddn/js-sdk`
2. 了解DDN区块链的基本概念和交易类型
3. 拥有一个有效的DDN账户（包括地址和密钥）
4. 了解要连接的DDN节点地址

> 注意：`@ddn/js-sdk` 不再提供 `DdnJS.init` 方法。在浏览器环境中，您可以通过设置全局配置 `window.DdnJS.config` 来指定网络参数；在Node.js环境中，您需要使用 `ApiClient` 类来指定API端点。

## 交易创建与提交流程

DDN交易的创建与提交流程如下：

1. 使用SDK创建交易体
2. 使用私钥对交易进行签名
3. 通过HTTP POST方法将签名后的交易提交到DDN节点
4. 节点验证交易并将其广播到网络
5. 交易被打包进区块并确认

## 使用SDK创建交易

以下是使用DDN JavaScript SDK创建不同类型交易的示例。`@ddn/js-sdk` 同时支持浏览器和Node.js环境，因此这些示例可以在前端和后台应用中使用：

### 转账交易

```javascript
const DdnJS = require('@ddn/js-sdk');

// 创建转账交易
const transaction = DdnJS.transaction.createTransaction(
  'DCG1GN1Q6KKeSQasB8XZxM3szAS4toQqmY', // 接收地址
  '1400000000',                          // 金额（DDN的最小单位，1 DDN = 100000000）
  'your secret passphrase',              // 发送者密钥
  'your second secret if any'            // 二级密码（如果有）
);

console.log(transaction);
```

> 注意：在浏览器环境中，您可以通过设置全局配置来指定网络参数：
> ```html
> <script>
>   window.DdnJS = window.DdnJS || {};
>   window.DdnJS.config = {
>     nethash: 'm66gcvle',
>     host: '127.0.0.1',
>     port: 8001
>   };
> </script>
> ```

### 资产发行交易

```javascript
const DdnJS = require('@ddn/js-sdk');

// 创建资产发行交易
const transaction = DdnJS.aob.createAsset(
  'ASSET_NAME',                // 资产名称
  'Asset description',         // 资产描述
  '10000000000',               // 发行量
  8,                           // 精度
  'your secret passphrase',    // 发送者密钥
  'your second secret if any'  // 二级密码（如果有）
);

console.log(transaction);
```

### 智能合约交易

```javascript
const DdnJS = require('@ddn/js-sdk');

// 创建智能合约交易
const transaction = DdnJS.contract.deploy(
  'contract code here',        // 合约代码
  'your secret passphrase',    // 发送者密钥
  'your second secret if any'  // 二级密码（如果有）
);

console.log(transaction);
```

## 提交交易到节点

创建并签名交易后，您需要将交易提交到DDN节点。以下是使用不同方法提交交易的示例，适用于前端和后台环境：

### 使用SDK提交

```javascript
const DdnJS = require('@ddn/js-sdk');

// 创建交易（以转账为例）
const transaction = DdnJS.transaction.createTransaction(
  'DCG1GN1Q6KKeSQasB8XZxM3szAS4toQqmY',
  '1400000000',
  'your secret passphrase'
);

// 提交交易
// 注意：需要设置API端点
const apiClient = new DdnJS.ApiClient('http://127.0.0.1:8001');
apiClient.transaction.broadcast(transaction)
  .then(result => {
    console.log('交易提交成功:', result);
  })
  .catch(error => {
    console.error('交易提交失败:', error);
  });
```

> 在浏览器环境中，您也可以通过全局配置设置API端点：
> ```html
> <script>
>   window.DdnJS = window.DdnJS || {};
>   window.DdnJS.config = {
>     apiUrl: 'http://127.0.0.1:8001'
>   };
> </script>
> ```

### 使用HTTP请求提交

#### 在Node.js环境中

```javascript
const axios = require('axios');

// 交易对象（已通过SDK创建并签名）
const transaction = {
  type: 0,
  nethash: 'm66gcvle',
  amount: '1400000000',
  fee: '10000000',
  recipientId: 'DCG1GN1Q6KKeSQasB8XZxM3szAS4toQqmY',
  message: '',
  timestamp: 232055312,
  asset: {},
  senderPublicKey: 'd3414d5ca406686907455522a379b1df321c671649b960de3339d068a17433d7',
  signature: '65ae801e3bb2f1a870beb205b02c039ff64ca195f9549fa785c7d8642423d5d6fba14cb08d99587f9957708c916a72add2c22358e6281b126e5b3ee58c6bba09',
  id: '583ba9f88f214e5bbe8435b38ab8f9f6bffd8f8371c03180959b62c5eb1816a5'
};

// 提交交易
axios.post('http://127.0.0.1:8001/api/transactions', transaction)
  .then(response => {
    console.log('交易提交成功:', response.data);
  })
  .catch(error => {
    console.error('交易提交失败:', error.response ? error.response.data : error.message);
  });
```

#### 在浏览器环境中

```javascript
// 交易对象（已通过SDK创建并签名）
const transaction = {
  type: 0,
  nethash: 'm66gcvle',
  amount: '1400000000',
  fee: '10000000',
  recipientId: 'DCG1GN1Q6KKeSQasB8XZxM3szAS4toQqmY',
  message: '',
  timestamp: 232055312,
  asset: {},
  senderPublicKey: 'd3414d5ca406686907455522a379b1df321c671649b960de3339d068a17433d7',
  signature: '65ae801e3bb2f1a870beb205b02c039ff64ca195f9549fa785c7d8642423d5d6fba14cb08d99587f9957708c916a72add2c22358e6281b126e5b3ee58c6bba09',
  id: '583ba9f88f214e5bbe8435b38ab8f9f6bffd8f8371c03180959b62c5eb1816a5'
};

// 使用fetch API提交交易
fetch('http://127.0.0.1:8001/api/transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(transaction)
})
.then(response => response.json())
.then(data => {
  console.log('交易提交成功:', data);
})
.catch(error => {
  console.error('交易提交失败:', error);
});
```

### 使用curl命令提交

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "type": 0,
  "nethash": "m66gcvle",
  "amount": "1400000000",
  "fee": "10000000",
  "recipientId": "DCG1GN1Q6KKeSQasB8XZxM3szAS4toQqmY",
  "message": "",
  "timestamp": 232055312,
  "asset": {},
  "senderPublicKey": "d3414d5ca406686907455522a379b1df321c671649b960de3339d068a17433d7",
  "signature": "65ae801e3bb2f1a870beb205b02c039ff64ca195f9549fa785c7d8642423d5d6fba14cb08d99587f9957708c916a72add2c22358e6281b126e5b3ee58c6bba09",
  "id": "583ba9f88f214e5bbe8435b38ab8f9f6bffd8f8371c03180959b62c5eb1816a5"
}' http://127.0.0.1:8001/api/transactions
```

## 错误处理

提交交易时可能会遇到各种错误。以下是一些常见错误及其处理方法：

### 常见错误

1. **交易验证失败**：检查交易字段是否正确，特别是签名、金额和费用。
2. **余额不足**：确保发送账户有足够的余额支付交易金额和费用。
3. **交易已存在**：该交易可能已经被提交过，检查交易ID是否重复。
4. **无效的发送者ID**：确保交易的发送者ID与从公钥计算出的地址匹配。
5. **网络哈希不匹配**：确保使用了正确的网络标识（nethash）。

### 错误响应示例

```json
{
  "success": false,
  "error": "Transaction validation failed: Invalid sender id: 583ba9f88f214e5bbe8435b38ab8f9f6bffd8f8371c03180959b62c5eb1816a5"
}
```

## 最佳实践

1. **始终验证交易**：在提交前，确保交易格式正确且所有必要字段都已填写。
2. **使用适当的费用**：设置合理的交易费用，以确保交易能被及时处理。
3. **处理错误**：实现适当的错误处理机制，以应对交易提交过程中可能出现的问题。
4. **检查交易状态**：提交交易后，使用交易ID查询交易状态，确认其是否被成功处理。
5. **保持网络连接**：确保与DDN节点的网络连接稳定，以避免交易提交中断。
6. **跨平台兼容性**：使用 `@ddn/js-sdk` 可以确保您的代码在前端和后台环境中都能正常工作。
7. **安全考虑**：在前端应用中，避免在客户端存储密钥，考虑使用安全的密钥管理方案。

## 常见问题

### 如何查询交易状态？

```javascript
const DdnJS = require('@ddn/js-sdk');

// 创建API客户端
const apiClient = new DdnJS.ApiClient('http://127.0.0.1:8001');

// 查询交易
apiClient.transaction.getTransaction('your-transaction-id')
  .then(transaction => {
    console.log('交易信息:', transaction);
  })
  .catch(error => {
    console.error('查询失败:', error);
  });
```

### 如何计算正确的交易费用？

不同类型的交易有不同的费用标准。以下是一些常见交易类型的费用：

- 转账交易：0.1 DDN
- 资产发行：500 DDN
- 智能合约部署：费用根据合约大小而定

您可以使用SDK的计算方法获取准确的费用：

```javascript
const DdnJS = require('@ddn/js-sdk');
const fee = DdnJS.transaction.calculateFee(transaction);
console.log('交易费用:', fee);
```

### 交易提交后多久能被确认？

交易通常在被提交后的几秒到几分钟内被确认，具体取决于网络状况和交易费用。您可以通过查询交易状态来检查确认情况。

### 如何在前端应用中安全地处理密钥？

在前端应用中处理密钥需要特别注意安全性：

1. **避免在客户端存储密钥**：不要将密钥存储在localStorage或sessionStorage中。
2. **使用临时会话**：只在用户输入密钥后的当前会话中使用它，会话结束后立即清除。
3. **考虑服务器签名**：对于高安全性要求的应用，考虑在服务器端进行交易签名。
4. **使用加密存储**：如果必须在客户端存储密钥，使用强加密方法并要求用户输入额外的密码解锁。

---

如有更多问题，请参考[DDN官方文档](https://github.com/ddnlink/ddn)或联系DDN技术支持团队。
