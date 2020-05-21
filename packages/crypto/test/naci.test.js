import nacl from 'tweetnacl';
import crypto from "crypto";
import DdnCrypto from "../";

import node from "@ddn/node-sdk/lib/test";
import Debug from 'debug';
import { Buffer } from 'buffer';

const debug = Debug('debug');
const expect = node.expect;

describe('NaCI', () => {

    it('Length is 32', () => {
        const kp = nacl.box.keyPair('test');

        // const secretKey = 'IOzP5GrKUs8xWJvikHo8BFhwPfV6kgZh4triBDr18SbwqNE27gFckpl042OkzsfN/V/zkuO/qR06tugnt92lzA==';
        // 加密
        const arr = '1asdfasdf21asdfasdf21asdfasdf21asdfasdf21asdfasdf21asdfasdf2qwer1asdfasdf21asdfasdf21asdfasdf21asdfasdf21asdfasdf21asdfasdf2qwer';

        const secretKey = Buffer.from(arr).toString('base64');
        // 解密
        const sKey = new Uint8Array(Array.prototype.slice.call(Buffer.from(secretKey, 'base64'), 0));

        debug(sKey);
        // debug(nacl.secretbox.keyLength);

        expect(kp.secretKey.length).be.equal(nacl.secretbox.keyLength);
        expect(sKey.length).be.equal(128);
    });

    it("crypto.createHash('sha256').update(str).digest() should be not Buffer.from(nacl.hash())", () => {
        const strBuffer = Buffer.from('test');
        const cryptoHash = crypto.createHash('sha256').update(strBuffer).digest();
        const naclHash = Buffer.from(nacl.hash(strBuffer));

        expect(cryptoHash).be.not.equal(naclHash);
    })

    it("crypto.createHash('sha256').update(bytes) == push ?", () => {
        let strBuffer = Buffer.from('test');
        let hashes = crypto.createHash('sha256').update(strBuffer);

        [1, 2, 3].forEach(e => {
            strBuffer = Buffer.from('tt'+ e);
            hashes = crypto.createHash('sha256').update(strBuffer);
            console.log("hashes" + e, hashes.digest());
            
        });
	// console.log(Buffer.from(privateKey, "hex") instanceof Uint8Array);
	// const tmp = new Uint8Array(hash.length);
	// for (var i = 0; i < tmp.length; i++) tmp[i] = hash[i];
        const result = hashes.digest();
        expect(result).to.be.equal('')
    })

    it("#createHash should be ok, and return a Buffer, Uint8Array too.", (done) => {
        const buf = Buffer.from('test');
        const hash1 = DdnCrypto.createHash(buf);
        const hash2 = DdnCrypto.createHash('test');

        debug(hash1);
        expect(hash1 instanceof Buffer).be.true;
        expect(hash1 instanceof Uint8Array).be.true;
        expect(hash1.toString()).be.equal(hash2.toString());
        done();
    })
})