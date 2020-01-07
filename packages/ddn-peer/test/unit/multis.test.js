"use strict";

var node = require("./../variables.js");

async function createTransfer(address, amount, secret, second_secret) {
    return await node.ddn.transaction.createTransaction(address, amount, null, secret, second_secret)
}

async function newAccount() {
    return new Promise((resolve, reject) => {
        node.api.get("/accounts/new")
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
            node.expect(res.body).to.have.property("secret");

            if (err)
            {
                return reject(err);
            }
            
            resolve(res.body);
        });
    });
}

async function multiSign(account, trsId) {
    return new Promise((resolve, reject) => {
        node.api.post("/multisignatures/sign")
        .set("Accept", "application/json")
        .send({
            secret: account.secret,
            transactionId: trsId
        })
        .expect("Content-Type", /json/)
        .expect(200)
        .end(function (err, res) {
            if (err) {
                return reject(err);
            }

            console.log(account.address + " sign:" + JSON.stringify(res.body));

            node.expect(res.body).to.have.property("success").to.be.true;

            resolve();
        });
    });
}

var multiAccount;
var accounts = [];

var multiTrsId;

describe("PUT /multisignatures", () => {

    before(async () => {
        multiAccount = await newAccount();
        console.log("Multi Account: " + JSON.stringify(multiAccount));
        console.log("\r\n");

        var transaction = await createTransfer(multiAccount.address, 100000000000, node.Gaccount.password);
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
                .end((err, res) => {
                    console.log(JSON.stringify(res.body))
                    node.expect(res.body).to.have.property("success").to.be.true;
                    
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        });

        var account =  await newAccount();
        console.log("account: " + JSON.stringify(account));
        console.log("\r\n");
        accounts.push(account);

        var account2 =  await newAccount();
        console.log("account2: " + JSON.stringify(account2));
        console.log("\r\n");
        accounts.push(account2);

        var account3 =  await newAccount();
        console.log("account3: " + JSON.stringify(account3));
        console.log("\r\n");
        accounts.push(account3);

    })

    it("PUT /multisignatures. Should be ok", (done) => {
        node.onNewBlock(() => {

            var kg = [];
            for (var i = 0; i < accounts.length; i++) {
                var acc = accounts[i];
                kg.push("+" + acc.publicKey);
            }
            console.log("keysgroup: " + JSON.stringify(kg));
            console.log("\r\n");

            node.api.put("/multisignatures")
            .set("Accept", "application/json")
            .send({
                secret: multiAccount.secret,
                min: 3,
                lifetime: 24,
                keysgroup: kg
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.true;

                multiTrsId = res.body.transactionId;

                done();
            });
            
        });

    });

    it("POST /multisignatures/sign. Should be ok", async() => {
        var result = false;

        for (var i = 0; i < accounts.length; i++) {
            try
            {
                var account = accounts[i];
                await multiSign(account, multiTrsId);
                result = true;
            }
            catch (err)
            {
                result = false;
            }
        }
    });

})