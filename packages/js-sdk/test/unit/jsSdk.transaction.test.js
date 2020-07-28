import Debug from 'debug'
import { DdnJS, node } from '../ddn-js'

const debug = Debug('debug')
const expect = node.expect

describe('transaction.js', () => {
  const transaction = DdnJS.transaction

  debug('start')
  it('should be object', () => {
    expect(transaction).that.is.an('object')
  })

  it('should have properties', () => {
    expect(transaction).to.have.property('createTransaction')
  })

  describe('#createTransaction', () => {
    const createTransaction = transaction.createTransaction
    let trs = null

    it('should be a function', () => {
      expect(createTransaction).to.be.a('function')
    })

    //  DP2kJY3RweZU2jhYpnSbLbxVjgot95bUma 10000000000 asd enter boring shaft rent essence foil trick vibrant fabric quote indoor output
    it('should create transaction without second signature', async () => {
      trs = await createTransaction('DP2kJY3RweZU2jhYpnSbLbxVjgot95bUma', '1000', 'asd', 'enter boring shaft rent essence foil trick vibrant fabric quote indoor output')
      debug('trs', trs)
      expect(trs).to.be.ok
    })

    describe('returned transaction', () => {
      it('should be object', () => {
        expect(trs).that.is.an('object')
      })

      it('should have id as string', () => {
        expect(trs.id).to.be.a('string')
      })

      it('should have type as number and eqaul 0', () => {
        expect(trs.type).to.be.a('number').to.equal(0)
      })

      it('should have timestamp as number', () => {
        expect(trs.timestamp).to.be.a('number').to.be.not.NaN
      })

      it('should have senderPublicKey as hex string', () => {
        expect(trs.senderPublicKey).to.be.a('string')
        // .and.match(() => {
        // 	try {
        // 		Buffer.from(trs.senderPublicKey, "hex")
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // })
      })

      it('should have recipientId as string and to be equal 58191285901858109', () => {
        expect(trs.recipientId).to.be.a('string').to.equal('DP2kJY3RweZU2jhYpnSbLbxVjgot95bUma')
      })

      it('should have amount as number and eqaul to 1000', () => {
        expect(trs.amount).to.be.a('string').to.equal('1000')
      })

      it('should have empty asset object', () => {
        expect(trs.asset).that.is.an('object').to.be.empty
      })

      it('should does not have second signature', () => {
        expect(trs).not.have.property('sign_signature')
      })

      it('should have signature as hex string', () => {
        expect(trs.signature).to.be.a('string')
        // .and.match(() => {
        // 	try {
        // 		Buffer.from(trs.signature, "hex")
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // })
      })

      it('should be signed correctly', async () => {
        const result = await DdnJS.crypto.verify(trs)
        expect(result).to.be.ok
      })

      it('should not be signed correctly now', async () => {
        trs.amount = '10000'
        const result = await DdnJS.crypto.verify(trs)
        expect(result).to.be.not.ok
      })
    })
  })

  describe('#createTransaction with second secret', () => {
    const createTransaction = transaction.createTransaction
    let trs = null
    const secondSecret = 'second secret'
    const keys = DdnJS.crypto.getKeys(secondSecret)

    it('should be a function', () => {
      expect(createTransaction).to.be.a('function')
    })

    it('should create transaction without second signature', async () => {
      trs = await createTransaction('58191285901858109', 1000, '', 'secret', secondSecret)
      expect(trs).to.be.ok
    })

    describe('returned transaction', () => {
      it('should be object', () => {
        expect(trs).that.is.an('object')
      })

      it('should have id as string', () => {
        expect(trs.id).to.be.a('string')
      })

      it('should have type as number and eqaul 0', () => {
        expect(trs.type).to.be.a('number').to.equal(0)
      })

      it('should have timestamp as number', () => {
        expect(trs.timestamp).to.be.a('number').not.NaN
      })

      it('should have senderPublicKey as hex string', () => {
        expect(trs.senderPublicKey).to.be.a('string')
        // .and.match(() => {
        // 	try {
        // 		Buffer.from(trs.senderPublicKey, "hex")
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // })
      })

      it('should have recipientId as string and to be equal 58191285901858109', () => {
        expect(trs.recipientId).to.be.a('string').to.equal('58191285901858109')
      })

      it('should have amount as string and eqaul to 1000', () => {
        expect(trs.amount).to.be.a('string').to.equal('1000')
      })

      it('should have empty asset object', () => {
        expect(trs.asset).that.is.an('object').to.be.empty
      })

      it('should have second signature', () => {
        expect(trs).to.have.property('sign_signature')
      })

      it('should have signature as hex string', () => {
        expect(trs.signature).to.be.a('string')
        // .and.match(() => {
        // 	try {
        // 		Buffer.from(trs.signature, "hex")
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // })
      })

      it('should have sign_signature as hex string', () => {
        expect(trs.sign_signature).to.be.a('string')
        // .to.match(() => {
        // 	try {
        // 		Buffer.from(trs.sign_signature, "hex");
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // });
      })

      it('should be signed correctly', async () => {
        const result = await DdnJS.crypto.verify(trs)
        expect(result).to.be.ok
      })

      it('should be second signed correctly', async () => {
        const result = await DdnJS.crypto.verifySecondSignature(trs, keys.publicKey)
        expect(result).to.be.ok
      })

      it('should not be signed correctly now', async () => {
        trs.amount = '10000'
        const result = await DdnJS.crypto.verify(trs)
        expect(result).to.be.not.ok
      })

      it('should not be second signed correctly now', async () => {
        trs.amount = '10000'
        const result = await DdnJS.crypto.verifySecondSignature(trs, keys.publicKey)
        expect(result).to.be.not.ok
      })
    })
  })
})
