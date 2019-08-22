const node = require('../../variables.js')

async function createPluginAsset(type, asset, secret, secondSecret) {
    return await node.ddn.assetPlugin.createPluginAsset(type, asset, secret, secondSecret)
}

describe("AOB Test", () => {
    // 加载插件
    node.ddn.init.init();

    it ("开启白名单 Should be ok", async() => {
        var obj = {
            currency: "DDD.NCR",
            flag: 1,
            flag_type: 1
        }
        var transaction = await createPluginAsset(62, obj, node.Eaccount.password, "DDD12345");
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

    it("资产转账 Should be fail", async () => {
        await node.onNewBlockAsync();

        var obj = {
            recipient_id: node.Daccount.address,
            currency: "DDD.NCR",
            aobAmount: "10",
            message: '测试转账',
            fee: '0',
        }

        var transaction = await createPluginAsset(65, obj, node.Eaccount.password, "DDD12345");

        // var transaction = node.ddn.aob.createTransfer("DDD.NCR", "10", node.Daccount.address, "测试转账", node.Eaccount.password, "DDD12345");
        // console.log('transaction', transaction)

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

                    node.expect(res.body).to.have.property("success").to.be.false;
                    node.expect(res.body).to.have.property("error").equal("Permission not allowed.");

                    resolve();
                });
        });
    })

    it ("关闭白名单 Should be ok", async() => {
        var obj = {
            currency: "DDD.NCR",
            flag: 2,
            flag_type: 1
        }
        var transaction = await createPluginAsset(62, obj, node.Eaccount.password, "DDD12345");
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

    it("资产转账 Should be ok", async () => {
        await node.onNewBlockAsync();

        var obj = {
            recipient_id: node.Daccount.address,
            currency: "DDD.NCR",
            aobAmount: "10",
            message: '测试转账',
            fee: '0',
        }

        var transaction = await createPluginAsset(65, obj, node.Eaccount.password, "DDD12345");

        // var transaction = node.ddn.aob.createTransfer("DDD.NCR", "10", node.Daccount.address, "测试转账", node.Eaccount.password, "DDD12345");
        // console.log('transaction', transaction)

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

    // it ("注销资产", async() => {
    //     var obj = {
    //         currency: "DDD.NCR",
    //         flag: 1,
    //         flag_type: 2
    //     }
    //     var transaction = await createPluginAsset(62, obj, node.Eaccount.password, "DDD12345");

    //     await new Promise((resolve, reject) => {
    //         node.peer.post("/transactions")
    //             .set("Accept", "application/json")
    //             .set("version", node.version)
    //             .set("nethash", node.config.nethash)
    //             .set("port", node.config.port)
    //             .send({ transaction })
    //             .expect("Content-Type", /json/)
    //             .expect(200)
    //             .end(function (err, res) {
                //     // console.log('res.body', res.body);

    //                 if (err) {
    //                     return reject(err);
    //                 }

    //                 node.expect(res.body).to.have.property("success").to.be.true;

    //                 resolve();
    //             });
    //     });
    // })

});