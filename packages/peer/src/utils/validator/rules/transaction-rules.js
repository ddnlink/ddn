/**
 * 基本交易验证规则
 */
export default {
  transaction: {
    description: 'Validate a basic transaction',
    async validate(accept, transaction, field) {
      const context = field.thisArg;

      if (!context || !context.runtime) {
        throw new Error('Validator context is required with runtime property');
      }

      // 检查交易是否已存在 - 验证器层的基础检查
      // 这是交易验证的第一道防线，采用轻量级处理方式
      try {
        const existingTrs = await context.dao.findOne('tr', {
          where: { id: transaction.id }
        });

        if (existingTrs) {
          context.logger.debug(`Transaction ${transaction.id} already exists, skipping validation`);
          // 返回false表示验证失败，但不抛出异常，允许调用方决定如何处理
          return false;
        }
      } catch (err) {
        // 查询错误仅记录日志，不中断验证流程
        context.logger.error(`Error checking existing transaction ${transaction.id}: ${err.message}`);
      }

      // 规范化交易对象
      try {
        await context.runtime.transaction.objectNormalize(transaction);
      } catch (err) {
        // 记录详细的错误信息
        context.logger.error(`Transaction normalization error: ${err.message}`, {
          transaction: transaction.id,
          error: err.stack
        });

        // 返回验证失败，而不是抛出错误
        return false;
      }

      return true;
    }
  }
};