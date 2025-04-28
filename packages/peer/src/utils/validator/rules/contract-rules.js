/**
 * 合约验证规则
 */
export default {
  contractCode: {
    description: 'Validate contract code syntax',
    async validate(accept, code, field) {
      const context = field.thisArg;
      
      if (!code) {
        throw new Error('Contract code is required');
      }
      
      // 使用现有的Compiler类验证代码语法
      try {
        // 导入Compiler类
        const { Compiler } = require('@ddn/dvm');
        
        // 创建编译器实例
        const compiler = new Compiler();
        
        // 尝试编译代码
        const result = compiler.compile(code);
        
        // 检查编译结果
        if (!result || !result.compiledCode) {
          throw new Error('Contract compilation failed');
        }
        
        return true;
      } catch (err) {
        throw new Error(`Contract code syntax error: ${err.message}`);
      }
    }
  },
  
  contractTransaction: {
    description: 'Validate a contract transaction',
    async validate(accept, transaction, field) {
      const context = field.thisArg;
      
      // 首先验证基本交易属性
      const basicValidation = await field.validator.validate(
        transaction, 
        { transaction: true }, 
        context
      );
      
      if (!basicValidation.isValid) {
        return false;
      }
      
      // 然后验证合约特有属性
      if (transaction.type !== 11 || !transaction.asset || !transaction.asset.contract) {
        throw new Error('Invalid contract transaction');
      }
      
      const { code, name, version } = transaction.asset.contract;
      
      // 验证必需字段
      if (!name) {
        throw new Error('Contract name is required');
      }
      
      if (!version) {
        throw new Error('Contract version is required');
      }
      
      if (!code) {
        throw new Error('Contract code is required');
      }
      
      // 验证合约代码语法
      const codeValidation = await field.validator.validate(
        code, 
        { contractCode: true }, 
        context
      );
      
      return codeValidation.isValid;
    }
  }
};