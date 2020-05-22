"use strict";
import sha256 from "fast-sha256";
import crypto from "crypto";
import ddnCrypto from "../lib";
import RIPEMD160 from "ripemd160";
import base58check from "../lib/base58check";
import { Buffer } from "buffer";
import Debug from 'debug';
import node from '@ddn/node-sdk/lib/test';

const debug = Debug('debug');

async function createTransfer(address, amount, secret) {
    return await node.ddn.transaction.createTransaction(address, amount, null, secret);
}

describe("crypto", () => {
    describe("#sha256.hash", function () {
        it("sha256.hash is crypto.createHash('sha256') ", () => {
            const str = 'data';
            const h1 = crypto
                .createHash("sha256")
                .update(str)
                .digest();

            const h2 = Buffer.from(sha256.hash(Buffer.from(str)));
            const h3 = sha256.hash(Buffer.from(str));

            expect(h1).toStrictEqual(h2);
            expect(h1).not.toEqual(h3);
        });

        it("Buffer.from(data, 'hex') !== Buffer.from(data).toString('hex')", () => {
            // 加密 -> 转为 hex
            const buf1 = Buffer.from('publicKey').toString("hex");
            // 解密 -> 解码
            const buf2 = Buffer.from('publicKey', "hex");

            const buf3 = Buffer.from(buf1, 'hex');

            expect(buf1).not.toBe(buf2);
            expect(buf3).not.toBe('publicKey');
        });

        it('should Buffer.from(sha256.hash(bytes)) is ok', () => {
            const bytes = Buffer.from('test');

            const result1 = Buffer.from(sha256.hash(bytes));
            const result2 = Buffer.from(sha256.hash(bytes));

            debug('result1= ', result1);
            debug('result2= ', result2);

            expect(result1).toEqual(result2);
        });
    });

    describe("#getHash", () => {
        const getHash = ddnCrypto.getHash;

        it("should be a function", () => {
            expect(typeof getHash).toBe("function");
        })

        it("length should be 64", async function () {
            const trs = await createTransfer(node.Eaccount.address, "10000000000000", node.Gaccount.password);
            const hash = await getHash(trs);
            debug(hash);
            expect(hash.length).toBe(64);
        });
    })

    describe("#sign", () => {
        const sign = ddnCrypto.sign;

        it("should be a function", () => {
            expect(typeof sign).toBe("function");
        })

        it("length should be 64", async function () {
            const keypair = await ddnCrypto.getKeys('secret');
            const trs = await createTransfer(node.Eaccount.address, "10000000000000", node.Gaccount.password);
            const signature = await sign(trs, keypair);
            const str = Buffer.from(signature, 'hex'); // 必须解密
            expect(str.length).toBe(64);
        });

        it('signature should be 64', () => {
            const sign = 'a803070ed9ce06792363f7601c1e45ead7f7d5293455c64da95ad0fc635c82aaeb5dd21cae6afc1fe50a36049f890c047efb3b2480bc32d4904440ebc371f205';
            const str = Buffer.from(sign, 'hex');
            debug('str', str);
            expect(str.length).toEqual(64);
        });
    })

    describe("#generateAddress", function () {
        const generateAddress = ddnCrypto.generateAddress;

        it("should be a function", function () {
            expect(typeof generateAddress).toBe("function");
        });

        it("should generate address by publicKey", function () {
            const kp = ddnCrypto.getKeys("secret");
            const address = ddnCrypto.generateAddress(kp.publicKey, "D");

            const kp2 = ddnCrypto.getKeys("enter boring shaft rent essence foil trick vibrant fabric quote indoor output");
            const address2 = ddnCrypto.generateAddress(kp2.publicKey, "D");
            debug('address2', address2);
            expect(kp2.publicKey).toStrictEqual('daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1');
            expect(address2).toEqual('DC5kJzMdNDhrnupWX2NGafzMoiwdHiySBe');
            // expect(address).toEqual("DFkctfgZFkaATGRhGbj72wzJqACvMyzQ1U");
            expect(address).toEqual("DFAZqQx6BxVyW63EqfZQBZYa1CTg7qH3oJ");
        });

        it('should be ok', () => {
            // 1. 获得一个随机字符串，也称为助记词
            // const secret = ddnCrypto.generateSecret();
            const secret = "you cousin patch lemon luxury picture impact lens slogan exotic purse hole";
            // 2. 产生公私钥对
            // const kp = ddnCrypto.keypair(secret); 
            const kp = ddnCrypto.getKeys(secret);

            // 3. 对公钥进行sha256 hash 计算
            const hashPubKey = Buffer.from(sha256.hash(kp.publicKey));

            // 4. 进一步进行RIPEMD-160哈希计算
            const Ripemd160 = new RIPEMD160().update(hashPubKey).digest();

            // 5. 使用Base58Check编码将结果从字节字符串转换为base58字符串
            const strBase58 = base58check.encode(Ripemd160);

            // 6. 在上述转码后的前直接添加前缀（比如：D)
            const address = "D" + strBase58;

            expect(kp.publicKey).toEqual('1c4fd85dc2a0752864d1454bdc37a9e7f9a09fa2c83f1f8d4da9d9bfdd38ed65'); // 2be3d7a21dd9715d949c58910b38d01a063cfe8159320aa426b2249a6aaf1340
            expect(address).toEqual('DLNxuHtMwn7MrmcSmatFLHb9YPgfZ5uxMr');
        });
    });

    describe("#getKeys", function () {
        it('The same secret should get a same keyPairs', () => {
            const secret = "you cousin patch lemon luxury picture impact lens slogan exotic purse hole";
            const kp = ddnCrypto.getKeys(secret);
            const kp1 = ddnCrypto.getKeys(secret);

            debug(kp.publicKey, kp1.publicKey);

            expect(kp.publicKey).toEqual('1c4fd85dc2a0752864d1454bdc37a9e7f9a09fa2c83f1f8d4da9d9bfdd38ed65');
            expect(kp.publicKey).toEqual(kp1.publicKey);
        });


        it('Multi toString("hex") should be not equal', done => {
            const Phasekey = ddnCrypto.generateSecret();
            const publicKey = ddnCrypto.getKeys(Phasekey).publicKey;

            node.expect(publicKey).to.be.a('string');

            const publicKey2 = publicKey.toString('hex');
            const publicKey3 = publicKey2.toString('hex');
            
            debug('Multi toString("hex") publicKey', publicKey, publicKey2, publicKey3);

            expect(publicKey).toEqual(publicKey2);
            expect(publicKey2).toEqual(publicKey3);

            done()
        })

    });


});
