var node = require('./../variables.js')

describe("可信区块链测试：查询账户历史变更记录", () => {

    it("查询账户ELVckUY5yYWVNvPVDKKtwZCQzvVtPZR5P2历史交易记录", (done) => {

        node.api.get("/transactions?ownerAddress=ELVckUY5yYWVNvPVDKKtwZCQzvVtPZR5P2")
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