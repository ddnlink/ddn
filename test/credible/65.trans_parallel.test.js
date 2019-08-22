var node = require('./../variables.js')
var async = require("async");

function createTransfer(address, amount, secret) {
    return node.ddn.transaction.createTransaction(address, amount, null, secret)
}
  
describe("可信区块链测试：并行业务互相不干扰", ()=> {

    var account, account2, account3;

    before((done) => {

        console.log("开始创建测试账户Test");
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
                console.log("创建测试账户Test成功")

                console.log("开始创建测试账户Test2");
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
                        console.log("创建测试账户Test2成功")

                        console.log("开始创建测试账户Test3");
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
                        
                                account3 = res.body;
                                console.log("创建测试账户Test3成功")

                                done();
                            });
                    });
            });
   
    })

    it("利用总账户向Test账户转账10", (done) => {
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

    it("查询Test账户余额", (done) => {
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

    it("并行发起两比交易，从Test账户分别向Test2账户和Test3账户转账3", (done) => {

        async.parallel([
            function(cb) {
                var transaction = createTransfer(account2.address, 300000000, account.secret);
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

                        cb(null, res.body);
                    });
            },
            function(cb) {
                var transaction = createTransfer(account3.address, 300000000, account.secret);
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

                        cb(null, res.body);
                    });
            }
        ],
        (err, results) => {
            done();
        });

    })

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

    it("查询Test2账户余额", (done) => {
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
    
    it("查询Test3账户余额", (done) => {
        node.onNewBlock((err) => {
            node.expect(err).to.be.not.ok;

            node.api.get("/accounts/getBalance?address=" + account3.address)
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

});