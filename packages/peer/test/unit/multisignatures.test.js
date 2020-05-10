/**
 * not passed
 */
import node from "@ddn/node-sdk/lib/test";

import Debug from "debug";

const debug = Debug("multisignatures");

const totalMembers = node.randomNumber(2, 16);
const requiredSignatures = node.randomNumber(2, totalMembers + 1);

const NoDDNAccount = node.randomAccount();
NoDDNAccount.name = "noddn";

const MultisigAccount = node.randomAccount();
MultisigAccount.name = "multi";

const Accounts = [];
for (let i = 0; i < totalMembers; i++) {
    Accounts[i] = node.randomAccount();
}

const MultiSigTX = {
    lifetime: 0,
    min: 0,
    members: [],
    txId: ""
};

async function openAccount({ password, secondPassword, name }, i) {
    await new Promise((resolve, reject) => {
        node.api
            .post("/accounts/open")
            .set("Accept", "application/json")
            .send({
                secret: password,
                secondSecret: secondPassword
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                if (err) {
                    return reject(err);
                }

                if (i != null) {
                    console.log(
                        `Opening Account ${i} with password: ${password}`
                    );
                }

                node.expect(body).to.have.property("success").to.be.true;
                if (body.account != null && i != null) {
                    Accounts[i].address = body.account.address;
                    Accounts[i].publicKey = body.account.publicKey;
                } else if (name == "noddn") {
                    NoDDNAccount.address = body.account.address;
                    NoDDNAccount.publicKey = body.account.publicKey;
                } else if (name == "multi") {
                    MultisigAccount.address = body.account.address;
                    MultisigAccount.publicKey = body.account.publicKey;
                    debug("Open MultisigAccount", MultisigAccount);
                    debug("Open body.account", body.account);
                }

                resolve();
            });
    });
}

async function sendDDN({ address }, i) {
    await node.onNewBlockAsync();

    await new Promise((resolve, reject) => {
        const randomCoin = node.randomCoin();

        node.api
            .put("/transactions")
            .set("Accept", "application/json")
            .send({
                secret: node.Gaccount.password,
                amount: `${randomCoin}`,
                recipientId: address
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                if (err) {
                    return reject(err);
                }

                // debug(JSON.stringify(res.body));
                debug(`sendDDN Sending ${randomCoin} DDN to ${address}`);
                node.expect(body).to.have.property("success").to.be.true;
                if (body.success == true && i != null) {
                    // fixme: Bignumber
                    Accounts[i].balance = randomCoin / node.normalizer;
                }

                resolve();
            });
    });
}

async function sendDDNfromMultisigAccount(amount, recipient) {
    return await new Promise((resolve, reject) => {
        node.api
            .put("/transactions")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                amount: `${amount}`,
                recipientId: recipient
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                if (err) {
                    return reject(err);
                }

                debug('sendDDNfromMultisigAccount: ', JSON.stringify(body));
                debug("Sending " + amount + " DDN to " + recipient);
                node.expect(body).to.have.property("success").to.be.true;
                if (body.success == true) {
                    node.expect(body).to.have.property("transactionId");
                }

                resolve(body.transactionId);
            });
    });
}

async function confirmTransaction({ password }, id) {
    await new Promise((resolve, reject) => {
        node.api
            .post("/multisignatures/sign")
            .set("Accept", "application/json")
            .send({
                secret: password,
                transactionId: id
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                if (err) {
                    return reject(err);
                }
                // debug("Signing Tx ID = " + id + " from account with password = " + account.password + " Got reply: " + JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.true;

                resolve();
            });
    });
}

// Used for KeysGroup
let Keys;

async function makeKeysGroup() {
    debug("makeKeysGroup Accounts", Accounts[0], Accounts[1]);
    const keysgroup = [];
    for (let i = 0; i < totalMembers; i++) {
        const member = `+${Accounts[i].publicKey}`;
        keysgroup.push(member);
    }
    return keysgroup;
}

beforeAll(done => {
    node.ddn.init();
    done();
});

