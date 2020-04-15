/**
 * passed
 */
import node from "@ddn/node-sdk/lib/test";

import crypto from "crypto";
import DdnUtils from '@ddn/utils';

const account = node.randomAccount();
const account2 = node.randomAccount();

describe("POST /peer/transactions", () => {

    beforeAll(done => {
        node.ddn.init();
        done();
    })

    describe("Enabling second passphrase", () => {

        it("When accounts has no funds. Should fail", async done => {
            const transaction = await node.ddn.signature.createSignature(node.randomPassword(), node.randomPassword());
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
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    done();
                });
        });

        it("When accounts has funds. Should be ok.", done => {
            node.api.post("/accounts/open")
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .send({
                    secret: account.password
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    account.address = body.account.address;
                    node.api.put("/transactions")
                        .set("Accept", "application/json")
                        .set("version", node.version)
                        .set("nethash", node.config.nethash)
                        .set("port", node.config.port)
                        .send({
                            secret: node.Gaccount.password,

                            // Testing 1 delegate registration + 1 transaction sending 1DDN
                            amount: DdnUtils.bignum.plus(node.Fees.secondPasswordFee, 100000000).toString(),
                            recipientId: account.address
                        })
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .end((err, {body}) => {
                            // console.log(JSON.stringify(body));
                            node.expect(body).to.have.property("success").to.be.true;
                            node.onNewBlock(async err => {
                                node.expect(err).to.be.not.ok;
                                const transaction = await node.ddn.signature.createSignature(account.password, account.secondPassword);
                                transaction.fee = node.Fees.secondPasswordFee;
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
                                        // console.log(account.address);
                                        // console.log(transaction);
                                        console.log(body);
                                        node.expect(body).to.have.property("success").to.be.true;
                                        // node.onNewBlock();
                                        done()
                                    });
                            });

                        });
                });
        });

    });
});

describe("POST /peer/transactions", () => {

    describe("Sending normal transaction with second passphrase now enabled", () => {

        it("When account doesn't have a second passphrase. Should fail", async done => {
            const transaction = await node.ddn.transaction.createTransaction("1", 1, node.Gaccount.password, account.secondPassword);
            node.peer.post("/transactions")
                .set("Accept", "application/json")
                .set("version",node.version)
                .set("nethash", node.config.nethash)
                .set("port",node.config.port)
                .send({
                    transaction
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    done();
                });
        });

        it("Using blank second signature. Should fail", async done => {
            const transaction = await node.ddn.transaction.createTransaction("1", 1, account.password, ""); // Send 1 DDN to address 1L
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
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    done();
                });
        });

        it("Using fake second signature. Should fail", async done => {
            const transaction = await node.ddn.transaction.createTransaction("1", 1, account.password, account2.secondPassword); // Send 1 DDN to address 1L
            transaction.signSignature = crypto.randomBytes(64).toString("hex");
            transaction.id = await node.ddn.crypto.getId(transaction);
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
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    done();
                });
        });

        it.skip("Using valid second signature. Should be ok", async done => {
            const transaction = await node.ddn.transaction.createTransaction("1", 1, account.password, account.secondPassword); // Send 1 DDN to address 1L
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
                    // console.log(JSON.stringify(body));
                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });

    });
});
