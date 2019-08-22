var node = require('./../variables.js')

function createTransfer(address, amount, secret) {
    return node.ddn.transaction.createTransaction(address, amount, null, secret)
}

describe("可信区块链测试：系统在线升级", ()=> {

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

    it("并行发起转账、查询等操作", (done) => {

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

                    done();
                });
        });

    })

});