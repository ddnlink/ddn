// passed
import Debug from 'debug';
import node from '@ddn/node-sdk/lib/test';
import DdnUtils from '@ddn/utils';

const debug = Debug('debug');

async function createTransfer(address, amount, secret, second_secret) {
    return await node.ddn.transaction.createTransaction(address, amount, null, secret, second_secret)
}

let orgId = "";

// 投稿测试
describe('Contributions Test', () => {
    let transaction;
    let contribution;
    
    beforeAll(async (done) => {

        // 先要获取组织号
        const transaction = await createTransfer(node.Daccount.address, 10000000000, node.Gaccount.password);
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
                debug(JSON.stringify(body))
                node.expect(err).to.be.not.ok;
                node.expect(body).to.have.property("success").to.be.true;
                done();
            });

        const getOrgIdUrl = `/dao/orgs/address/${node.Gaccount.address}`;
        node.api.get(getOrgIdUrl)
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect(200)
            .end((err, {
                body
            }) => {
                node.expect(err).to.be.not.ok;
                node.expect(body).to.have.property("success").to.be.true;

                orgId = body.data.org.orgId;
                debug('orgId', JSON.stringify(orgId));

                done();
            });
    });

    // Daccount 用户投稿给 Gaccount
    it("POST peers/transactions to contribute should be ok", async (done) => {
        await node.onNewBlockAsync();

        contribution = {
            title: "from /transactions",
            sender_address: node.Daccount.address,
            received_address: node.Gaccount.address,
            url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
            price: "0"
        }

        transaction = await node.ddn.assetPlugin.createPluginAsset(DdnUtils.assetTypes.DAO_CONTRIBUTION, contribution, node.Daccount.password); // 42
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
                debug("POST peers/transactions", JSON.stringify(body));
                node.expect(err).to.be.not.ok;

                node.expect(body).to.have.property("success").to.be.true;

                done();
            });
    });

    // 使用接口投稿
    it("PUT /api/dao/contributions/:orgId to contribute should be ok", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            contribution = {
                title: "from /contributions",
                url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                price: `${(Math.random() * 100).toFixed(0) * 100000000}`,
                secret: node.Daccount.password
            }

            node.api.put(`/dao/contributions/${orgId}`)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .send(contribution)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug("PUT /api/dao/contributions/:orgId", JSON.stringify(body));
                    node.expect(err).to.be.not.ok;

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });

    // 检索投稿者投过的记录
    it("GET /api/dao/contributions/all?sender_address= should be ok", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            let reqUrl = "/dao/contributions/all";
            reqUrl += `?sender_address=${node.Daccount.address}`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug("GET /api/dao/contributions/all?sender_address=", JSON.stringify(body));
                    node.expect(err).to.be.not.ok;

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });

    // 检索组织号收到的投稿记录
    it("GET /api/dao/contributions/:orgId/all", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const reqUrl = `/dao/contributions/${orgId}/all`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug(reqUrl, JSON.stringify(body));

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });

    // 可以根据文章 url 以及投稿人的公钥检索
    it("GET /api/dao/contributions/:orgId/all?url should be ok", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const keys = node.ddn.crypto.getKeys(node.Gaccount.password);

            let reqUrl = `/dao/contributions/${orgId}/all`;
            reqUrl += `?senderPublicKey=${keys.publicKey}&url=${encodeURIComponent("dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html")}`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug("GET /api/dao/contributions/:orgId/all?", JSON.stringify(body));
                    node.expect(err).to.be.not.ok;

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    })

    // 根据收稿地址检索全部收稿记录
    it("GET /api/dao/contributions/all", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            let reqUrl = "/dao/contributions/all";
            reqUrl += `?received_address=${node.Gaccount.address}`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug("GET /api/dao/contributions/all", JSON.stringify(body));
                    node.expect(err).to.be.not.ok;

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    })

});

// 收稿确认
describe('Confirmations Test', () => {
    let transaction;
    let confirmation;
    
    // let orgId = "";
    let contributionTrsId = "";
    let contributionPrice = "0";
    
    // 先获得组织号下的全部收稿
    beforeAll((done) => {
        // Fixme:  2020.6.15 得使用一个标识，保证检索到的就是没有确认的才行
        // const getContributionTrsIdUrl = `/dao/contributions?received_address=${node.Gaccount.address}&pagesize=1&sort=timestamp:desc`;
        const getContributionTrsIdUrl = `/dao/contributions/${orgId}/all?received_address=${node.Gaccount.address}&pagesize=1&sort=timestamp:desc`;
        node.api.get(getContributionTrsIdUrl)
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug("getContributionTrsIdUrl", getContributionTrsIdUrl);

                node.expect(err).to.be.not.ok;
                node.expect(body).to.have.property("success").to.be.true;

                // 确保获取最新投稿
                contributionTrsId = body.data.rows[0].transaction_id;
                contributionPrice = body.data.rows[0].price;

                done();
            });
    });

    // 通用：确认收稿
    it("POST peers/transactions to confirmate should be ok", (done) => {
        node.onNewBlock(async (err) => {
            node.expect(err).to.be.not.ok;

            const state = (Math.random() * 100).toFixed(0) % 2;

            confirmation = {
                sender_address: node.Gaccount.address,
                received_address: node.Daccount.address,
                url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                contribution_trs_id: contributionTrsId, //确保每次运行都是新的投稿id，才能通过测试
                state,
                amount: state == 1 ? contributionPrice : "0",
                recipientId: state == 1 ? node.Daccount.address : "",
            };

            transaction = await node.ddn.assetPlugin.createPluginAsset(DdnUtils.assetTypes.DAO_CONFIRMATION, confirmation, node.Gaccount.password);
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
                    debug("contribute, ok", JSON.stringify(body));

                    node.expect(err).to.be.not.ok;
                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    });

    // 接口：确认交易
    it("PUT /api/dao/confirmations/ again should be already confirmed ok", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const state = (Math.random() * 100).toFixed(0) % 2;

            confirmation = {
                title: 'test title',
                url: "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
                contributionTrsId, // 同样的投稿 id
                state,
                secret: node.Gaccount.password
            }

            node.api.put(`/dao/confirmations`)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .send(confirmation)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug("already confirmed ok", JSON.stringify(body));
                    node.expect(err).to.be.not.ok;

                    node.expect(body).to.have.property("success").to.be.false;
                    node.expect(body).to.have.property("error").to.include("The contribution has been confirmed");
                    done();
                });
        });
    })

    it("GET /api/dao/confirmations/:orgId/all", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const keys = node.ddn.crypto.getKeys(node.Gaccount.password);

            let reqUrl = `/dao/confirmations/${orgId}/all`;
            reqUrl += `?senderPublicKey=${keys.publicKey}`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug(reqUrl, JSON.stringify(body));
                    node.expect(err).to.be.not.ok;

                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    })

    it("GET /api/dao/confirmations/:orgId/all?url", (done) => {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;

            const keys = node.ddn.crypto.getKeys(node.Daccount.password);

            let reqUrl = `/dao/confirmations/${orgId}/all`;
            reqUrl += `?senderPublicKey=${keys.publicKey}&url=${encodeURIComponent("dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html")}`;

            node.api.get(reqUrl)
                .set("Accept", "application/json")
                .set("version", node.version)
                .set("nethash", node.config.nethash)
                .set("port", node.config.port)
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    debug(reqUrl, JSON.stringify(body));
                    node.expect(err).to.be.not.ok;
                    node.expect(body).to.have.property("success").to.be.true;
                    done();
                });
        });
    })

});