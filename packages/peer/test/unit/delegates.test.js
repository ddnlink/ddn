/**
 * passed
 */
import Debug from 'debug';
import DdnUtils from '@ddn/utils';
import node from "@ddn/node-sdk/lib/test";

const debug = Debug('delegates');

let Raccount = node.randomAccount();
while (Raccount.username === Raccount.username.toUpperCase()) {
    Raccount = node.randomAccount();
}

const R2account = node.randomAccount();
R2account.username = Raccount.username.toUpperCase();

beforeAll(async () => {
    const res = await node.openAccountAsync({ secret: Raccount.password });
    debug('open account response', res.body)
    node.expect(res.body).to.have.property("success").to.be.true;
    node.expect(res.body).to.have.property("account").that.is.an("object");
    node.expect(res.body.account.balance).to.be.equal(0);
});

describe("PUT /delegates without funds", () => {

    it("Using valid parameters. Should fail", done => {
        node.api.put("/delegates")
            .set("Accept", "application/json")
            .send({
                secret: Raccount.password,
                username: Raccount.username
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                debug('register delegates response', body)
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                // node.expect(res.body.error).to.match(/Insufficient balance:/);
		body.error = "Account not found";
                done();
            });
    });
});

// TODO test 0ddn<account's balance<100ddn

describe("PUT /accounts/delegates without funds", () => {

    it("When upvoting. Should fail", done => {
        node.api.post("/accounts/open")
            .set("Accept", "application/json")
            .send({
                secret: Raccount.password
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("account").that.is.an("object");
                Raccount.address = body.account.address;
                Raccount.public_key = body.account.public_key;
                Raccount.balance = body.account.balance;

                node.onNewBlock(err => {
                    node.expect(err).to.be.not.ok;
                    node.api.put("/accounts/delegates")
                        .set("Accept", "application/json")
                        .send({
                            secret: Raccount.password,
                            delegates: [`+${node.Eaccount.publicKey}`]
                        })
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .end((err, {body}) => {
                            // console.log(JSON.stringify(res.body));
                            node.expect(body).to.have.property("success").to.be.false;
                            node.expect(body).to.have.property("error");
			                body.error = "Account not found";
                            done();
                        });
                });
            });
    });
// TODO test 0ddn<account's balance<100ddn

    it("When downvoting. Should fail", done => {
        node.onNewBlock(err => {
            node.api.put("/accounts/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    delegates: [`-${node.Eaccount.publicKey}`]
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
		            body.error = "Account not found";
                    done();
                });
        });
    });
});

