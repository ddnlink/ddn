var DEBUG = require('debug')('dao')
var node = require('../../variables.js')

var Account1 = node.randomTxAccount();
var Account2 = node.randomTxAccount();
var transaction, evidence;

var createEvidence = node.ddn.evidence.createEvidence;

describe('Test evidence', () => {

  before(function (done) {
    const ipid = node.randomIpId();
    evidence = {
      "ipid": ipid,
      "title": node.randomUsername(),
      "description": ipid + " has been evidence.",
      "hash": "f082022ee664008a1f15d62514811dfd",
      "author": "Evanlai",
      "size": "2448kb",
      "type": "html",
      "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
      "tags": "world,cup,test"
    }

    done();
  })

  it("CreateEvidence Should be ok", function (done) {
    transaction = createEvidence(evidence, node.Gaccount.password);

    node.peer.post("/transactions")
      .set("Accept", "application/json")
      .set("version", node.version)
      .set("nethash", node.config.nethash)
      .set("port", node.config.port)
      .send({
        transaction: transaction
      })
      .expect("Content-Type", /json/)
      .expect(200)
      .end(function (err, res) {
        console.log(JSON.stringify(res.body));
        node.expect(res.body).to.have.property("success").to.be.true;
        done();
      });
  });

  it('Get /evidence/:ipid should be ok', function (done) {
    node.onNewBlock(function (err) {
      node.api.get("/evidence/" + evidence.ipid)
        .set("Accept", "application/json")
        .set("version", node.version)
        .set("nethash", node.config.nethash)
        .set("port", node.config.port)
        .expect("Content-Type", /json/)
        .expect(200)
        .end(function (err, res) {
          console.log(JSON.stringify(res.body.transaction));
          node.expect(res.body).to.have.property('success').to.be.true;
          node.expect(res.body).to.have.property('transaction');

          node.expect(res.body.transaction.fee).to.equal(transaction.fee);
          node.expect(res.body.transaction.recipient_id).to.equal('');
          node.expect(res.body.transaction.type).to.equal(transaction.type);
          node.expect(res.body.transaction.asset.evidence.type).to.equal(transaction.asset.evidence.type);

          done();
        });
    })
  })
})

//
describe('PUT /api/evidence/new', function () {

  it('Using valid parameters. Should be ok', function (done) {
    const ipid = node.randomIpId();
    evidence = {
      "ipid": node.randomIpId(),
      "title": "test",
      "description": ipid + " has been evidence.",
      "hash": "f082022ee664008a1f15d62514811dfd",
      "author": "Evanlai",
      "size": "2008kb",
      "type": "html",
      "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
      "tags": "world,cup,test"
    }

    node.api.put('/evidence/new')
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
    .end(function (err, res) {
        console.log(JSON.stringify(res.body));
        node.expect(res.body).to.have.property('success').to.be.true;
        node.expect(res.body).to.have.property('transactionId');
        done();
      });
  });
})
