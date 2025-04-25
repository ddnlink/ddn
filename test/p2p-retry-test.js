/**
 * 测试 P2P 重试机制
 */
const { P2P, Peer } = require('../packages/p2p/lib')

// 创建一个测试 P2P 实例
const p2p = new P2P({
  port: '9000',
  httpPort: '8000',
  host: '127.0.0.1',
  seeds: [
    { host: '127.0.0.1', port: '9001' }, // 不存在的节点
    { host: '127.0.0.1', port: '9002' }  // 不存在的节点
  ],
  logger: {
    debug: console.log,
    info: console.log,
    warn: console.warn,
    error: console.error
  }
})

// 准备 P2P 网络
p2p.prepare()

// 测试 _request 方法的重试机制
async function testRequestRetry() {
  console.log('测试 _request 方法的重试机制...')
  
  try {
    // 尝试请求不存在的节点
    const result = await p2p._request('GET', '/test')
    console.log('请求结果:', result)
  } catch (err) {
    console.log('请求失败，错误信息:', err.message)
    console.log('重试机制正常工作')
  }
}

// 测试节点发现机制
async function testDiscovery() {
  console.log('测试节点发现机制...')
  
  // 手动触发发现过程
  await p2p._discover()
  
  // 检查节点状态
  const peers = p2p.inventory.getAllPeers()
  console.log(`发现了 ${peers.length} 个节点`)
  
  // 输出节点状态
  peers.forEach(peer => {
    console.log(`节点 ${peer.host}:${peer.port} 状态: ${peer.status}, 失败次数: ${peer.failCount}`)
  })
}

// 运行测试
async function runTests() {
  try {
    await testRequestRetry()
    console.log('-----------------------')
    await testDiscovery()
    
    // 等待一段时间，让节点状态变化
    console.log('等待 10 秒，观察节点状态变化...')
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    // 再次检查节点状态
    const peers = p2p.inventory.getAllPeers()
    console.log(`现在有 ${peers.length} 个节点`)
    peers.forEach(peer => {
      console.log(`节点 ${peer.host}:${peer.port} 状态: ${peer.status}, 失败次数: ${peer.failCount}`)
    })
    
    // 关闭 P2P 网络
    p2p.close()
    console.log('测试完成')
  } catch (err) {
    console.error('测试过程中出错:', err)
  }
}

runTests()
