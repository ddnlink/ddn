import Debug from 'debug'
import DdnUtils from '@ddn/utils'
import { DdnJS, node } from '../ddn-js'

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
    debug('beforeAll starting ...')
    const ipid = node.randomIpId()

    debug(`beforeAll ipid: ${ipid}`)
    evidence = {
      title: node.randomUsername(),
      description: `${ipid} has been evidence.`,
      hash: `f082022ee664${new Date().getTime()}`,
      short_hash: `f08202${new Date().getTime()}`,
      author: 'Evanlai',
      size: '2448kb',
      type: 'html',
      source_address: 'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
      tags: 'world,cup,test',
      metadata: 'world,cup,test'
    }

    // const ipid2 = node.randomIpId()
    evidence2 = {
      title: node.randomUsername(),
      description: `${ipid} has been evidence.`,
      hash: `f082022e664${new Date().getTime()}`,
      short_hash: `f0802${new Date().getTime()}`,
      author: 'Evanlai',
      size: '2448kb',
      type: 'html',
      source_address: 'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
      tags: 'world,cup,test',
      metadata: 'world,cup,test'
    }

    node.expect(evidence).to.be.not.equal(evidence2)
    debug(`beforeAll end: ${JSON.stringify(evidence2)}`)

    done()
  })

  it('CreateEvidence Should be ok', async done => {
    evidence.address = node.Gaccount.address
    transaction = await createEvidence(evidence, node.Gaccount.password)
    debug(`transaction: ${JSON.stringify(transaction)}`)

    node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        debug('CreateEvidence: ', JSON.stringify(body))
        node.expect(err).to.be.not.ok
        node.expect(body).to.have.property('success').to.be.true
        done()
      })
  })
  it('CreateEvidence Should not be ok with excess field', async done => {
    evidence.address = node.Gaccount.address
    evidence.data = node.Gaccount.address
    transaction = await createEvidence(evidence, node.Gaccount.password)
    debug(`transaction: ${JSON.stringify(transaction)}`)

    node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        debug('CreateEvidence: ', JSON.stringify(body))
        node.expect(err).to.be.not.ok
        node.expect(body).to.have.property('success').to.be.not.ok
        done()
      })
  })

  it('CreateEvidence Should  be ok with lack field', async done => {
    evidence.address = node.Gaccount.address
    delete evidence.description
    transaction = await createEvidence(evidence, node.Gaccount.password)
    debug(`transaction: ${JSON.stringify(transaction)}`)

    node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        debug('CreateEvidence: ', JSON.stringify(body))
        node.expect(err).to.be.not.ok
        node.expect(body).to.have.property('success').to.be.not.ok
        done()
      })
  })

  it('Get /evidences/short_hash/:short_hash should be ok', async done => {
    // debug(`onNewBlock: ${ipid}`)
    // await node.onNewBlockAsync()
    node.onNewBlock(err => {
      debug('onNewBlock 2..')

      node.expect(err).to.be.not.ok
      debug(`/evidences/short_hash/${evidence.short_hash}`, evidence.short_hash)

      node.api
        .get(`/evidences/short_hash/${evidence.short_hash}`)
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, { body }) => {
          debug(`/evidences/short_hash/${evidence.short_hash}`, JSON.stringify(body))
          node.expect(err).to.be.not.ok
          node.expect(body).to.have.property('success').to.be.true
          node.expect(body).to.have.property('result').not.null

          node.expect(body.result).to.have.property('transaction_id')

          node.expect(body.result.transaction_type).to.equal(transaction.type)
          node.expect(body.result.short_hash).to.equal(evidence.short_hash)

          done()
        })
    })
  })

  describe('Asset puglin Test', () => {
    it('POST peers/transactions, Should be ok', async done => {
      evidence2.address = node.Gaccount.address
      const transaction = await createPluginAsset(DdnUtils.assetTypes.EVIDENCE, evidence2, node.Gaccount.password)

      node.api
        .post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, { body }) => {
          debug('Asset puglin body: ', JSON.stringify(body))
          node.expect(err).to.be.not.ok
          node.expect(body).have.property('success').be.true

          done()
        })
    })
  })
})
