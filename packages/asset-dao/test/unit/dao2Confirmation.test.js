const DEBUG = require('debug')('dao');
import node from '../node';

const Account1 = node.randomTxAccount();
const Account2 = node.randomTxAccount();
let transaction;
let confirmation;

describe('Confirmations Test', () => {

    node.ddn.init();

    let orgId = "";
    let contributionTrsId = "";
    let contributionPrice = "0";

    before((done) => {
        const getOrgIdUrl = `/org/address/${node.Gaccount.address}`;
        node.api.get(getOrgIdUrl)
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));

                node.expect(body).to.have.property("success").to.be.true;

                if (body.success) {
                    orgId = body.data.org.org_id;
                    // orgId = res.body.orgId;
                }
            });

        const getContributionTrsIdUrl = `/contribution/list?received_address=${node.Gaccount.address}&pagesize=1`;
        node.api.get(getContributionTrsIdUrl)
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));

                node.expect(body).to.have.property("success").to.be.true;

                if (body.success) {
                    contributionTrsId = body.data.rows[0].transaction_id;
                    // contributionTrsId = res.body.data.rows[0].transactionId;
                    contributionPrice = body.data.rows[0].price;
                }

                done();
            });
    });

    it("POST peers/transactions", (done) => {
        node.onNewBlock(async (err) => {
            node.expect(err).to.be.not.ok;

            const state = (Math.random() * 100).toFixed(0) % 2;

            confirmation = {
                sender_address: node.Gaccount.address,
                received_address: node.Daccount.address,
                url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                contribution_trs_id: contributionTrsId, //fixme 确保每次运行都是新的投稿id，才能通过测试
                state,
                amount: state == 1 ? contributionPrice : "0",
                recipient_id: state == 1 ? node.Daccount.address : "",
            };

            // transaction = createConfirmation(confirmation, node.Gaccount.password, null, contributionPrice);
            transaction = await node.ddn.assetPlugin.createPluginAsset(43, confirmation, node.Gaccount.password);
            await new Promise((resolve, reject) => {
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
                        if (err) {
                            return reject(err);
                        }

                        // console.log(JSON.stringify(res.body));

                        node.expect(body).to.have.property("success").to.be.true;

                        resolve();
                    });
            })

            done();
        });
    });

    it("PUT /api/confirmation should be already confirmed ok", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const state = (Math.random() * 100).toFixed(0) % 2;

            confirmation = {
                url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                contributionTrsId,
                state,
                secret: node.Gaccount.password
            }

            node.api.put("/confirmation")
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .send(confirmation)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));

                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error").to.contain("The contribution has been confirmed");
                    done();
                });
        });
    })

    it("GET /api/confirmation/:orgId/list", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const keys = node.ddn.crypto.getKeys(node.Gaccount.password);

            let reqUrl = `/confirmation/${orgId}/list`;
            reqUrl += `?senderPublicKey=${keys.publicKey}`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    })

    it("GET /api/confirmation/:orgId/list?url", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const keys = node.ddn.crypto.getKeys(node.Daccount.password);

            let reqUrl = `/confirmation/${orgId}/list`;
            reqUrl += `?senderPublicKey=${keys.publicKey}&url=${encodeURIComponent("dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html")}`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    console.log(JSON.stringify(body));

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    })

});
