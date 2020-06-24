import ddn from '../../lib'
import node from '../../lib/test'
import Debug from 'debug'

const debug = Debug('debug')
const expect = node.expect

describe('Node SDK', () => {
  it('should be ok', () => {
    // (ddn).to.be.ok;
    expect(ddn).to.be.ok
  })

  it('should be object', () => {
    expect(ddn).that.is.an('object')
  })

  it('should have properties', () => {
    const properties = ['transaction', 'signature', 'vote', 'delegate', 'dapp', 'crypto']

    properties.forEach(property => {
      expect(ddn).to.have.property(property)
    })
  })

  describe('multisignature.js', () => {
  })

  describe('transfer.js', () => {
  })
})
