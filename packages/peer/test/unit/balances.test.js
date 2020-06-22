/**
 * passed
 */
import node from '@ddn/node-sdk/lib/test'

import BalanceManager from '../../lib/helpers/balance-manager.js'

describe('balance cache manager', () => {
  it('normal test', done => {
    const balances = new BalanceManager()
    balances.setNativeBalance('1', 10)
    balances.setNativeBalance('2', '1000')
    node.expect(balances.getNativeBalance('1')).to.equal('10')
    node.expect(balances.getNativeBalance('2')).to.equal('1000')
    balances.addNativeBalance('1', '10')
    balances.addNativeBalance('2', 1000)
    node.expect(balances.getNativeBalance('1')).to.equal('20')
    node.expect(balances.getNativeBalance('2')).to.equal('2000')
    balances.rollback()
    node.expect(balances.getNativeBalance('1')).to.not.exist
    node.expect(balances.getNativeBalance('2')).to.not.exist

    // Test assets
    balances.addAssetBalance('3', 'ddn.GOLD', 300)
    node.expect(balances.getAssetBalance('3', 'ddn.GOLD')).to.equal('300')
    balances.addAssetBalance('3', 'ddn.BTC', '3000')
    node.expect(balances.getAssetBalance('3', 'ddn.BTC')).to.equal('3000')
    balances.commit()
    balances.rollback()
    node.expect(balances.getAssetBalance('3', 'ddn.GOLD')).to.equal('300')
    node.expect(balances.getAssetBalance('3', 'ddn.BTC')).to.equal('3000')

    done()
  })
})
