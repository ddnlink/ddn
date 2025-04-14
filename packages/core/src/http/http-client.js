/**
 * DDN HTTP 客户端
 * 基于 Axios 实现，提供统一的错误处理
 */
import axios from 'axios';
import { DdnError, ErrorCodes, createError } from '../errors';

/**
 * HTTP 错误类
 */
export class HttpError extends DdnError {
  constructor(message, code = ErrorCodes.NETWORK_ERROR, data = null, cause = null) {
    super(message, code, data, cause);
    
    this.request = data && data.request;
    this.response = data && data.response;
    this.config = data && data.config;
  }
}

/**
 * 创建 HTTP 客户端实例
 * @param {Object} config - Axios 配置
 * @returns {Object} HTTP 客户端实例
 */
export function createHttpClient(config = {}) {
  const instance = axios.create({
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    },
    ...config
  });
  
  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 可以在这里添加认证信息等
      return config;
    },
    (error) => {
      return Promise.reject(createHttpError(error));
    }
  );
  
  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      // 处理 DDN API 响应格式
      const data = response.data;
      
      if (data && data.success === false && data.error) {
        return Promise.reject(createHttpError({
          response,
          data: data.error
        }));
      }
      
      return data;
    },
    (error) => {
      return Promise.reject(createHttpError(error));
    }
  );
  
  return instance;
}

/**
 * 创建 HTTP 错误
 * @param {*} error - 错误对象
 * @returns {HttpError} HTTP 错误实例
 */
function createHttpError(error) {
  let message = '网络请求失败';
  let code = ErrorCodes.NETWORK_ERROR;
  let data = null;
  
  if (error.response) {
    // 服务器返回了错误响应
    const { status, data: responseData } = error.response;
    
    message = `请求失败，状态码: ${status}`;
    
    if (responseData) {
      if (responseData.error && responseData.error.message) {
        message = responseData.error.message;
      }
      
      if (responseData.error && responseData.error.code) {
        code = responseData.error.code;
      } else if (status === 404) {
        code = ErrorCodes.API_ERROR;
        message = '请求的资源不存在';
      } else if (status === 401) {
        code = ErrorCodes.INVALID_SIGNATURE;
        message = '认证失败';
      } else if (status === 400) {
        code = ErrorCodes.INVALID_PARAMETER;
        message = '无效的请求参数';
      } else if (status >= 500) {
        code = ErrorCodes.INTERNAL_SERVER_ERROR;
        message = '服务器内部错误';
      }
    }
    
    data = {
      status,
      response: error.response,
      config: error.config
    };
  } else if (error.request) {
    // 请求已发送但没有收到响应
    message = '服务器无响应';
    data = {
      request: error.request,
      config: error.config
    };
  } else if (error.data && error.data.error) {
    // DDN API 错误格式
    message = error.data.error.message || '请求失败';
    code = error.data.error.code || ErrorCodes.API_ERROR;
    data = {
      response: error.response,
      config: error.config
    };
  }
  
  return new HttpError(message, code, data, error);
}

export default {
  HttpError,
  createHttpClient
};
