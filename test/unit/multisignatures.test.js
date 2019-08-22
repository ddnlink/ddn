"use strict";

// Requires and node configuration
var node = require("./../variables.js");

var totalMembers = node.randomNumber(2,16);
var requiredSignatures = node.randomNumber(2,totalMembers+1);

var NoDDNAccount = node.randomAccount();
NoDDNAccount.name = "noddn";

var MultisigAccount = node.randomAccount();
MultisigAccount.name = "multi";

var Accounts = [];
for (var i = 0 ; i < totalMembers; i++) {
    Accounts[i] = node.randomAccount();
}

var MultiSigTX = {
    lifetime : 0,
    min : 0,
    members : [],
    txId : ""
}

// Used for opening accounts
var accountOpenTurn = 0;

async function openAccount (account, i) {
    await new Promise((resolve, reject) => {
        node.api.post("/accounts/open")
            .set("Accept", "application/json")
            .send({
                secret: account.password,
                secondSecret: account.secondPassword
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return reject(err);
                }

                if (i != null) {
                    console.log("Opening Account " + i + " with password: " + account.password);
                }

                node.expect(res.body).to.have.property("success").to.be.true;
                if (res.body.account != null && i != null) {
                    Accounts[i].address = res.body.account.address;
                    Accounts[i].public_key = res.body.account.public_key;
                } else if (account.name == "noddn") {
                    NoDDNAccount.address = res.body.account.address;
                    NoDDNAccount.public_key = res.body.account.public_key;
                } else if (account.name == "multi") {
                    MultisigAccount.address = res.body.account.address;
                    MultisigAccount.public_key = res.body.account.public_key;
                }

                resolve();
            });
    })
}

// Used for sending DDN to accounts
var accountSendTurn = 0;

async function sendDDN (account, i) {
    await node.onNewBlockAsync();

    await new Promise((resolve, reject) => {
        var randomCoin = node.randomCoin();

        node.api.put("/transactions")
            .set("Accept", "application/json")
            .send({
                secret: node.Gaccount.password,
                amount: randomCoin + '',
                recipientId: account.address
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return reject(err);
                }

                // console.log(JSON.stringify(res.body));
                console.log("Sending " + randomCoin + " DDN to " + account.address);
                node.expect(res.body).to.have.property("success").to.be.true;
                if (res.body.success == true && i != null) {
                // fixme: bignumber
                    Accounts[i].balance = randomCoin / node.normalizer;
                }

                resolve();
            });
    })
}

async function sendDDNfromMultisigAccount (amount, recipient) {
    return await new Promise((resolve, reject) => {
        node.api.put("/transactions")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                amount: amount + '',
                recipientId: recipient
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return reject(err);
                }

                // console.log(JSON.stringify(res.body));
                // console.log("Sending " + amount + " DDN to " + recipient);
                node.expect(res.body).to.have.property("success").to.be.true;
                if (res.body.success == true) {
                    node.expect(res.body).to.have.property("transactionId");
                }

                resolve(res.body.transactionId);
            });
    });
}

async function confirmTransaction (account, id) {
    await new Promise((resolve, reject) => {
        node.api.post("/multisignatures/sign")
            .set("Accept", "application/json")
            .send({
                secret: account.password,
                transactionId: id
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return reject(err);
                }
                // console.log("Signing Tx ID = " + id + " from account with password = " + account.password + " Got reply: " + JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.true;

                resolve();
            });
    })
}

// Used for KeysGroup
var Keys;

async function makeKeysGroup () {
    // console.log('Accounts', Accounts[0],Accounts[1])
    var keysgroup = [];
    for (var i = 0; i < totalMembers; i++) {
        var member = "+" + Accounts[i].public_key;
        keysgroup.push(member);
    }
    return keysgroup;
}

