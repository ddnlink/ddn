"use strict";

var node = require("./../variables.js");

async function createTransfer(address, amount, secret, second_secret) {
    return await node.ddn.transaction.createTransaction(address, amount, null, secret, second_secret)
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

var accounts = [];
var multiTrsId;

describe("PUT /multisignatures", () => {

    it("POST /transactions", async () => {
        var account = {
            secret:"daughter aerobic reduce buyer awful prefer crowd exercise pretty outer chaos museum",
            publicKey:"9bec291262250709a981f24201326227ef0a7d2d30645aa2254ef1fe984aa285",
            privateKey:"84f19f24b0be84f40d43531027d943954b1d6a6135c5bf715510b82d4f0e5a539bec291262250709a981f24201326227ef0a7d2d30645aa2254ef1fe984aa285",
            address:"EFGZuUVxvSosPbrDhmuaN4CdQGkasfigno"
        };
        accounts.push(account);

        var account2 = {
            secret:"leopard fee inflict dignity imitate twelve hidden assume rug hotel mixed palm",
            publicKey:"5a6f407c1212614f3c0f227d03f43709caec9a24dadc997e19ed2c91ab013519",
            privateKey:"4d1b10eeb7c009651a4b6f3fff6456b09c7f0f6f2314f4f04c5c93bd962b42915a6f407c1212614f3c0f227d03f43709caec9a24dadc997e19ed2c91ab013519",
            address:"EJ9g2pRUcJa6mjSY5AhUXrEL2rwSNdz9xq"
        };
        accounts.push(account2);
        
        var account3 = {
            secret:"this state own junk diesel slot festival cry action prison dice nose",
            publicKey:"b3037f3642d508d161f674fd76a2e987d3747da3ee3b61d4cd1845c82e200b9f",
            privateKey:"49515a83df7a72b64896620d35fea363779cf4ffdd2829c852929a37ab9d025cb3037f3642d508d161f674fd76a2e987d3747da3ee3b61d4cd1845c82e200b9f",
            address:"EABdfeJj8fhL73DkgJBY1ibW6c4ZZPc7fb"
        };
        // accounts.push(account3);

        var transaction = await createTransfer(node.Daccount.address, 100000000, node.Eaccount.password);
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
                    node.expect(res.body).to.have.property("success").to.be.true;

                    multiTrsId = res.body.transactionId;

                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        });

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

    })

})