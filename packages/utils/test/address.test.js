import DdnUtil from "../lib";
const { address } = DdnUtil;

describe("test/address.test.js", () => {
    it("should ok", () => {
        const addr = address.generateBase58CheckAddress('abc');
        expect(address.isAddress(addr)).toBe(true);
    });
});
