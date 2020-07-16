import Debug from 'debug'
import DdnUtils from '@ddn/utils'
import Tester from '@ddn/test-utils'
import DdnJS from '../ddn-js'

const debug = Debug('debug')

// 这里有两种创建存证交易的方法
const createEvidence = DdnJS.evidence.createEvidence

async function createPluginAsset (type, asset, secret) {
  return await DdnJS.assetPlugin.createPluginAsset(type, asset, secret)
}

describe('Test createEvidence', () => {
  let transaction
  let evidence
  let evidence2

  beforeAll(done => {
    const ipid = Tester.randomIpId()
    evidence = {
      ipid: ipid,
      title: Tester.randomUsername(),
      description: `${ipid} has been evidence.`,
      hash: 'f082022ee664008a1f15d62514811dfd',
      author: 'Evanlai',
      size: '2448kb',
      type: 'html',
      url: 'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
      tags: 'world,cup,test'
    }

    const ipid2 = Tester.randomIpId()
    evidence2 = {
      ipid: ipid2,
      title: Tester.randomUsername(),
      description: `${ipid} has been evidence.`,
      hash: 'f082022ee664008a1f15d62514811dfd',
      author: 'Evanlai',
      size: '2448kb',
      type: 'html',
      url: 'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
      tags: 'world,cup,test',
      ext: 'china',
      ext1: 12345,
      ext2: new Date()
    }

    Tester.expect(evidence).to.be.not.equal(evidence2)
    done()
  })

  it('CreateEvidence Should be ok', async (done) => {
    transaction = await createEvidence(evidence, Tester.Gaccount.password)

    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, {
        body
      }) => {
        debug('CreateEvidence: ', JSON.stringify(body))
        Tester.expect(err).to.be.not.ok
        Tester.expect(body).to.have.property('success').to.be.true
        done()
      })
  })

  it('Get /evidences/ipid/:ipid should be ok', done => {
    Tester.onNewBlock(err => {
      Tester.expect(err).to.be.not.ok

      Tester.api.get(`/evidences/ipid/${evidence.ipid}`)
        .set('Accept', 'application/json')
        .set('version', Tester.version)
        .set('nethash', Tester.config.nethash)
        .set('port', Tester.config.port)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug(`/evidences/ipid/${evidence.ipid}`, JSON.stringify(body))

          Tester.expect(err).to.be.not.ok
          Tester.expect(body).to.have.property('success').to.be.true
          Tester.expect(body).to.have.property('result').not.null

          Tester.expect(body.result).to.have.property('transaction_id')

          Tester.expect(body.result.transaction_type).to.equal(transaction.type)
          Tester.expect(body.result.ipid).to.equal(evidence.ipid)

          done()
        })
    })
  })

  describe('Asset puglin Test', () => {
    it('POST peers/transactions, Should be ok', async (done) => {
      const transaction = await createPluginAsset(DdnUtils.assetTypes.EVIDENCE, evidence2, Tester.Gaccount.password)

      Tester.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', Tester.version)
        .set('nethash', Tester.config.nethash)
        .set('port', Tester.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('Asset puglin body: ', JSON.stringify(body))
          Tester.expect(err).to.be.not.ok
          Tester.expect(body).have.property('success').be.true

          done()
        })
    })
  })
})
