var node = require('../variables.js')
var async = require("async");

function createTransfer(address, amount, secret) {
    return node.ddn.transaction.createTransaction(address, amount, null, secret)
}

describe("可信区块链测试：最大交易确认时间", ()=> {

    var account, account2, account3, account4, account5;

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

                                console.log("开始创建测试账户Test4");
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
                                
                                        account4 = res.body;
                                        console.log("创建测试账户Test4成功")

                                        console.log("开始创建测试账户Test5");
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
                                        
                                                account4 = res.body;
                                                console.log("创建测试账户Test5成功")
        
                                                done();
                                            });
                                    });
                            });
                    });
            });
   
    })

    var execNum = 40;
    var sumTime1 = 0, sumTime2 = 0, sumTime3 = 0, sumTime4 = 0, sumTime5 = 0;

    it("并行发起转账等操作，并同时记录交易落块时间", (done) => {
        function test1(num, cb) {
            if (num < execNum) {
                console.log("开始发起交易")
                var transaction = createTransfer(account.address, 10000000, node.Gaccount.password);
        
                var sTime = node.getRealTime(transaction.timestamp);
                var sDate = new Date(sTime);
                console.log("交易发起时间：" + sDate.toLocaleString() +　"（" + transaction.timestamp + "）");
        
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
                        console.log("交易成功，等待确认")

                        node.onNewBlock((err) => {
                            node.expect(err).to.be.not.ok;
        
                            console.log("交易确认成功，生成区块")
                            console.log("查询最新确认区块的高度")
                            
                            node.api.get("/blocks/getheight")
                                .set("Accept", "application/json")
                                .set("version", node.version)
                                .set("nethash", node.config.nethash)
                                .set("port", node.config.port)
                                .expect("Content-Type", /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    console.log(JSON.stringify(res.body));
                                    node.expect(res.body).to.have.property('success').to.be.true;
                                    console.log("得到区块高度，开始查询区块信息")
                                    node.api.get("/blocks/get?height=" + res.body.height)
                                    .set("Accept", "application/json")
                                    .set("version", node.version)
                                    .set("nethash", node.config.nethash)
                                    .set("port", node.config.port)
                                    .expect("Content-Type", /json/)
                                    .expect(200)
                                    .end(function (err, res) {
                                        console.log(JSON.stringify(res.body));
                                        node.expect(res.body).to.have.property('success').to.be.true;
                                        console.log("获得区块信息，查看交易确认时间")

                                        var eTime = node.getRealTime(res.body.block.timestamp);
                                        var eDate = new Date(eTime);
                                        console.log("交易确认时间：" + eDate.toLocaleString() +　"（" + res.body.block.timestamp + "）");
                                        
                                        var diff = res.body.block.timestamp - transaction.timestamp;
                                        console.log("交易确认花费时间：" + diff + " 秒");

                                        sumTime1 += diff;

                                        test1(num + 1, cb);
                                    });
                            });
                        });

                    });
            } else {
                cb(null, 1);
            }
        }

        function test2(num, cb) {
            if (num < execNum) {
                console.log("开始发起交易")
                var transaction2 = createTransfer(account.address, 1000000, node.Gaccount.password);
        
                var sTime = node.getRealTime(transaction2.timestamp);
                var sDate = new Date(sTime);
                console.log("交易发起时间：" + sDate.toLocaleString() +　"（" + transaction2.timestamp + "）");
        
                node.peer.post("/transactions")
                    .set("Accept", "application/json")
                    .set("version", node.version)
                    .set("nethash", node.config.nethash)
                    .set("port", node.config.port)
                    .send({
                        transaction: transaction2
                    })
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end(function (err, res) {

                        console.log(JSON.stringify(res.body));
                        node.expect(res.body).to.have.property("success").to.be.true;
                        console.log("交易成功，等待确认")

                        node.onNewBlock((err) => {
                            node.expect(err).to.be.not.ok;
        
                            console.log("交易确认成功，生成区块")
                            console.log("查询最新确认区块的高度")
                            
                            node.api.get("/blocks/getheight")
                                .set("Accept", "application/json")
                                .set("version", node.version)
                                .set("nethash", node.config.nethash)
                                .set("port", node.config.port)
                                .expect("Content-Type", /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    console.log(JSON.stringify(res.body));
                                    node.expect(res.body).to.have.property('success').to.be.true;
                                    console.log("得到区块高度，开始查询区块信息")
                                    node.api.get("/blocks/get?height=" + res.body.height)
                                    .set("Accept", "application/json")
                                    .set("version", node.version)
                                    .set("nethash", node.config.nethash)
                                    .set("port", node.config.port)
                                    .expect("Content-Type", /json/)
                                    .expect(200)
                                    .end(function (err, res) {
                                        console.log(JSON.stringify(res.body));
                                        node.expect(res.body).to.have.property('success').to.be.true;
                                        console.log("获得区块信息，查看交易确认时间")

                                        var eTime = node.getRealTime(res.body.block.timestamp);
                                        var eDate = new Date(eTime);
                                        console.log("交易确认时间：" + eDate.toLocaleString() +　"（" + res.body.block.timestamp + "）");
                                        
                                        var diff2 = res.body.block.timestamp - transaction2.timestamp;
                                        console.log("交易确认花费时间：" + diff2 + " 秒");

                                        sumTime2 += diff2;

                                        test2(num + 1, cb);
                                    });
                            });
                        });

                    });
            } else {
                cb(null, 2);
            }
        }

        function test3(num, cb) {
            if (num < execNum) {
                console.log("开始发起交易")
                var transaction3 = createTransfer(account.address, 100000, node.Gaccount.password);
        
                var sTime = node.getRealTime(transaction3.timestamp);
                var sDate = new Date(sTime);
                console.log("交易发起时间：" + sDate.toLocaleString() +　"（" + transaction3.timestamp + "）");
        
                node.peer.post("/transactions")
                    .set("Accept", "application/json")
                    .set("version", node.version)
                    .set("nethash", node.config.nethash)
                    .set("port", node.config.port)
                    .send({
                        transaction: transaction3
                    })
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end(function (err, res) {

                        console.log(JSON.stringify(res.body));
                        node.expect(res.body).to.have.property("success").to.be.true;
                        console.log("交易成功，等待确认")

                        node.onNewBlock((err) => {
                            node.expect(err).to.be.not.ok;
        
                            console.log("交易确认成功，生成区块")
                            console.log("查询最新确认区块的高度")
                            
                            node.api.get("/blocks/getheight")
                                .set("Accept", "application/json")
                                .set("version", node.version)
                                .set("nethash", node.config.nethash)
                                .set("port", node.config.port)
                                .expect("Content-Type", /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    console.log(JSON.stringify(res.body));
                                    node.expect(res.body).to.have.property('success').to.be.true;
                                    console.log("得到区块高度，开始查询区块信息")
                                    node.api.get("/blocks/get?height=" + res.body.height)
                                    .set("Accept", "application/json")
                                    .set("version", node.version)
                                    .set("nethash", node.config.nethash)
                                    .set("port", node.config.port)
                                    .expect("Content-Type", /json/)
                                    .expect(200)
                                    .end(function (err, res) {
                                        console.log(JSON.stringify(res.body));
                                        node.expect(res.body).to.have.property('success').to.be.true;
                                        console.log("获得区块信息，查看交易确认时间")

                                        var eTime = node.getRealTime(res.body.block.timestamp);
                                        var eDate = new Date(eTime);
                                        console.log("交易确认时间：" + eDate.toLocaleString() +　"（" + res.body.block.timestamp + "）");
                                        
                                        var diff3 = res.body.block.timestamp - transaction3.timestamp;
                                        console.log("交易确认花费时间：" + diff3 + " 秒");

                                        sumTime3 += diff3;

                                        test3(num + 1, cb);
                                    });
                            });
                        });

                    });
            } else {
                cb(null, 3);
            }
        }

        function test4(num, cb) {
            if (num < execNum) {
                console.log("开始发起交易")
                var transaction4 = createTransfer(account.address, 10000, node.Gaccount.password);
        
                var sTime = node.getRealTime(transaction4.timestamp);
                var sDate = new Date(sTime);
                console.log("交易发起时间：" + sDate.toLocaleString() +　"（" + transaction4.timestamp + "）");
        
                node.peer.post("/transactions")
                    .set("Accept", "application/json")
                    .set("version", node.version)
                    .set("nethash", node.config.nethash)
                    .set("port", node.config.port)
                    .send({
                        transaction: transaction4
                    })
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end(function (err, res) {

                        console.log(JSON.stringify(res.body));
                        node.expect(res.body).to.have.property("success").to.be.true;
                        console.log("交易成功，等待确认")

                        node.onNewBlock((err) => {
                            node.expect(err).to.be.not.ok;
        
                            console.log("交易确认成功，生成区块")
                            console.log("查询最新确认区块的高度")
                            
                            node.api.get("/blocks/getheight")
                                .set("Accept", "application/json")
                                .set("version", node.version)
                                .set("nethash", node.config.nethash)
                                .set("port", node.config.port)
                                .expect("Content-Type", /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    console.log(JSON.stringify(res.body));
                                    node.expect(res.body).to.have.property('success').to.be.true;
                                    console.log("得到区块高度，开始查询区块信息")
                                    node.api.get("/blocks/get?height=" + res.body.height)
                                    .set("Accept", "application/json")
                                    .set("version", node.version)
                                    .set("nethash", node.config.nethash)
                                    .set("port", node.config.port)
                                    .expect("Content-Type", /json/)
                                    .expect(200)
                                    .end(function (err, res) {
                                        console.log(JSON.stringify(res.body));
                                        node.expect(res.body).to.have.property('success').to.be.true;
                                        console.log("获得区块信息，查看交易确认时间")

                                        var eTime = node.getRealTime(res.body.block.timestamp);
                                        var eDate = new Date(eTime);
                                        console.log("交易确认时间：" + eDate.toLocaleString() +　"（" + res.body.block.timestamp + "）");
                                        
                                        var diff4 = res.body.block.timestamp - transaction4.timestamp;
                                        console.log("交易确认花费时间：" + diff4 + " 秒");

                                        sumTime4 += diff4;

                                        test4(num + 1, cb);
                                    });
                            });
                        });

                    });
            } else {
                cb(null, 4);
            }
        }

        function test5(num, cb) {
            if (num < execNum) {
                console.log("开始发起交易")
                var transaction5 = createTransfer(account.address, 1000, node.Gaccount.password);
        
                var sTime = node.getRealTime(transaction5.timestamp);
                var sDate = new Date(sTime);
                console.log("交易发起时间：" + sDate.toLocaleString() +　"（" + transaction5.timestamp + "）");
        
                node.peer.post("/transactions")
                    .set("Accept", "application/json")
                    .set("version", node.version)
                    .set("nethash", node.config.nethash)
                    .set("port", node.config.port)
                    .send({
                        transaction: transaction5
                    })
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end(function (err, res) {

                        console.log(JSON.stringify(res.body));
                        node.expect(res.body).to.have.property("success").to.be.true;
                        console.log("交易成功，等待确认")

                        node.onNewBlock((err) => {
                            node.expect(err).to.be.not.ok;
        
                            console.log("交易确认成功，生成区块")
                            console.log("查询最新确认区块的高度")
                            
                            node.api.get("/blocks/getheight")
                                .set("Accept", "application/json")
                                .set("version", node.version)
                                .set("nethash", node.config.nethash)
                                .set("port", node.config.port)
                                .expect("Content-Type", /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    console.log(JSON.stringify(res.body));
                                    node.expect(res.body).to.have.property('success').to.be.true;
                                    console.log("得到区块高度，开始查询区块信息")
                                    node.api.get("/blocks/get?height=" + res.body.height)
                                    .set("Accept", "application/json")
                                    .set("version", node.version)
                                    .set("nethash", node.config.nethash)
                                    .set("port", node.config.port)
                                    .expect("Content-Type", /json/)
                                    .expect(200)
                                    .end(function (err, res) {
                                        console.log(JSON.stringify(res.body));
                                        node.expect(res.body).to.have.property('success').to.be.true;
                                        console.log("获得区块信息，查看交易确认时间")

                                        var eTime = node.getRealTime(res.body.block.timestamp);
                                        var eDate = new Date(eTime);
                                        console.log("交易确认时间：" + eDate.toLocaleString() +　"（" + res.body.block.timestamp + "）");
                                        
                                        var diff5 = res.body.block.timestamp - transaction5.timestamp;
                                        console.log("交易确认花费时间：" + diff5 + " 秒");

                                        sumTime5 += diff5;

                                        test5(num + 1, cb);
                                    });
                            });
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
            var avgTime = (sumTime1 / execNum + sumTime2 / execNum + sumTime3 / execNum + sumTime4 / execNum + sumTime5 / execNum) / 5;
            console.log("交易平均确认时间：" + avgTime + " 秒");

            done();
        });
    });    

});