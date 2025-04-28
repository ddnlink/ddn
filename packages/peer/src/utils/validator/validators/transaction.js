
import { Validator } from '../validator.js';
import transactionRules from '../rules/transaction-rules.js';
import contractRules from '../rules/contract-rules.js';

/**
 * 交易验证器
 * 扩展基本验证器，添加交易相关的验证规则
 */
export class TransactionValidator extends Validator {
  constructor(options = {}) {
    super(options);
    this.initTransactionRules();
  }

  /**
   * 初始化交易验证规则
   */
  initTransactionRules() {
    // 这里不需要做任何事情，因为规则已经通过静态方法添加到原型中
  }

  /**
   * 验证交易
   * @param {Object} transaction 交易对象
   * @param {Object} context 上下文对象，包含runtime、logger等
   * @returns {Promise<boolean>} 验证结果
   */
  async validateTransaction(transaction, context) {
    if (!context || !context.runtime) {
      throw new Error('Validation context is required with runtime property');
    }

    try {
      // 直接使用同步验证方法
      const report = this.validate(transaction, { transaction: true }, context);
      return report.isValid;
    } catch (err) {
      // 记录详细的错误信息
      context.logger.error(`Transaction validation error: ${err.message}`, {
        transaction: transaction.id,
        type: transaction.type,
        error: err.stack
      });

      // 重新抛出一个格式化的错误，确保错误信息清晰
      throw new Error(`Transaction validation failed: ${err.message}`);
    }
  }

  /**
   * 验证合约代码
   * @param {string} code 合约代码
   * @param {Object} context 上下文对象，包含runtime、logger等
   * @returns {Promise<boolean>} 验证结果
   */
  async validateContractCode(code, context) {
    if (!context || !context.runtime) {
      throw new Error('Validation context is required with runtime property');
    }

    try {
      // 直接使用同步验证方法
      const report = this.validate(code, { contractCode: true }, context);
      return report.isValid;
    } catch (err) {
      // 记录详细的错误信息
      context.logger.error(`Contract code validation error: ${err.message}`, {
        error: err.stack
      });

      // 重新抛出一个格式化的错误，确保错误信息清晰
      throw new Error(`Contract code validation failed: ${err.message}`);
    }
  }

  /**
   * 验证合约交易
   * @param {Object} transaction 交易对象
   * @param {Object} context 上下文对象，包含runtime、logger等
   * @returns {Promise<boolean>} 验证结果
   */
  async validateContractTransaction(transaction, context) {
    if (!context || !context.runtime) {
      throw new Error('Validation context is required with runtime property');
    }

    try {
      // 直接使用同步验证方法
      const report = this.validate(transaction, { contractTransaction: true }, context);
      return report.isValid;
    } catch (err) {
      // 记录详细的错误信息
      context.logger.error(`Contract transaction validation error: ${err.message}`, {
        transaction: transaction.id,
        type: transaction.type,
        error: err.stack
      });

      // 重新抛出一个格式化的错误，确保错误信息清晰
      throw new Error(`Contract transaction validation failed: ${err.message}`);
    }
  }
}

// 添加交易验证规则
Object.entries(transactionRules).forEach(([name, rule]) => {
  TransactionValidator.addRule(name, rule);
});

// 添加合约验证规则
Object.entries(contractRules).forEach(([name, rule]) => {
  TransactionValidator.addRule(name, rule);
});
