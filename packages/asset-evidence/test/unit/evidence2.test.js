const DEBUG = require('debug')('dao');
import node from '../node';

const Account1 = node.randomTxAccount();
const Account2 = node.randomTxAccount();
let transaction;
let evidence;

const createEvidence = node.ddn.evidence.createEvidence;

describe('Test evidence', () => {

  beforeAll(done => {
    const ipid = node.randomIpId();
    evidence = {
      "ipid": ipid,
      "title": node.randomUsername(),
      "description": `${ipid} has been evidence.`,
      "hash": "f082022ee664008a1f15d62514811dfd",
      "author": "Evanlai",
      "size": "2448kb",
      "type": "html",
      "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
      "tags": "world,cup,test"
    }

    done();
  })

  it("CreateEvidence Should be ok", done => {
    transaction = createEvidence(evidence, node.Gaccount.password);

    node.peer.post("/transactions")
      .set("Accept", "application/json")
      .set("version", node.version)
      .set("nethash", node.config.nethash)
      .set("port", node.config.port)
      .send({
        transaction
      })
      .expect("Content-Type", /json/)
      .expect(200)
      .end((err, {body}) => {
        console.log(JSON.stringify(body));
        node.expect(body).to.have.property("success").to.be.true;
        done();
      });
  });

  it('Get /evidences/:ipid should be ok', done => {
    node.onNewBlock(err => {
      node.api.get(`/evidences/${evidence.ipid}`)
        .set("Accept", "application/json")
        .set("version", node.version)
        .set("nethash", node.config.nethash)
        .set("port", node.config.port)
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, {body}) => {
          console.log(JSON.stringify(body.transaction));
          node.expect(body).to.have.property('success').to.be.true;
          node.expect(body).to.have.property('transaction');

          node.expect(body.transaction.fee).to.equal(transaction.fee);
          node.expect(body.transaction.recipient_id).to.equal('');
          node.expect(body.transaction.type).to.equal(transaction.type);
          node.expect(body.transaction.asset.evidence.type).to.equal(transaction.asset.evidence.type);

          done();
        });
    })
  })
})

//
describe('PUT /api/evidences/new', () => {

  it('Using valid parameters. Should be ok', done => {
    const ipid = node.randomIpId();
    evidence = {
      "ipid": node.randomIpId(),
      "title": "test",
      "description": `${ipid} has been evidence.`,
      "hash": "f082022ee664008a1f15d62514811dfd",
      "author": "Evanlai",
      "size": "2008kb",
      "type": "html",
      "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
      "tags": "world,cup,test"
    }

    node.api.put('/evidences/new')
      .set('Accept', 'application/json')
      .send({
        secret: node.Gaccount.password,
        ipid: evidence.ipid,
        "title": evidence.title,
        "description": evidence.description,
        "hash": evidence.hash,
        "author": evidence.author,
        "size": evidence.size,
        "type": evidence.type,
        "url": evidence.url,
        "tags": evidence.tags
    })
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, {body}) => {
        console.log(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.true;
        node.expect(body).to.have.property('transactionId');
        done();
      });
  });
})
