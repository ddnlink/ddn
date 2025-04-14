/**
 * DDN 错误处理中间件
 */
import { ErrorUtils, createError, ErrorCodes } from '../errors';

/**
 * 创建错误处理中间件
 * @param {Object} options - 中间件选项
 * @returns {Function} Express 错误处理中间件
 */
export function createErrorMiddleware(options = {}) {
  const defaultOptions = {
    logErrors: true,
    logger: console,
    includeStackTrace: process.env.NODE_ENV === 'development'
  };
  
  const config = { ...defaultOptions, ...options };
  
  return function errorMiddleware(err, req, res, next) {
    // 转换为标准错误对象
    const error = createError(err);
    
    // 记录错误
    if (config.logErrors) {
      const logContext = {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip,
        userId: req.user ? req.user.id : undefined
      };
      
      if (error.code >= 10000 && error.code < 20000) {
        // 系统错误，使用 error 级别
        config.logger.error(`[${error.code}] ${error.name}: ${error.message}`, {
          error: error.toJSON(),
          context: logContext
        });
      } else if (error.code >= 20000 && error.code < 30000) {
        // 业务错误，使用 warn 级别
        config.logger.warn(`[${error.code}] ${error.name}: ${error.message}`, {
          error: error.toJSON(),
          context: logContext
        });
      } else {
        // 其他错误，使用 info 级别
        config.logger.info(`[${error.code}] ${error.name}: ${error.message}`, {
          error: error.toJSON(),
          context: logContext
        });
      }
    }
    
    // 构建响应对象
    const response = {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    };
    
    // 在开发环境中包含堆栈跟踪
    if (config.includeStackTrace) {
      response.error.stack = error.stack;
    }
    
    // 包含错误数据
    if (error.data) {
      response.error.data = error.data;
    }
    
    // 设置 HTTP 状态码
    let statusCode = 500;
    
    if (error.code >= 40000 && error.code < 50000) {
      // 用户输入错误，使用 400 状态码
      statusCode = 400;
    } else if (error.code === ErrorCodes.ACCOUNT_NOT_FOUND || 
               error.code === ErrorCodes.BLOCK_NOT_FOUND || 
               error.code === ErrorCodes.ASSET_NOT_FOUND) {
      // 资源不存在，使用 404 状态码
      statusCode = 404;
    } else if (error.code === ErrorCodes.INVALID_SIGNATURE) {
      // 认证错误，使用 401 状态码
      statusCode = 401;
    }
    
    // 发送响应
    res.status(statusCode).json(response);
  };
}

/**
 * 异步路由处理器包装函数
 * 用于包装 Express 路由处理函数，自动捕获并处理异步错误
 * @param {Function} fn - 路由处理函数
 * @returns {Function} 包装后的路由处理函数
 */
export function asyncHandler(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  createErrorMiddleware,
  asyncHandler
};