describe("PUT /accounts/delegates with funds", () => {

    beforeAll(done => {
        node.api.put("/transactions")
            .set("Accept", "application/json")
            .send({
                secret: node.Gaccount.password,
                amount: `${node.RANDOM_COIN}`,
                recipientId: Raccount.address
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // debug('give money response', JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("transactionId");
                if (body.success == true && body.transactionId != null) {
                    node.expect(body.transactionId).to.be.a('string');
                    // fixme: Bignumber
                    //DdnUtils.bignum update Raccount.amount += node.RANDOM_COIN;
                    Raccount.amount = DdnUtils.bignum.plus(Raccount.amount, node.RANDOM_COIN).toString();
                } else {
                    // console.log("Transaction failed or transactionId is null");
                    // console.log("Sent: secret: " + node.Gaccount.password + ", amount: " + node.RANDOM_COIN + ", recipientId: " + Raccount.address);
                    node.expect("TEST").to.equal("FAILED");
                }
                done();
            });
    });

    beforeAll(done => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            node.api.post("/accounts/open")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.true;
                    if (body.success == true && body.account != null) {
                        node.expect(`${body.account.balance}`).to.be.equal(node.RANDOM_COIN);
                    } else {
                        // console.log("Failed to open account or account object is null");
                        // console.log("Sent: secret: " + Raccount.password);
                        node.expect("TEST").to.equal("FAILED");
                    }
                    done();
                });
        });
    });

    it("When upvoting same delegate multiple times. Should fail", done => {
        const votedDelegate = `'+${node.Eaccount.publicKey}','+${node.Eaccount.publicKey}'`;
        node.onNewBlock(err => {
            node.api.put("/accounts/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    delegates: [votedDelegate]
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    if (body.success == true) {
                        // console.log("Sent: secret:" + Raccount.password + ", delegates: [" + votedDelegate + "]");
                    }
                    done();
                });
        });
    });

    it("When downvoting same delegate multiple times. Should fail", done => {
        const votedDelegate = `'-${node.Eaccount.publicKey}','-${node.Eaccount.publicKey}'`;
        node.onNewBlock(err => {
            node.api.put("/accounts/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    delegates: [votedDelegate]
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    if (body.success == true) {
                        console.log(`Sent: secret:${Raccount.password}, delegates: [${votedDelegate}]`);
                    }
                    done();
                });
        });
    });

    it("When upvoting and downvoting within same request. Should fail", done => {
        const votedDelegate = `'+${node.Eaccount.publicKey}','-${node.Eaccount.publicKey}'`;

        node.onNewBlock(err => {
            node.api.put("/accounts/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    delegates: [votedDelegate]
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log('upvoting and downvoting within same request',JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    if (body.success == true) {
                        // console.log("Sent: secret:" + Raccount.password + ", delegates: [" + votedDelegate) + "]";
                    }
                    done();
                });
        });
    });

    it("When upvoting. Should be ok", done => {
        node.api.put("/accounts/delegates")
            .set("Accept", "application/json")
            .send({
                secret: Raccount.password,
                delegates: [`+${node.Eaccount.publicKey}`]
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("transaction").that.is.an("object");
                if (body.success == true && body.transaction != null) {
                    node.expect(body.transaction.type).to.equal(node.AssetTypes.VOTE);
                    node.expect(body.transaction.amount).to.equal("0");
                    node.expect(body.transaction.senderPublicKey).to.equal(Raccount.public_key);
                    node.expect(body.transaction.fee).to.equal(node.Fees.voteFee);
                } else {
                    // console.log("Transaction failed or transaction object is null");
                    // console.log("Sent: secret: " + Raccount.password + ", delegates: [+" + node.Eaccount.publicKey + "]");
                    node.expect("TEST").to.equal("FAILED");
                }
                done();
            });
    });

    it("When upvoting again from same account. Should fail", done => {
        node.onNewBlock(err => {
            node.api.put("/accounts/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    delegates: [`+${node.Eaccount.publicKey}`]
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    if (body.success == false && body.error != null) {
                        node.expect(body.error.toLowerCase()).to.contain("already voted");
                    } else {
                        // console.log("Expected error but got success");
                        // console.log("Sent: secret: " + Raccount.password + ", delegates: [+" + node.Eaccount.publicKey + "]");
                        node.expect("TEST").to.equal("FAILED");
                    }
                    done();
                });
        });
    });

    it("When downvoting. Should be ok", done => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;
            node.api.put("/accounts/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    delegates: [`-${node.Eaccount.publicKey}`]
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.true;
                    node.expect(body).to.have.property("transaction").that.is.an("object");
                    if (body.success == true && body.transaction != null) {
                        node.expect(body.transaction.type).to.equal(node.AssetTypes.VOTE);
                        node.expect(body.transaction.amount).to.equal("0");
                        node.expect(body.transaction.senderPublicKey).to.equal(Raccount.public_key);
                        node.expect(body.transaction.fee).to.equal(node.Fees.voteFee);
                    } else {
                        // console.log("Expected success but got error");
                        // console.log("Sent: secret: " + Raccount.password + ", delegates: [-" + node.Eaccount.publicKey + "]");
                        node.expect("TEST").to.equal("FAILED");
                    }
                    done();
                });
        });
    });

    it("When downvoting again from same account. Should fail", done => {
        node.onNewBlock(err => {
            node.api.put("/accounts/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    delegates: [`-${node.Eaccount.publicKey}`]
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    if (body.success == false && body.error != null) {
                        node.expect(body.error.toLowerCase()).to.contain("not voted");
                    } else {
                        // console.log("Expected error but got success");
                        // console.log("Sent: secret: " + Raccount.password + ", delegates: [-" + node.Eaccount.publicKey + "]");
                        node.expect("TEST").to.equal("FAILED");
                    }
                    done();
                });
        });
    });

    it("When upvoting using a blank pasphrase. Should fail", done => {
        node.api.put("/accounts/delegates")
            .set("Accept", "application/json")
            .send({
                secret: "",
                delegates: [`+${node.Eaccount.publicKey}`]
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("When downvoting using a blank pasphrase. Should fail", done => {
        node.api.put("/accounts/delegates")
            .set("Accept", "application/json")
            .send({
                secret: "",
                delegates: [`-${node.Eaccount.publicKey}`]
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("When upvoting without any delegates. Should fail", done => {
        node.onNewBlock(() => {
            node.api.put("/accounts/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    delegates: ["+"]
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    done();
                });
        });
    });

    it("When downvoting without any delegates. Should fail", done => {
        node.onNewBlock(() => {
            node.api.put("/accounts/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    delegates: ["-"]
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    done();
                });
        });
    });

    it("Without any delegates. Should fail", function (done) {
        
        setTimeout(() => {
            node.api.put("/accounts/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    delegates: ""
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    done();
                });
        }, 3000);
    });
});

describe("PUT /delegates with funds", () => {

    beforeAll(done => {
        node.api.post("/accounts/open")
            .set("Accept", "application/json")
            .send({
                secret: R2account.password
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("account").that.is.an("object");
                R2account.address = body.account.address;
                R2account.public_key = body.account.public_key;
                R2account.balance = body.account.balance;

                node.onNewBlock(err => {
                    node.expect(err).to.be.not.ok;
                    node.api.put('/transactions')
                        .set('Accept', 'application/json')
                        .send({
                            secret: node.Gaccount.password,
                            amount: `${node.RANDOM_COIN}`,
                            recipientId: R2account.address
                        })
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end((err, {body}) => {
                            // console.log(JSON.stringify(res.body));
                            node.expect(body).to.have.property("success").to.be.true;
                            node.expect(body).to.have.property("transactionId");
                            if (body.success == true && body.transactionId != null) {
                                node.expect(body.transactionId).to.be.a('string');
                                //DdnUtils.bignum update R2account.amount += node.RANDOM_COIN;
                                R2account.amount = DdnUtils.bignum.plus(R2account.amount, node.RANDOM_COIN).toString();
                            } else {
                                // console.log("Transaction failed or transactionId is null");
                                // console.log("Sent: secret: " + node.Gaccount.password + ", amount: " + node.RANDOM_COIN + ", recipientId: " + R2account.address);
                                node.expect("TEST").to.equal("FAILED");
                            }
                            done();
                        });
                });
            });

        beforeAll(done => {
            node.onNewBlock(err => {
                node.expect(err).to.be.not.ok;
                node.api.post('/accounts/open')
                    .set('Accept', 'application/json')
                    .send({
                        secret: R2account.password
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, {body}) => {
                        // console.log(JSON.stringify(res.body));
                        node.expect(body).to.have.property("success").to.be.true;
                        if (body.success == true && body.account != null) {
                            node.expect(body.account.balance).to.be.equal(`${node.RANDOM_COIN}`);
                        } else {
                            // console.log("Failed to open account or account object is null");
                            // console.log("Sent: secret: " + R2account.password);
                            node.expect("TEST").to.equal("FAILED");
                        }
                        done();
                    });
            });
        });
    });

    it("Using blank pasphrase. Should fail", done => {
        node.api.put("/delegates")
            .set("Accept", "application/json")
            .send({
                secret: "",
                username: Raccount.username
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("Using invalid pasphrase. Should fail", function (done) {
        
        setTimeout(() => {
            node.api.put("/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: [],
                    username: Raccount.username
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    done();
                });
        }, 3000);
    });

    it("Using invalid username. Should fail", function (done) {
        
        setTimeout(() => {
            node.api.put("/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    username: "~!@#$%^&*()_+.,?/"
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    done();
                });
        }, 1000);
    });

    it("Using username longer than 20 characters. Should fail", function (done) {
        
        setTimeout(() => {
            node.api.put("/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    username: "ABCDEFGHIJKLMNOPQRSTU"
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    done();
                });
        }, 1000);
    });

    it("Using blank username. Should fail", function (done) {
        
        setTimeout(() => {
            node.api.put("/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    username: ""
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    done();
                });
        }, 1000);
    });

    it(`Using uppercase username: ${R2account.username}. Should be ok and delegate should be registered in lower case`, done => {
        node.onNewBlock(err => {
            node.api.put('/delegates')
                .set('Accept', 'application/json')
                .send({
                    secret: R2account.password,
                    username: R2account.username
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.true;
                    node.expect(body).to.have.property("transaction").that.is.an("object");
                    if (body.success == true && body.transaction != null) {
                        node.expect(body.transaction.fee).to.equal(node.Fees.delegateRegistrationFee);
                        node.expect(body.transaction.asset.delegate.username).to.equal(R2account.username.toLowerCase());
                        node.expect(body.transaction.asset.delegate.public_key).to.equal(R2account.public_key);
                        node.expect(body.transaction.type).to.equal(node.AssetTypes.DELEGATE);
                        node.expect(body.transaction.amount).to.equal("0");
                    } else {
                        console.log("Transaction failed or transaction object is null");
                        console.log(`Sent: secret: ${Raccount.password}, username: ${Raccount.username}`);
                        node.expect("TEST").to.equal("FAILED");
                    }
                    done();
                });
        });
    });

    it("Using same account. Should fail", done => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;
            node.api.put("/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    username: Raccount.username
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    done();
                });
        });
    });

    it(`Using existing username but different case: ${R2account.username}. Should fail`, done => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;
            // console.log(JSON.stringify({
            //    secret: R2account.password,
            //    username: R2account.username
            // }));
            node.api.put('/delegates')
                .set('Accept', 'application/json')
                .send({
                    secret: R2account.password,
                    username: R2account.username
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error");
                    done();
                });
        });
    });
});

