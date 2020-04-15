/**
 * not passed
 */
import node from "@ddn/node-sdk/lib/test";

async function createTransfer(address, amount, secret, second_secret) {
    return await node.ddn.transaction.createTransaction(address, amount, null, secret, second_secret)
}

async function newAccount() {
    return new Promise((resolve, reject) => {
        node.api.get("/accounts/new")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                node.expect(body).to.have.property("secret");

                if (err) {
                    return reject(err);
                }

                resolve(body);
            });
    });
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
                if (err) {
                    return reject(err);
                }

                console.log(`${address} sign:${JSON.stringify(body)}`);

                node.expect(body).to.have.property("success").to.be.true;

                resolve();
            });
    });
}

let multiAccount;
const accounts = [];

let multiTrsId;

describe("PUT /multisignatures", () => {

    beforeAll(async () => {
        multiAccount = await newAccount();
        console.log(`Multi Account: ${JSON.stringify(multiAccount)}`);
        console.log("\r\n");

        const transaction = await createTransfer(multiAccount.address, 100000000000, node.Gaccount.password);
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
                .end((err, {
                    body
                }) => {
                    console.log(JSON.stringify(body))
                    node.expect(body).to.have.property("success").to.be.true;

                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        });

        const account = await newAccount();
        console.log(`account: ${JSON.stringify(account)}`);
        console.log("\r\n");
        accounts.push(account);

        const account2 = await newAccount();
        console.log(`account2: ${JSON.stringify(account2)}`);
        console.log("\r\n");
        accounts.push(account2);

        const account3 = await newAccount();
        console.log(`account3: ${JSON.stringify(account3)}`);
        console.log("\r\n");
        accounts.push(account3);

    })

    it("PUT /multisignatures. Should be ok", (done) => {
        node.onNewBlock(() => {

            const kg = [];
            for (let i = 0; i < accounts.length; i++) {
                const acc = accounts[i];
                kg.push(`+${acc.publicKey}`);
            }
            console.log(`keysgroup: ${JSON.stringify(kg)}`);
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
                .end((err, {
                    body
                }) => {
                    console.log(JSON.stringify(body));
                    node.expect(body).to.have.property("success").to.be.true;

                    multiTrsId = body.transactionId;

                    done();
                });

        });

    });

    it("POST /multisignatures/sign. Should be ok", async (done) => {
        let result = false;

        for (let i = 0; i < accounts.length; i++) {
            try {
                const account = accounts[i];
                await multiSign(account, multiTrsId);
                result = true;
            } catch (err) {
                result = false;
            }
        }
        done();
    });

})