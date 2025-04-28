import { Field } from './field';
import { Validator } from './validator';
import transactionRules from './rules/transaction-rules';
import contractRules from './rules/contract-rules';

// 导出基础验证器
export { Validator, Field };

// 导出验证规则
export const rules = {
  transaction: transactionRules,
  contract: contractRules
};

// 导出交易验证器
export * from './validators';

// 默认导出(不包含具体的验证器，都在具名导出里)
export default {
  Validator,
  Field,
  rules
};