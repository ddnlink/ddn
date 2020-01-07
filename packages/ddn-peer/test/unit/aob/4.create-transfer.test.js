const node = require('../../variables.js')

async function createPluginAsset(type, asset, secret, secondSecret) {
    return await node.ddn.assetPlugin.createPluginAsset(type, asset, secret, secondSecret)
}

describe("AOB Test", () => {
    // 加载插件
    node.ddn.init.init();

    it("资产转账 Should be ok", async () => {
        var obj = {
            recipient_id: node.Daccount.address,
            currency: "DDD.NCR",
            aobAmount: "10",
            message: '测试转账',
            fee: '0',
        }

        var transaction = await createPluginAsset(65, obj, node.Eaccount.password, "DDD12345");
        await new Promise((resolve, reject) => {
            node.peer.post("/transactions")
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .send({ transaction })
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    // console.log(res.body);

                    if (err) {
                        return reject(err);
                    }

                    node.expect(res.body).to.have.property("success").to.be.true;

                    resolve();
                });
        });
    })

});