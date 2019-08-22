var node = require('./../variables.js')
var async = require("async");

function createTransfer(address, amount, secret) {
    return node.ddn.transaction.createTransaction(address, amount, null, secret)
}

describe("可信区块链测试：修改节点配置的稳定性", ()=> {

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

    it("利用总账户向Test账户转账100", (done) => {
        var transaction = createTransfer(account.address, 10000000000, node.Gaccount.password);
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

    it("并行发起转账、查询等操作，并同时监控节点CPU状态", (done) => {

        function test1(num, cb) {
            if (num < 5) {
                node.onNewBlock((err) => {
                    node.expect(err).to.be.not.ok;

                    console.log("开始从Test帐户向Test2帐户转账")
                    var transaction = createTransfer(account2.address, 100000000, account.secret);
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
                            console.log("向Test2帐户转账成功完成：" + JSON.stringify(res.body));
                            node.expect(res.body).to.have.property("success").to.be.true;

                            test1(num + 1, cb);
                        });
                });
            } else {
                cb(null, 1);
            }
        }

        function test2(num, cb) {
            if (num < 5) {
                node.onNewBlock((err) => {
                    node.expect(err).to.be.not.ok;

                    console.log("开始从Test帐户向Test3帐户转账")
                    var transaction = createTransfer(account3.address, 100000000, account.secret);
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
                            console.log("向Test3帐户转账成功完成：" + JSON.stringify(res.body));
                            node.expect(res.body).to.have.property("success").to.be.true;

                            test2(num + 1, cb);
                        });
                });
            } else {
                cb(null, 2);
            }
        }

        function test3(num, cb) {
            if (num < 5) {
                node.onNewBlock((err) => {
                    node.expect(err).to.be.not.ok;

                    console.log("开始查询Test账户的余额信息")
                    node.api.get("/accounts/getBalance?address=" + account.address)
                        .set("Accept", "application/json")
                        .set("version", node.version)
                        .set("nethash", node.config.nethash)
                        .set("port", node.config.port)
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .end(function (err, res) {
                            console.log("查询Test账户的余额信息完成：" + JSON.stringify(res.body));
                            node.expect(res.body).to.have.property('success').to.be.true;

                            test3(num + 1, cb);
                        });
                });
            } else {
                cb(null, 3);
            }
        }

        function test4(num, cb) {
            if (num < 5) {
                node.onNewBlock((err) => {
                    node.expect(err).to.be.not.ok;

                    console.log("开始查询Test2账户的余额信息")
                    node.api.get("/accounts/getBalance?address=" + account2.address)
                        .set("Accept", "application/json")
                        .set("version", node.version)
                        .set("nethash", node.config.nethash)
                        .set("port", node.config.port)
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .end(function (err, res) {
                            console.log("查询Test2账户的余额信息完成：" + JSON.stringify(res.body));
                            node.expect(res.body).to.have.property('success').to.be.true;

                            test4(num + 1, cb);
                        });
                });
            } else {
                cb(null, 4);
            }
        }

        function test5(num, cb) {
            if (num < 5) {
                node.onNewBlock((err) => {
                    node.expect(err).to.be.not.ok;

                    console.log("开始查询Test3账户的余额信息")
                    node.api.get("/accounts/getBalance?address=" + account3.address)
                        .set("Accept", "application/json")
                        .set("version", node.version)
                        .set("nethash", node.config.nethash)
                        .set("port", node.config.port)
                        .expect("Content-Type", /json/)
                        .expect(200)
                        .end(function (err, res) {
                            console.log("查询Test3账户的余额信息完成：" + JSON.stringify(res.body));
                            node.expect(res.body).to.have.property('success').to.be.true;

                            test5(num + 1, cb);
                        });
                });
            } else {
                cb(null, 5);
            }
        }

        async.parallel([
            function(cb) {
                test1(0, cb);
            },
            function(cb) {
                test2(0, cb);
            },
            function(cb) {
                test3(0, cb);
            },
            function(cb) {
                test4(0, cb);
            },
            function(cb) {
                test5(0, cb);
            }
        ],
        (err, results) => {
            done();
        });

    })

});