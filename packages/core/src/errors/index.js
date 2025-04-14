/**
 * DDN 错误处理模块
 * 提供统一的错误处理机制，包括错误类、错误码、错误格式化等功能
 */

/**
 * 错误码定义
 * 错误码格式：ABBCC
 * A: 错误类型
 *    1 - 系统错误
 *    2 - 业务错误
 *    3 - 第三方服务错误
 *    4 - 用户输入错误
 * BB: 模块编号
 *    01 - 核心模块
 *    02 - 交易模块
 *    03 - 区块模块
 *    04 - 账户模块
 *    05 - 共识模块
 *    06 - P2P模块
 *    07 - API模块
 *    08 - 资产模块
 *    ...
 * CC: 具体错误编号，从01开始递增
 */
export const ErrorCodes = {
  // 系统错误 (1xxxx)
  SYSTEM_ERROR: 10001,
  INTERNAL_SERVER_ERROR: 10002,
  DATABASE_ERROR: 10101,
  NETWORK_ERROR: 10201,
  
  // 业务错误 (2xxxx)
  TRANSACTION_ERROR: 20201,
  INVALID_TRANSACTION: 20202,
  TRANSACTION_EXPIRED: 20203,
  INSUFFICIENT_BALANCE: 20204,
  INVALID_AMOUNT: 20205,
  INVALID_RECIPIENT: 20206,
  INVALID_SENDER: 20207,
  INVALID_SIGNATURE: 20208,
  
  // 区块错误
  BLOCK_ERROR: 20301,
  INVALID_BLOCK: 20302,
  BLOCK_NOT_FOUND: 20303,
  
  // 账户错误
  ACCOUNT_ERROR: 20401,
  ACCOUNT_NOT_FOUND: 20402,
  
  // 共识错误
  CONSENSUS_ERROR: 20501,
  
  // P2P错误
  PEER_ERROR: 20601,
  PEER_NOT_FOUND: 20602,
  
  // API错误
  API_ERROR: 20701,
  INVALID_PARAMETER: 20702,
  
  // 资产错误
  ASSET_ERROR: 20801,
  ASSET_NOT_FOUND: 20802,
  
  // 第三方服务错误 (3xxxx)
  THIRD_PARTY_ERROR: 30001,
  
  // 用户输入错误 (4xxxx)
  VALIDATION_ERROR: 40001,
  INVALID_FORMAT: 40002,
  MISSING_PARAMETER: 40003
};

/**
 * 错误信息定义
 */
export const ErrorMessages = {
  [ErrorCodes.SYSTEM_ERROR]: '系统错误',
  [ErrorCodes.INTERNAL_SERVER_ERROR]: '内部服务器错误',
  [ErrorCodes.DATABASE_ERROR]: '数据库错误',
  [ErrorCodes.NETWORK_ERROR]: '网络错误',
  
  [ErrorCodes.TRANSACTION_ERROR]: '交易错误',
  [ErrorCodes.INVALID_TRANSACTION]: '无效的交易',
  [ErrorCodes.TRANSACTION_EXPIRED]: '交易已过期',
  [ErrorCodes.INSUFFICIENT_BALANCE]: '余额不足',
  [ErrorCodes.INVALID_AMOUNT]: '无效的金额',
  [ErrorCodes.INVALID_RECIPIENT]: '无效的接收者',
  [ErrorCodes.INVALID_SENDER]: '无效的发送者',
  [ErrorCodes.INVALID_SIGNATURE]: '无效的签名',
  
  [ErrorCodes.BLOCK_ERROR]: '区块错误',
  [ErrorCodes.INVALID_BLOCK]: '无效的区块',
  [ErrorCodes.BLOCK_NOT_FOUND]: '区块未找到',
  
  [ErrorCodes.ACCOUNT_ERROR]: '账户错误',
  [ErrorCodes.ACCOUNT_NOT_FOUND]: '账户未找到',
  
  [ErrorCodes.CONSENSUS_ERROR]: '共识错误',
  
  [ErrorCodes.PEER_ERROR]: '节点错误',
  [ErrorCodes.PEER_NOT_FOUND]: '节点未找到',
  
  [ErrorCodes.API_ERROR]: 'API错误',
  [ErrorCodes.INVALID_PARAMETER]: '无效的参数',
  
  [ErrorCodes.ASSET_ERROR]: '资产错误',
  [ErrorCodes.ASSET_NOT_FOUND]: '资产未找到',
  
  [ErrorCodes.THIRD_PARTY_ERROR]: '第三方服务错误',
  
  [ErrorCodes.VALIDATION_ERROR]: '验证错误',
  [ErrorCodes.INVALID_FORMAT]: '无效的格式',
  [ErrorCodes.MISSING_PARAMETER]: '缺少参数'
};

