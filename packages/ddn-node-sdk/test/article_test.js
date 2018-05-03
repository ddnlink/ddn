var Buffer = require("buffer/").Buffer;
var crypto_lib = require("crypto-browserify");
var should = require("should");
var ddn = require("../index.js");

describe("DDN article.js", function () {
    var article = ddn.article;

    it("should be object", function () {
        (article).should.be.type("object");
    });

    it("should have properties", function () {
        (article).should.have.property("createArticle");
    })

    describe("#createArticle", function () {
        var createArticle = article.createArticle;
        var trs = null;

        it("should be a function", function () {
            (createArticle).should.be.type("function");
        });

        it("should create article without second signature", function () {
            trs = createArticle("123456", "hello-world.md", "hello world", "This is an article.", "secret");
            (trs).should.be.ok;
        });

        describe("returned article", function () {
            it("should be object", function () {
                (trs).should.be.type("object");
            });

            it("should have id as string", function () {
                (trs.id).should.be.type("string");
            });

            it("should have type as number and eqaul 0", function () {
                (trs.type).should.be.type("number").and.equal(15);
            });

            it("should have timestamp as number", function () {
                (trs.timestamp).should.be.type("number").and.not.NaN;
            });

            it("should have senderPublicKey as hex string", function () {
                (trs.senderPublicKey).should.be.type("string").and.match(function () {
                    try {
                        new Buffer(trs.senderPublicKey, "hex")
                    } catch (e) {
                        return false;
                    }

                    return true;
                })
            });

            it("should have empty asset object", function () {
                (trs.asset).should.be.type("object").and.empty;
            });

            it("should does not have second signature", function () {
                (trs).should.not.have.property("signSignature");
            });

            it("should have signature as hex string", function () {
                (trs.signature).should.be.type("string").and.match(function () {
                    try {
                        new Buffer(trs.signature, "hex")
                    } catch (e) {
                        return false;
                    }

                    return true;
                })
            });

            it("should be signed correctly", function () {
                var result = ddn.crypto.verify(trs);
                (result).should.be.ok;
            });

        });
    });

});