beforeAll(async done => {
    for (let i = 0; i < Accounts.length; i++) {
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
    done();
});

beforeAll(async done => {
    for (let i = 0; i < Accounts.length; i++) {
        if (Accounts[i] != null) {
            await sendDDN(Accounts[i], i);
        }
    }
    await sendDDN(MultisigAccount, null);
    done();
});

beforeAll(async done => {
    await node.onNewBlockAsync();
    // Wait for two new blocks to ensure all data has been recieved
    await node.onNewBlockAsync();
    done();
});

describe("PUT /multisignatures", () => {
    beforeAll(async done => {
        Keys = await makeKeysGroup();
        done();
    });

    // it("When owner's public key in keysgroup. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: Accounts[Accounts.length - 1].password,
    //             lifetime: 1,
    //             min: requiredSignatures,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             debug("keysgroup", JSON.stringify(body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When account has 0 DDN. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: NoDDNAccount.password,
    //             lifetime: 1,
    //             min: requiredSignatures,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When keysgroup is empty. Should fail", done => {
    //     const emptyKeys = [];

    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: 1,
    //             min: requiredSignatures,
    //             keysgroup: emptyKeys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When no keygroup is given. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: 1,
    //             min: requiredSignatures
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When keysgroup is a string. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: 1,
    //             min: requiredSignatures,
    //             keysgroup: "invalid"
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When no passphase is given. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             lifetime: 1,
    //             min: requiredSignatures,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When an invalid passphrase is given. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: `${MultisigAccount.password}invalid`,
    //             lifetime: 1,
    //             min: requiredSignatures,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When no lifetime is given. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             min: requiredSignatures,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When lifetime is a string. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: "invalid",
    //             min: requiredSignatures,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When lifetime is greater than the maximum allowed. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: 99999999,
    //             min: requiredSignatures,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When lifetime is zero. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: 0,
    //             min: requiredSignatures,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When lifetime is negative. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: -1,
    //             min: requiredSignatures,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When lifetime is a string. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: "2",
    //             min: requiredSignatures,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When no min is given. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: 1,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When min is invalid. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: 1,
    //             min: "invalid",
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When min is greater than the total members. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: 1,
    //             min: totalMembers + 5,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When min is zero. Should fail", done => {
    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: 1,
    //             min: 0,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When min is negative. Should fail", done => {
    //     const minimum = -1 * requiredSignatures;

    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: 1,
    //             min: minimum,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             // debug(JSON.stringify(res.body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    // it("When min is a string. Should fail", done => {
    //     const minimum = toString(requiredSignatures);

    //     node.api
    //         .put("/multisignatures")
    //         .set("Accept", "application/json")
    //         .send({
    //             secret: MultisigAccount.password,
    //             lifetime: 1,
    //             min: minimum,
    //             keysgroup: Keys
    //         })
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    //         .end((err, { body }) => {
    //             debug('/multisignatures min is a string', JSON.stringify(body));
    //             node.expect(body).to.have.property("success").to.be.false;
    //             node.expect(body).to.have.property("error");
    //             done();
    //         });
    // });

    it("When data is valid. Should be ok", done => {
        const life = parseInt(node.randomNumber(5, 25));
        node.api
            .put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: MultisigAccount.password,
                lifetime: life,
                min: requiredSignatures,
                keysgroup: Keys
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                debug("should be ok: ", JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("transactionId");
                if (body.success == true && body.transactionId != null) {
                    MultiSigTX.txId = body.transactionId;
                    MultiSigTX.lifetime = life;
                    MultiSigTX.members = Keys;
                    MultiSigTX.min = requiredSignatures;
                } else {
                    console.log("Transaction failed or transactionId null");
                    node.expect("test").to.equal("failed");
                }
                done();
            });
    }, 30000);
});

// describe("GET /multisignatures/pending", () => {
//     it("Using invalid public key. Should fail", done => {
//         const publicKey = "abcd"; 

