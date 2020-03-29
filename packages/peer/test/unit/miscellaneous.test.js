import path from 'path';
import Debug from 'debug';
import DdnUtils from '@ddn/utils';

import node from "../node";
import {
    requireFile
} from '@ddn/core/lib/getUserConfig';

const debug = Debug('peer');

const genesisblockFile = path.resolve(process.cwd(), './examples/fun-tests/config/genesisBlock.json');
const genesisblock = requireFile(genesisblockFile);

const block = {
    blockHeight: "0",
    id: 0,
    generatorPublicKey: "",
    totalAmount: "0",
    totalFee: "0"
};

let testBlocksUnder101 = 0;

describe("POST /accounts/open", () => {

    it("When payload is over 2Mb. Should fail", done => {
        node.api.post("/accounts/open")
            .set("Accept", "application/json")
            .send({
                payload: Buffer.allocUnsafe(8 * 1000 * 1000).toString()
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, { body }) => {
                debug(body);
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error").to.equal("PayloadTooLargeError: request entity too large");
                done();
            });
    });
});

describe("GET /peers/version", () => {

    it("Should be ok", done => {
        node.api.get("/peers/version")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("build").to.be.a("string");
                node.expect(body).to.have.property("version").to.be.a("string");
                done();
            });
    });
});

describe("GET /peers", () => {

    it("Using empty parameters. Should fail", done => {
        const state = "";
        const os = "";
        const shared = "";
        const version = "";
        const limit = "";
        const offset = 0;
        const orderBy = "";
        node.api.get(`/peers?state=${state}&os=${os}&shared=${true}&version=${version}&limit=${limit}&offset=${offset}orderBy=${orderBy}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("Using state. Should be ok", done => {
        const state = 1;
        node.api.get(`/peers?state=${state}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("peers").that.is.an("array");
                if (body.peers.length > 0) {
                    for (let i = 0; i < body.peers.length; i++) {
                        node.expect(body.peers[i].state).to.equal(parseInt(state));
                    }
                }
                done();
            });
    });

    it("Using limit. Should be ok", done => {
        const limit = 3;
        const offset = 0;
        node.api.get(`/peers?&limit=${limit}&offset=${offset}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("peers").that.is.an("array");

                // To check it need to have peers
                node.expect(body.peers.length).to.be.at.most(limit);
                done();
            });
    });

    it("Using orderBy. Should be ok", done => {
        const orderBy = "state:desc";
        node.api.get(`/peers?orderBy=${orderBy}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("peers").that.is.an("array");

                if (body.peers.length > 0) {
                    for (let i = 0; i < body.peers.length; i++) {
                        if (body.peers[i + 1] != null) {
                            node.expect(body.peers[i + 1].state).to.at.most(body.peers[i].state);
                        }
                    }
                }

                done();
            });

    });

    it("Using limit > 100. Should fail", done => {
        const limit = 101;
        node.api.get(`/peers?&limit=${limit}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("Using invalid parameters. Should fail", done => {
        const state = "invalid";
        const os = "invalid";
        const shared = "invalid";
        const version = "invalid";
        const limit = "invalid";
        const offset = "invalid";
        const orderBy = "invalid";
        node.api.get(`/peers?state=${state}&os=${os}&shared=${shared}&version=${version}&limit=${limit}&offset=${offset}orderBy=${orderBy}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });
});

describe("GET /blocks/getHeight", () => {

    it("Should be ok", done => {
        node.api.get("/blocks/getHeight")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                if (body.success == true && body.height != null) {
                    node.expect(body).to.have.property("height").to.be.above(0);
                    if (body.success == true) {
                        block.blockHeight = body.height;
                        if (body.height > 100) {
                            if (DdnUtils.bignum.isGreaterThan(body.height, 100)) {
                                testBlocksUnder101 = true;
                                done();
                            }
                        }
                    } else {
                        debug("Request failed or height is null");
                        done();
                    }
                }
            });
    });
});

describe("GET /blocks/getFee", () => {

    it("Should be ok", done => {
        node.api.get("/blocks/getFee")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                if (body.success == true && body.fee != null) {
                    node.expect(body).to.have.property("fee");
                    node.expect(body.fee).to.equal(node.Fees.transactionFee);
                } else {
                    debug("Request failed or fee is null");
                }
                done();
            });
    });
});

