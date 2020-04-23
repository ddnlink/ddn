import Debug from 'debug';
import DdnUtil from '@ddn/utils';

import node from '@ddn/node-sdk/lib/test';

const debug = Debug('dao');

const Account1 = node.randomTxAccount();
const Account2 = node.randomTxAccount();
let transaction;
let exchange;
let Account1Balance;
const exchangePrice = "700000000";

async function openAccount(account) {
    await new Promise((resolve, reject) => {
        node.api.post("/accounts/open")
            .set("Accept", "application/json")
            .send({
                secret: account.password,
                secondSecret: account.secondPassword
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body))

                if (err) {
                    return reject(err);
                }

                node.expect(body).to.have.property("success").to.be.true;

                if (body.account != null) {
                    account.address = body.account.address;
                    account.public_key = body.account.public_key;
                    account.balance = body.account.balance;
                }

                console.log(`Open Account [${account.address}] with password: ${account.password}`);

                resolve();
            });
    })
}

async function sendDDN({
    address
}, coin) {
    await node.onNewBlockAsync();

    const result = await new Promise((resolve, reject) => {
        const randomCoin = node.randomCoin();
        if (!coin) {
            coin = randomCoin;
        }

        node.api.put("/transactions")
            .set("Accept", "application/json")
            .send({
                secret: node.Gaccount.password,
                amount: `${coin}`,
                recipientId: address
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body));

                if (err) {
                    return reject(err);
                }

                console.log(`Sending ${coin} DDN to ${address}`);
                node.expect(body).to.have.property("success").to.be.true;

                resolve(coin);
            });
    })

    await node.onNewBlockAsync();

    return result;
}

describe('Put /transactions', () => {

    // 转账
    // let trs = node.ddn.transaction.createTransaction(node.Daccount.address, 89909, "thanks", node.Gaccount.password)
    // sendTransactions(trs);

    let orgId = "";

    beforeAll(async () => {

        // 加载插件
        node.ddn.init();

        await openAccount(Account1);
        await openAccount(Account2);

        Account1Balance = await sendDDN(Account1);

        await new Promise((resolve, reject) => {
            const getOrgIdUrl = `/orgs/getlist?pagesize=1&address=${node.Gaccount.address}`;
            node.api.get(getOrgIdUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug(JSON.stringify(body));

                    if (err) {
                        return reject(err);
                    }

                    node.expect(body).to.have.property("success").to.be.true;

                    if (body.success && body.data && body.data.rows && body.data.rows.length) {
                        orgId = body.data.rows[0].org_id;
                        // orgId = body.orgId;
                    } else {
                        return reject("未查找到符合要求的Org数据。");
                    }

                    resolve();
                });
        });
    });

    it("Create exchange with state = 0, Should be ok", async (done) => {
        exchange = {
            "org_id": orgId,
            "price": exchangePrice,
            "received_address": Account1.address,
        };

        exchange = Object.assign({
            "org_id": "",
            // "orgId": "",
            "exchange_trs_id": "",
            "state": 0,
            "price": "98765",
            "sender_address": node.Gaccount.address
            // "receivedAddress": node.Daccount.address,
        }, exchange)

        transaction = await node.ddn.assetPlugin.createPluginAsset(41, exchange, node.Gaccount.password)
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
                debug(JSON.stringify(body));

                node.expect(err).to.be.not.ok;

                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("transactionId");

                exchange.exchange_trs_id = body.transactionId;

                done();
            });
    });

    it("Create exchange with state = 1, Should be ok", async (done) => {
        await node.onNewBlockAsync();

        const temp = exchange.received_address;
        exchange.received_address = exchange.sender_address;
        exchange.sender_address = temp;
        exchange.amount = exchange.price;
        exchange.recipientId = exchange.received_address;
        exchange.state = 1;

        transaction = await node.ddn.assetPlugin.createPluginAsset(41, exchange, Account1.password);
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
                debug(JSON.stringify(body));

                node.expect(err).to.be.not.ok;

                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("transactionId");

                done();
            });
    });

    it("Account1 balance calculate, Should be ok.", async () => {
        await node.onNewBlockAsync();

        await openAccount(Account1);
        node.expect(Account1).to.have.property("balance");

        const fee = "10000000";
        const nowBalance = DdnUtil.bignum.minus(Account1Balance, exchangePrice, fee);
        node.expect(Account1.balance.toString()).to.equal(nowBalance.toString());
    })

    it("Create exchange with state = 1 again, Should be fail", async (done) => {
        await node.onNewBlockAsync();

        exchange.amount = exchange.price;
        exchange.recipientId = exchange.received_address;

        transaction = await node.ddn.assetPlugin.createPluginAsset(41, exchange, Account1.password);

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
                debug(JSON.stringify(body));

                node.expect(err).to.be.not.ok;

                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error").to.contain("confirm exchange already exists");

                done();
            });
    });
})

