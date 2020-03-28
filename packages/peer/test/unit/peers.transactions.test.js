import crypto from "crypto";
import path from 'path';
import {
    requireFile
} from '@ddn/core/lib/getUserConfig';

import node from "../node";

const message = "test";

// Node configuration
const genesisblockFile = path.resolve(process.cwd(), './examples/fun-tests/config/genesisBlock.json');
const genesisblock = requireFile(genesisblockFile);

describe("POST /peer/transactions", () => {
    beforeAll((done) => {
        node.ddn.init();
        done();
    });

    it("Using valid transaction with wrong nethash in headers. Should fail", async done => {
        const transaction = await node.ddn.transaction.createTransaction(node.Daccount.address, 1, message, node.Gaccount.password);

        node.peer.post("/transactions")
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", "wrongnet")
            .set("port", node.config.port)
            .send({
                transaction
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end((err, {
                body
            }) => {
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body.expected).to.equal(node.config.nethash);
                done();
            });
    });

    it("Using same valid transaction with correct nethash in headers. Should be ok", async done => {
        const transaction = await node.ddn.transaction.createTransaction(node.Daccount.address, 1, message, node.Gaccount.password);

        console.log('transaction= ', transaction);

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
                console.log(JSON.stringify(body));
                node.expect(body).to.have.property("success").to.be.true;
                done();
            });
    });

    it("Using transaction with undefined recipientId. Should fail", async done => {
        const transaction = await node.ddn.transaction.createTransaction(undefined, 1, message, node.Gaccount.password);
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
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("Using transaction with negative amount. Should fail", async done => {
        const transaction = await node.ddn.transaction.createTransaction(node.Daccount.address, -1, message, node.Gaccount.password);
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
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("Using invalid passphrase. Should fail", async done => {
        const transaction = await node.ddn.transaction.createTransaction(node.Daccount.address, 1, message, node.Gaccount.password);
        transaction.recipientId = node.Daccount.address;
        transaction.id = node.ddn.crypto.getId(transaction); // 这里提供是不对的
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
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("When sender has no funds. Should fail", async done => {
        const transaction = await node.ddn.transaction.createTransaction(node.Daccount.address, 1, message, "randomstring");
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
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("Usin fake signature. Should fail", async done => {
        const transaction = await node.ddn.transaction.createTransaction(node.Daccount.address, 1, message, node.Gaccount.password);
        transaction.signature = crypto.randomBytes(64).toString("hex");
        transaction.id = node.ddn.crypto.getId(transaction);
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
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("Using invalid publicKey and signature. Should fail", async done => {
        const transaction = await node.ddn.transaction.createTransaction(node.Daccount.address, 1, message, node.Gaccount.password);
        transaction.signature = node.randomPassword();
        transaction.senderPublicKey = node.randomPassword();
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
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("Using very large amount and genesis block id. Should fail", async done => {
        const transaction = await node.ddn.transaction.createTransaction(node.Daccount.address, node.constants.totalAmount, message, node.Gaccount.password);
        transaction.blockId = genesisblock.id;

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
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                done()
            });
    });

    it("Using overflown amount. Should fail", async done => {
        const transaction = await node.ddn.transaction.createTransaction(node.Daccount.address, 184819291270000000012910218291201281920128129, message, node.Gaccount.password);
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
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });

    it("Using float amount. Should fail", async done => {
        const transaction = await node.ddn.transaction.createTransaction(node.Daccount.address, 1.3, message, node.Gaccount.password);
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
                // console.log(JSON.stringify(res.body));
                node.expect(body).to.have.property("success").to.be.false;
                node.expect(body).to.have.property("error");
                done();
            });
    });
});