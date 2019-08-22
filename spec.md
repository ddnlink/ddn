{"success":false,"error":"Org daoaiohdsdbnpm being process for apply"}
{"success":true,"transactionId":"0c9a79c144d349938c468466f6ac615f9079b4baf0da0f3bafc82016452cb820"}
DAOAIOHDsdbNpM
{"success":false,"error":"Org DAOAIOHDsdbNpM not find"}
{"success":false,"error":"Invalid parameters: should NOT be longer than 20 characters"}
{"success":false,"error":"Insufficient balance: DqLGmWLxtawABxgBrcn5Zmg86v3Aq9Jnb"}
{"success":false,"error":"confirmation not found: c3aa16a7b2bf226302926393586b4d207a7d7b2f2c7d83094e15914c33b29fb1"}
{"success":false,"error":"Invalid parameters \"orgId\" format"}
{"success":false,"error":"Invalid parameters \"orgId\" format"}
{"success":false,"error":"Invalid parameters \"orgId\" format"}
{"success":true,"transactionId":"4033850bd24e214a810fa6e6505c0acf7b2b73eb4b3b94e245abb871b7794a9f"}
{"success":false,"error":"Invalid parameters \"orgId\" format"}
{"success":false,"error":"Invalid parameters \"orgId\" format"}
{"success":false,"error":"Invalid parameters \"orgId\" format"}◊
{"success":true,"transactionId":"8106197ceeb95834a57ab8d9c09bd9a545b8fb9278625f161cc52e0fa3e8de4e"}
{"success":false,"error":"Failed to verify signature, 5"}
# TOC
   - [Test Dao](#test-dao)
     - [Using valid parameters, should be ok.](#test-dao-using-valid-parameters-should-be-ok)
     - [Using invalid parameters, should be fail.](#test-dao-using-invalid-parameters-should-be-fail)
   - [Confirmations Test](#confirmations-test)
   - [Contributions Test](#contributions-test)
   - [Test evidence](#test-evidence)
   - [PUT /api/evidence/new](#put-apievidencenew)
   - [Test Exchange](#test-exchange)
<a name=""></a>
 
<a name="test-dao"></a>
# Test Dao
<a name="test-dao-using-valid-parameters-should-be-ok"></a>
## Using valid parameters, should be ok.
post /peer/transactions to create a orgId is ok..

```js
const orgs = {
  "orgId": node.randomOrgId(),
  "name": node.randomUsername(),
  "state": 0,
  "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
  "tags": "world,cup,test"
}
const transaction = createOrg(orgs, Gaccount.password);
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
    // console.log(JSON.stringify(res.body));
    node.expect(res.body).to.have.property("success").to.be.true;
    done();
  });
```

PUT /api/dao to create a orgId is ok.

```js
node.api.put('/dao')
  .set('Accept', 'application/json')
  .send({
    secret: Gaccount.password,
    orgId: org.orgId,
    name: org.name,
    url: org.url,
    state: 0,
    tags: org.tags
  })
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function (err, res) {
    // console.log(JSON.stringify(res.body));
    node.expect(res.body).to.have.property('success').to.be.true;
    node.expect(res.body).to.have.property('transactionId');
    done();
  });
```

Put api/dao to update the orgId`s name in 10s is fails.

```js
node.api.put('/dao')
  .set('Accept', 'application/json')
  .send({
    secret: Gaccount.password,
    orgId: org.orgId,
    name: node.randomUsername(),
    state: 1,
  })
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function (err, res) {
    console.log(JSON.stringify(res.body));
    node.expect(res.body).to.have.property('success').to.be.false;
    node.expect(res.body).to.have.property('error');
    done();
  });
```

Put api/dao to update the orgId`s name in a new block is ok.

```js
node.onNewBlock(function (err) {
  node.api.put('/dao')
  .set('Accept', 'application/json')
  .send({
    secret: Gaccount.password,
    orgId: org.orgId,
    name: node.randomUsername(),
    state: 1,
  })
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function (err, res) {
    console.log(JSON.stringify(res.body));
    node.expect(res.body).to.have.property('success').to.be.true;
    // node.expect(res.body).to.have.property('error');
    done();
  });
})
```

<a name="test-dao-using-invalid-parameters-should-be-fail"></a>
## Using invalid parameters, should be fail.
 "orgId" more than 20, should be fails. .

```js
node.api.put('/dao')
  .set('Accept', 'application/json')
  .send({
    secret: Gaccount.password,
    orgId: org.orgId + "asdefasdfs123456789M",
    name: org.name,
    url: org.url,
    state: org.state,
    tags: org.tags
  })
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function (err, res) {
    console.log(JSON.stringify(res.body));
    node.expect(res.body).to.have.property('success').to.be.false;
    node.expect(res.body.error).to.equal("Invalid parameters: should NOT be longer than 20 characters");
    done();
  });
```

 Fee is less, should be fails. .

```js
node.api.put('/dao')
  .set('Accept', 'application/json')
  .send({
    secret: node.Eaccount.password,
    orgId: org.orgId,
    name: org.name,
    url: org.url,
    state: org.state,
    tags: org.tags
  })
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function (err, res) {
    console.log(JSON.stringify(res.body));
    node.expect(res.body).to.have.property('success').to.be.false;
    node.expect(res.body.error).to.include("Insufficient balance");
    done();
  });
```

<a name="confirmations-test"></a>
# Confirmations Test
<a name="contributions-test"></a>
# Contributions Test
POST /transactions.

```js
contribution = {
    title: "来自/transactions",
    senderAddress: node.Gaccount.address,
    receivedAddress: node.Eaccount.address,
    url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
    price: "0"
}
transaction = createContribution(contribution, node.Gaccount.password);
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
```

<a name="test-evidence"></a>
# Test evidence
CreateEvidence Should be ok.

```js
evidence = {
      "ipid": "IPIDasdf2018050122107ed",
      "title": "test",
      "hash": "f082022ee664008a1f15d62514811dfd",
      "author": "Evanlai",
      "size": "2448kb",
      "type": "html",
      "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
      "tags": "world,cup,test"
    }
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
```

<a name="put-apievidencenew"></a>
# PUT /api/evidence/new
Using valid parameters. Should be ok.

```js
evidence = {
  "ipid": "IPIDasdf2018050122133ed",
  "title": "test",
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
    secret: "horse dinosaur brand october spoon news install tongue token pig napkin leg",
    ipid: evidence.ipid,
    "title": evidence.title,
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
    // console.log(JSON.stringify(res.body));
    node.expect(res.body).to.have.property('success').to.be.true;
    node.expect(res.body).to.have.property('transactionId');
    done();
});
```

<a name="test-exchange"></a>
# Test Exchange