describe('PUT /dao/exchanges', () => {
    let orgId = "";

    beforeAll(async (done) => {
        const getOrgIdUrl = `/orgs/getlist?pagesize=1&address=${node.Gaccount.address}`;
        node.api.get(getOrgIdUrl)
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body));

                node.expect(err).to.be.not.ok;

                node.expect(body).to.have.property("success").to.be.true;

                if (body.success && body.data && body.data.rows && body.data.rows.length) {
                    orgId = body.data.rows[0].org_id;
                    // orgId = body.orgId;
                } else {
                    debug("未查找到符合要求的Org数据。");
                    done();
                }

                done();
            });
    });

    it("Using invalid parameters, no parameters, should be fail.", (done) => {
        node.api.put("/dao/exchanges")
            .set('Accept', 'application/json')
            .send({
                secret: node.Gaccount.password
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body));

                node.expect(err).to.be.not.ok;

                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error").to.contain("Invalid parameters");

                done();
            });
    });

    it("State=0, Using valid parameters, should be ok.", (done) => {
        node.api.put("/dao/exchanges")
            .set('Accept', 'application/json')
            .send({
                secret: node.Gaccount.password,
                orgId,
                price: exchangePrice,
                receivedAddress: Account2.address
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body));

                node.expect(err).to.be.not.ok;

                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("transactionId");

                exchange = exchange || {};
                exchange.exchange_trs_id = body.transactionId;

                done();
            });
    });

    it("State=1, Account2 no exists, should be fail.", async (done) => {
        await node.onNewBlockAsync();

        node.api.put("/dao/exchanges")
            .set('Accept', 'application/json')
            .send({
                secret: Account2.password,
                orgId,
                price: exchangePrice,
                exchangeTrsId: exchange.exchange_trs_id,
                receivedAddress: node.Gaccount.address,
                state: 1
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body));

                node.expect(err).to.be.not.ok;

                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error").to.equal("Account not found");

                done();
            });
    })

    it("Send 1 DDN to Account2, should be ok.", async () => {
        await sendDDN(Account2, "100000000");
    });

    it("State=1, Account2 balance < 700000000, should be fail.", async (done) => {
        await node.onNewBlockAsync();

        node.api.put("/dao/exchanges")
            .set('Accept', 'application/json')
            .send({
                secret: Account2.password,
                orgId,
                price: exchangePrice,
                exchangeTrsId: exchange.exchange_trs_id,
                receivedAddress: node.Gaccount.address,
                state: 1
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body));

                node.expect(err).to.be.not.ok;

                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error").to.contain("Insufficient balance");

                done();
            });
    })

    // it("Send random DDN to Account2, should be ok.", async () => {
    // });

    it("State=1, Account2 balance > 700000000, should be ok.", async (done) => {
        await sendDDN(Account2);

        await node.onNewBlockAsync();

        node.api.put("/dao/exchanges")
            .set('Accept', 'application/json')
            .send({
                secret: Account2.password,
                orgId,
                price: exchangePrice,
                exchangeTrsId: exchange.exchange_trs_id,
                receivedAddress: node.Gaccount.address,
                state: 1
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body));

                node.expect(err).to.be.not.ok;

                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("transactionId");

                done();
            });
    })
});