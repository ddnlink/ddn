var node = require('./../variables.js')
var async = require("async");

function createTransfer(address, amount, secret) {
    return node.ddn.transaction.createTransaction(address, amount, null, secret)
}

describe("可信区块链测试：网络延迟", ()=> {

    var account;

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

                done();
            });
   
    })

    it("利用总账户向Test账户转账10", (done) => {
        var transaction = createTransfer(account.address, 1000000000, node.Gaccount.password);

        var sTime = node.getRealTime(transaction.timestamp);
        var sDate = new Date(sTime);
        console.log("交易请求发起时间：" + sDate.toLocaleString() +　"（" + sDate.getTime() + "）");

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
                var eDate = new Date();
                console.log("交易请求答复时间：" + eDate.toLocaleString() +　"（" + eDate.getTime() + "）");
                console.log("交易用时：" + (eDate.getTime() - sDate.getTime()) + " ms");
                
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.true;

                done();
            });
    });

});