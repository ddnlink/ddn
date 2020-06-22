/**
 * note passed
 */
import node from '@ddn/node-sdk/lib/test'

import Debug from 'debug'
import async from 'async'

const debug = Debug('multinodes')

// 全部启动下面的服务才能测试通过
const urls = [
  'http://127.0.0.1:8001',
  'http://127.0.0.1:8002',
  'http://127.0.0.1:8003',
  'http://127.0.0.1:8004'
]

describe('GET /blocks/getHeight in multi nodes', () => {
  it('Should be same height', done => {
    async.mapSeries(urls, node._getheight, (err, results) => {
      debug('heights', results)
      if (!err) {
        const items = new Set(results)
        node.expect(items.size).to.equal(1)
      } else {
        console.log('getHeight in multi nodes error')
      }
      done()
    })
  })
})