/**
 * DDN 基础错误类
 * 所有自定义错误都应该继承这个类
 */
export class DdnError extends Error {
  /**
   * 构造函数
   * @param {string} message - 错误消息
   * @param {number} code - 错误码
   * @param {*} data - 附加数据
   * @param {Error} cause - 原始错误
   */
  constructor(message, code = ErrorCodes.SYSTEM_ERROR, data = null, cause = null) {
    super(message || ErrorMessages[code] || '未知错误');
    
    this.name = this.constructor.name;
    this.code = code;
    this.data = data;
    this.cause = cause;
    
    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * 将错误转换为标准格式的对象
   * @returns {Object} 标准格式的错误对象
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      data: this.data,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
      cause: this.cause ? (this.cause instanceof DdnError ? this.cause.toJSON() : this.cause.message) : undefined
    };
  }
  
  /**
   * 将错误转换为字符串
   * @returns {string} 错误字符串
   */
  toString() {
    return `[${this.code}] ${this.name}: ${this.message}`;
  }
}

/**
 * 系统错误类
 */
export class SystemError extends DdnError {
  constructor(message, code = ErrorCodes.SYSTEM_ERROR, data = null, cause = null) {
    super(message, code, data, cause);
  }
}

/**
 * 业务错误类
 */
export class BusinessError extends DdnError {
  constructor(message, code, data = null, cause = null) {
    super(message, code, data, cause);
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends DdnError {
  constructor(message, data = null, cause = null) {
    super(message, ErrorCodes.VALIDATION_ERROR, data, cause);
  }
}

/**
 * 交易错误类
 */
export class TransactionError extends BusinessError {
  constructor(message, code = ErrorCodes.TRANSACTION_ERROR, data = null, cause = null) {
    super(message, code, data, cause);
  }
}

/**
 * 区块错误类
 */
export class BlockError extends BusinessError {
  constructor(message, code = ErrorCodes.BLOCK_ERROR, data = null, cause = null) {
    super(message, code, data, cause);
  }
}

/**
 * 账户错误类
 */
export class AccountError extends BusinessError {
  constructor(message, code = ErrorCodes.ACCOUNT_ERROR, data = null, cause = null) {
    super(message, code, data, cause);
  }
}

/**
 * 资产错误类
 */
export class AssetError extends BusinessError {
  constructor(message, code = ErrorCodes.ASSET_ERROR, data = null, cause = null) {
    super(message, code, data, cause);
  }
}

/**
 * 从任意错误对象创建 DdnError
 * @param {*} err - 错误对象
 * @param {number} defaultCode - 默认错误码
 * @param {string} defaultMessage - 默认错误消息
 * @returns {DdnError} DdnError 实例
 */
export function createError(err, defaultCode = ErrorCodes.SYSTEM_ERROR, defaultMessage = '系统错误') {
  if (err instanceof DdnError) {
    return err;
  }
  
  let message = defaultMessage;
  let data = null;
  
  if (err instanceof Error) {
    message = err.message;
  } else if (typeof err === 'string') {
    message = err;
  } else if (err && typeof err === 'object') {
    if (err.message) {
      message = err.message;
    }
    if (err.data) {
      data = err.data;
    }
  }
  
  return new DdnError(message, defaultCode, data, err instanceof Error ? err : null);
}

/**
 * 错误处理工具函数
 */
export const ErrorUtils = {
  /**
   * 格式化错误对象，确保返回有用的错误信息
   * @param {*} err - 错误对象
   * @returns {string} 格式化后的错误消息
   */
  getErrorMessage(err) {
    if (!err) return '未知错误';
    if (err instanceof DdnError) return err.message;
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && err.message) return err.message;
    if (err && err.toString && typeof err.toString === 'function' && err.toString() !== '[object Object]') {
      return err.toString();
    }
    
    try {
      return JSON.stringify(err);
    } catch (e) {
      return '未知错误对象';
    }
  },
  
  /**
   * 从错误对象中提取错误码
   * @param {*} err - 错误对象
   * @param {number} defaultCode - 默认错误码
   * @returns {number} 错误码
   */
  getErrorCode(err, defaultCode = ErrorCodes.SYSTEM_ERROR) {
    if (err instanceof DdnError) return err.code;
    if (err && err.code && typeof err.code === 'number') return err.code;
    return defaultCode;
  },
  
  /**
   * 创建标准的错误响应对象
   * @param {*} err - 错误对象
   * @returns {Object} 标准错误响应对象
   */
  createErrorResponse(err) {
    const error = createError(err);
    
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        data: error.data
      }
    };
  }
};

