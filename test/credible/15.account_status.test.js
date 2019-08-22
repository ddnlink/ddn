var node = require('./../variables.js')

describe("可信区块链测试：查询用户账户当前状态信息", () => {

    it("查询账户ELVckUY5yYWVNvPVDKKtwZCQzvVtPZR5P2的状态信息", (done) => {

        node.api.get("/accounts?address=ELVckUY5yYWVNvPVDKKtwZCQzvVtPZR5P2")
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

})