// import Buffer from "buffer";
import Debug from 'debug'
import DdnUtils from '@ddn/utils'

import ddn from '../../lib'
import node from '../../lib/test'
// const Buffer = Buffer.Buffer;
const debug = Debug('evidence')

const expect = node.expect

describe('DDN evidence.js', () => {
  const evidence = ddn.evidence

  it('should be object', () => {
    expect(evidence).that.is.an('object')
  })

  it('should have properties', () => {
    expect(evidence).to.have.property('createEvidence')
  })

  describe('#createEvidence', () => {
    const createEvidence = evidence.createEvidence
    let trs = null

    it('should be a function', (done) => {
      expect(createEvidence).to.be.a('function')
      done()
    })

    it('should create evidence without second signature', async (done) => {
      const evidence = {
        ipid: 'IPIDasdf20180501221md',
        title: 'Evidencetitle',
        hash: 'contenthash',
        author: 'author1',
        url: 'dat://helloworld/index.html',
        tags: 'test, article',
        size: '12',
        type: 'html'
      }
      trs = await createEvidence(evidence, 'secret')
      debug('trs: ', trs)
      expect(trs).to.be.ok
      done()
    })

    describe('returned evidence', () => {
      it('should be object', (done) => {
        expect(trs).that.is.an('object')
        done()
      })

      it('should have id as string', (done) => {
        expect(trs.id).to.be.a('string')
        done()
      })

      it('should have type as number and eqaul DdnUtils.assetTypes.EVIDENCE', (done) => {
        expect(trs.type).to.be.a('number').be.equal(DdnUtils.assetTypes.EVIDENCE)
        done()
      })

      it('should have timestamp as number', (done) => {
        expect(trs.timestamp).be.a('number').and.not.NaN
        debug('returned evidence timestamp:', trs.timestamp)
        done()
      })

      it('should have senderPublicKey as hex string', (done) => {
        expect(trs.senderPublicKey).be.a('string')
        // .and.match(() => {
        //     try {
        //         Buffer.from(trs.senderPublicKey, "hex")
        //     } catch (e) {
        //         return false;
        //     }

        //     return true;
        // })
        done()
      })

      it('should have not empty asset object', (done) => {
        expect(trs.asset).that.is.an('object').and.not.empty
        done()
      })

      it('should does not have second signature', (done) => {
        expect(trs).not.have.property('sign_signature')
        done()
      })

      it('should have signature as hex string', (done) => {
        expect(trs.signature).be.a('string')
        // .and.match(() => {
        //     try {
        //         Buffer.from(trs.signature, "hex")
        //     } catch (e) {
        //         return false;
        //     }

        //     return true;
        // })
        done()
      })

      it('should be signed correctly', (done) => {
        const result = ddn.crypto.verify(trs)
        expect(result).be.ok
        done()
      })
    })
  })
})
