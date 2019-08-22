var DEBUG = require('debug')('dao')
var node = require('../../variables.js')

var Account1 = node.randomTxAccount();
var Account2 = node.randomTxAccount();
var transaction, contribution;

async function createTransfer(address, amount, secret, second_secret) {
    return await node.ddn.transaction.createTransaction(address, amount, null, secret, second_secret)
}

describe('Contributions Test', () => {

    var orgId = "";

    before(async () => {
        node.ddn.init.init();

        var transaction = await createTransfer(node.Daccount.address, 10000000000, node.Gaccount.password);
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
                    // console.log(JSON.stringify(res.body))
                    node.expect(res.body).to.have.property("success").to.be.true;

                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        });

        var getOrgIdUrl = "/org/address/" + node.Gaccount.address;
        await new Promise((resolve, reject) => {
            node.api.get(getOrgIdUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect(200)
                .end(function (err, res) {
                    // console.log(JSON.stringify(res.body));

                    node.expect(res.body).to.have.property("success").to.be.true;

                    if (err) {
                        return reject(err);
                    }

                    if (res.body.success) {
                        orgId = res.body.data.org.org_id;
                    }

                    resolve();
                });
        })
    });

    it("POST peers/transactions", async () => {
        await node.onNewBlockAsync();

        contribution = {
            title: "from /transactions",
            sender_address: node.Daccount.address,
            received_address: node.Gaccount.address,
            url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
            price: "0"
        }

        transaction = await node.ddn.assetPlugin.createPluginAsset(42, contribution, node.Daccount.password);
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
                .end(function (err, res) {
                    // console.log(JSON.stringify(res.body));

                    node.expect(res.body).to.have.property("success").to.be.true;

                    if (err) {
                        return reject(err);
                    }

                    resolve();
                });
        })
    });

    it("PUT /api/contribution/:orgId", (done) => {
        node.onNewBlock(function (err) {
            node.expect(err).to.be.not.ok;

            contribution = {
                title: "from /contributions",
                url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                price: ((Math.random() * 100).toFixed(0) * 100000000) + "",
                secret: node.Daccount.password
            }

            node.api.put("/contribution/" + orgId)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .send(contribution)
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    // console.log(JSON.stringify(res.body));

                    node.expect(res.body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });

    it("GET /api/contribution/list", (done) => {
        node.onNewBlock(function (err) {
            node.expect(err).to.be.not.ok;

            var reqUrl = "/contribution/list";
            reqUrl += "?sender_address=" + node.Daccount.address;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    // console.log(JSON.stringify(res.body));

                    node.expect(res.body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });

    it("GET /api/contribution/:orgId/list", (done) => {
        node.onNewBlock(function (err) {
            node.expect(err).to.be.not.ok;

            var reqUrl = "/contribution/" + orgId + "/list";

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    // console.log(JSON.stringify(res.body));

                    node.expect(res.body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });

    it("GET /api/contribution/:orgId/list?url", (done) => {
        node.onNewBlock(function (err) {
            node.expect(err).to.be.not.ok;

            var keys = node.ddn.crypto.getKeys(node.Gaccount.password);

            var reqUrl = "/contribution/" + orgId + "/list";
            reqUrl += "?senderPublicKey=" + keys.publicKey + "&url=" +
                encodeURIComponent("dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html");

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    // console.log(JSON.stringify(res.body));

                    node.expect(res.body).to.have.property("success").to.be.true;
                    done();
                });
        });
    })

    it("GET /api/contribution/list", (done) => {
        node.onNewBlock(function (err) {
            node.expect(err).to.be.not.ok;

            var reqUrl = "/contribution/list";
            reqUrl += "?received_address=" + node.Gaccount.address;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    // console.log(JSON.stringify(res.body));

                    node.expect(res.body).to.have.property("success").to.be.true;
                    done();
                });
        });
    })

});
