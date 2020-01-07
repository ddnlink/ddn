const node = require('../../variables.js')

async function createTransfer(address, amount, secret) {
    return node.ddn.dao.createTransfer(address, amount, secret)
}

async function createPluginAsset(type, asset, secret, secondSecret) {
    return await node.ddn.assetPlugin.createPluginAsset(type, asset, secret, secondSecret)
}

describe("AOB Test", () => {
    // 加载插件
    node.ddn.init.init();

    it("注册资产 Should be ok", async () => {
        var obj = {
            name: "DDD.NCR",
            desc: "DDD新币种",
            maximum: "100000000",
            precision: 2,
            strategy: '',
            allow_blacklist: '1',
            allow_whitelist: '1',
            allow_writeoff: '1',
            fee: '50000000000'
        }

        var transaction = await createPluginAsset(61, obj, node.Eaccount.password, "DDD12345");

        // var transaction = node.ddn.aob.createAsset("DDD.NCR", "DDD新币种", "100000000", 2, '', 0, 0, 0, node.Eaccount.password, "DDD12345");

        // console.log('transaction:', transaction)

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
                    // console.log('res.body', res.body);

                    if (err) {
                        return reject(err);
                    }

                    node.expect(res.body).to.have.property("success").to.be.true;

                    resolve();
                });
        });
    })

});