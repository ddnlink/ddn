import crypto from "crypto";

import node from "../node";
import genesisblock from "../../genesisBlocks";
const message = "test";

describe("POST /peer/transactions", () => {
  it("Using valid transaction with wrong nethash in headers. Should fail", done => {
    const transaction = node.ddn.transaction.createTransaction("1", 1, message, node.Gaccount.password);

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
      .end((err, {body}) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property("success").to.be.false;
        node.expect(body.expected).to.equal(node.config.nethash);
        done();
      });
  });

  it("Using same valid transaction with correct nethash in headers. Should be ok", done => {
    const transaction = node.ddn.transaction.createTransaction("1", 1, message, node.Gaccount.password);

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
      .end((err, {body}) => {
        console.log(JSON.stringify(body));
        node.expect(body).to.have.property("success").to.be.true;
        done();
      });
  });

  it("Using transaction with undefined recipientId. Should fail", done => {
    const transaction = node.ddn.transaction.createTransaction(undefined, 1, message, node.Gaccount.password);
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
      .end((err, {body}) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property("success").to.be.false;
        node.expect(body).to.have.property("error");
        done();
      });
  });

  it("Using transaction with negative amount. Should fail", done => {
    const transaction = node.ddn.transaction.createTransaction("1", -1, message, node.Gaccount.password);
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
      .end((err, {body}) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property("success").to.be.false;
        node.expect(body).to.have.property("error");
        done();
      });
  });

  it("Using invalid passphrase. Should fail", done => {
    const transaction = node.ddn.transaction.createTransaction("12", 1, message, node.Gaccount.password);
    transaction.recipientId = "1";
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
      .end((err, {body}) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property("success").to.be.false;
        node.expect(body).to.have.property("error");
        done();
      });
  });

  it("When sender has no funds. Should fail", done => {
    const transaction = node.ddn.transaction.createTransaction("1", 1, message, "randomstring");
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
      .end((err, {body}) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property("success").to.be.false;
        node.expect(body).to.have.property("error");
        done();
      });
  });

  it("Usin fake signature. Should fail", done => {
    const transaction = node.ddn.transaction.createTransaction("12", 1, message, node.Gaccount.password);
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
      .end((err, {body}) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property("success").to.be.false;
        node.expect(body).to.have.property("error");
        done();
      });
  });

  it("Using invalid publicKey and signature. Should fail", done => {
    const transaction = node.ddn.transaction.createTransaction("12", 1, message, node.Gaccount.password);
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
      .end((err, {body}) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property("success").to.be.false;
        node.expect(body).to.have.property("error");
        done();
      });
  });

  it("Using very large amount and genesis block id. Should fail", done => {
    const transaction = node.ddn.transaction.createTransaction("12", node.constants.totalAmount, message, node.Gaccount.password);
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
      .end((err, {body}) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property("success").to.be.false;
        setTimeout(done, 30000);
      });
  });

  it("Using overflown amount. Should fail", done => {
    const transaction = node.ddn.transaction.createTransaction("12", 184819291270000000012910218291201281920128129, message, node.Gaccount.password);
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
      .end((err, {body}) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property("success").to.be.false;
        node.expect(body).to.have.property("error");
        done();
      });
  });

  it("Using float amount. Should fail", done => {
    const transaction = node.ddn.transaction.createTransaction("12", 1.3, message, node.Gaccount.password);
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
      .end((err, {body}) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property("success").to.be.false;
        node.expect(body).to.have.property("error");
        done();
      });
  });
});