//         node.api
//             .get(`/multisignatures/pending?publicKey=${publicKey}`)
//             .set("Accept", "application/json")
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end((err, { body }) => {
//                 debug("GET /multisignatures/pending", JSON.stringify(body));
//                 node.expect(body).to.have.property("success").to.be.false;
//                 node.expect(body).to.have.property("error");
//                 done();
//             });
//     });

//     it("Using no public key. Should be ok", done => {
//         node.api
//             .get("/multisignatures/pending?publicKey=")
//             .set("Accept", "application/json")
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end((err, { body }) => {
//                 // debug(JSON.stringify(res.body));
//                 node.expect(body).to.have.property("success");
//                 node.expect(body).to.have.property("success").to.be.true;
//                 node.expect(body)
//                     .to.have.property("transactions")
//                     .that.is.an("array");
//                 node.expect(body.transactions.length).to.equal(0);
//                 done();
//             });
//     });

//     it("Using valid public key. Should be ok", done => {
//         // node.onNewBlock(function (err) {
//         node.api
//             .get(
//                 `/multisignatures/pending?publicKey=${MultisigAccount.publicKey}`
//             )
//             .set("Accept", "application/json")
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end((err, { body }) => {
//                 // debug('res.body', res.body)
//                 node.expect(body).to.have.property("success").to.be.true;
//                 node.expect(body)
//                     .to.have.property("transactions")
//                     .that.is.an("array");
//                 node.expect(body.transactions.length).to.be.at.least(1);
//                 let flag = 0;
//                 for (let i = 0; i < body.transactions.length; i++) {
//                     // debug(MultisigAccount.publicKey);
//                     if (
//                         body.transactions[i].transaction.senderPublicKey ==
//                         MultisigAccount.publicKey
//                     ) {
//                         flag += 1;
//                         node.expect(body.transactions[i].transaction)
//                             .to.have.property("type")
//                             .to.equal(node.AssetTypes.MULTISIGNATURE);
//                         node.expect(body.transactions[i].transaction)
//                             .to.have.property("amount")
//                             .to.equal("0");
//                         node.expect(body.transactions[i].transaction)
//                             .to.have.property("asset")
//                             .that.is.an("object");
//                         node.expect(body.transactions[i].transaction)
//                             .to.have.property("fee")
//                             .to.equal(
//                                 String(
//                                     node.Fees.multisignatureRegistrationFee *
//                                         (Keys.length + 1)
//                                 )
//                             );
//                         node.expect(body.transactions[i].transaction)
//                             .to.have.property("id")
//                             .to.equal(MultiSigTX.txId);
//                         node.expect(body.transactions[i].transaction)
//                             .to.have.property("senderPublicKey")
//                             .to.equal(MultisigAccount.publicKey);
//                         node.expect(body.transactions[i])
//                             .to.have.property("lifetime")
//                             .to.equal(Number(MultiSigTX.lifetime));
//                         node.expect(body.transactions[i])
//                             .to.have.property("min")
//                             .to.equal(MultiSigTX.min);
//                     }
//                 }
//                 node.expect(flag).to.equal(1);
//                 done();
//             });
//         // });
//     });
// });

// describe("PUT /multisignatures/sign", () => {
//     it("Using invalid passphrase. Should fail", done => {
//         node.api
//             .put("/multisignatures/sign")
//             .set("Accept", "application/json")
//             .send({
//                 secret: 1234,
//                 transactionId: MultiSigTX.txId
//             })
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end((err, { body }) => {
//                 // debug(JSON.stringify(res.body));
//                 node.expect(body).to.have.property("success").to.be.false;
//                 done();
//             });
//     });

//     it("Using null passphrase. Should fail", done => {
//         node.api
//             .put("/multisignatures/sign")
//             .set("Accept", "application/json")
//             .send({
//                 secret: null,
//                 transactionId: MultiSigTX.txId
//             })
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end((err, { body }) => {
//                 // debug(JSON.stringify(res.body));
//                 node.expect(body).to.have.property("success").to.be.false;
//                 done();
//             });
//     });

//     it("Using undefined passphrase. Should fail", done => {
//         node.api
//             .put("/multisignatures/sign")
//             .set("Accept", "application/json")
//             .send({
//                 secret: undefined,
//                 transactionId: MultiSigTX.txId
//             })
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end((err, { body }) => {
//                 // debug(JSON.stringify(res.body));
//                 node.expect(body).to.have.property("success").to.be.false;
//                 done();
//             });
//     });

//     it("Using random passphrase. Should fail (account is not associated)", done => {
//         node.api
//             .put("/multisignatures/sign")
//             .set("Accept", "application/json")
//             .send({
//                 secret: "Just 4 R4nd0m P455W0RD",
//                 transactionId: MultiSigTX.txId
//             })
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end((err, { body }) => {
//                 // debug(JSON.stringify(res.body));
//                 node.expect(body).to.have.property("success").to.be.false;
//                 done();
//             });
//     });

//     it("Use valid phrases, Should be ok", async () => {
//         for (let i = 0; i < totalMembers; i++) {
//             const account = Accounts[i];
//             await confirmTransaction(account, MultiSigTX.txId);
//         }
//     });
// });

// describe("Sending another transaction", () => {
//     let sendTrsId;

//     it("When other transactions are still pending. Should be ok", done => {
//         node.onNewBlock(async () => {
//             try {
//                 sendTrsId = await sendDDNfromMultisigAccount(
//                     100000000,
//                     node.Gaccount.address
//                 );
//                 // todo
//                 done();
//             } catch (err) {
//                 done(err);
//             }
//         });
//     });

//     it("Get unconfirmed transaction, Should be ok.", done => {
//         node.api
//             .get(`/transactions/unconfirmed/get?id=${sendTrsId}`)
//             .set("Accept", "application/json")
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end((err, { body }) => {
//                 if (err) {
//                     return done(err);
//                 }

//                 node.expect(body).to.have.property("success").to.be.true;
//                 node.expect(body)
//                     .to.have.property("transaction")
//                     .that.is.an("object");

//                 return done();
//             });
//     });

//     it("Confirm the send transaction, Should be ok.", async () => {
//         for (let i = 0; i < totalMembers; i++) {
//             const account = Accounts[i];
//             await confirmTransaction(account, sendTrsId);
//         }
//     });
// });
// });
