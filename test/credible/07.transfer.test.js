var DEBUG = require('debug')('credible')
var node = require('../variables.js')


function createTransfer(address, amount, secret) {
    return node.ddn.transaction.createTransaction(address, amount, null, secret)
}
  
describe("可信区块链测试：一对一帐户转帐", ()=> {

    var account;

    it("向错误的账户转账100", (done) => {
        transaction = createTransfer("E4gZwiWvTeWd3kCQD8enoxyP4MpgMoPU3Y", 10000000000, node.Gaccount.password);
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
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error").eq("Invalid recipient", "无效的账户");

                done();
            });
    })

    it("创建新账户作为转入账户", (done) => {
        node.api.get("/accounts/new")
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property('success').to.be.true;

                account = res.body;
                
                done();
            });
    });

    it("查询转账前转入账户余额", (done) => {
        node.api.get("/accounts/getBalance?address=" + account.address)
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property('success').to.be.true;
                
                done();
            });
    });

    it("查询转账前转出账户余额", (done) => {
        node.api.get("/accounts/getBalance?address=" + node.Gaccount.address)
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property('success').to.be.true;
                
                done();
            });
    });

    it("从转出账户转账10到转入账户", (done) => {
        transaction = createTransfer(account.address, 1000000000, node.Gaccount.password);
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
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.true;

                done();
            });
    })

    it("转账10成功后查询转入帐户余额", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            node.api.get("/accounts/getBalance?address=" + account.address)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(JSON.stringify(res.body));
                    node.expect(res.body).to.have.property('success').to.be.true;

                    done();
                });
        });
    });

    it("转账10成功后查询转出帐户余额", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            node.api.get("/accounts/getBalance?address=" + node.Gaccount.address)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(JSON.stringify(res.body));
                    node.expect(res.body).to.have.property('success').to.be.true;

                    done();
                });
        });
    });

    it("从转出账户转账超过账户总额的金额到转入账户", (done) => {
        transaction = createTransfer(account.address, "10000000000000000000", node.Gaccount.password);
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
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error").contains("Invalid transaction amount", "无效的转账金额");

                done();
            });
    })

    it("从转出账户转账0.00000001的金额到转入账户", (done) => {
        transaction = createTransfer(account.address, "1", node.Gaccount.password);
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
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.true;

                done();
            });
    })
    it("转账0.00000001成功后查询转入帐户余额", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            node.api.get("/accounts/getBalance?address=" + account.address)
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property('success').to.be.true;

                done();
            });
        });
    });

    it("转账0.00000001成功后查询转出帐户余额", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            node.api.get("/accounts/getBalance?address=" + node.Gaccount.address)
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property('success').to.be.true;

                done();
            });
        });
    });

})