import { TransactionValidator } from './transaction';

// 导出交易验证器
export { TransactionValidator };

// 导出便捷方法
export const validateTransaction = async (transaction, context) => {
  try {
    const validator = new TransactionValidator();
    return await validator.validateTransaction(transaction, context);
  } catch (err) {
    // 记录错误但不抛出，返回验证失败
    if (context && context.logger) {
      context.logger.error(`Transaction validation error: ${err.message}`, {
        transaction: transaction.id,
        error: err.stack
      });
    }
    return false;
  }
};

export const validateContractCode = async (code, context) => {
  try {
    const validator = new TransactionValidator();
    return await validator.validateContractCode(code, context);
  } catch (err) {
    // 记录错误但不抛出，返回验证失败
    if (context && context.logger) {
      context.logger.error(`Contract code validation error: ${err.message}`, {
        error: err.stack
      });
    }
    return false;
  }
};

export const validateContractTransaction = async (transaction, context) => {
  try {
    const validator = new TransactionValidator();
    return await validator.validateContractTransaction(transaction, context);
  } catch (err) {
    // 记录错误但不抛出，返回验证失败
    if (context && context.logger) {
      context.logger.error(`Contract transaction validation error: ${err.message}`, {
        transaction: transaction.id,
        error: err.stack
      });
    }
    return false;
  }
};