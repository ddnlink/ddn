/**
 * passed
 */
import { node } from '../ddn-js'
import { amount } from '../../'

describe('amount', () => {
  it('normal test', done => {
    node.expect(amount.validate(2).message).to.equal('Amount is valid!')
    node.expect(amount.validate('2').valid).to.be.true

    node.expect(amount.validate('1000').message).to.equal('Amount is valid!')
    node.expect(amount.validate(1000).valid).to.be.true
    
    node.expect(amount.validate('1.1').message).to.equal('Amount is valid!')
    node.expect(amount.validate(1.1).valid).to.be.true

    node.expect(amount.validate('abc').message).to.equal('Invalid amount type')
    node.expect(amount.validate('NaN').message).to.equal('Invalid amount type')
    node.expect(amount.validate('-2').message).to.equal('Invalid amount range')
    node.expect(amount.validate('9999999999999999999999999999999999999999999999999').message).to.equal('Invalid amount range')
    node.expect(amount.validate('10000000000000000000000000000000000000000000000000').message).to.equal('Invalid amount range')

    done()
  })
})