describe("GET /delegates", () => {

    it("Using no parameters. Should be ok", done => {
        const limit = 10;
        const offset = 0;

        node.api.get(`/delegates?limit=${limit}&offset=${offset}&orderBy=vote:asc`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("delegates").that.is.an("array");
                node.expect(body).to.have.property("totalCount").that.is.at.least(0);
                node.expect(body.delegates).to.have.length.of.at.most(limit);
                const num_of_delegates = body.delegates.length;
                // console.log("Limit is " + limit + ". Number of delegates returned is: " + num_of_delegates);
                // console.log("Total Number of delegates returned is: " + res.body.totalCount);
                if (num_of_delegates >= 1) {
                    for (let i = 0; i < num_of_delegates; i++) {
                        if (body.delegates[i + 1] != null) {
                            node.expect(body.delegates[i].vote).to.be.at.most(body.delegates[i + 1].vote);
                            node.expect(body.delegates[i]).to.have.property("username");
                            node.expect(body.delegates[i]).to.have.property("address");
                            node.expect(body.delegates[i]).to.have.property("public_key");
                            node.expect(body.delegates[i]).to.have.property("vote");
                            node.expect(body.delegates[i]).to.have.property("rate");
                            node.expect(body.delegates[i]).to.have.property("productivity");
                        }
                    }
                } else {
                    // console.log("Got 0 delegates");
                    node.expect("TEST").to.equal("FAILED");
                }
                done();
            });
    });

    it("Using valid parameters. Should be ok", done => {
        const limit = 20;
        const offset = 10;

        node.api.get(`/delegates?limit=${limit}&offset=${offset}&orderBy=rate:desc`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("delegates").that.is.an("array");
                node.expect(body).to.have.property("totalCount").that.is.at.least(0);
                node.expect(body.delegates).to.have.length.of.at.most(limit);
                const num_of_delegates = body.delegates.length;
                // console.log("Limit is: " + limit + ". Number of delegates returned is: " + num_of_delegates);
                // console.log("Total Number of delegates returned is: " + res.body.totalCount);
                if (num_of_delegates >= 1) {
                    for (let i = 0; i < num_of_delegates; i++) {
                        if (body.delegates[i + 1] != null) {
                            node.expect(body.delegates[i].rate).to.be.at.least(body.delegates[i + 1].rate);
                        }
                    }
                } else {
                    // console.log("Got 0 delegates");
                    node.expect("TEST").to.equal("FAILED");
                }
                done();
            });
    });

    it("Using invalid parameters. Should be fail", done => {
        // Should be ok because invalid parameters that we send are optional parameters

        const limit = "invalid";
        const offset = "invalid";

        node.api.get(`/delegates?limit=${limit}&offset=${offset}&orderBy=invalid`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });
});

