/**
 * passed
 */
import DdnUtil from '@ddn/utils'
const node = DdnUtil.Tester

describe('test blocks', () => {
  describe('POST /peer/blocks', () => {
    it('Using invalid nethash in headers. Should fail', done => {
      node.peer.post('/blocks')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', 'wrongmagic')
        .set('port', node.config.port)
        .send({
          dummy: 'dummy'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, {
          body
        }) => {
          // console.log(JSON.stringify(body));
          node.expect(body).to.have.property('success').to.be.false
          // node.expect(res.body.expected).to.equal(node.config.nethash);
          done()
        })
    })
  })

  describe('GET /peer/blocks', () => {
    it('Using correct nethash in headers. Should be ok', done => {
      node.peer.get('/blocks')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, {
          headers,
          body
        }) => {
          // console.log(JSON.stringify(res.body.blocks));
          node.expect(headers.nethash).to.equal(node.config.nethash)
          node.expect(body.blocks.length).to.be.greaterThan(1)
          done()
        })
    })
  })
})
