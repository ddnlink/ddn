import async from 'async'
import request from 'request'
import nodeSdk from '@ddn/node-sdk'
import Api from '../utils/api'

let globalOptions

// 调用其他方法之前需要初始化全局选项
function init (options) {
  globalOptions = options
}

function getApi () {
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

async function peerStat (argv) {
  try {
    const api = getApi()
    const baseUrl = `http://${globalOptions.host}:${globalOptions.port}`

    // 获取节点列表
    const response = await makeRequest(`${baseUrl}/api/peers`)
    
    if (!response || !response.success) {
      throw new Error('获取节点列表失败')
    }

    const peers = response.peers || []
    if (peers.length === 0) {
      console.log('没有找到可用的节点')
      return
    }

    // 并行获取所有节点的高度
    const heightPromises = peers.map(async peer => {
      // 使用 httpPort，如果没有则从 port 计算
      const httpPort = peer.httpPort || (peer.port - 1000)
      
      try {
        const url = `http://${peer.host}:${httpPort}/api/blocks/getHeight`
        console.log('正在请求:', url)
        
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

    // 输出统计信息
    const validResults = results.filter(r => r && r.height)
    if (validResults.length > 0) {
      const heights = validResults.map(r => r.height)
      const maxHeight = Math.max(...heights)
      const minHeight = Math.min(...heights)
      
      console.log('\n统计信息:')
      console.log(`总节点数: ${peers.length}`)
      console.log(`响应节点数: ${validResults.length}`)
      console.log(`最高区块: ${maxHeight}`)
      console.log(`最低区块: ${minHeight}`)
      console.log(`差距: ${maxHeight - minHeight}`)

      // 检查是否存在分叉
      if (maxHeight - minHeight > 3) {
        console.log('\n警告: 可能存在分叉!')
        console.log('分叉节点:')
        validResults.forEach(r => {
          if (maxHeight - r.height > 3) {
            console.log(`${r.peer.host}:${r.peer.httpPort} 高度: ${r.height} 落后: ${maxHeight - r.height}`)
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

function delegateStat () {
  const api = getApi()
  api.get('/api/delegates', {}, (err, { delegates }) => {
    if (err) {
      console.log('Failed to get delegates', err)
      return
    }
    async.map(delegates, (delegate, next) => {
      const params = {
        generatorPublicKey: delegate.publicKey,
        limit: 1,
        offset: 0,
        orderBy: 'height:desc'
      }
      api.get('/api/blocks', params, (err, { blocks }) => {
        if (err) {
          next(err)
        } else {
          next(null, {
            delegate,
            block: blocks[0]
          })
        }
      })
    }, (err, delegates) => {
      if (err) {
        console.log('Failed to get forged block', err)
        return
      }
      delegates = delegates.sort(function (l, r) {
        if (!l.block) {
          return -1
        }
        if (!r.block) {
          return 1
        }
        return l.block.timestamp - r.block.timestamp
      })
      console.log('name\taddress\trate\tapproval\tproductivity\tproduced\tbalance\theight\tid\ttime')
      for (const i in delegates) {
        const d = delegates[i].delegate
        const b = delegates[i].block
        console.log('%s\t%s\t%d\t%s%%\t%s%%\t%d\t%d\t%s\t%s\t%s(%s)',
          d.username,
          d.address,
          d.rate,
          d.approval,
          d.productivity,
          d.producedblocks,
          d.balance / 100000000,
          b ? b.height : '',
          b ? b.id : '',
          nodeSdk.utils.format.fullTimestamp(b ? b.timestamp : ''),
          nodeSdk.utils.format.timeAgo(b ? b.timestamp : ''))
      }
    })
  })
}

function ipStat () {
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
  delegateStat,
  ipStat
}
