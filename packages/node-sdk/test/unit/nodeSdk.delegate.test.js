import ddn from '../../lib'
import node from '../../lib/test'
import Debug from 'debug'

const debug = Debug('debug')
const expect = node.expect

describe('delegate.js', () => {
  const delegate = ddn.delegate

  it('should be ok', () => {
    expect(delegate).to.be.ok
  })

  it('should be function', () => {
    expect(delegate).that.is.an('object')
  })

  it('should have property createDelegate', () => {
    expect(delegate).to.have.property('createDelegate')
  })

  describe('#createDelegate', () => {
    const createDelegate = delegate.createDelegate
    let trs = null

    it('should be ok', () => {
      expect(createDelegate).to.be.ok
    })

    it('should be function', () => {
      expect(createDelegate).to.be.a('function')
    })

    describe('should create delegate', () => {
      const keys = ddn.crypto.getKeys('secret')
      const secondKeys = ddn.crypto.getKeys('secret 2')

      it('should be ok', async () => {
        trs = await createDelegate('delegate', 'secret', 'secret 2')
        debug('createDelegate, trs', trs)

        expect(trs).to.be.ok
      })

      it('should be object', () => {
        expect(trs).that.is.an('object')
      })

      it('should have recipientId equal null', () => {
        expect(trs).to.have.property('recipientId').to.be.null
      })

      it('shoud have amount equal 0', () => {
        expect(trs).to.have.property('amount').and.be.a('string').to.equal('0')
      })

      it('should have type equal 0', () => {
        expect(trs).to.have.property('type').and.be.a('number').to.equal(2)
      })

      it('should have timestamp number', () => {
        expect(trs).to.have.property('timestamp').and.be.a('number')
      })

      it('should have senderPublicKey in hex', () => {
        expect(trs).to.have.property('senderPublicKey').and.be.a('string')
        // .and.match(() => {
        // 	try {
        // 		Buffer.from(trs.senderPublicKey, "hex");
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // }).to.equal(keys.publicKey);
      })

      it('should have signature in hex', () => {
        expect(trs).to.have.property('signature').to.be.a('string')
        // .and.match(() => {
        // 	try {
        // 		Buffer.from(trs.signature, "hex");
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // });
      })

      it('should have second signature in hex', () => {
        expect(trs).to.have.property('sign_signature').to.be.a('string')
        // .and.match(() => {
        // 	try {
        // 		Buffer.from(trs.sign_signature, "hex");
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // });
      })

      it('should have delegate asset', () => {
        expect(trs).to.have.property('asset').that.is.an('object')
        expect(trs.asset).to.have.property('delegate')
      })

      it('should be signed correctly', async () => {
        const result = await ddn.crypto.verify(trs, keys.publicKey)
        expect(result).to.be.ok
      })

      it('should be second signed correctly', async () => {
        const result = await ddn.crypto.verifySecondSignature(trs, secondKeys.publicKey)
        debug('second signed', result)
        expect(result).to.be.true
      })

      it('should not be signed correctly now', async () => {
        trs.amount = '100'
        const result = await ddn.crypto.verify(trs, keys.publicKey)
        expect(result).to.be.not.ok
      })

      it('should not be second signed correctly now', async () => {
        trs.amount = '100'
        const result = await ddn.crypto.verify(trs, secondKeys.publicKey)
        expect(result).to.be.not.ok
      })

      describe('delegate asset', () => {
        it('should be ok', () => {
          expect(trs.asset.delegate).to.be.ok
        })

        it('should be object', () => {
          expect(trs.asset.delegate).that.is.an('object')
        })

        it('should be have property username', () => {
          expect(trs.asset.delegate).to.have.property('username').to.be.a('string').to.equal('delegate')
        })
      })
    })
  })
})
