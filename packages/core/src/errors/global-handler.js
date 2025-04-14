/**
 * DDN 全局未捕获异常处理器
 */
import { globalErrorHandler, ErrorCodes } from './index';

/**
 * 设置全局未捕获异常处理器
 * @param {Object} options - 选项
 */
export function setupGlobalErrorHandlers(options = {}) {
  const defaultOptions = {
    exitOnUncaughtException: true,
    logger: console
  };
  
  const config = { ...defaultOptions, ...options };
  
  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    try {
      config.logger.error('未捕获的异常:', error);
      
      globalErrorHandler.handle(error, { source: 'uncaughtException' });
      
      if (config.exitOnUncaughtException) {
        config.logger.error('由于未捕获的异常，进程将退出');
        
        // 给日志一些时间写入
        setTimeout(() => {
          process.exit(1);
        }, 1000);
      }
    } catch (handlerError) {
      config.logger.error('处理未捕获异常时出错:', handlerError);
      process.exit(1);
    }
  });
  
  // 处理未处理的 Promise 拒绝
  process.on('unhandledRejection', (reason, promise) => {
    try {
      config.logger.error('未处理的 Promise 拒绝:', reason);
      
      globalErrorHandler.handle(reason, { 
        source: 'unhandledRejection',
        promise 
      });
    } catch (handlerError) {
      config.logger.error('处理未处理的 Promise 拒绝时出错:', handlerError);
    }
  });
  
  // 处理进程警告
  process.on('warning', (warning) => {
    config.logger.warn('进程警告:', warning);
  });
}

export default {
  setupGlobalErrorHandlers
};
