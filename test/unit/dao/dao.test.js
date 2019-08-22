const DEBUG = require('debug')('dao')
const node = require('../../variables.js')

const Gaccount = node.Gaccount;
// const createOrg = node.ddn.dao.createOrg;
// fix 接口没有了，需要写到ddn-dao包中，无法确定正确写法
describe('Test Dao', () => {

    describe('post /peer/transactions', () => {

        // 加载插件
        node.ddn.init.init();

        // Common api
        it("Using valid parameters to create a orgId is ok.", async () => {
            const orgs = {
                "org_id": node.randomOrgId().toLowerCase(),
                // "orgId": node.randomOrgId(),
                "name": node.randomUsername(),
                "state": 0,
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "tags": "world,cup,test",
                "address": Gaccount.address
            }

            // const transaction = createOrg(orgs, Gaccount.password);
            const transaction = await node.ddn.assetPlugin.createPluginAsset(40, orgs, Gaccount.password)
            await new Promise((resolve, reject) => {
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

                        if (err) {
                            return reject(err);
                        }

                        node.expect(res.body).to.have.property("success").to.be.true;

                        resolve();
                    });
            })
        });

        // Common api
        it("Fee is less to create a orgId is fail.", async () => {
            const orgs = {
                "org_id": node.randomOrgId().toLowerCase(),
                // "orgId": node.randomOrgId(),
                "name": node.randomUsername(),
                "state": 0,
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "tags": "world,cup,test",
                "address": node.Eaccount.address
            }
            const transaction = await node.ddn.assetPlugin.createPluginAsset(40, orgs, node.Eaccount.password)
            await new Promise((resolve, reject) => {
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
                        if (err) {
                            return reject(err);
                        }

                        // console.log(JSON.stringify(res.body));
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body.error).to.include("Insufficient balance");

                        resolve();
                    });
            });
        });

    })
    // special api
    describe('PUT /api/org to create a orgId', () => {
        let org;

        before(function (done) {
            org = {
                "org_id": node.randomOrgId(),
                // "orgId": node.randomOrgId(),
                "name": node.randomUsername(),
                "state": 0, // Default to create
                "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                "tags": "world,cup,test"
            }

            done();
        })

        it('Using valid parameters, should be ok.', function (done) {
            node.api.put('/org')
                .set('Accept', 'application/json')
                .send({
                    secret: Gaccount.password,
                    orgId: org.org_id,
                    // orgId: org.orgId,
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
        });

        // Update name
        it('Update the Org`s name in the save 10s is fails', function (done) {
            node.api.put('/org')
                .set('Accept', 'application/json')
                .send({
                    secret: Gaccount.password,
                    orgId: org.org_id,
                    // orgId: org.orgId,
                    name: node.randomUsername(),
                    state: 1,
                    tags: org.tags
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    // console.log(JSON.stringify(res.body));
                    node.expect(res.body).to.have.property('success').to.be.false;
                    node.expect(res.body).to.have.property('error');
                    done();
                });
        });

        it('Get /org/orgid/:orgId should be ok if Org`s name is not modified', function (done) {
            node.onNewBlock(function (err) {
                node.expect(err).to.be.not.ok;
                node.api.get("/org/orgid/" + org.org_id.toLowerCase())
                    // node.api.get("/dao/" + org.orgId)
                    .set("Accept", "application/json")
                    .set("version", node.version)
                    .set("nethash", node.config.nethash)
                    .set("port", node.config.port)
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end(function (err, res) {
                        // console.log(JSON.stringify(res.body));

                        node.expect(res.body).to.have.property('success').to.be.true;
                        node.expect(res.body).to.have.property("data").that.is.an("object");
                        node.expect(res.body.data).to.have.property("org").that.is.an("object");

                        node.expect(res.body.data.org).to.have.property('transaction_id');
                        node.expect(res.body.data.org).to.have.property('org_id');

                        node.expect(res.body.data.org.org_id).to.equal(org.org_id.toLowerCase());
                        // node.expect(res.body.org.org_id).to.equal(org.orgId.toLowerCase());
                        node.expect(res.body.data.org.name).to.equal(org.name);
                        node.expect(res.body.data.org.state).to.equal(org.state);
                        // node.expect(res.body).to.have.property('balance');
                        // node.expect(res.body).to.have.property('unconfirmedBalance');

                        done();
                    });
            });
        });

        it('Update the Org`s name in a new block is ok', function (done) {
            node.onNewBlock(function (err) {
                const name = node.randomUsername();
                node.api.put('/org')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Gaccount.password,
                        orgId: org.org_id,
                        // orgId: org.orgId,
                        name: name,
                        state: 1,
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
            })
        });

        it('Get /org/orgid/:orgId should be ok if Org`s name has been modified', function (done) {
            node.onNewBlock(function (err) {
                node.expect(err).to.be.not.ok;
                node.api.get("/org/orgid/" + org.org_id.toLowerCase())
                    // node.api.get("/dao/" + org.orgId)
                    .set("Accept", "application/json")
                    .set("version", node.version)
                    .set("nethash", node.config.nethash)
                    .set("port", node.config.port)
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end(function (err, res) {
                        // console.log(JSON.stringify(res.body));

                        node.expect(res.body).to.have.property('success').to.be.true;
                        node.expect(res.body).to.have.property("data").that.is.an("object");
                        node.expect(res.body.data).to.have.property("org").that.is.an("object");

                        node.expect(res.body.data.org).to.have.property('transaction_id');
                        node.expect(res.body.data.org).to.have.property('org_id');

                        node.expect(res.body.data.org.org_id).to.equal(org.org_id.toLowerCase());
                        // node.expect(res.body.org.org_id).to.equal(org.orgId.toLowerCase());
                        node.expect(res.body.data.org.name).to.not.equal(org.name); // name 已经更改
                        node.expect(res.body.data.org.state).to.equal(1);
                        node.expect(res.body.data.org.state).to.not.equal(org.state);
                        // node.expect(res.body).to.have.property('balance');
                        // node.expect(res.body).to.have.property('unconfirmedBalance');

                        done();
                    });
            });
        })

        it('Update the orgId`s tags in a new block is ok', function (done) {
            node.onNewBlock(function (err) {
                node.api.put('/org')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Gaccount.password,
                        orgId: org.org_id.toLowerCase(),
                        // orgId: org.orgId,
                        // name: node.randomUsername(),
                        tags: org.tags + ", add",
                        state: 1,
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        // console.log(JSON.stringify(res.body));
                        node.expect(res.body).to.have.property('success').to.be.true;
                        node.expect(res.body).to.have.property('transactionId');
                        done();
                    });
            })
        });

        it(' "orgId" more than 20, should be fails. ', function (done) {
            node.api.put('/org')
                .set('Accept', 'application/json')
                .send({
                    secret: Gaccount.password,
                    orgId: org.org_id + "asdefasdfs123456789M",
                    // orgId: org.orgId + "asdefasdfs123456789M",
                    name: org.name,
                    url: org.url,
                    state: org.state,
                    tags: org.tags
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    // console.log(JSON.stringify(res.body));
                    node.expect(res.body).to.have.property('success').to.be.false;
                    node.expect(res.body.error).to.equal("Invalid parameters: should NOT be longer than 20 characters");
                    done();
                });
        })

        it('Fee is less, should be fails. ', function (done) {
            node.api.put('/org')
                .set('Accept', 'application/json')
                .send({
                    secret: node.Eaccount.password,
                    orgId: node.randomOrgId(),
                    // orgId: node.randomOrgId(),
                    name: org.name,
                    url: org.url,
                    state: org.state,
                    tags: org.tags
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    // console.log(JSON.stringify(res.body));
                    node.expect(res.body).to.have.property('success').to.be.false;
                    node.expect(res.body.error).to.include("Insufficient balance");
                    done();
                });
        });

        // it('Using valid parameters. Should be ok', function (done) {
        //     node.onNewBlock(function (err) {
        //         node.expect(err).to.be.not.ok;
        //         var amountToSend = 100000000;
        //         node.api.put('/transactions')
        //             .set('Accept', 'application/json')
        //             .send({
        //                 secret: Account1.password,
        //                 amount: amountToSend,
        //                 recipientId: Account2.address
        //             })
        //             .expect('Content-Type', /json/)
        //             .expect(200)
        //             .end(function (err, res) {
        //                 // console.log(JSON.stringify(res.body));
        //                 node.expect(res.body).to.have.property('success').to.be.true;
        //                 node.expect(res.body).to.have.property('transactionId');
        //                 if (res.body.success == true && res.body.transactionId != null) {
        //                     expectedFee = node.expectedFee(amountToSend);
        //                     Account1.balance -= (amountToSend + expectedFee);
        //                     Account2.balance += amountToSend;
        //                     Account1.transactions.push(transactionCount);
        //                     transactionList[transactionCount] = {
        //                         'sender': Account1.address,
        //                         'recipient': Account2.address,
        //                         'brutoSent': (amountToSend + expectedFee) / node.normalizer,
        //                         'fee': expectedFee / node.normalizer,
        //                         'nettoSent': amountToSend / node.normalizer,
        //                         'txId': res.body.transactionId,
        //                         'type': node.TxTypes.SEND
        //                     }
        //                     transactionCount += 1;
        //                 } else {
        //                     // console.log('Failed Tx or transactionId is null');
        //                     // console.log('Sent: secret: ' + Account1.password + ', amount: ' + amountToSend + ', recipientId: ' + Account2.address);
        //                     node.expect('TEST').to.equal('FAILED');
        //                 }
        //                 done();
        //             });
        //     });
        // });
    }) // end describe

    describe('GET api/dao', () => {
        it('No params should be ok', done => {
            node.api.get("/org/list")
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    // console.log(JSON.stringify(res.body));

                    node.expect(res.body).to.have.property('success').to.be.true;

                    node.expect(res.body).to.have.property("data").that.is.an("object");

                    node.expect(res.body.data).to.have.property('rows').that.is.an("array");
                    node.expect(res.body.data).to.have.property('total');

                    done();
                });
        });

        it('Given filter should be ok', done => {
            node.api.get("/org/list?pagesize=10&pageindex=1")
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    // console.log(JSON.stringify(res.body));

                    node.expect(res.body).to.have.property('success').to.be.true;

                    node.expect(res.body).to.have.property("data").that.is.an("object");

                    node.expect(res.body.data).to.have.property('rows').that.is.an("array");
                    node.expect(res.body.data).to.have.property('total');

                    done();
                });
        });
    })

})
