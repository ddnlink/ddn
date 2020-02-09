/*---------------------------------------------------------------------------------------------
 *  Created by Imfly on Wed Jan 29 2020 11:48:54
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import sha256 from "fast-sha256";
import RIPEMD160 from "ripemd160";
import Mnemonic from "bitcore-mnemonic";
import base58check from "./base58check";
import nacl from 'tweetnacl';

function randomName() {
    // Convert arguments to Array
    const array = Array.prototype.slice.apply(arguments);

    let size = 16;
    if (array.length > 2) {
        size = array.shift();
    }

    let name = array[0];
    let random = array[1];

    if (name.length > 0) {
        size = size - 1;
    }

    for (let i = 0; i < size; i++) {
        name += random.charAt(Math.floor(Math.random() * random.length));
    }

    return name;
}

function randomNethash() {
    return randomName(8, "", "abcdefghijklmnopqrstuvwxyz0123456789");
}

function randomString(max) {
    let possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%^&*@";
    return randomName(max, "", possible);
}

function keypair(secret) {
    const hash = getHash(secret);
    const keypair = nacl.sign.keyPair.fromSeed(hash);

    return {
        publicKey: bufToHex(keypair.publicKey),
        privateKey: bufToHex(keypair.secretKey)
    }
}

// TODO: sign(keypair, data) -> sign(data, keypair)
function sign(keypair, data) {
    const hash = getHash(data);
    const signature = nacl.sign.detached(
        hash,
        Buffer.from(keypair.privateKey, "hex")
    );
    return bufToHex(signature);
}

function getId(data) {
    return getHash(data).toString("hex");
}

// 生成助记词 == node-sdk.crypto.generatePhasekey()
function generateSecret() {
    return new Mnemonic(Mnemonic.Words.ENGLISH).toString();
}

function isValidSecret(secret) {
    return Mnemonic.isValid(secret);
}

/**
 * description:
 * 1. 把地址base58解码成字节数组
 * 2. 把数组分成两个字节数组，字节数组（1）是后4字节数组，字节数组（2）是减去后4字节的数组
 * 3. 把字节数组（2）两次Sha256 Hash
 * 4. 取字节数组（2）hash后的前4位，跟字节数组（1）比较。如果相同校验通过。
 * 5. 校验通过的解码字节数组取第一个字节，地址前缀。
 * 6. 检验前缀的合法性（根据主网参数校验），注意大小写。
 * Note: address.slice(0, -4) === address.slice(0, address.length - 4)
 */
function isAddress(address, tokenPrefix) {
    if (typeof address !== "string") {
        return false;
    }
    if (!base58check.decodeUnsafe(address.slice(1))) {
        return false;
    }
    if ([tokenPrefix].indexOf(address[0]) == -1) {
        return false;
    }
    return true;
}

function generateAddress(publicKey, tokenPrefix) {
    if (typeof publicKey === "string") {
        publicKey = Buffer.from(publicKey, "hex");
    }
    const h1 = sha256.hash(publicKey);
    const h2 = new RIPEMD160().update(Buffer.from(h1)).digest();
    return tokenPrefix + base58check.encode(h2);
}

function getHash(data) {
    return Buffer.from(sha256.hash(Buffer.from(data)));
}

function bufToHex(data) {
    return Buffer.from(data).toString("hex");
}

export default {
    keypair,
    sign,
    getId,
    randomString,
    randomNethash,
    generateSecret,
    isValidSecret,
    generateAddress,
    base58check,
    isAddress
};
