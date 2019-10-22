"use strict";

var path = require("path");
var spawn = require("child_process").spawn;

// Requires and node configuration
var DEBUG = require('debug')('accounts')
var node = require("./../variables.js")

// Account info for password "ddntest"
// New account does not have publickey in db
var AccountTest = {
    "address": node.constants.tokenPrefix + "4tEjMLbAMcwgLpcsmTW4rLyz3maZdBRtZ",
    "balance": 0,
    "publicKey": "4ebfcc2c652fbc27cfbedb8c985566cd673a5e0e32e266434a0030d28e332984",
    "secondSignature": "",
    "secondPublicKey": "",
    "multisignatures": "",
    "u_multisignatures": "",
    "lockHeight": "0",  //bignum update
    "password": "ddntest"
};

var Gaccount = node.Gaccount
Gaccount.balance=9990881532094328

describe("POST /accounts/open", function () {
    it("Using valid passphrase: " + AccountTest.password + ". Should be ok", async function () {
        var res = await node.openAccountAsync({ secret: AccountTest.password })
        // console.log(JSON.stringify(res.body));
        node.expect(res.body).to.have.property("success").to.be.true;
        node.expect(res.body).to.have.property("account").that.is.an("object");
        node.expect(res.body.account.address).to.equal(AccountTest.address);
        node.expect(res.body.account.public_key).to.equal(AccountTest.publicKey);
        AccountTest.balance = res.body.account.balance;
    });

    it("Using empty json. Should fail", async function () {
        var res = await node.openAccountAsync({})
        node.expect(res.body).to.have.property("success").to.be.false;
        node.expect(res.body).to.have.property("error");
    });

    it("Using empty passphrase. Should fail", async function () {
        var res = await node.openAccountAsync({ secoret: '' })
        node.expect(res.body).to.have.property("success").to.be.false;
        node.expect(res.body).to.have.property("error");
    });

    it("Using invalid json. Should fail", async function () {
        var res = await node.openAccountAsync("{\"invalid\"}")
        node.expect(res.body).to.have.property("success").to.be.false;
        node.expect(res.body).to.have.property("error");
    });
});

describe("GET /accounts/count", function () {

  it("Using valid params. Should be ok", function (done) {
      node.api.get("/accounts/count")
          .set("Accept", "application/json")
          .expect("Content-Type", /json/)
          .expect(200)
          .end(function (err, res) {
            //   console.log(JSON.stringify(res.body));
              node.expect(res.body).to.have.property("success").to.be.true;
              node.expect(res.body).to.have.property("count");
              // node.expect(res.body.balance).to.equal(AccountTest.balance);
              done();
          });
  });
});

describe("GET /accounts/top", function () {

  it("Using valid params. Should be ok", function (done) {
      node.api.get("/accounts/top")
          .set("Accept", "application/json")
          .expect("Content-Type", /json/)
          .expect(200)
          .end(function (err, res) {
              // console.log(JSON.stringify(res.body));
              node.expect(res.body).to.have.property("success").to.be.true;
              node.expect(res.body).to.have.property("accounts").that.is.an("Array");
              // node.expect(res.body.balance).to.equal(AccountTest.balance);
              done();
          });
  });
});

describe("GET /accounts/getBalance", function () {

    it("Using valid params. Should be ok", function (done) {
        node.api.get("/accounts/getBalance?address=" + AccountTest.address)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.true;
                node.expect(res.body).to.have.property("balance");
                node.expect(res.body.balance).to.equal(AccountTest.balance);
                done();
            });
    });

    it("Using invalid address. Should fail", function (done) {
        node.api.get("/accounts/getBalance?address=thisIsNOTADdnAddress")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("Using no address. Should fail", function (done) {
        node.api.get("/accounts/getBalance")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });
});

describe("GET /accounts/getPublicKey", function () {

    it("Using valid address. Should be ok", function (done) {
        node.api.get("/accounts/getPublicKey?address=" + Gaccount.address)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                node.expect(res.body).to.have.property("success").to.be.true;
                node.expect(res.body).to.have.property("publicKey");
                node.expect(res.body.publicKey).to.equal(Gaccount.publicKey);
                done();
            });
    });

    it("Using invalid address. Should fail", function (done) {
        node.api.get("/accounts/getPublicKey?address=thisIsNOTADdnAddress")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                done();
            });
    });

    it("Using no address. Should fail", function (done) {
        node.api.get("/accounts/getPublicKey?address=")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                // expect(res.body.error).to.contain("Provide valid DDN address");
                done();
            });
    });

    it("Using valid params. Should be ok", function (done) {
        node.api.post("/accounts/generatePublicKey")
            .set("Accept", "application/json")
            .send({
                secret: AccountTest.password
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.true;
                node.expect(res.body).to.have.property("publicKey");
                node.expect(res.body.publicKey).to.equal(AccountTest.publicKey);
                done();
            });
    });
});

describe("POST /accounts/generatePublicKey", function () {

    it("Using empty passphrase. Should fail", function (done) {
        node.api.post("/accounts/generatePublicKey")
            .set("Accept", "application/json")
            .send({
                secret: ""
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                // node.expect(res.body.error).to.contain("Provide secret key");
                done();
            });
    });

    it("Using no params. Should fail", function (done) {
        node.api.post("/accounts/generatePublicKey")
            .set("Accept", "application/json")
            .send({})
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                // node.expect(res.body.error).to.contain("Provide secret key");
                done();
            });
    });

    it("Using invalid json. Should fail", function (done) {
        node.api.post("/accounts/generatePublicKey")
            .set("Accept", "application/json")
            .send("{\"invalid\"}")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                // node.expect(res.body.error).to.contain("Provide secret key");
                done();
            });
    });
});

describe("GET /accounts?address=", function () {

    it("Using valid address. Should be ok", function (done) {
        node.api.get("/accounts?address=" + AccountTest.address)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.true;
                node.expect(res.body).to.have.property("account").that.is.an("object");
                node.expect(res.body.account.address).to.equal(AccountTest.address);
                // node.expect(res.body.account.publicKey).to.equal(AccountTest.publicKey);
                node.expect(res.body.account.balance).to.equal(AccountTest.balance);
                done();
            });
    });

    it("Using invalid address. Should fail", function (done) {
        node.api.get("/accounts?address=thisIsNOTAValidDdnAddress")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                // expect(res.body.error).to.contain("Provide valid DDN address");
                done();
            });
    });

    it("Using empty address. Should fail", function (done) {
        node.api.get("/accounts?address=")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property("success").to.be.false;
                node.expect(res.body).to.have.property("error");
                // node.expect(res.body.error).to.contain("Provide address in url");
                done();
            });
    });
});
