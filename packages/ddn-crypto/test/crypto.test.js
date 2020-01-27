"use strict";
const sha256 = require("fast-sha256");
const crypto = require("crypto");

// const ddnCrypto = require("..");

describe("ddn-crypto", () => {
    it("needs tests", () => {
        const h1 = crypto
            .createHash("sha256")
            .update("data")
            .digest();

        const h2 = sha256("data");

        console.log('h1= ', h1);
        console.log('h2= ', h2);
        
        expect(h1 == h2);
    });
});
