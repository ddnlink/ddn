import Debug from 'debug';
import node from '@ddn/node-sdk/lib/test';

const debug = Debug('debug');
const expect = node.expect;

async function createPluginAsset(type, asset, secret, secondSecret) {
    return await node.ddn.assetPlugin.createPluginAsset(type, asset, secret, secondSecret)
}

describe("AOB Test", () => {
    beforeAll(() => {
        // 加载插件
        node.ddn.init();
    })

    it("发行资产 Should be ok", async (done) => {
        const obj = {
            currency: "DDD.NCR",
            aobAmount: "50000000",
            fee: '10000000',
        }

        const transaction = await createPluginAsset(64, obj, node.Eaccount.password, "DDD12345");

        // var transaction = node.ddn.aob.createIssue("DDD.NCR", "100000", node.Eaccount.password, "DDD12345");

        // console.log('transaction:', transaction)

        node.peer.post("/transactions")
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .send({
                transaction
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(body);

                expect(err).to.be.not.ok;
                expect(body).to.have.property("success").to.be.true;

                done();
            });
    })

});