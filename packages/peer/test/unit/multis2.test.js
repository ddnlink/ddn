/**
 * not passed
 */
import node from "@ddn/node-sdk/lib/test";
import Debug from "debug";

const debug = Debug("debug");
const expect = node.expect;

async function createTransfer(address, amount, secret, second_secret) {
    return await node.ddn.transaction.createTransaction(address, amount, null, secret, second_secret)
}

async function multiSign({
    secret,
    address
}, trsId) {
    return new Promise((resolve, reject) => {
        node.api.post("/multisignatures/sign")
            .set("Accept", "application/json")
            .send({
                secret,
                transactionId: trsId
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // expect(err).be.not.ok;
                if (err) {
                    reject(err);
                }

                debug('trsId:', trsId);

                debug(`${address} sign: ${JSON.stringify(body)}`);

                node.expect(body).to.have.property("success").to.be.true;

                resolve();
            });
    });
}


describe("PUT /multisignatures", () => {
    const accounts = [];
    let multiTrsId;

    it("POST /transactions", async (done) => {
        var account = {
            secret: "daughter aerobic reduce buyer awful prefer crowd exercise pretty outer chaos museum",
            publicKey: "9bec291262250709a981f24201326227ef0a7d2d30645aa2254ef1fe984aa285",
            privateKey: "84f19f24b0be84f40d43531027d943954b1d6a6135c5bf715510b82d4f0e5a539bec291262250709a981f24201326227ef0a7d2d30645aa2254ef1fe984aa285",
            address: "DFGZuUVxvSosPbrDhmuaN4CdQGkasfigno"
        };
        accounts.push(account);

        const account2 = {
            secret: "leopard fee inflict dignity imitate twelve hidden assume rug hotel mixed palm",
            publicKey: "5a6f407c1212614f3c0f227d03f43709caec9a24dadc997e19ed2c91ab013519",
            privateKey: "4d1b10eeb7c009651a4b6f3fff6456b09c7f0f6f2314f4f04c5c93bd962b42915a6f407c1212614f3c0f227d03f43709caec9a24dadc997e19ed2c91ab013519",
            address: "DJ9g2pRUcJa6mjSY5AhUXrEL2rwSNdz9xq"
        };
        accounts.push(account2);

        // accounts.push(account3);

        const transaction = await createTransfer(node.Eaccount.address, '100000000', node.Gaccount.password);
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
            .end(async (err, {
                body
            }) => {
                debug('body', body);

                expect(err).to.be.not.ok;
                expect(body).to.have.property("success").to.be.true;

                multiTrsId = body.transactionId;
                debug('multiTrsId', multiTrsId);

                let result = false;

                for (let i = 0; i < accounts.length; i++) {

                    try {
                        const account = accounts[i];
                        await multiSign(account, multiTrsId);
                        // debug(account);
                        result = true;
                    } catch (err) {
                        result = false;
                    }
                }
                expect(result).to.be.true;
                done();
            });


    });

});