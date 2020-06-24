/**
 * passed
 */
import node from '@ddn/node-sdk/lib/test'

import BufferCache from '../../lib/helpers/buffer-cache'

describe('BufferCache', () => {
  it('normal test', async () => {
    const bc = new BufferCache({
      maxCacheNumber: 10,
      refreshInterval: 1000,
      clearInterval: 2000
    })
    bc.set('k1', 1)
    node.expect(bc.has('k1')).to.be.true
    for (let i = 0; i < 9; ++i) {
      const key = `k${i + 2}`
      bc.set(key, 1)
      node.expect(bc.has(key)).to.be.true
    }
    function f () {
      bc.set('k11', 1)
    }
    node.expect(f).to.throw(Error, /Cache limit exceeded/)
    bc.remove('k1')
    node.expect(bc.has('k1')).to.be.false

    await node.sleepAsync(1)
    bc.set('k11', 1)
    node.expect(bc.has('k2')).to.be.true

    bc.remove('k3')
    await node.sleepAsync(2)
    bc.set('k12', 1)
    node.expect(bc.has('k12')).to.be.true
    node.expect(bc.has('k2')).to.be.false
    node.expect(bc.has('k11')).to.be.false
  })
})