before(async () => {
    for (var i = 0; i < Accounts.length; i++) {
        if (Accounts[i] != null) {
            await openAccount(Accounts[i], i);
            // setTimeout(function () {
            //     if (accountOpenTurn < totalMembers) {
            //         accountOpenTurn += 1;
            //     }
            // }, 2000);
        }
    }
    await openAccount(NoDDNAccount, null);
    await openAccount(MultisigAccount, null);
});

before(async () => {
   for (var i = 0; i < (Accounts.length); i++) {
       if(Accounts[i] != null) {
           await sendDDN(Accounts[i], i);
       }
   }
   await sendDDN(MultisigAccount, null);
});

before(async () => {
    await node.onNewBlockAsync();
    // Wait for two new blocks to ensure all data has been recieved
    await node.onNewBlockAsync();
});

describe("PUT /multisignatures", function () {
    before(async () => {
        Keys = await makeKeysGroup();
    });

    it("When owner's public key in keysgroup. Should fail", (done) => {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: Accounts[Accounts.length-1].password,
                lifetime: 1,
                min: requiredSignatures,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When account has 0 DDN. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: NoDDNAccount.password,
                lifetime: 1,
                min: requiredSignatures,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When keysgroup is empty. Should fail", function (done) {
        var emptyKeys = [];

        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: 1,
                min: requiredSignatures,
                keysgroup: emptyKeys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When no keygroup is given. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: 1,
                min: requiredSignatures
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When keysgroup is a string. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: 1,
                min: requiredSignatures,
                keysgroup: "invalid"
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When no passphase is given. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                lifetime: 1,
                min: requiredSignatures,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When an invalid passphrase is given. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password + "invalid",
                lifetime: 1,
                min: requiredSignatures,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When no lifetime is given. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                min: requiredSignatures,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When lifetime is a string. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: "invalid",
                min: requiredSignatures,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When lifetime is greater than the maximum allowed. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: 99999999,
                min: requiredSignatures,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When lifetime is zero. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: 0,
                min: requiredSignatures,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When lifetime is negative. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: -1,
                min: requiredSignatures,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When lifetime is a string. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: "2",
                min: requiredSignatures,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When no min is given. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: 1,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When min is invalid. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: 1,
                min: "invalid",
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When min is greater than the total members. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: 1,
                min: totalMembers + 5,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When min is zero. Should fail", function (done) {
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: 1,
                min: 0,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When min is negative. Should fail", function (done) {
        var minimum = -1 * requiredSignatures;

        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: 1,
                min: minimum,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When min is a string. Should fail", function (done) {
        var minimum =  toString(requiredSignatures);

        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: 1,
                min: minimum,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("When data is valid. Should be ok", function (done) {
        var life = parseInt(node.randomNumber(5,25));
        node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: life,
                min: requiredSignatures,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                if (res.body.error != null) {
                    console.log(res.body.error);
                }
                node.expect(res.body).to.have.property("success").to.be.true;
                node.expect(res.body).to.have.property("transactionId");
                if (res.body.success == true && res.body.transactionId != null) {
                    MultiSigTX.txId = res.body.transactionId;
                    MultiSigTX.lifetime = life;
                    MultiSigTX.members = Keys;
                    MultiSigTX.min = requiredSignatures;
                } else {
                    console.log("Transaction failed or transactionId null");
                    node.expect("test").to.equal("failed");
                }
                done();
            });
    });
});

