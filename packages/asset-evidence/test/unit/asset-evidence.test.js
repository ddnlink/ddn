import Debug from 'debug'
import DdnUtil from '@ddn/utils'
import node from '@ddn/node-sdk/lib/test'

const debug = Debug('debug')

// 这里有两种创建存证交易的方法
const createEvidence = node.ddn.evidence.createEvidence

async function createPluginAsset (type, asset, secret) {
  return await node.ddn.assetPlugin.createPluginAsset(type, asset, secret)
}

describe('Test createEvidence', () => {
  let transaction
  let evidence
  let evidence2

  beforeAll(done => {
    const ipid = node.randomIpId()
    evidence = {
      ipid: ipid,
      title: node.randomUsername(),
      description: `${ipid} has been evidence.`,
      hash: 'f082022ee664008a1f15d62514811dfd',
      author: 'Evanlai',
      size: '2448kb',
      type: 'html',
      url: 'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
      tags: 'world,cup,test'
    }

    const ipid2 = node.randomIpId()
    evidence2 = {
      ipid: ipid2,
      title: node.randomUsername(),
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

    node.expect(evidence).to.be.not.equal(evidence2)
    done()
  })

  it('CreateEvidence Should be ok', async (done) => {
    transaction = await createEvidence(evidence, node.Gaccount.password)

    node.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, {
        body
      }) => {
        debug('CreateEvidence: ', JSON.stringify(body))
        node.expect(err).to.be.not.ok
        node.expect(body).to.have.property('success').to.be.true
        done()
      })
  })

  it('Get /evidences/ipid/:ipid should be ok', done => {
    node.onNewBlock(err => {
      node.expect(err).to.be.not.ok

      node.api.get(`/evidences/ipid/${evidence.ipid}`)
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug(`/evidences/ipid/${evidence.ipid}`, JSON.stringify(body))

          node.expect(err).to.be.not.ok
          node.expect(body).to.have.property('success').to.be.true
          node.expect(body).to.have.property('result').not.null

          node.expect(body.result).to.have.property('transaction_id')

          node.expect(body.result.transaction_type).to.equal(transaction.type)
          node.expect(body.result.ipid).to.equal(evidence.ipid)

          done()
        })
    })
  })

  describe('Asset puglin Test', () => {
    it('POST peers/transactions, Should be ok', async (done) => {
      const transaction = await createPluginAsset(DdnUtil.assetTypes.EVIDENCE, evidence2, node.Gaccount.password)

      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('Asset puglin body: ', JSON.stringify(body))
          node.expect(err).to.be.not.ok
          node.expect(body).have.property('success').be.true

          done()
        })
    })
  })
})
