/**
 * 智能合约交易相关功能模块
 *
 * 提供创建智能合约部署、调用和支付的交易功能
 */

import { bignumber, assetTypes, slots } from '../utils'

import * as crypto from '../crypto'
import { constants } from '../config'

/**
 * 创建智能合约部署交易
 *
 * @param {Object} options - 合约部署选项
 * @param {string} options.name - 合约名称
 * @param {number} options.gasLimit - 合约执行的燃料上限，默认为constants.maxGasLimit
 * @param {string} options.desc - 合约描述
 * @param {string} options.version - 合约版本
 * @param {string} options.code - 合约代码
 * @param {string} secret - 发送者密钥
 * @param {string} [secondSecret] - 发送者二级密钥（可选）
 * @returns {Object} 创建的合约部署交易对象
 */
async function createContract (options, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const fee = bignumber.multiply(constants.fees.contract, constants.fixedPoint)

  const timestamp = slots.getTime() - 5
  const senderAddress = await crypto.generateAddress(keys.publicKey, constants.tokenPrefix)
  const contractAddress = await crypto.generateContractAddress(`${options.name}_${senderAddress}`, constants.contractPrefix )

  const contract = {
    name: options.name,
    gasLimit: +options.gasLimit || constants.maxGasLimit,
    ownerId: senderAddress,
    address: contractAddress,
    desc: options.desc,
    version: options.version,
    code: options.code,
    consumeOwnerEnergy: options.consumeOwnerEnergy
  }

  const transaction = {
    nethash: constants.nethash,
    type: assetTypes.CONTRACT,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    senderPublicKey: keys.publicKey,
    timestamp,
    asset: {
      contract
    }
  }
  transaction.signature = await crypto.sign(transaction, keys)

  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)
  return transaction
}

/**
 * 创建向合约支付资产的交易
 *
 * @param {Object} options - 合约支付选项
 * @param {string} options.id - 合约ID
 * @param {number} options.gasLimit - 合约执行的燃料上限，默认为constants.maxGasLimit
 * @param {string} options.amount - 支付金额
 * @param {string} options.currency - 支付的资产类型
 * @param {string} options.method - 调用的合约方法名
 * @param {Array|string} options.args - 合约方法参数
 * @param {string} secret - 发送者密钥
 * @param {string} [secondSecret] - 发送者二级密钥（可选）
 * @returns {Object} 创建的合约支付交易对象
 */
async function pay (options, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  // 确保args是JSON字符串
  let args = options.args
  if (args instanceof Array) {
    args = JSON.stringify(args)
  } else if (typeof args === 'string') {
    // 如果已经是字符串，尝试解析确保它是有效的JSON
    try {
      JSON.parse(args)
    } catch (e) {
      // 如果解析失败，说明不是有效的JSON，重新序列化
      args = JSON.stringify(args)
    }
  } else if (args !== undefined && args !== null) {
    // 其他类型也转为JSON字符串
    args = JSON.stringify(args)
  } else {
    // 如果是undefined或null，使用空数组
    args = '[]'
  }

  const fee = bignumber.multiply(constants.fees.contract_pay, constants.fixedPoint)

  const timestamp = slots.getTime() - 5

  const contractPay = {
    id: options.id,
    gasLimit: `${options.gasLimit || constants.maxGasLimit}`,
    amount: options.amount,
    currency: options.currency,
    method: options.method,
    args
  }

  const opts = [options.id, `${options.gasLimit || constants.maxGasLimit}`, options.amount, options.currency, options.method, args]
  const trs = {
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    timestamp,
    senderPublicKey: keys.publicKey,
    type: assetTypes.CONTRACT_PAY,
    args: opts, // 直接使用数组格式，符合schema要求
    asset: {
      contractPay
    }
  }
  // console.log(trs)
  trs.signature = await crypto.sign(trs, keys)
  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    trs.sign_signature = await crypto.secondSign(trs, secondKeys)
  }
  trs.id = await crypto.getId(trs)
  return trs
}

/**
 * 创建调用合约方法的交易（不包含资产转移）
 *
 * @param {Object} options - 合约调用选项
 * @param {string} options.id - 合约ID
 * @param {number} options.gasLimit - 合约执行的燃料上限，默认为constants.maxGasLimit
 * @param {string} options.method - 调用的合约方法名
 * @param {Array|string} options.args - 合约方法参数
 * @param {string} secret - 发送者密钥
 * @param {string} [secondSecret] - 发送者二级密钥（可选）
 * @returns {Object} 创建的合约调用交易对象
 */
async function transfer (options, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  // 确保args是JSON字符串
  let args = options.args
  if (args instanceof Array) {
    args = JSON.stringify(args)
  } else if (typeof args === 'string') {
    // 如果已经是字符串，尝试解析确保它是有效的JSON
    try {
      JSON.parse(args)
    } catch (e) {
      // 如果解析失败，说明不是有效的JSON，重新序列化
      args = JSON.stringify(args)
    }
  } else if (args !== undefined && args !== null) {
    // 其他类型也转为JSON字符串
    args = JSON.stringify(args)
  } else {
    // 如果是undefined或null，使用空数组
    args = '[]'
  }

  const fee = bignumber.multiply(constants.fees.contract_call, constants.fixedPoint)

  const timestamp = slots.getTime() - 5
  // const opts = {
  //   id: options.id,
  //   gasLimit: `${options.gasLimit || constants.maxGasLimit}`,
  //   method: options.method,
  //   args
  // }
  const opts = [options.id, `${options.gasLimit || constants.maxGasLimit}`, options.method, args]
  const trs = {
    nethash: constants.nethash,
    amount: '0',
    fee: `${fee}`,
    recipientId: null,
    timestamp,
    senderPublicKey: keys.publicKey,
    type: assetTypes.CONTRACT_TRANSFER,
    args: opts // 直接使用数组格式，符合schema要求
  }
  // console.log(trs)
  trs.signature = await crypto.sign(trs, keys)
  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    trs.sign_signature = await crypto.secondSign(trs, secondKeys)
  }
  trs.id = await crypto.getId(trs)
  return trs
}

/**
 * 智能合约交易模块导出对象
 */
export default {
  createContract, // 原来的 deploy
  transfer, // 原来的 send
  pay
}