describe("GET /accounts/delegates?address=", () => {

    it("Using valid address. Should be ok", done => {
        node.api.get(`/accounts/delegates?address=${node.Gaccount.address}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                debug('get delegates using invalid address response', body)
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("delegates").that.is.an("array");
                node.expect(body.delegates).to.have.length.of.at.least(1);
                node.expect(body.delegates[0]).to.have.property("username");
                node.expect(body.delegates[0]).to.have.property("address");
                node.expect(body.delegates[0]).to.have.property("public_key");
                node.expect(body.delegates[0]).to.have.property("vote");
                node.expect(body.delegates[0]).to.have.property("rate");
                node.expect(body.delegates[0]).to.have.property("productivity");
                done();
            });
    });

    it("Using invalid address. Should fail", done => {
        node.api.get("/accounts/delegates?address=NOTaDdnAddress")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });
});

describe("GET /delegates/count", () => {

    it("Should be ok", done => {
        node.api.get("/delegates/count")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("count").to.least(101);  //此处数量根据运行次数会有测试案例新增的受托人进来，但至少101个
                done();
            });
    });
});

describe("GET /delegates/voters", () => {

    beforeAll(done => {
        // console.log(JSON.stringify({
        //    secret: Raccount.password,
        //    delegates: ["+" + node.Eaccount.publicKey]
        // }));
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;
            node.api.put("/accounts/delegates")
                .set("Accept", "application/json")
                .send({
                    secret: Raccount.password,
                    delegates: [`+${node.Eaccount.publicKey}`]
                })
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });

    it("Using no publicKey. Should fail", done => {
        node.api.get("/delegates/voters?publicKey=")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success");
                if (body.success == false) {
                    node.expect(body).to.have.property("error");
                } else {
                    node.expect(body).to.have.property("accounts").that.is.an("array");
                    node.expect(body.accounts.length).to.equal(0);
                }

                done();
            });
    });

    it("Using invalid publicKey. Should fail", done => {
        node.api.get("/delegates/voters?publicKey=NotAPublicKey")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {body}) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("Using valid publicKey. Should be ok", done => {
        node.onNewBlock(err => {
            node.api.get(`/delegates/voters?publicKey=${node.Eaccount.publicKey}`)
                .set("Accept", "application/json")
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {body}) => {
                    // console.log(JSON.stringify(res.body));
                    node.expect(body).to.have.property("success").to.be.true;
                    node.expect(body).to.have.property("accounts").that.is.an("array");
                    let flag = 0;
                    if (body.success == true && body.accounts != null) {
                        for (let i = 0; i < body.accounts.length; i++) {
                            if (body.accounts[i].address == Raccount.address) {
                                flag = 1;
                            }
                        }
                    }
                    node.expect(flag).to.equal(1);
                    done();
                });
        });
    });
});
