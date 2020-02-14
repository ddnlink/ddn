import DdnUtils from '@ddn/utils';
import node from "./../variables.js";

const account = node.randomAccount();
const voterAccount = node.randomAccount();

let delegate1;
let delegate2;
node.chai.config.includeStack = true;

describe("POST /peer/transactions", () => {

    before(done => {
        node.api.post("/accounts/open")
            .set("Accept", "application/json")
            .send({
                secret: voterAccount.password
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.true;
                if (body.success == true && body.account != null) {
                    voterAccount.address = body.account.address;
                    voterAccount.publicKey = body.account.publicKey;
                    voterAccount.balance = body.account.balance;
                } else {
                    console.log("Unable to open voterAccount, tests will fail");
                    console.log(`Data sent: secret: ${voterAccount.password} , secondSecret: ${voterAccount.secondPassword}`);
                    node.expect("TEST").to.equal("FAILED");
                }

                // Send random DDN amount from genesis account to Random account
                node.api.put("/transactions")
                    .set("Accept", "application/json")
                    .send({
                        secret: node.Gaccount.password,
                        amount: node.RANDOM_COIN,
                        recipientId: voterAccount.address
                    })
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end((err, {body}) => {
                        console.log(JSON.stringify(body));
                        node.expect(body).to.have.property("success").to.be.true;
                        node.expect(body).to.have.property("transactionId");
                        if (body.success == true && body.transactionId != null) {
                            // node.expect(res.body.transactionId).to.be.above(1);
                            node.expect(body.transactionId).to.be.a('string');
                            //DdnUtils.bignum update voterAccount.amount += node.RANDOM_COIN;
                            voterAccount.amount = DdnUtils.bignum.plus(voterAccount.amount, node.RANDOM_COIN).toString();
                        } else {
                            // console.log("Transaction failed or transactionId is null");
                            // console.log("Sent: secret: " + node.Gaccount.password + ", amount: " + node.RANDOM_COIN + ", recipientId: " + voterAccount.address);
                            node.expect("TEST").to.equal("FAILED");
                        }
                        node.onNewBlock(done);
                    });
            });
    });

    before(done => {
        node.api.get("/delegates/")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                node.expect(body).to.have.property("success").to.be.true;
                delegate1 = body.delegates[0].public_key;
                delegate2 = body.delegates[1].public_key;
                const votes = [];
                votes.push(`+${delegate1}`);
                votes.push(`+${delegate2}`);
                const transaction = node.ddn.vote.createVote(votes, voterAccount.password);
                // console.log('createVote transaction', transaction);
                if (transaction !== null) {
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
                            console.log("Sent vote fix for delegates");
                            console.log(`Sent: ${JSON.stringify(transaction)} Got reply: ${JSON.stringify(body)}`);
                            node.expect(body).to.have.property("success").to.be.true;
                            done();
                        });
                } else {
                    done();
                }
            });
    });

    it("Voting twice for a delegate. Should fail", done => {
        node.onNewBlock(err => {
            const transaction = node.ddn.vote.createVote([`+${delegate1}`], voterAccount.password);
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
                    // console.log("Sending POST /transactions with data: " + JSON.stringify(transaction) + " Got reply: " + JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    done();
                });
        });
    });

    it("Removing votes from a delegate. Should be ok", done => {
        const transaction = node.ddn.vote.createVote([`-${delegate1}`], voterAccount.password);
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
                node.expect(body).to.have.property("success").to.be.true;
                done();
            });
    });

    it("Removing votes from a delegate and then voting again. Should fail", done => {
        node.onNewBlock(err => {
            const transaction = node.ddn.vote.createVote([`-${delegate2}`], voterAccount.password);
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
                    // console.log("Sent POST /transactions with data:" + JSON.stringify(transaction) + "! Got reply:" + JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.true;
                    const transaction2 = node.ddn.vote.createVote([`+${delegate2}`], voterAccount.password);
                    node.peer.post("/transactions")
                        .set("Accept", "application/json")
                        .set("version", node.version)
                        .set("nethash", node.config.nethash)
                        .set("port", node.config.port)
                        .send({
                            transaction: transaction2
                        })
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .end((err, {body}) => {
                            // console.log("Sent POST /transactions with data: " + JSON.stringify(transaction2) + "!. Got reply: " + res.body);
                            node.expect(body).to.have.property("success").to.be.false;
                            done();
                        });
                });
        });
    });

    // Not right test, because sometimes new block comes and we don't have time to vote
    it("Registering a new delegate. Should be ok", done => {
        node.api.post("/accounts/open")
            .set("Accept", "application/json")
            .set("version",node.version)
            .set("nethash", node.config.nethash)
            .set("port",node.config.port)
            .send({
                secret: account.password
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                if (body.success == true && body.account != null){
                    account.address = body.account.address;
                    account.publicKey = body.account.publicKey;
                } else {
                    // console.log("Open account failed or account object is null");
                    node.expect(true).to.equal(false);
                    done();
                }
                node.api.put("/transactions")
                    .set("Accept", "application/json")
                    .set("version",node.version)
                    .set("nethash", node.config.nethash)
                    .set("port",node.config.port)
                    .send({
                        secret: node.Gaccount.password,

                        //DdnUtils.bignum update amount: node.Fees.delegateRegistrationFee + node.Fees.voteFee,
                        amount: DdnUtils.bignum.plus(node.Fees.delegateRegistrationFee, node.Fees.voteFee),

                        recipientId: account.address
                    })
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end((err, res) => {
                        node.onNewBlock(err => {
                            node.expect(err).to.be.not.ok;
                            account.username = node.randomDelegateName().toLowerCase();
                            const transaction = node.ddn.delegate.createDelegate(account.username, account.password);
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
                                    node.expect(body).to.have.property("success").to.be.true;
                                    done();
                                });
                        });
                    });
            });
    });

    it("Voting for a delegate. Should be ok", done => {
        const transaction = node.ddn.vote.createVote([`+${account.publicKey}`], account.password);
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;
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
                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });
});