describe("GET /multisignatures/pending", function () {

    it("Using invalid public key. Should fail", function (done) {
        var publicKey = 'abcd';

        node.api.get("/multisignatures/pending?publicKey=" + publicKey)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("Using no public key. Should be ok", function (done) {
        node.api.get("/multisignatures/pending?publicKey=")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success");
                node.expect(res.body).to.have.property("success").to.be.true;
                node.expect(res.body).to.have.property("transactions").that.is.an("array");
                node.expect(res.body.transactions.length).to.equal(0);
                done();
            });
    });

    it("Using valid public key. Should be ok", function (done) {
        // node.onNewBlock(function (err) {
            node.api.get("/multisignatures/pending?publicKey=" + MultisigAccount.public_key)
                .set("Accept", "application/json")
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    // console.log('res.body', res.body)
                    node.expect(res.body).to.have.property("success").to.be.true;
                    node.expect(res.body).to.have.property("transactions").that.is.an("array");
                    node.expect(res.body.transactions.length).to.be.at.least(1);
                    var flag = 0;
                    for (var i = 0; i < res.body.transactions.length; i++) {
                        // console.log(MultisigAccount.publicKey);
                        if (res.body.transactions[i].transaction.sender_public_key == MultisigAccount.public_key) {
                            flag += 1;
                            node.expect(res.body.transactions[i].transaction).to.have.property("type").to.equal(node.AssetTypes.MULTISIGNATURE);
                            node.expect(res.body.transactions[i].transaction).to.have.property("amount").to.equal('0');
                            node.expect(res.body.transactions[i].transaction).to.have.property("asset").that.is.an("object");
                            node.expect(res.body.transactions[i].transaction).to.have.property("fee").to.equal(String(node.Fees.multisignatureRegistrationFee * (Keys.length + 1)));
                            node.expect(res.body.transactions[i].transaction).to.have.property("id").to.equal(MultiSigTX.txId);
                            node.expect(res.body.transactions[i].transaction).to.have.property("sender_public_key").to.equal(MultisigAccount.public_key);
                            node.expect(res.body.transactions[i]).to.have.property("lifetime").to.equal(Number(MultiSigTX.lifetime));
                            node.expect(res.body.transactions[i]).to.have.property("min").to.equal(MultiSigTX.min);
                        }
                    }
                    node.expect(flag).to.equal(1);
                    done();
                });
        // });
    });
});

describe("PUT /multisignatures/sign", function () {

    it("Using invalid passphrase. Should fail", function (done) {
        node.api.put("/multisignatures/sign")
            .set("Accept", "application/json")
            .send({
                secret: 1234,
                transactionId: MultiSigTX.txId
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                done();
            });
    });

    it("Using null passphrase. Should fail", function (done) {
        node.api.put("/multisignatures/sign")
            .set("Accept", "application/json")
            .send({
                secret: null,
                transactionId: MultiSigTX.txId
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                done();
            });
    });

    it("Using undefined passphrase. Should fail", function (done) {
        var undefined;

        node.api.put("/multisignatures/sign")
            .set("Accept", "application/json")
            .send({
                secret: undefined,
                transactionId: MultiSigTX.txId
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                done();
            });
    });

    it("Using random passphrase. Should fail (account is not associated)", function (done) {
        node.api.put("/multisignatures/sign")
            .set("Accept", "application/json")
            .send({
                secret: "Just 4 R4nd0m P455W0RD",
                transactionId: MultiSigTX.txId
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                done();
            });
    });

    it("Use valid phrases, Should be ok", async () => {
        for (var i = 0; i < totalMembers; i++) {
            var account = Accounts[i];
            await confirmTransaction(account, MultiSigTX.txId);
        }
    });
});

describe("Sending another transaction", function () {

    var sendTrsId;

    it("When other transactions are still pending. Should be ok", function (done) {
        node.onNewBlock(async () => {
            try
            {
                sendTrsId = await sendDDNfromMultisigAccount(100000000, node.Gaccount.address);
                done();
            }
            catch(err)
            {
                done(err);
            }
        });
    });

    it("Get unconfirmed transaction, Should be ok.", function(done) {
        node.api.get("/transactions/unconfirmed/get?id=" + sendTrsId)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }

                node.expect(res.body).to.have.property("success").to.be.true;
                node.expect(res.body).to.have.property("transaction").that.is.an("object");

                done();
            });
    })

    it("Confirm the send transaction, Should be ok.", async () => {
        for (var i = 0; i < totalMembers; i++) {
            var account = Accounts[i];
            await confirmTransaction(account, sendTrsId);
        }
    });
});
