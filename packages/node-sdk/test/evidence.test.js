// import Buffer from "buffer";
import ddn from "../";

// const Buffer = Buffer.Buffer;

describe("DDN evidence.js", () => {
    const evidence = ddn.evidence;

    it("should be object", () => {
        (evidence).should.be.type("object");
    });

    it("should have properties", () => {
        (evidence).should.have.property("createEvidence");
    })

    describe("#createEvidence", () => {
        const createEvidence = evidence.createEvidence;
        let trs = null;

        it("should be a function", () => {
            (createEvidence).should.be.type("function");
        });

        it("should create evidence without second signature", () => {
            const evidence = {
                ipid: "IPIDasdf20180501221md",
				title: "Evidencetitle",
				hash: "contenthash",
                author: "author1",
                url: "dat://helloworld/index.html",
                tags: "test, article",
				size: 12,
				type: "html"
            };
            trs = createEvidence(evidence, "secret");
            (trs).should.be.ok;
        });

        describe("returned evidence", () => {
            it("should be object", () => {
                (trs).should.be.type("object");
            });

            it("should have id as string", () => {
                (trs.id).should.be.type("string");
            });

            it("should have type as number and eqaul 0", () => {
                (trs.type).should.be.type("number").and.equal(20);
            });

            it("should have timestamp as number", () => {
                (trs.timestamp).should.be.type("number").and.not.NaN;
            });

            it("should have senderPublicKey as hex string", () => {
                (trs.senderPublicKey).should.be.type("string").and.match(() => {
                    try {
                        Buffer.from(trs.senderPublicKey, "hex")
                    } catch (e) {
                        return false;
                    }

                    return true;
                })
            });

            it("should have empty asset object", () => {
                (trs.asset).should.be.type("object").and.empty;
            });

            it("should does not have second signature", () => {
                (trs).should.not.have.property("signSignature");
            });

            it("should have signature as hex string", () => {
                (trs.signature).should.be.type("string").and.match(() => {
                    try {
                        Buffer.from(trs.signature, "hex")
                    } catch (e) {
                        return false;
                    }

                    return true;
                })
            });

            it("should be signed correctly", () => {
                const result = ddn.crypto.verify(trs);
                (result).should.be.ok;
            });

        });
    });

});
