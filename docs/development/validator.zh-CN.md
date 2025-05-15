# DDN 验证器开发和使用文档

## 简介

DDN 验证器是一个灵活、可扩展的验证框架，用于验证各种类型的数据，包括交易、合约代码等。它提供了一套统一的接口和规则，使开发者能够轻松地添加新的验证规则和扩展现有功能。

## 架构

DDN 验证器由以下几个主要部分组成：

1. **基础验证器 (Validator)**：提供核心验证功能和规则管理。
2. **字段 (Field)**：表示被验证的数据字段，包含值和规则。
3. **交易验证器 (TransactionValidator)**：扩展基础验证器，添加交易相关的验证规则。
4. **验证规则 (Rules)**：定义如何验证特定类型的数据。

## 使用方法

### 基础验证

```javascript
import { Validator } from '@ddn/peer/src/utils/validator';

// 创建验证器实例
const validator = new Validator();

// 验证数据
const report = validator.validate(value, {
  type: 'string',
  minLength: 5,
  maxLength: 100
});

// 检查验证结果
if (report.isValid) {
  console.log('验证通过');
} else {
  console.log('验证失败:', report.issues);
}
```

### 交易验证

```javascript
import { validateTransaction, validateContractTransaction } from '@ddn/peer/src/utils/validator';

// 验证普通交易
const isValidTransaction = await validateTransaction(transaction, context);

// 验证合约交易
const isValidContractTransaction = await validateContractTransaction(transaction, context);
```

### 合约代码验证

```javascript
import { validateContractCode } from '@ddn/peer/src/utils/validator';

// 验证合约代码
const isValidCode = await validateContractCode(code, context);
```

## 添加自定义验证规则

### 向基础验证器添加规则

```javascript
import { Validator } from '@ddn/peer/src/utils/validator';

// 添加自定义规则
Validator.addRule('customRule', {
  description: '自定义验证规则',
  validate(accept, value) {
    // 实现验证逻辑
    return value === accept;
  }
});

// 使用自定义规则
const validator = new Validator();
const report = validator.validate(value, { customRule: expectedValue });
```

### 扩展交易验证器

```javascript
import { TransactionValidator } from '@ddn/peer/src/utils/validator';

// 添加自定义交易验证规则
TransactionValidator.addRule('customTransactionRule', {
  description: '自定义交易验证规则',
  async validate(accept, transaction, field) {
    const context = field.thisArg;

    // 实现验证逻辑
    // ...

    return true;
  }
});

// 使用自定义规则
const validator = new TransactionValidator();
const report = await validator.validate(transaction, { customTransactionRule: true }, context);
```

## 验证规则

### 基础规则

| 规则名 | 描述 | 示例 |
|-------|------|------|
| `type` | 检查值的类型 | `{ type: 'string' }` |
| `equal` | 检查值是否等于指定值 | `{ equal: 'expected' }` |
| `greater` | 检查值是否大于指定值 | `{ greater: 10 }` |
| `less` | 检查值是否小于指定值 | `{ less: 100 }` |
| `defaults` | 设置默认值 | `{ defaults: 'default value' }` |

### 交易规则

| 规则名 | 描述 | 示例 |
|-------|------|------|
| `transaction` | 验证基本交易 | `{ transaction: true }` |
| `contractTransaction` | 验证合约交易 | `{ contractTransaction: true }` |
| `contractCode` | 验证合约代码 | `{ contractCode: true }` |

## 最佳实践

1. **使用便捷方法**：对于常见的验证任务，使用提供的便捷方法，如 `validateTransaction`。
2. **扩展而非修改**：通过扩展现有验证器添加新功能，而不是修改核心代码。
3. **模块化规则**：将相关的验证规则组织在一起，提高代码的可维护性。
4. **提供详细错误信息**：在验证规则中提供详细的错误信息，帮助开发者快速定位问题。
5. **异步验证**：对于需要访问数据库或其他异步操作的验证，使用异步验证规则。

## 示例

### 验证交易

```javascript
import { validateTransaction } from '@ddn/peer/src/utils/validator';

async function processTransaction(transaction) {
  const context = {
    runtime: this.runtime,
    logger: this.logger,
    dao: this.dao
  };

  const isValid = await validateTransaction(transaction, context);

  if (isValid) {
    // 处理有效交易
    await this.applyTransaction(transaction);
  } else {
    // 处理无效交易
    this.logger.warn(`Invalid transaction: ${transaction.id}`);
  }
}
```

### 验证合约代码

```javascript
import { validateContractCode } from '@ddn/peer/src/utils/validator';

async function registerContract(code) {
  const context = {
    runtime: this.runtime,
    logger: this.logger
  };

  const isValid = await validateContractCode(code, context);

  if (isValid) {
    // 部署合约
    await this.runtime.contract.deploy(code);
  } else {
    // 处理无效合约代码
    throw new Error('Invalid contract code');
  }
}
```

## 高级主题

### 自定义报告器

```javascript
import { Validator } from '@ddn/peer/src/utils/validator';

// 创建自定义报告器
class CustomReporter {
  constructor(validator) {
    this.validator = validator;
  }

  convert(issues, rules) {
    // 转换问题为自定义格式
    return issues.map(issue => ({
      code: 'VALIDATION_ERROR',
      field: issue.path,
      message: issue.message
    }));
  }
}

// 使用自定义报告器
const validator = new Validator({
  reporter: CustomReporter
});
```

### 条件验证

```javascript
import { Validator } from '@ddn/peer/src/utils/validator';

// 添加条件验证规则
Validator.addRule('conditional', {
  description: '条件验证',
  validate(accept, value, field) {
    const condition = accept.condition;
    const rule = accept.rule;

    // 如果条件满足，应用规则
    if (condition(value)) {
      return field.validator.validate(value, rule).isValid;
    }

    return true;
  }
});

// 使用条件验证
const validator = new Validator();
const report = validator.validate(value, {
  conditional: {
    condition: v => v > 10,
    rule: { type: 'string' }
  }
});
```

## 故障排除

### 常见问题

1. **验证器找不到规则**：确保规则已经正确添加到验证器中。
2. **异步验证没有回调**：确保在使用异步验证时提供回调函数。
3. **验证器上下文缺失**：确保在调用验证方法时提供正确的上下文对象。

### 调试技巧

1. **启用详细日志**：在验证规则中添加详细的日志记录。
2. **检查验证报告**：验证报告包含详细的问题信息，可以帮助定位问题。
3. **单步验证**：对复杂的验证逻辑，可以分步验证，逐步定位问题。

## 参考

- [DDN 官方文档](https://docs.ddn.net)
- [验证器源码](https://github.com/ddnlink/ddn/tree/master/packages/peer/src/utils/validator)