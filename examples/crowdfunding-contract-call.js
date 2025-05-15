/**
 * 众筹合约调用示例
 * 
 * 这个示例专门用于解决您遇到的错误情况
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
 * 调用众筹合约的payInitialToken方法
 * @param {string} contractId 合约ID
 * @param {number} amount 金额
 * @param {boolean} isActive 是否激活
 * @param {string} name 名称
 * @param {number} days 天数
 * @param {string} currency 货币类型
 */
async function payInitialToken(contractId, amount, isActive, name, days, currency) {
  try {
    console.log(`向众筹合约 ${contractId} 支付初始代币...`);
    console.log(`金额: ${amount} ${currency}`);
    console.log(`参数: isActive=${isActive}, name=${name}, days=${days}`);
    
    // 构造合约支付选项
    const options = {
      id: contractId,           // 合约ID
      gasLimit: 10000000,       // Gas限制
      method: 'payInitialToken', // 合约方法
      amount: amount.toString(), // 支付金额
      currency: currency,       // 货币类型
      args: [isActive, name, days] // 方法参数
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

/**
 * 直接使用HTTP API调用合约
 * 这种方式不推荐，仅用于展示错误情况
 */
async function incorrectContractCall() {
  try {
    console.log('使用不正确的方式调用合约...');
    
    // 这是错误的方式，不要这样做！
    const incorrectTransaction = {
      type: 12,
      fee: 0,
      args: [5000, true, "ThirdCrowdFundging/CrowdFundging", 10, "DDN"],
      secret: "finish valley own jealous lobster mother inflict voice sphere stay second puppy"
    };
    
    // 这会导致错误
    const response = await axios.post(`${config.baseUrl}/`, incorrectTransaction, {
      headers: config.headers
    });
    
    console.log('响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('调用失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
    throw error;
  }
}

/**
 * 正确的方式：使用SDK创建交易，然后通过API广播
 */
async function correctContractCall() {
  // 获取您的合约ID
  // 如果您不知道合约ID，可以通过API查询
  const contractId = 'YOUR_CONTRACT_ID'; // 替换为您的合约ID
  
  // 调用众筹合约
  return await payInitialToken(
    contractId,                        // 合约ID
    5000,                              // 金额
    true,                              // 是否激活
    'ThirdCrowdFundging/CrowdFundging', // 名称
    10,                                // 天数
    'DDN'                              // 货币类型
  );
}

// 运行示例
async function runExample() {
  try {
    console.log('=== 正确的合约调用方式 ===');
    await correctContractCall();
    
    // 不要运行这个，它会导致错误
    // console.log('\n=== 错误的合约调用方式 ===');
    // await incorrectContractCall();
  } catch (error) {
    console.error('运行示例失败:', error.message);
  }
}

// 运行示例
runExample();
