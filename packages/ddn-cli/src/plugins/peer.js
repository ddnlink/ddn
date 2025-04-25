import async from 'async'
import request from 'request'
import Api from '../utils/api'

let globalOptions

// 调用其他方法之前需要初始化全局选项
function init(options) {
  globalOptions = options
}

function getApi() {
  return new Api({
    host: globalOptions.host,
    port: globalOptions.port,
    mainnet: !!globalOptions.main
  })
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    request({
      url,
      json: true,
      timeout: 5000,
      ...options
    }, (err, resp, body) => {
      if (err) return reject(err)
      resolve(body)
    })
  })
}

async function peerStat(argv) {
  try {
    const api = getApi()
    const baseUrl = `http://${globalOptions.host}:${globalOptions.port}`

    // 获取节点列表
    const response = await makeRequest(`${baseUrl}/api/peers`)

    if (!response || !response.success) {
      throw new Error('获取节点列表失败')
    }

    const peers = response.peers || []
    const stats = response.stats || {}

    if (peers.length === 0) {
      console.log('没有找到可用的节点')
      return
    }

    // 打印节点详细信息
    console.log('节点详细信息:')
    console.log('主机\t\t端口\tP2P端口\t状态\t高度\t版本\t操作系统\t交易池')

    peers.forEach(peer => {
      const httpPort = peer.httpPort || 8000
      const p2pPort = peer.port || 9000
      const status = peer.statusText || peer.status || 'unknown'
      const height = peer.height || 'unknown'
      // const nethash = peer.nethash || 'unknown'
      const version = peer.version || 'unknown'
      const os = peer.os || 'unknown'
      // 只能针对请求的节点
      // const diskSpace = peer.diskSpace.used || 'unknown' 
      // const memoryUsage = peer.memoryUsage.heapUsed || 'unknown'
      const txPool = peer.transactionPoolSize || 'unknown'

      console.log(`${peer.host}\t${httpPort}\t${p2pPort}\t${status}\t${height}\t${version}\t${os}\t\t${txPool}`)
    })

    // 并行获取所有节点的高度（如果还没有高度信息）
    const heightPromises = peers
      .filter(peer => !peer.height || peer.height === 'unknown')
      .map(async peer => {
        // 使用 httpPort，如果没有则使用 port
        const httpPort = peer.httpPort || peer.port || 8000

        try {
          const url = `http://${peer.host}:${httpPort}/api/blocks/getHeight`
          console.log('正在请求高度:', url)

          const body = await makeRequest(url)

          if (!body || !body.success) {
            console.log(`${peer.host}:${httpPort} 响应错误:`, body)
            return null
          }

          console.log(`${peer.host}:${httpPort} 高度: ${body.height}`)
          return {
            peer,
            height: body.height
          }
        } catch (err) {
          console.log(`${peer.host}:${httpPort} 请求错误: ${err.message}`)
          return null
        }
      })

    // 等待所有请求完成
    const results = await Promise.all(heightPromises)

    // 收集所有高度信息
    const heightMap = new Map()

    // 先添加已知高度的节点
    peers.forEach(peer => {
      if (peer.height && peer.height !== 'unknown') {
        heightMap.set(peer.host + ':' + (peer.httpPort || peer.port || 8000), {
          peer,
          height: peer.height
        })
      }
    })

    // 再添加新查询到的高度
    results.forEach(result => {
      if (result && result.height) {
        const key = result.peer.host + ':' + (result.peer.httpPort || result.peer.port || 8000)
        heightMap.set(key, result)
      }
    })

    // 转换为数组
    const validResults = Array.from(heightMap.values())

    // 输出高度统计信息
    if (validResults.length > 0) {
      const heights = validResults.map(r => r.height)
      const maxHeight = Math.max(...heights)
      const minHeight = Math.min(...heights)

      // 输出节点统计信息
      console.log('\n节点统计信息:')
      console.log(`总节点数: ${peers.length}`)
      console.log(`响应节点数: ${validResults.length}`)

      console.log(`待定节点数: ${stats.pending || 0}`)
      console.log(`禁用节点数: ${stats.disabled || 0}`)
      console.log(`健康率: ${stats.healthRate || 0}\n`)

      console.log(`最高区块: ${maxHeight}`)
      console.log(`最低区块: ${minHeight}`)
      console.log(`差距: ${maxHeight - minHeight}`)

      // 检查是否存在分叉
      if (maxHeight - minHeight > 3) {
        console.log('\n警告: 可能存在分叉!')
        console.log('分叉节点:')
        validResults.forEach(r => {
          if (maxHeight - r.height > 3) {
            const httpPort = r.peer.httpPort || r.peer.port || 8000
            console.log(`${r.peer.host}:${httpPort} 高度: ${r.height} 落后: ${maxHeight - r.height}`)
          }
        })
      }
    } else {
      console.log('没有获取到任何有效的节点状态')
    }

  } catch (err) {
    console.error('执行失败:', err.message)
  }
}

function ipStat() {
  const api = getApi()
  api.get('/api/peers/', {}, (err, { peers }) => {
    if (err) {
      console.log('Failed to get peers', err)
      return
    }
    async.mapLimit(peers, 5, ({ ip }, next) => {
      const url = `http://ip-api.com/json/${ip}`
      request(url, (err, { statusCode }, body) => {
        if (err || statusCode !== 200) {
          console.error('Failed to get ip info:', err)
          next(null, {})
        } else {
          next(null, JSON.parse(body))
        }
      })
    }, (_err, ips) => {
      for (let i = 0; i < ips.length; ++i) {
        const ip = ips[i]
        if (ip.country) {
          console.log('%s\t%s', ip.country, ip.countryCode)
        }
      }
    })
  })
}

// 只在最后统一导出所有方法
export {
  init,
  peerStat,
  // delegateStat,
  ipStat
}
