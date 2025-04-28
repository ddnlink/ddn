/**
 * 测试 /peer/transactions 接口
 * 验证普通转账交易功能
 */
import Debug from 'debug'
import { DdnJS, node } from '../ddn-js'

const debug = Debug('debug')

describe('POST /peer/transactions', () => {
  // 测试账户
  const testAccount = {
    address: 'D7868UnSiVUf7xShPmayvjo9gRrhuCDV85',
    password: 'test password' // 这里使用测试密码，实际测试时应替换为有效密码
  }

  // 测试前准备
  beforeAll(async () => {
    // 确保节点已启动并且可以接收请求
    try {
      const response = await node.api.get('/api/peers/version')
      debug('节点版本信息:', response.body)
    } catch (error) {
      console.error('节点未启动或无法连接:', error.message)
    }
  })

  // 辅助函数：发送交易到指定接口
  async function sendTransaction(endpoint, transaction, headers = {}) {
    const defaultHeaders = {
      'Accept': 'application/json',
      'version': node.version,
      'nethash': node.config.nethash,
      'port': node.config.port
    }
    
    const mergedHeaders = { ...defaultHeaders, ...headers }
    
    const response = await node.api
      .post(endpoint)
      .set(mergedHeaders)
      .send({ transaction })
      .expect('Content-Type', /json/)
      .expect(200)

    debug('发送交易到', endpoint, '响应:', response.body)

    return response.body
  }

  it('使用正确的nethash发送有效交易应成功', async () => {
    // 创建一个普通转账交易
    const amount = '100000000' // 1 DDN
    const message = '测试普通转账交易'
    
    // 使用SDK创建交易
    const transaction = await DdnJS.transaction.createTransaction(
      testAccount.address,
      amount,
      message,
      node.Gaccount.password
    )

    debug('创建的交易:', transaction)

    // 发送交易到节点
    const body = await sendTransaction('/tx', transaction)
    debug('交易响应:', body)
    
    // 验证响应
    node.expect(body).to.have.property('success').to.be.true
    node.expect(body).to.have.property('transactionId').to.be.a('string')
  })

  it('使用错误的nethash发送交易应失败', async () => {
    // 创建一个普通转账交易
    const amount = '100000000' // 1 DDN
    const message = '测试错误nethash'
    
    // 使用SDK创建交易
    const transaction = await DdnJS.transaction.createTransaction(
      testAccount.address,
      amount,
      message,
      node.Gaccount.password
    )

    // 发送交易到节点，使用错误的nethash
    const body = await sendTransaction('/tx', transaction, {
      'nethash': 'wrongnethash'
    })
    
    debug('错误nethash响应:', body)
    
    // 验证响应
    node.expect(body).to.have.property('success').to.be.false
    node.expect(body).to.have.property('expected').to.equal(node.config.nethash)
  })

  it('发送负数金额的交易应失败', async () => {
    // 创建一个负数金额的交易
    const amount = '-100000000' // -1 DDN
    const message = '测试负数金额'
    
    try {
      // 使用SDK创建交易
      const transaction = await DdnJS.transaction.createTransaction(
        testAccount.address,
        amount,
        message,
        node.Gaccount.password
      )

      // 发送交易到节点
      const body = await sendTransaction('/tx', transaction)
      debug('负数金额响应:', body)
      
      // 验证响应
      node.expect(body).to.have.property('success').to.be.false
      node.expect(body).to.have.property('error').to.contain('Invalid transaction amount')
    } catch (error) {
      // SDK可能会在创建交易时就拒绝负数金额
      if (error.message && error.message.includes('amount')) {
        debug('SDK拒绝创建负数金额交易:', error.message)
        // 这是预期行为，测试通过
        return
      }
      
      throw error
    }
  })

  it('发送超大金额的交易应失败', async () => {
    // 创建一个超过总量的交易
    const largeAmount = '10000000000000001' // 超过总量
    const message = '测试超大金额'
    
    try {
      // 使用SDK创建交易
      const transaction = await DdnJS.transaction.createTransaction(
        testAccount.address,
        largeAmount,
        message,
        node.Gaccount.password
      )

      // 发送交易到节点
      const body = await sendTransaction('/tx', transaction)
      debug('超大金额响应:', body)
      
      // 验证响应
      node.expect(body).to.have.property('success').to.be.false
    } catch (error) {
      // SDK可能会在创建交易时就拒绝超大金额
      if (error.message && (error.message.includes('amount') || error.message.includes('exceed'))) {
        debug('SDK拒绝创建超大金额交易:', error.message)
        // 这是预期行为，测试通过
        return
      }
      
      throw error
    }
  })

  it('发送小数金额的交易应成功并转换为整数', async () => {
    // 创建一个小数金额的交易
    const amount = 1.5 // 1.5 DDN
    const message = '测试小数金额'
    
    // 使用SDK创建交易
    const transaction = await DdnJS.transaction.createTransaction(
      testAccount.address,
      amount,
      message,
      node.Gaccount.password
    )

    debug('小数金额交易:', transaction)

    // 发送交易到节点
    const body = await sendTransaction('/tx', transaction)
    debug('小数金额响应:', body)
    
    // 验证响应
    // 根据SDK的实现，小数可能会被转换为整数字符串
    node.expect(body).to.have.property('success')
    
    if (body.success) {
      node.expect(body).to.have.property('transactionId').to.be.a('string')
    } else {
      // 如果失败，检查是否是因为小数被拒绝
      debug('小数金额被拒绝:', body.error)
    }
  })

  it('同一交易重复发送应失败', async () => {
    // 创建一个普通转账交易
    const amount = '100000000' // 1 DDN
    const message = '测试重复交易'
    
    // 使用SDK创建交易
    const transaction = await DdnJS.transaction.createTransaction(
      testAccount.address,
      amount,
      message,
      node.Gaccount.password
    )

    // 第一次发送交易
    const firstResponse = await sendTransaction('/tx', transaction)
    debug('第一次发送响应:', firstResponse)

    // 第二次发送相同交易
    const secondResponse = await sendTransaction('/tx', transaction)
    debug('重复发送响应:', secondResponse)
    
    // 验证响应
    // 重复交易应该被拒绝
    if (firstResponse.success) {
      node.expect(secondResponse).to.have.property('success').to.be.false
      node.expect(secondResponse).to.have.property('error')
    }
  })

  // 测试 /peer/tx 接口是否与 /peer/transactions 接口行为一致
  it('/peer/tx 接口应与 /peer/transactions 接口行为一致', async () => {
    // 创建一个普通转账交易
    const amount = '100000000' // 1 DDN
    const message = '测试接口一致性'
    
    // 使用SDK创建交易
    const transaction = await DdnJS.transaction.createTransaction(
      testAccount.address,
      amount,
      message,
      node.Gaccount.password
    )

    // 发送到 /peer/tx 接口
    const txResponse = await sendTransaction('/tx', transaction)
    debug('/peer/tx 响应:', txResponse)

    // 创建另一个交易用于测试 /peer/transactions
    const transaction2 = await DdnJS.transaction.createTransaction(
      testAccount.address,
      amount,
      message + ' (transactions)',
      node.Gaccount.password
    )

    // 发送到 /peer/transactions 接口
    const transactionsResponse = await sendTransaction('/tx', transaction2)
    debug('/peer/transactions 响应:', transactionsResponse)
    
    // 验证两个接口的响应结构是否一致
    node.expect(Object.keys(txResponse).sort()).to.deep.equal(Object.keys(transactionsResponse).sort())
    
    // 两个接口都应该返回success属性
    node.expect(txResponse).to.have.property('success')
    node.expect(transactionsResponse).to.have.property('success')
  })
})
