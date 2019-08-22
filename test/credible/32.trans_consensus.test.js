var node = require('./../variables.js')

function createTransfer(address, amount, secret) {
    return node.ddn.transaction.createTransaction(address, amount, null, secret)
}
  
describe("可信区块链测试：无故障与无欺诈的共识", ()=> {

    var account, account2;

    it("创建新账户作为测试账户，命名为Test账户", (done) => {
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

    it("查询Test账户余额", (done) => {
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

    it("创建新账户作为测试账户，命名为Test2账户", (done) => {
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

                account2 = res.body;
                
                done();
            });
    });

    it("查询Test2账户余额", (done) => {
        node.api.get("/accounts/getBalance?address=" + account2.address)
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

    it("利用总账户向测试账户Test转账10", (done) => {
        var transaction = createTransfer(account.address, 1000000000, node.Gaccount.password);
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
    });

    it("再次查询Test账户余额", (done) => {
        node.onNewBlock((err) => {
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

    it("从Test账户向Test2账户转账5，转账成功", (done) => {
        var transaction = createTransfer(account2.address, 500000000, account.secret);
        
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
    });

    it("查询转账后Test账户余额", (done) => {
        node.onNewBlock((err) => {
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

    it("查询转账后Test2账户余额", (done) => {
        node.onNewBlock((err) => {
            node.expect(err).to.be.not.ok;

            node.api.get("/accounts/getBalance?address=" + account2.address)
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

    it("再次从Test账户向Test2账户转账5，Test账户余额为4.9，余额不足返回失败", (done) => {
        var transaction = createTransfer(account2.address, 500000000, account.secret);

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

                done();
            });
    });

});