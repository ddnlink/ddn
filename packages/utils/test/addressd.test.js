import { Address } from "../";
// const { Address } = require('../');

describe("test/address.test.js", () => {
    // const { Address } = Utils;
    it("should ok", () => {
        const address = Address.generateBase58CheckAddress('abc');

        expect(Address.isAddress(address)).toBe(true);
    });
});
