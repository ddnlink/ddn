// passed
import Debug from 'debug';
import node from '@ddn/node-sdk/lib/test';

const debug = Debug('debug');

async function createTransfer(address, amount, secret, second_secret) {
    return await node.ddn.transaction.createTransaction(address, amount, null, secret, second_secret)
}

// 投稿
describe('Contributions Test', () => {
    let transaction;
    let contribution;
    
    let orgId = "";

    beforeAll(async (done) => {

        const transaction = await createTransfer(node.Daccount.address, 10000000000, node.Gaccount.password);
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
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body))
                node.expect(err).to.be.not.ok;
                node.expect(body).to.have.property("success").to.be.true;
                done();
            });

        const getOrgIdUrl = `/dao/orgs/address/${node.Gaccount.address}`;
        node.api.get(getOrgIdUrl)
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body));
                node.expect(err).to.be.not.ok;
                node.expect(body).to.have.property("success").to.be.true;

                if (body.success) {
                    orgId = body.data.org.orgId;
                }

                done();
            });
    });

    it("POST peers/transactions", async (done) => {
        await node.onNewBlockAsync();

        contribution = {
            title: "from /transactions",
            sender_address: node.Daccount.address,
            received_address: node.Gaccount.address,
            url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
            price: "0"
        }

        transaction = await node.ddn.assetPlugin.createPluginAsset(42, contribution, node.Daccount.password);
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
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body));
                node.expect(err).to.be.not.ok;

                node.expect(body).to.have.property("success").to.be.true;

                done();
            });
    });

    it("PUT /api/dao/contributions/:orgId", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            contribution = {
                title: "from /contributions",
                url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                price: `${(Math.random() * 100).toFixed(0) * 100000000}`,
                secret: node.Daccount.password
            }

            node.api.put(`/dao/contributions/${orgId}`)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .send(contribution)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug(JSON.stringify(body));
                    node.expect(err).to.be.not.ok;

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });

    it("GET /api/dao/contributions", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            let reqUrl = "/dao/contributions";
            reqUrl += `?sender_address=${node.Daccount.address}`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug(JSON.stringify(body));
                    node.expect(err).to.be.not.ok;

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });

    it("GET /api/dao/contributions/:orgId/list", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const reqUrl = `/dao/contributions/${orgId}/list`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug(JSON.stringify(body));

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });

    it("GET /api/dao/contributions/:orgId/list?url", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const keys = node.ddn.crypto.getKeys(node.Gaccount.password);

            let reqUrl = `/dao/contributions/${orgId}/list`;
            reqUrl += `?senderPublicKey=${keys.publicKey}&url=${encodeURIComponent("dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html")}`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug(JSON.stringify(body));
                    node.expect(err).to.be.not.ok;

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    })

    it("GET /api/dao/contributions", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            let reqUrl = "/dao/contributions";
            reqUrl += `?received_address=${node.Gaccount.address}`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug(JSON.stringify(body));
                    node.expect(err).to.be.not.ok;

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    })

});

// 收稿
describe('Confirmations Test', () => {
    let transaction;
    let confirmation;
    let contribution;
    
    let orgId = "";
    let contributionTrsId = "";
    let contributionPrice = "0";
    
    beforeAll((done) => {
        const getOrgIdUrl = `/dao/orgs/address/${node.Gaccount.address}`;
        node.api.get(getOrgIdUrl)
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug("getOrgIdUrl: ", JSON.stringify(body));

                node.expect(err).to.be.not.ok;
                node.expect(body).to.have.property("success").to.be.true;
                orgId = body.data.org.orgId;
            });

        const getContributionTrsIdUrl = `/dao/contributions?received_address=${node.Gaccount.address}&pagesize=1`;
        node.api.get(getContributionTrsIdUrl)
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug("getContributionTrsIdUrl", JSON.stringify(body));

                node.expect(err).to.be.not.ok;
                node.expect(body).to.have.property("success").to.be.true;

                contributionTrsId = body.data.rows[0].transaction_id;
                contributionPrice = body.data.rows[0].price;

                done();
            });
    });

    // 投稿 contribution
    it("POST peers/transactions to contribute should be ok", (done) => {
        node.onNewBlock(async (err) => {
            node.expect(err).to.be.not.ok;

            const state = (Math.random() * 100).toFixed(0) % 2;

            contribution = {
                sender_address: node.Gaccount.address,
                received_address: node.Daccount.address,
                url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                contribution_trs_id: contributionTrsId, //fixme 确保每次运行都是新的投稿id，才能通过测试
                state,
                amount: state == 1 ? contributionPrice : "0",
                recipientId: state == 1 ? node.Daccount.address : "",
            };

            transaction = await node.ddn.assetPlugin.createPluginAsset(43, contribution, node.Gaccount.password);
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
                .end((err, {
                    body
                }) => {
                    debug(JSON.stringify(body));

                    node.expect(err).to.be.not.ok;
                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });

    // 
    it("PUT /api/dao/contributions/${orgId} should be already confirmed ok", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const state = (Math.random() * 100).toFixed(0) % 2;

            confirmation = {
                title: 'test title',
                url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                contributionTrsId,
                state,
                secret: node.Gaccount.password
            }

            node.api.put(`/dao/contributions/${orgId}`)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .send(confirmation)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug("", JSON.stringify(body));
                    node.expect(err).to.be.not.ok;

                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error").to.contain("The contribution has been confirmed");
                    done();
                });
        });
    })

    it("GET /api/dao/contributions/:orgId/list", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const keys = node.ddn.crypto.getKeys(node.Gaccount.password);

            let reqUrl = `/dao/contributions/${orgId}/list`;
            reqUrl += `?senderPublicKey=${keys.publicKey}`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug(JSON.stringify(body));
                    node.expect(err).to.be.not.ok;

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    })

    it("GET /api/dao/contributions/:orgId/list?url", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const keys = node.ddn.crypto.getKeys(node.Daccount.password);

            let reqUrl = `/dao/contributions/${orgId}/list`;
            reqUrl += `?senderPublicKey=${keys.publicKey}&url=${encodeURIComponent("dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html")}`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug(JSON.stringify(body));
                    node.expect(err).to.be.not.ok;
                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    })

});