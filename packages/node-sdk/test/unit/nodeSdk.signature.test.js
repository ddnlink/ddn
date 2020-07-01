import Debug from 'debug'
import DdnUtils from '@ddn/utils'
import DdnJS from '../ddn-js'
const Tester = DdnUtils.Tester

const debug = Debug('debug')
const expect = Tester.expect

describe('signature.js', () => {
  const signature = DdnJS.signature
  it('should be ok', () => {
    expect(signature).to.be.ok
  })

  it('should be object', () => {
    expect(signature).that.is.an('object')
  })

  it('should have properties', () => {
    expect(signature).to.have.property('createSignature')
  })

  describe('#createSignature', () => {
    const createSignature = signature.createSignature
    let sgn = null

    it('should be function', () => {
      expect(createSignature).to.be.a('function')
    })

    it('should create signature transaction', async () => {
      sgn = await createSignature('secret', 'second secret')
      debug('createSignature: ', sgn)
      expect(sgn).to.be.ok
      expect(sgn).that.is.an('object')
    })

    describe('returned signature transaction', () => {
      it('should have empty recipientId', () => {
        expect(sgn).to.have.property('recipientId').equal(null)
      })

      it('should have amount equal 0', () => {
        expect(sgn.amount).to.be.a('string').equal('0')
      })

      it('should have asset', () => {
        expect(sgn.asset).that.is.an('object')
        expect(sgn.asset).to.be.not.empty
      })

      it('should have signature inside asset', () => {
        expect(sgn.asset).to.have.property('signature')
      })

      describe('signature asset', () => {
        it('should be ok', () => {
          expect(sgn.asset.signature).to.be.ok
        })

        it('should be object', () => {
          expect(sgn.asset.signature).that.is.an('object')
        })

        it('should have publicKey property', () => {
          expect(sgn.asset.signature).to.have.property('publicKey')
        })

        it('should have publicKey in hex', () => {
          expect(sgn.asset.signature.publicKey).to.be.a('string')
          // .and.match(() => {
          // 	try {
          // 		Buffer.from(sgn.asset.signature.publicKey);
          // 	} catch (e) {
          // 		return false;
          // 	}

          // 	return true;
          // });
        })

        it('should have publicKey in 32 bytes', () => {
          const publicKey = Buffer.from(sgn.asset.signature.publicKey, 'hex')
          expect(publicKey.length).to.equal(32)
        })
      })
    })
  })
})
