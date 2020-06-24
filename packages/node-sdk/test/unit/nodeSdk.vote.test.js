import ddn from '../../lib'
import node from '../../lib/test'
import Debug from 'debug'

const debug = Debug('debug')
const expect = node.expect

describe('vote.js', () => {
  const vote = ddn.vote
  debug('vote')
  it('should be ok', () => {
    expect(vote).to.be.ok
  })

  it('should be object', () => {
    expect(vote).that.is.an('object')
  })

  it('should have createVote property', () => {
    expect(vote).to.have.property('createVote')
  })

  describe('#createVote', () => {
    const createVote = vote.createVote
    let vt = null
    const publicKey = ddn.crypto.getKeys('secret').publicKey
    const publicKeys = [`+${publicKey}`]

    it('should be ok', () => {
      expect(createVote).to.be.ok
    })

    it('should be function', () => {
      expect(createVote).to.be.a('function')
    })

    describe('should create vote', () => {
      it('should be ok', async () => {
        vt = await createVote(publicKeys, 'secret', 'second secret')
        expect(vt).to.be.ok
      })

      it('should be object', () => {
        expect(vt).that.is.an('object')
      })

      it('should have recipientId string equal to sender', () => {
        expect(vt).to.have.property('recipientId').equal(null)
      })

      it('should have amount number eaul to 0', () => {
        expect(vt).to.have.property('amount').and.be.a('string').to.equal('0')
      })

      it('should have type number equal to 3', () => {
        expect(vt).to.have.property('type').and.be.a('number').to.equal(3)
      })

      it('should have timestamp number', () => {
        expect(vt).to.have.property('timestamp').and.be.a('number')
      })

      it('should have senderPublicKey hex string equal to sender public key', () => {
        expect(vt).to.have.property('senderPublicKey').and.be.a('string').to.equal(publicKey)
        // .and.match(() => {
        // 	try {
        // 		Buffer.from(vt.senderPublicKey, "hex");
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // })
      })

      it('should have signature hex string', () => {
        expect(vt).to.have.property('signature').and.be.a('string')
        // .and.match(() => {
        // 	try {
        // 		Buffer.from(vt.signature, "hex");
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // });
      })

      it('should have second signature hex string', () => {
        expect(vt).to.have.property('sign_signature').and.be.a('string')
        // .and.match(() => {
        // 	try {
        // 		Buffer.from(vt.sign_signature, "hex");
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // });
      })

      it('should be signed correctly', () => {
        const result = ddn.crypto.verify(vt)
        expect(result).to.be.ok
      })

      it('should be second signed correctly', () => {
        const result = ddn.crypto.verifySecondSignature(vt, ddn.crypto.getKeys('second secret').publicKey)
        expect(result).to.be.ok
      })

      it('should not be signed correctly now', async () => {
        vt.amount = '100'
        const result = await ddn.crypto.verify(vt)
        expect(result).to.be.not.ok
      })

      it('should not be second signed correctly now', async () => {
        vt.amount = '100'
        const result = await ddn.crypto.verifySecondSignature(vt, ddn.crypto.getKeys('second secret').publicKey)
        expect(result).to.be.not.ok
      })

      it('should have asset', () => {
        expect(vt).to.have.property('asset').and.not.empty
      })

      describe('vote asset', () => {
        it('should be ok', () => {
          expect(vt.asset.vote).to.have.property('votes').and.be.ok
        })

        it('should be array', () => {
          expect(vt.asset.vote.votes).to.a('array')
        })

        it('should be not empty', () => {
          expect(vt.asset.vote.votes).to.be.not.empty
        })

        it('should contains one element', () => {
          expect(vt.asset.vote.votes.length).to.equal(1)
        })

        it('should have public keys in hex', () => {
          vt.asset.vote.votes.forEach(v => {
            expect(v).to.be.a('string')
            debug('v: ', v)
            // .startWith("+")
            // .and.match(() => {
            // 	try {
            // 		Buffer.from(v.substring(1, v.length), "hex");
            // 	} catch (e) {
            // 		return false;
            // 	}

            // 	return true;
            // });
          })
        })

        it('should be equal to sender public key', () => {
          const v = vt.asset.vote.votes[0]
          expect(v.substring(1, v.length)).to.equal(publicKey)
        })
      })
    })
  })
})
