/**
 * passed
 */
import { node } from '../ddn-js'
import { amount } from '../../'

describe('amount', () => {
  it('normal test', done => {
    node.expect(amount.validate(2)).to.equal('Invalid amount type')
    node.expect(amount.validate('abc')).to.equal('Amount should be integer')
    node.expect(amount.validate('NaN')).to.equal('Amount should be integer')
    node.expect(amount.validate('1.1')).to.equal('Amount should be integer')
    node.expect(amount.validate('-2')).to.equal('Amount should be integer')
    node.expect(amount.validate('9999999999999999999999999999999999999999999999999')).to.equal('Invalid amount range')
    node.expect(amount.validate('10000000000000000000000000000000000000000000000000')).to.equal('Invalid amount range')

    node.expect(amount.validate('2') === false).to.be.true
    node.expect(amount.validate('1000') === false).to.be.true
    done()
  })
})
