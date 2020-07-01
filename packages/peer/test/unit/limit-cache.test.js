/**
 * passed
 */
import DdnUtil from '@ddn/utils'
const node = DdnUtil.Tester

describe('LimitCache', () => {
  it('normal test', done => {
    const lc = new DdnUtil.LimitCache({
      limit: 10
    })
    for (let i = 0; i < 10; ++i) {
      lc.set(i, true)
      node.expect(lc.has(i)).to.be.true
    }
    lc.set(10, true)
    node.expect(lc.has(10)).to.be.true
    node.expect(lc.has(0)).to.be.false
    node.expect(lc.has(1)).to.be.true
    lc.set(11, true)
    node.expect(lc.has(1)).to.be.false

    done()
  })
})
