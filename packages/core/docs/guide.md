# DDN 错误处理指南

本文档详细介绍了 DDN 项目中的错误处理机制，包括错误类、错误码、错误处理工具和最佳实践。

## 目录

- [概述](#概述)
- [错误处理的优势](#错误处理的优势)
- [错误类层次结构](#错误类层次结构)
- [错误码系统](#错误码系统)
- [错误处理工具](#错误处理工具)
  - [错误创建](#错误创建)
  - [错误格式化](#错误格式化)
  - [全局错误处理](#全局错误处理)
  - [异步函数错误处理](#异步函数错误处理)
  - [Express 中间件](#express-中间件)
  - [HTTP 客户端错误处理](#http-客户端错误处理)
- [使用示例](#使用示例)
  - [基本用法](#基本用法)
  - [在业务逻辑中使用](#在业务逻辑中使用)
  - [在 API 层使用](#在-api-层使用)
  - [在 HTTP 客户端中使用](#在-http-客户端中使用)
- [错误处理最佳实践](#错误处理最佳实践)
- [常见问题解答](#常见问题解答)

## 概述

DDN 项目的错误处理机制旨在提供一个统一、规范、易用的错误处理方案，解决以下问题：

1. 错误处理代码分散，缺乏统一标准
2. 大量重复的错误处理逻辑
3. 错误信息格式不一致，有时会出现`[object Object]`等无用信息
4. 缺乏全局错误处理机制
5. 错误处理不符合现代互联网产品规范

通过引入标准化的错误处理机制，我们可以提高代码质量、增强用户体验、简化调试过程，并提高系统的整体稳定性。

## 错误处理的优势

使用 DDN 的错误处理机制有以下优势：

1. **统一的错误格式**：所有错误都遵循相同的格式，包括错误码、错误消息和附加数据，便于前端处理和显示。

2. **减少重复代码**：通过集中的错误处理工具，减少重复的错误处理代码，提高代码的可维护性。

3. **提高调试效率**：标准化的错误格式和错误码使调试更加容易，可以快速定位问题。

4. **增强用户体验**：向用户提供清晰、有意义的错误消息，帮助用户理解和解决问题。

5. **系统稳定性**：全局错误处理机制可以捕获未处理的异常，防止系统崩溃。

6. **符合行业标准**：错误处理方式符合现代互联网产品的规范，如 RESTful API 的错误响应格式。

7. **多语言支持**：错误码系统便于实现多语言错误消息。

8. **错误分类与统计**：通过错误码可以对错误进行分类和统计，便于系统监控和性能优化。

## 错误类层次结构

DDN 错误处理机制提供了一系列特定领域的错误类，形成了一个层次结构：

```
DdnError (基类)
├── SystemError
├── BusinessError
│   ├── TransactionError
│   ├── BlockError
│   ├── AccountError
│   └── AssetError
├── ValidationError
└── HttpError
```

每个错误类都有特定的用途：

- **DdnError**：所有自定义错误的基类，提供基本的错误属性和方法。
- **SystemError**：表示系统级错误，如数据库连接失败、内存不足等。
- **BusinessError**：表示业务逻辑错误，是 TransactionError、BlockError 等的基类。
- **TransactionError**：表示交易相关的错误，如余额不足、交易过期等。
- **BlockError**：表示区块相关的错误，如区块验证失败、区块不存在等。
- **AccountError**：表示账户相关的错误，如账户不存在、密码错误等。
- **AssetError**：表示资产相关的错误，如资产不存在、资产已冻结等。
- **ValidationError**：表示数据验证错误，如参数格式错误、必填字段缺失等。
- **HttpError**：表示 HTTP 请求错误，如请求超时、服务器错误等。

## 错误码系统

DDN 使用结构化的错误码系统，格式为 `ABBCC`：

- **A**：错误类型
  - 1：系统错误
  - 2：业务错误
  - 3：第三方服务错误
  - 4：用户输入错误
- **BB**：模块编号
  - 01：核心模块
  - 02：交易模块
  - 03：区块模块
  - 04：账户模块
  - 05：共识模块
  - 06：P2P模块
  - 07：API模块
  - 08：资产模块
  - ...
- **CC**：具体错误编号，从01开始递增

例如：
- `10001`：系统错误
- `20201`：交易错误
- `20301`：区块错误
- `40001`：验证错误

错误码与 HTTP 状态码的映射关系：

- 1xxxx：对应 HTTP 500（服务器内部错误）
- 2xxxx：根据具体错误类型映射
  - 账户/区块/资产不存在：HTTP 404（资源不存在）
  - 认证错误：HTTP 401（未授权）
  - 其他业务错误：HTTP 400（请求错误）
- 3xxxx：对应 HTTP 502（网关错误）
- 4xxxx：对应 HTTP 400（请求错误）

## 错误处理工具

### 错误创建

```javascript
import { DdnError, ErrorCodes, createError } from '@ddn/core/errors';

// 创建基本错误
const error = new DdnError('操作失败', ErrorCodes.SYSTEM_ERROR);

// 创建特定类型的错误
const txError = new TransactionError('余额不足', ErrorCodes.INSUFFICIENT_BALANCE);

// 从任意错误对象创建 DdnError
const error2 = createError(new Error('数据库连接失败'), ErrorCodes.DATABASE_ERROR);

// 包含附加数据
const error3 = new DdnError('交易验证失败', ErrorCodes.INVALID_TRANSACTION, {
  transactionId: 'abc123',
  reason: 'signature_mismatch'
});

// 包含原始错误
try {
  // 可能抛出错误的代码
} catch (err) {
  throw new DdnError('处理交易失败', ErrorCodes.TRANSACTION_ERROR, null, err);
}
```

### 错误格式化

```javascript
import { ErrorUtils } from '@ddn/core/errors';

// 获取错误消息
const message = ErrorUtils.getErrorMessage(err);

// 获取错误码
const code = ErrorUtils.getErrorCode(err, ErrorCodes.SYSTEM_ERROR);

// 创建标准错误响应
const response = ErrorUtils.createErrorResponse(err);
// {
//   success: false,
//   error: {
//     code: 20205,
//     message: '交易金额无效',
//     data: null
//   }
// }
```

### 全局错误处理

```javascript
import { globalErrorHandler, ErrorCodes } from '@ddn/core/errors';
import { setupGlobalErrorHandlers } from '@ddn/core/errors';

// 注册特定错误类型的处理函数
globalErrorHandler.register(ErrorCodes.INSUFFICIENT_BALANCE, (error, context) => {
  console.warn(`余额不足: ${error.message}`);
  return {
    success: false,
    error: {
      code: error.code,
      message: '您的账户余额不足，请充值后再试'
    }
  };
});

// 注册特定错误类的处理函数
globalErrorHandler.register('TransactionError', (error, context) => {
  // 处理所有交易错误
  return ErrorUtils.createErrorResponse(error);
});

// 注册自定义条件的处理函数
globalErrorHandler.register(
  error => error.code >= 20200 && error.code < 20300,
  (error, context) => {
    // 处理所有交易相关错误码
    return ErrorUtils.createErrorResponse(error);
  }
);

// 设置全局未捕获异常处理器
setupGlobalErrorHandlers({
  exitOnUncaughtException: process.env.NODE_ENV === 'production',
  logger: console
});
```

### 异步函数错误处理

```javascript
import { asyncErrorWrapper } from '@ddn/core/errors';

// 原始异步函数
async function processTransaction(tx) {
  // 可能抛出错误的代码
  if (!tx.signature) {
    throw new TransactionError('交易签名缺失', ErrorCodes.INVALID_SIGNATURE);
  }
  return tx;
}

// 包装后的函数会自动捕获并处理错误
const safelyProcessTransaction = asyncErrorWrapper(processTransaction);

// 使用包装后的函数
const result = await safelyProcessTransaction(transaction);
if (!result.success) {
  console.error(result.error.message);
}
```

### Express 中间件

```javascript
import express from 'express';
import { createErrorMiddleware, asyncHandler } from '@ddn/core/middleware/error-middleware';

const app = express();

// 路由处理
app.get('/api/transactions/:id', asyncHandler(async (req, res) => {
  const transaction = await getTransactionById(req.params.id);
  if (!transaction) {
    throw new TransactionError('交易不存在', ErrorCodes.TRANSACTION_NOT_FOUND);
  }
  res.json({ success: true, data: transaction });
}));

// 错误处理中间件（放在所有路由之后）
app.use(createErrorMiddleware({
  logErrors: true,
  includeStackTrace: process.env.NODE_ENV === 'development'
}));
```

### HTTP 客户端错误处理

```javascript
import { createHttpClient } from '@ddn/core/http/http-client';

// 创建 HTTP 客户端
const httpClient = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

// 使用客户端发送请求
try {
  const data = await httpClient.get('/transactions/123');
  console.log(data);
} catch (error) {
  console.error(`请求失败: ${error.message}`);
  console.error(`错误码: ${error.code}`);
  
  if (error.response) {
    console.error(`状态码: ${error.response.status}`);
  }
}
```

## 使用示例

### 基本用法

```javascript
import { DdnError, ErrorCodes, createError, ErrorUtils } from '@ddn/core/errors';

// 创建错误
const error = new DdnError('操作失败', ErrorCodes.SYSTEM_ERROR);

// 错误转换为 JSON
console.log(error.toJSON());
// {
//   name: 'DdnError',
//   code: 10001,
//   message: '操作失败',
//   data: null,
//   stack: '...'
// }

// 错误转换为字符串
console.log(error.toString());
// [10001] DdnError: 操作失败

// 获取错误消息
console.log(ErrorUtils.getErrorMessage(error));
// 操作失败

// 创建错误响应
console.log(ErrorUtils.createErrorResponse(error));
// {
//   success: false,
//   error: {
//     code: 10001,
//     message: '操作失败',
//     data: null
//   }
// }
```

### 在业务逻辑中使用

```javascript
// packages/peer/src/kernal/transaction/transaction.js
import { TransactionError, ErrorCodes, ErrorUtils } from '@ddn/core/errors';

class Transaction {
  async verify(trs, sender) {
    try {
      // 验证交易
      if (!trs.signature) {
        throw new TransactionError('交易签名缺失', ErrorCodes.INVALID_SIGNATURE);
      }
      
      if (bignum.isLessThan(trs.amount, 0)) {
        throw new TransactionError('交易金额无效', ErrorCodes.INVALID_AMOUNT);
      }
      
      // 验证余额
      if (bignum.isLessThan(sender.balance, trs.amount)) {
        throw new TransactionError('余额不足', ErrorCodes.INSUFFICIENT_BALANCE, {
          required: trs.amount,
          available: sender.balance
        });
      }
      
      // 调用资产特定的验证
      return await this._assets.call(trs.type, 'verify', trs, sender);
    } catch (err) {
      // 使用 ErrorUtils 格式化错误信息
      this.logger.error(`验证交易失败: ${ErrorUtils.getErrorMessage(err)}`);
      
      // 如果错误已经是 DdnError，直接抛出
      if (err instanceof DdnError) {
        throw err;
      }
      
      // 否则，包装为 TransactionError
      throw new TransactionError(
        `验证交易失败: ${ErrorUtils.getErrorMessage(err)}`,
        ErrorCodes.TRANSACTION_ERROR,
        { transactionId: trs.id },
        err
      );
    }
  }
}
```

### 在 API 层使用

```javascript
// packages/peer/src/network/service/api/transactions/index.js
import { asyncHandler } from '@ddn/core/middleware/error-middleware';
import { TransactionError, ErrorCodes } from '@ddn/core/errors';

export default class TransactionsApi {
  constructor(context) {
    Object.assign(this, context);
    this._context = context;
  }
  
  mount(app) {
    app.get('/api/transactions/:id', asyncHandler(async (req, res) => {
      const transaction = await this.runtime.transaction.getTransactionById(req.params.id);
      
      if (!transaction) {
        throw new TransactionError('交易不存在', ErrorCodes.TRANSACTION_NOT_FOUND, {
          id: req.params.id
        });
      }
      
      res.json({
        success: true,
        data: transaction
      });
    }));
    
    app.post('/api/transactions', asyncHandler(async (req, res) => {
      const { transaction } = req.body;
      
      if (!transaction) {
        throw new ValidationError('缺少交易数据');
      }
      
      const result = await this.runtime.transaction.processUnconfirmedTransaction(transaction);
      
      res.json({
        success: true,
        data: result
      });
    }));
  }
}
```

### 在 HTTP 客户端中使用

```javascript
// packages/peer/src/network/service/api/client.js
import { createHttpClient } from '@ddn/core/http/http-client';
import { SystemError, ErrorCodes } from '@ddn/core/errors';

// 创建 HTTP 客户端
const apiClient = createHttpClient({
  baseURL: config.apiBaseUrl,
  timeout: 10000
});

// 使用客户端发送请求
async function fetchPeers() {
  try {
    return await apiClient.get('/peers');
  } catch (error) {
    logger.error(`获取节点列表失败: ${error.message}`);
    
    // 可以根据需要重新抛出或处理错误
    throw new SystemError(
      `获取节点列表失败: ${error.message}`,
      ErrorCodes.NETWORK_ERROR,
      null,
      error
    );
  }
}
```

## 错误处理最佳实践

1. **使用特定错误类型**：根据错误的性质选择合适的错误类型，如 `TransactionError`、`BlockError` 等，而不是通用的 `Error` 或 `DdnError`。

2. **提供有意义的错误消息**：错误消息应该清晰描述问题，并可能提供解决方案。例如，使用"余额不足，需要 100 DDN，当前余额 50 DDN"而不是简单的"余额不足"。

3. **使用标准错误码**：使用定义好的错误码，便于跟踪和分类错误。不要使用自定义的、未在 `ErrorCodes` 中定义的错误码。

4. **包含上下文信息**：在错误对象中包含足够的上下文信息，帮助诊断问题。例如，包含交易 ID、区块高度等相关数据。

5. **避免暴露敏感信息**：在生产环境中，不要在错误响应中包含堆栈跟踪或敏感数据，如数据库连接字符串、密码等。

6. **集中处理错误**：使用全局错误处理器和中间件集中处理错误，避免在每个函数中重复编写错误处理代码。

7. **记录错误**：记录所有错误，但根据错误的严重性选择不同的日志级别。系统错误使用 `error` 级别，业务错误使用 `warn` 级别，用户输入错误使用 `info` 级别。

8. **优雅降级**：当发生错误时，系统应该尽可能地继续运行，而不是完全崩溃。例如，如果一个交易处理失败，不应该影响其他交易的处理。

9. **使用 asyncHandler**：在 Express 路由中使用 `asyncHandler` 包装异步函数，自动捕获并处理异常，避免未捕获的 Promise 拒绝。

10. **提供友好的用户错误消息**：对于面向用户的错误，提供友好、易懂的错误消息，避免技术术语和内部实现细节。

11. **区分开发和生产环境**：在开发环境中提供详细的错误信息，包括堆栈跟踪，而在生产环境中提供简洁的错误消息。

12. **处理第三方库错误**：包装第三方库抛出的错误，转换为标准的 DDN 错误格式。

## 常见问题解答

### 1. 如何选择正确的错误类型？

根据错误的性质选择合适的错误类型：
- 系统级错误（如数据库连接失败）：使用 `SystemError`
- 交易相关错误：使用 `TransactionError`
- 区块相关错误：使用 `BlockError`
- 账户相关错误：使用 `AccountError`
- 资产相关错误：使用 `AssetError`
- 数据验证错误：使用 `ValidationError`
- HTTP 请求错误：使用 `HttpError`

如果没有合适的特定错误类型，可以使用基类 `DdnError` 或 `BusinessError`。

### 2. 如何处理未捕获的异常？

使用 `setupGlobalErrorHandlers` 函数设置全局未捕获异常处理器：

```javascript
import { setupGlobalErrorHandlers } from '@ddn/core/errors';

setupGlobalErrorHandlers({
  exitOnUncaughtException: process.env.NODE_ENV === 'production',
  logger: console
});
```

这将捕获所有未处理的异常和 Promise 拒绝，记录错误并根据配置决定是否退出进程。

### 3. 如何在 Express 应用中处理错误？

使用 `createErrorMiddleware` 创建错误处理中间件，并将其添加到 Express 应用的最后：

```javascript
import { createErrorMiddleware } from '@ddn/core/middleware/error-middleware';

app.use(createErrorMiddleware({
  logErrors: true,
  includeStackTrace: process.env.NODE_ENV === 'development'
}));
```

同时，使用 `asyncHandler` 包装异步路由处理函数，自动捕获并处理异常：

```javascript
import { asyncHandler } from '@ddn/core/middleware/error-middleware';

app.get('/api/resource', asyncHandler(async (req, res) => {
  // 异步代码
}));
```

### 4. 如何添加新的错误码？

在 `ErrorCodes` 对象中添加新的错误码，并在 `ErrorMessages` 对象中添加对应的错误消息：

```javascript
// packages/core/src/errors/index.js
export const ErrorCodes = {
  // 现有错误码...
  
  // 添加新的错误码
  TRANSACTION_EXPIRED: 20210,
};

export const ErrorMessages = {
  // 现有错误消息...
  
  // 添加新的错误消息
  [ErrorCodes.TRANSACTION_EXPIRED]: '交易已过期',
};
```

### 5. 如何在错误响应中包含额外数据？

在创建错误对象时，可以传递额外的数据作为第三个参数：

```javascript
throw new TransactionError(
  '余额不足',
  ErrorCodes.INSUFFICIENT_BALANCE,
  {
    required: '100',
    available: '50',
    currency: 'DDN'
  }
);
```

这些数据将包含在错误响应的 `error.data` 字段中。

### 6. 如何实现多语言错误消息？

可以创建一个错误消息翻译函数，根据当前语言环境返回对应的错误消息：

```javascript
function translateErrorMessage(code, language = 'zh-CN') {
  const messages = {
    'zh-CN': {
      [ErrorCodes.INSUFFICIENT_BALANCE]: '余额不足',
      // 其他错误消息...
    },
    'en-US': {
      [ErrorCodes.INSUFFICIENT_BALANCE]: 'Insufficient balance',
      // 其他错误消息...
    }
  };
  
  return messages[language][code] || ErrorMessages[code] || '未知错误';
}
```

然后在创建错误响应时使用这个函数：

```javascript
const response = {
  success: false,
  error: {
    code: error.code,
    message: translateErrorMessage(error.code, req.language)
  }
};
```
