import Debug from 'debug';
import node from '@ddn/node-sdk/lib/test';

const debug = Debug('debug');
const expect = node.expect;

async function createPluginAsset(type, asset, secret, secondSecret) {
    return await node.ddn.assetPlugin.createPluginAsset(type, asset, secret, secondSecret)
}

function randomCurrencName() {
    return node.randomIssuerName("DDN.", 3);
}

describe("AOB Test", () => {
    // 加载插件
    node.ddn.init();

    it("开启白名单 Should be ok", async (done) => {
        const obj = {
            currency: randomCurrencName(),
            flag: 1,
            flag_type: 1
        };
        const transaction = await createPluginAsset(62, obj, node.Eaccount.password, "DDD12345");
        node.peer.post("/transactions")
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .send({ transaction })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                // console.log('body', body);

                expect(err).be.not.ok;

                expect(body).to.have.property("success").to.be.true;

                done();
            });
    })

    it("资产转账 Should be fail", async (done) => {
        await node.onNewBlockAsync();

        const obj = {
            recipientId: node.Daccount.address,
            currency: randomCurrencName(),
            aobAmount: "10",
            message: '测试转账',
            fee: '0',
        };

        const transaction = await createPluginAsset(65, obj, node.Eaccount.password, "DDD12345");
        node.peer.post("/transactions")
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .send({ transaction })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                debug(body);

                expect(err).be.not.ok;
                expect(body).to.have.property("success").to.be.false;
                expect(body).to.have.property("error").equal("Permission not allowed.");

                done();
            });
    })

    it("增加Daccount到白名单 Should be ok", async (done) => {
        const obj = {
            currency: randomCurrencName(),
            flag: 1,
            operator: "+",
            list: [
                node.Daccount.address
            ].join(",")
        };
        const transaction = await createPluginAsset(63, obj, node.Eaccount.password, "DDD12345");
        node.peer.post("/transactions")
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .send({ transaction })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                debug('body', body);

                expect(err).be.not.ok;

                expect(body).to.have.property("success").to.be.true;

                done();
            });
    });

    it("资产转账 Should be ok", async (done) => {
        await node.onNewBlockAsync();

        const obj = {
            recipientId: node.Daccount.address,
            currency: randomCurrencName(),
            aobAmount: "10",
            message: '测试转账',
            fee: '0',
        };

        const transaction = await createPluginAsset(65, obj, node.Eaccount.password, "DDD12345");
        node.peer.post("/transactions")
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .send({ transaction })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                debug(body);
                expect(err).be.not.ok;

                expect(body).to.have.property("success").to.be.true;

                done();
            });
    })

    it("在白名单删除Daccount Should be ok", async (done) => {
        const obj = {
            currency: randomCurrencName(),
            flag: 1,
            operator: "-",
            list: [
                node.Daccount.address
            ].join(",")
        };
        const transaction = await createPluginAsset(63, obj, node.Eaccount.password, "DDD12345");

        node.peer.post("/transactions")
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .send({ transaction })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                debug('body', body);

                expect(err).be.not.ok;

                expect(body).to.have.property("success").to.be.true;

                done();
            });
    });

    it("资产转账 Should be fail", async (done) => {
        await node.onNewBlockAsync();

        const obj = {
            recipientId: node.Daccount.address,
            currency: randomCurrencName(),
            aobAmount: "10",
            message: '测试转账',
            fee: '0',
        };

        const transaction = await createPluginAsset(65, obj, node.Eaccount.password, "DDD12345");

        node.peer.post("/transactions")
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .send({ transaction })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                debug(body);

                expect(err).be.not.ok;

                expect(body).to.have.property("success").to.be.false;
                expect(body).to.have.property("error").equal("Permission not allowed.");

                done();
            });
    })

    it("关闭白名单 Should be ok", async (done) => {
        const obj = {
            currency: randomCurrencName(),
            flag: 2,
            flag_type: 1
        };
        const transaction = await createPluginAsset(62, obj, node.Eaccount.password, "DDD12345");

        node.peer.post("/transactions")
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .send({ transaction })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                // console.log('body', body);

                expect(err).be.not.ok;

                expect(body).to.have.property("success").to.be.true;

                done();
            });
    })

    it("资产转账 Should be ok", async (done) => {
        await node.onNewBlockAsync();

        const obj = {
            recipientId: node.Daccount.address,
            currency: randomCurrencName(),
            aobAmount: "10",
            message: '测试转账',
            fee: '0',
        };

        const transaction = await createPluginAsset(65, obj, node.Eaccount.password, "DDD12345");

        node.peer.post("/transactions")
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .send({ transaction })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                debug(body);

                expect(err).be.not.ok;

                expect(body).to.have.property("success").to.be.true;

                done();
            });
    })

});