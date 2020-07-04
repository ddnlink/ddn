/**
 * passed
 */
import Debug from 'debug'
import node from '@ddn/test-utils'

const debug = Debug('peer')

describe('GET /peers/version', () => {
  it('Should be ok', done => {
    node.api.get('/peers/version')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug('version', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body.version).to.have.property('build').to.be.a('string')
        node.expect(body.version).to.have.property('version').to.be.a('string')
        done()
      })
  })
})

describe('GET /peers', () => {
  it('Using empty parameters. Should fail', done => {
    const state = ''
    const os = ''
    const version = ''
    const limit = ''
    const offset = 0
    const orderBy = ''
    node.api.get(`/peers?state=${state}&os=${os}&shared=${true}&version=${version}&limit=${limit}&offset=${offset}orderBy=${orderBy}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using state. Should be ok', done => {
    const state = 1
    node.api.get(`/peers?state=${state}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('peers').that.is.an('array')
        if (body.peers.length > 0) {
          for (let i = 0; i < body.peers.length; i++) {
            node.expect(body.peers[i].state).to.equal(parseInt(state))
          }
        }
        done()
      })
  })

  it('Using limit. Should be ok', done => {
    const limit = 3
    const offset = 0
    node.api.get(`/peers?&limit=${limit}&offset=${offset}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('peers').that.is.an('array')

        // To check it need to have peers
        node.expect(body.peers.length).to.be.at.most(limit)
        done()
      })
  })

  it('Using orderBy. Should be ok', done => {
    const orderBy = 'state:desc'
    node.api.get(`/peers?orderBy=${orderBy}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('peers').that.is.an('array')

        if (body.peers.length > 0) {
          for (let i = 0; i < body.peers.length; i++) {
            if (typeof body.peers[i + 1] !== 'undefined') {
              node.expect(body.peers[i + 1].state).to.at.most(body.peers[i].state)
            }
          }
        }

        done()
      })
  })

  it('Using limit > 100. Should fail', done => {
    const limit = 101
    node.api.get(`/peers?&limit=${limit}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using invalid parameters. Should fail', done => {
    const state = 'invalid'
    const os = 'invalid'
    const shared = 'invalid'
    const version = 'invalid'
    const limit = 'invalid'
    const offset = 'invalid'
    const orderBy = 'invalid'
    node.api.get(`/peers?state=${state}&os=${os}&shared=${shared}&version=${version}&limit=${limit}&offset=${offset}orderBy=${orderBy}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })
})