/**
 * 全局错误处理器
 */
export class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      logErrors: true,
      logger: console,
      ...options
    };
    
    this.handlers = new Map();
  }
  
  /**
   * 注册错误处理函数
   * @param {number|string|Function} errorType - 错误类型、错误码或错误判断函数
   * @param {Function} handler - 处理函数
   */
  register(errorType, handler) {
    this.handlers.set(errorType, handler);
  }
  
  /**
   * 处理错误
   * @param {*} err - 错误对象
   * @param {*} context - 上下文信息
   * @returns {*} 处理结果
   */
  handle(err, context = {}) {
    const error = createError(err);
    
    // 记录错误
    if (this.options.logErrors) {
      this.logError(error, context);
    }
    
    // 查找匹配的处理函数
    for (const [type, handler] of this.handlers.entries()) {
      if (this.matchesErrorType(error, type)) {
        return handler(error, context);
      }
    }
    
    // 默认处理
    return this.defaultHandler(error, context);
  }
  
  /**
   * 判断错误是否匹配指定类型
   * @param {DdnError} error - 错误对象
   * @param {number|string|Function} type - 错误类型、错误码或错误判断函数
   * @returns {boolean} 是否匹配
   */
  matchesErrorType(error, type) {
    if (typeof type === 'function') {
      return type(error);
    }
    
    if (typeof type === 'number') {
      return error.code === type;
    }
    
    if (typeof type === 'string') {
      return error.name === type || error instanceof global[type];
    }
    
    return false;
  }
  
  /**
   * 记录错误
   * @param {DdnError} error - 错误对象
   * @param {*} context - 上下文信息
   */
  logError(error, context) {
    const { logger } = this.options;
    
    if (error.code >= 10000 && error.code < 20000) {
      // 系统错误，使用 error 级别
      logger.error(`[${error.code}] ${error.name}: ${error.message}`, {
        error: error.toJSON(),
        context
      });
    } else if (error.code >= 20000 && error.code < 30000) {
      // 业务错误，使用 warn 级别
      logger.warn(`[${error.code}] ${error.name}: ${error.message}`, {
        error: error.toJSON(),
        context
      });
    } else {
      // 其他错误，使用 info 级别
      logger.info(`[${error.code}] ${error.name}: ${error.message}`, {
        error: error.toJSON(),
        context
      });
    }
  }
  
  /**
   * 默认错误处理函数
   * @param {DdnError} error - 错误对象
   * @param {*} context - 上下文信息
   * @returns {Object} 标准错误响应对象
   */
  defaultHandler(error, context) {
    return ErrorUtils.createErrorResponse(error);
  }
}

// 创建全局错误处理器实例
export const globalErrorHandler = new ErrorHandler();

/**
 * 异步函数错误包装器
 * 用于包装异步函数，自动捕获并处理错误
 * @param {Function} fn - 异步函数
 * @param {Object} options - 选项
 * @returns {Function} 包装后的函数
 */
export function asyncErrorWrapper(fn, options = {}) {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (err) {
      const context = {
        functionName: fn.name,
        arguments: args,
        ...options.context
      };
      
      return options.errorHandler 
        ? options.errorHandler.handle(err, context)
        : globalErrorHandler.handle(err, context);
    }
  };
}

/**
 * 创建中间件，用于在 Express 应用中处理错误
 * @param {ErrorHandler} errorHandler - 错误处理器
 * @returns {Function} Express 错误处理中间件
 */
export function createErrorMiddleware(errorHandler = globalErrorHandler) {
  return function(err, req, res, next) {
    const context = {
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body
      }
    };
    
    const result = errorHandler.handle(err, context);
    
    res.status(result.error && result.error.code >= 40000 ? 400 : 500).json(result);
  };
}

export default {
  DdnError,
  SystemError,
  BusinessError,
  ValidationError,
  TransactionError,
  BlockError,
  AccountError,
  AssetError,
  ErrorCodes,
  ErrorMessages,
  ErrorUtils,
  ErrorHandler,
  globalErrorHandler,
  createError,
  asyncErrorWrapper,
  createErrorMiddleware
};
