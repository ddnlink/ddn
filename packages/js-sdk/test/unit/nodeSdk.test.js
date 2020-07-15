import Debug from 'debug'
import Tester from '@ddn/test-utils'
import DdnJS from '../ddn-js'

const debug = Debug('debug')
const expect = Tester.expect

describe('Node SDK', () => {
  it('should be ok', () => {
    // (DdnJS).to.be.ok;
    expect(DdnJS).to.be.ok
  })

  it('should be object', () => {
    expect(DdnJS).that.is.an('object')
  })

  it('should have properties', () => {
    const properties = ['transaction', 'signature', 'vote', 'delegate', 'dapp', 'crypto']

    properties.forEach(property => {
      expect(DdnJS).to.have.property(property)
    })
  })

  describe('multisignature.js', () => {
  })

  describe('transfer.js', () => {
  })
})
