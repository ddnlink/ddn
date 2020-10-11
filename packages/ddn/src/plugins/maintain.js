
import async from 'async'
import request from 'request'
import nodeSdk from '@ddn/node-sdk'
import Api from '../helpers/api'

let globalOptions

function getApi () {
  return new Api({
    host: globalOptions.host,
    port: globalOptions.port,
    mainnet: !!globalOptions.main
  })
}

// 调用其他方法之前需要初始化全局选项
function init (options) {
  globalOptions = options
}

function peerStat () {
  const api = getApi()
  api.get('/api/peers/', {}, (err, { peers }) => {
    if (err) {
      console.log('Failed to get peers', err)
      return
    }

    async.map(peers, (peer, next) => {
      new Api({
        host: peer.ip,
        port: peer.port
      }).get('/api/blocks/getHeight', (err, body) => {
        if (err) {
          console.log('%s:%d %s %d', peer.ip, peer.port, peer.version, err)
          next(null, {
            peer,
            error: err
          })
        } else {
          console.log('%s:%d %s %d', peer.ip, peer.port, peer.version, body.height)
          next(null, {
            peer,
            height: body.height
          })
        }
      })
    }, (_err, results) => {
      const heightMap = {}
      const errorMap = {}
      for (let i = 0; i < results.length; ++i) {
        const item = results[i]
        if (item.error) {
          if (!errorMap[item.error]) {
            errorMap[item.error] = []
          }
          errorMap[item.error].push(item.peer)
        } else {
          if (!heightMap[item.height]) {
            heightMap[item.height] = []
          }
          heightMap[item.height].push(item.peer)
        }
      }
      const normalList = []
      const errList = []
      for (const k in heightMap) {
        normalList.push({
          peers: heightMap[k],
          height: k
        })
      }
      for (const k in errorMap) {
        errList.push({
          peers: errorMap[k],
          error: k
        })
      }
      normalList.sort(function (l, r) {
        return r.height - l.height
      })

      function joinPeerAddrs (peers) {
        const peerAddrs = []
        peers.forEach(({ ip, port }) => {
          peerAddrs.push(`${ip}:${port}`)
        })
        return peerAddrs.join(',')
      }

      for (let i = 0; i < normalList.length; ++i) {
        const item = normalList[i]
        if (i === 0) {
          console.log(`${item.peers.length} height: ${item.height}`)
        } else {
          console.log(`${item.peers.length} height: ${item.height}`, joinPeerAddrs(item.peers))
        }
      }
      for (let i = 0; i < errList.length; ++i) {
        const item = errList[i]
        console.log(`${item.peers.length} error: ${item.error}`, joinPeerAddrs(item.peers))
      }
    })
  })
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

/**
 * 提供获取ip地址的接口网站
 * http://ip.taobao.com/
 * https://zhuanlan.zhihu.com/p/83765235
 * https://ip-api.com/docs/api:json
 * 
 */
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

export {
  init,
  peerStat,
  delegateStat,
  ipStat
}
