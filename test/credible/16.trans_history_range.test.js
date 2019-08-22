var node = require('./../variables.js')

describe("可信区块链测试：查询用户指定范围内的数据", () => {

    it("查询账户ELVckUY5yYWVNvPVDKKtwZCQzvVtPZR5P2指定日期范围内的数据（2018-09-15 14:10:00 至 2018-09-05 14:15:00）", (done) => {

        node.api.get("/transactions?ownerAddress=ELVckUY5yYWVNvPVDKKtwZCQzvVtPZR5P2&startTime=2018-09-05 10:00:00&endTime=2018-09-05 10:10:00&and=1")
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

    })

    it("查询账户ELVckUY5yYWVNvPVDKKtwZCQzvVtPZR5P2最新的一条数据", (done) => {
        
        node.api.get("/transactions?ownerAddress=ELVckUY5yYWVNvPVDKKtwZCQzvVtPZR5P2&offset=0&limit=1")
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

    })

    it("查询目标接收账户地址为ELVckUY5yYWVNvPVDKKtwZCQzvVtPZR5P2的数据", (done) => {
        node.api.get("/transactions?recipientId=ELVckUY5yYWVNvPVDKKtwZCQzvVtPZR5P2")
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
    })

});