//该接口不存在
// describe("GET /blocks/getFees", function () {

//     it.skip("Should be ok", function (done) {
//         node.api.get("/blocks/getFees")
//             .set("Accept", "application/json")
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end(function (err, {body}) {
//             // debug(JSON.stringify(body));
//             node.expect(body).to.have.property("success").to.be.true;
//             if (body.success == true && body.fees != null) {
//                 node.expect(body).to.have.property("fees");
//                 node.expect(body.fees.send).to.equal(node.Fees.transactionFee);
//                 node.expect(body.fees.vote).to.equal(node.Fees.voteFee);
//                 node.expect(body.fees.dapp).to.equal(node.Fees.dappAddFee);
//                 node.expect(body.fees.secondsignature).to.equal(node.Fees.secondPasswordFee);
//                 node.expect(body.fees.delegate).to.equal(node.Fees.delegateRegistrationFee);
//                 node.expect(body.fees.multisignature).to.equal(node.Fees.multisignatureRegistrationFee);
//             } else {
//               console.log("Request failed or fees is null");
//             }
//             done();
//           });
//     });
// });

//该接口不存在
// describe("GET /blocks/getNethash", function () {

//     it.skip("Get blockchain nethash. Should be ok", function (done) {
//         node.api.get("/blocks/getNethash")
//             .set("Accept", "application/json")
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end(function (err, {body}) {
//                 // debug(JSON.stringify(body));
//                 node.expect(body).to.have.property("success").to.be.true;
//                 if (body.success == true && body.nethash != null) {
//                     node.expect(body).to.have.property("nethash");
//                     node.expect(body.nethash).to.equal(node.config.nethash);
//                 } else {
//                     console.log("Request failed or nethash is null");
//                 }
//                 done();
//             });
//     });
// });

describe("GET /blocks", () => {

    it("Using height. Should be ok", done => {
        const height = block.blockHeight;
        const limit = 100;
        const offset = 0;
        node.api.get(`/blocks?height=${height}&limit=${limit}&offset=${offset}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                if (body.success == true && body.blocks != null) {
                    node.expect(body).to.have.property("blocks").that.is.an("array");
                    node.expect(body).to.have.property("count").to.equal(1);
                    node.expect(body.blocks.length).to.equal(1);
                    node.expect(body.blocks[0]).to.have.property("previous_block");
                    node.expect(body.blocks[0]).to.have.property("total_amount");
                    node.expect(body.blocks[0]).to.have.property("total_fee");
                    node.expect(body.blocks[0]).to.have.property("generator_id");
                    node.expect(body.blocks[0]).to.have.property("confirmations");
                    node.expect(body.blocks[0]).to.have.property("block_signature");
                    node.expect(body.blocks[0]).to.have.property("number_of_transactions");
                    node.expect(body.blocks[0].height).to.equal(block.blockHeight);
                    block.id = body.blocks[0].id;
                    block.generatorPublicKey = body.blocks[0].generator_public_key;
                    block.totalAmount = body.blocks[0].total_amount;
                    block.totalFee = body.blocks[0].total_fee;
                } else {
                    console.log("Request failed or blocks array is null");
                }
                done();
            });
    });

    it("Using height < 100. Should be ok", done => {
        if (testBlocksUnder101) {
            const height = 10;
            node.api.get(`/blocks?height=${height}`)
                .set("Accept", "application/json")
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, {
                    body
                }) => {
                    // debug(JSON.stringify(body));
                    node.expect(body).to.have.property("success").to.be.true;
                    if (body.success == true && body.blocks != null) {
                        node.expect(body).to.have.property("count");
                        node.expect(body).to.have.property("blocks").that.is.an("array");
                        node.expect(body.blocks.length).to.equal(1);
                        node.expect(body.blocks[0]).to.have.property("previous_block");
                        node.expect(body.blocks[0]).to.have.property("total_amount");
                        node.expect(body.blocks[0]).to.have.property("total_fee");
                        node.expect(body.blocks[0]).to.have.property("generator_id");
                        node.expect(body.blocks[0]).to.have.property("confirmations");
                        node.expect(body.blocks[0]).to.have.property("block_signature");
                        node.expect(body.blocks[0]).to.have.property("number_of_transactions");
                        node.expect(body.blocks[0].height).to.equal("10");
                        block.id = body.blocks[0].id;
                        block.generatorPublicKey = body.blocks[0].generator_public_key;
                        block.totalAmount = body.blocks[0].totalAmount;
                        block.totalFee = body.blocks[0].totalFee;
                    } else {
                        console.log("Request failed or blocks array is null");
                    }
                    done();
                });
        } else {
            done();
        }
    });

    it("Using generatorPublicKey. Should be ok", done => {
        const generatorPublicKey = block.generatorPublicKey;
        const limit = 100;
        const offset = 0;
        const orderBy = "";
        node.api.get(`/blocks?generatorPublicKey=${generatorPublicKey}&limit=${limit}&offset=${offset}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("blocks").that.is.an("array");
                for (let i = 0; i < body.blocks.length; i++) {
                    node.expect(body.blocks[i].generator_public_key).to.equal(block.generatorPublicKey);
                }
                done();
            });
    });

    it("Using totalFee. Should be ok", done => {
        const totalFee = block.totalFee;
        const limit = 100;
        const offset = 0;
        node.api.get(`/blocks?totalFee=${totalFee}&limit=${limit}&offset=${offset}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("blocks").that.is.an("array");
                for (let i = 0; i < body.blocks.length; i++) {
                    node.expect(body.blocks[i].total_fee).to.equal(block.totalFee);
                }
                done();
            });
    });

    it("Using totalAmount. Should be ok", done => {
        const totalAmount = block.totalAmount;
        const limit = 100;
        const offset = 0;
        node.api.get(`/blocks?totalAmount=${totalAmount}&limit=${limit}&offset=${offset}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("blocks").that.is.an("array");
                for (let i = 0; i < body.blocks.length; i++) {
                    node.expect(body.blocks[i].total_amount).to.equal(block.totalAmount);
                }
                done();
            });
    });

    it("Using previousBlock. Should be ok", done => {
        if (block.id != null) {
            const previousBlock = block.id;
            node.onNewBlock(err => {
                node.expect(err).to.be.not.ok;
                node.api.get(`/blocks?previousBlock=${previousBlock}`)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end((err, {
                        body
                    }) => {
                        // debug(JSON.stringify(body));
                        node.expect(body).to.have.property("success").to.be.true;
                        node.expect(body).to.have.property("blocks").that.is.an("array");
                        node.expect(body.blocks).to.have.length(1);
                        node.expect(body.blocks[0].previous_block).to.equal(previousBlock);
                        done();
                    });
            });
        }
    });

    it("Using orderBy. Should be ok", done => {
        const orderBy = "height:desc";
        node.api.get(`/blocks?orderBy=${orderBy}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("blocks").that.is.an("array");
                for (let i = 0; i < body.blocks.length; i++) {
                    if (body.blocks[i + 1] != null) {
                        node.expect(body.blocks[i].height).to.be.above(body.blocks[i + 1].height);
                        const bRet = DdnUtils.bignum.isGreaterThanOrEqualTo(body.blocks[i].height, body.blocks[i + 1].height);
                        node.expect(bRet).to.be.true;
                    }
                }
                done();
            });
    });
});

describe("GET /blocks/get?id=", () => {

    it("Using genesisblock id. Should be ok", done => {
        const genesisblockId = genesisblock.id;
        debug('genesisblockId= ', genesisblockId);

        node.api.get(`/blocks/get?id=${genesisblockId}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                debug(JSON.stringify(body));
                debug(body.block);
                node.expect(body).to.have.property("success").to.be.true;
                node.expect(body).to.have.property("block").to.be.a("object");
                node.expect(body.block).to.have.property("id").to.be.a("string");
                done();
            });
    });

    it("Using unknown id. Should be fail", done => {
        const unknownId = "9928719876370886655";

        node.api.get(`/blocks/get?id=${unknownId}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error").to.be.a("string");
                done();
            });
    });

    it("Using no id. Should be fail", done => {
        node.api.get(`/blocks/get?id=${null}`)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // debug(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error").to.be.a("string");
                done();
            });
    });
});