"use strict";
import sha256 from "fast-sha256";
import crypto from "crypto";
import ddnCrypto from "../lib/";
import RIPEMD160 from "ripemd160";
import base58check from "../lib/base58check";

describe("crypto", () => {
    describe("#sha256.hash", function() {
        it("sha256.hash is crypto.createHash('sha256') ", () => {
            const h1 = crypto
                .createHash("sha256")
                .update("data")
                .digest();
            const h2 = Buffer.from(sha256.hash(Buffer.from("data")));

            expect(h1).toStrictEqual(h2);
        });

        it("Buffer.from(data, 'hex') !== Buffer.from(data).toString('hex')", () => {
            const buf1 = Buffer.from('publicKey', "hex");
            const buf2 = Buffer.from('publicKey').toString("hex");

            expect(buf1).not.toBe(buf2);
        });

        it('should Buffer.from(sha256.hash(bytes)) is ok', () => {
            const bytes = Buffer.from('test');

            const result1 = Buffer.from(sha256.hash(bytes));
            const result2 = Buffer.from(sha256.hash(bytes));

            console.log('result1= ', result1);
            console.log('result2= ', result2);
            
            expect(result1).toEqual(result2);
        });

        // test('should ', () => {
        //     // const keypair = nacl.sign.keyPair.fromSeed(hash);
        // });
    });

    describe("#generateAddress", function() {
        const generateAddress = ddnCrypto.generateAddress;

        it("should be a function", function() {
            expect(typeof generateAddress).toBe("function");
        });

        it("should generate address by publicKey", function() {
            const kp = ddnCrypto.keypair("secret");
            const address = ddnCrypto.generateAddress(kp.publicKey, "D");

            expect(address).toEqual("DFkctfgZFkaATGRhGbj72wzJqACvMyzQ1U");
        });

        it('the process is ok', () => {
            // 1. 获得一个随机字符串，也称为助记词
            // const secret = ddnCrypto.generateSecret();
            const secret = "you cousin patch lemon luxury picture impact lens slogan exotic purse hole";
            // 2. 产生公私钥对
            const kp = ddnCrypto.keypair(secret); 
            // const kp = ddnCrypto.getKeys(secret);

            // 3. 对公钥进行sha256 hash 计算
            const hashPubKey = Buffer.from(sha256.hash(kp.publicKey));

            // 4. 进一步进行RIPEMD-160哈希计算
            const Ripemd160 = new RIPEMD160().update(hashPubKey).digest();

            // 5. 使用Base58Check编码将结果从字节字符串转换为base58字符串
            const strBase58 = base58check.encode(Ripemd160);

            // 6. 在上述转码后的前直接添加前缀（比如：D)
            const address = "D" + strBase58;

            expect(kp.publicKey).toEqual('50e18b1d5ee084680fbc5cc34cdc4aaa1c4fe23662a3376c8bf5b33d3b16c4ae');
            expect(address).toEqual('DCz8KXfrSQD61SEZv5PYETNaJZMbgHk4cx');
        });
    });
});
