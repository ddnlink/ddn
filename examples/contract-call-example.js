/**
 * 合约调用示例
 * 
 * 这个示例展示了如何正确调用合约方法
 */

const DdnJS = require('@ddn/js-sdk').default;
const axios = require('axios');

// 配置DDN节点信息
const config = {
  baseUrl: 'http://localhost:8001',
  headers: {
    'nethash': 'm66gcvle',
    'version': '1.0.0',
    'Content-Type': 'application/json'
  }
};

// 初始化SDK配置
DdnJS.init({
  nethash: 'm66gcvle'
});

// 账户密钥
const secret = 'finish valley own jealous lobster mother inflict voice sphere stay second puppy';

/**
 * 调用合约方法（不包含资产转移）
 * @param {string} contractId 合约ID
 * @param {string} method 方法名
 * @param {Array} args 方法参数
 */
async function callContractMethod(contractId, method, args) {
  try {
    console.log(`调用合约 ${contractId} 的 ${method} 方法...`);
    console.log('参数:', JSON.stringify(args));
    
    // 构造合约调用选项
    const options = {
      id: contractId,           // 合约ID
      gasLimit: 10000000,       // Gas限制
      method: method,           // 合约方法
      args: args                // 方法参数
    };
    
    // 使用SDK创建合约调用交易
    console.log('创建交易...');
    const transaction = await DdnJS.contract.transfer(options, secret);
    console.log('交易已创建:', transaction);
    
    // 广播交易到区块链网络
    console.log('广播交易...');
    const response = await axios.post(`${config.baseUrl}/api/transactions`, {
      transaction
    }, {
      headers: config.headers
    });
    
    console.log('交易广播结果:', response.data);
    return response.data;
  } catch (error) {
    console.error('调用合约失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
    throw error;
  }
}

/**
 * 向合约支付资产
 * @param {string} contractId 合约ID
 * @param {string} method 方法名
 * @param {string} amount 金额
 * @param {string} currency 货币类型
 * @param {Array} args 方法参数
 */
async function payToContract(contractId, method, amount, currency, args) {
  try {
    console.log(`向合约 ${contractId} 支付 ${amount} ${currency}...`);
    console.log('方法:', method);
    console.log('参数:', JSON.stringify(args));
    
    // 构造合约支付选项
    const options = {
      id: contractId,           // 合约ID
      gasLimit: 10000000,       // Gas限制
      method: method,           // 合约方法
      amount: amount,           // 支付金额
      currency: currency,       // 货币类型
      args: args                // 方法参数
    };
    
    // 使用SDK创建合约支付交易
    console.log('创建交易...');
    const transaction = await DdnJS.contract.pay(options, secret);
    console.log('交易已创建:', transaction);
    
    // 广播交易到区块链网络
    console.log('广播交易...');
    const response = await axios.post(`${config.baseUrl}/api/transactions`, {
      transaction
    }, {
      headers: config.headers
    });
    
    console.log('交易广播结果:', response.data);
    return response.data;
  } catch (error) {
    console.error('向合约支付失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
    throw error;
  }
}

// 示例：调用合约方法
async function runExample() {
  try {
    // 示例1：调用合约方法（不包含资产转移）
    // await callContractMethod(
    //   'D2KjLsCjEMQCcC7KXMvwbav8mNQvLP6A1A',  // 合约ID
    //   'setValue',                            // 方法名
    //   ['Hello World']                        // 方法参数
    // );
    
    // 示例2：向合约支付资产
    await payToContract(
      'D2KjLsCjEMQCcC7KXMvwbav8mNQvLP6A1A',  // 合约ID
      'payInitialToken',                     // 方法名
      '5000',                                // 金额
      'DDN',                                 // 货币类型
      [true, 'ThirdCrowdFundging/CrowdFundging', 10]  // 方法参数
    );
  } catch (error) {
    console.error('运行示例失败:', error.message);
  }
}

// 运行示例
runExample();
