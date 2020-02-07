const sha256 = require("fast-sha256");
const addressHelper = require('../address.js');
const options = require('../options');
const constants = require('../constants');
const trsTypes = require('../transaction-types');
const { AssetUtils } = require('@ddn/ddn-asset-base').default;
const Mnemonic = require('bitcore-mnemonic');
const crypto = require('crypto');

let Buffer;
if (typeof Buffer === "undefined") {
    Buffer = require("buffer/").Buffer;
}

const ByteBuffer = require("bytebuffer");
const Bignum = require("@ddn/ddn-utils");
const nacl = require('tweetnacl')

const fixedPoint = Math.pow(10, 8);

function getSignatureBytes(signature) {
    var bb = new ByteBuffer(32, true);
    var publicKeyBuffer = Buffer.from(signature.public_key, "hex");

    for (var i = 0; i < publicKeyBuffer.length; i++) {
        bb.writeByte(publicKeyBuffer[i]);
    }

    bb.flip();
    return new Uint8Array(bb.toArrayBuffer());
}

function toLocalBuffer(buf) {
    if (typeof window !== 'undefined') {
        return new Uint8Array(buf.toArrayBuffer())
    } else {
        return buf.toBuffer()
    }
}

function sha256Bytes(data) {
    return Buffer.from(sha256.hash(data))
}

function sha256Hex(data) {
    return Buffer.from(sha256.hash(data)).toString('hex')
}

async function getAssetBytes(transaction) {
    if (AssetUtils.isTypeValueExists(transaction.type)) {
        var trans = AssetUtils.getTransactionByTypeValue(transaction.type);
        var transCls = require(trans.package)[trans.name];
        var transInst = new transCls({
            tokenSetting: {
                tokenName: constants.nethash[options.get('nethash')].tokenName
            }
        });
        var buf = await transInst.getBytes(transaction);
        transInst = null;
        return buf;
    }
    return null;
}

async function getBytes(transaction, skipSignature, skipSecondSignature) {
    var assetSize = 0,
        assetBytes = null;

    switch (transaction.type) {
        case trsTypes.SIGNATURE: // Signature
            {
                assetBytes = getSignatureBytes(transaction.asset.signature);
                break;
            }

        case trsTypes.DELEGATE: // Delegate
            {
                assetBytes = Buffer.from(transaction.asset.delegate.username, "utf8");
                break;
            }

        case trsTypes.VOTE: // Vote
            {
                assetBytes = Buffer.from(transaction.asset.vote.votes.join(""), "utf8");
                break;
            }

        case trsTypes.MULTI: // Multi-Signature
            {
                let keysgroupBuffer = Buffer.from(transaction.asset.multisignature.keysgroup.join(""), "utf8");
                let bb = new ByteBuffer(1 + 1 + keysgroupBuffer.length, true);

                bb.writeByte(transaction.asset.multisignature.min);
                bb.writeByte(transaction.asset.multisignature.lifetime);

                for (let i = 0; i < keysgroupBuffer.length; i++) {
                    bb.writeByte(keysgroupBuffer[i]);
                }

                bb.flip();

                assetBytes = bb.toBuffer();
                break;
            }

        default:
            {
                assetBytes = await getAssetBytes(transaction);
            }
    }

    if (transaction.__assetBytes__) {
        assetBytes = transaction.__assetBytes__;
    }
    if (assetBytes) assetSize = assetBytes.length

    // fixme: please delete follower +32
    // if (transaction.requesterPublicKey) {
    // 	assetSize += 32;
    // }

    const bb = new ByteBuffer(1, true);
    bb.writeByte(transaction.type); // +1
    bb.writeInt(transaction.timestamp); // +4
    bb.writeString(transaction.nethash); // +8

    // +32
    const senderPublicKeyBuffer = Buffer.from(transaction.sender_public_key, "hex");
    // var senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, "hex");
    for (let i = 0; i < senderPublicKeyBuffer.length; i++) {
        bb.writeByte(senderPublicKeyBuffer[i]);
    }

    // +32
    if (transaction.requester_public_key) { //wxm block database
        let requesterPublicKey = Buffer.from(transaction.requester_public_key, "hex"); //wxm block database

        for (let i = 0; i < requesterPublicKey.length; i++) {
            bb.writeByte(requesterPublicKey[i]);
        }
    }

    // +8
    if (transaction.recipient_id) {
        bb.writeString(transaction.recipient_id);
    } else {
        for (let i = 0; i < 8; i++) {
            bb.writeByte(0);
        }
    }

    // +8
    bb.writeString(transaction.amount);

    // +64
    if (transaction.message) bb.writeString(transaction.message)

    // +64
    if (transaction.args) {
        let args = transaction.args
        for (let i = 0; i < args.length; ++i) {
            bb.writeString(args[i])
        }
    }

    if (assetSize > 0) {
        for (let i = 0; i < assetSize; i++) {
            bb.writeByte(assetBytes[i]);
        }
    }

    if (!skipSignature && transaction.signature) {
        let signatureBuffer = Buffer.from(transaction.signature, "hex");
        for (let i = 0; i < signatureBuffer.length; i++) {
            bb.writeByte(signatureBuffer[i]);
        }
    }

    if (!skipSecondSignature && transaction.sign_signature) {  //wxm block database
        let signSignatureBuffer = Buffer.from(transaction.sign_signature, "hex"); //wxm block database
        for (let i = 0; i < signSignatureBuffer.length; i++) {
            bb.writeByte(signSignatureBuffer[i]);
        }
    }

    bb.flip();

    // competifined browser
    const arrayBuffer = new Uint8Array(bb.toArrayBuffer());
    const buffer = [];

    for (let i = 0; i < arrayBuffer.length; i++) {
        buffer[i] = arrayBuffer[i];
    }

    return Buffer.from(buffer);
}

async function getId(transaction) {
    return sha256Hex(await getBytes(transaction))
}

async function getHash(transaction, skipSignature, skipSecondSignature) {
    return sha256Bytes(await getBytes(transaction, skipSignature, skipSecondSignature))
}

async function getFee(transaction) {
    switch (transaction.type) {
        case trsTypes.SEND: // Normal
            return Bignum.multiply(0.1, fixedPoint);
        case trsTypes.SIGNATURE: // Signature
            return Bignum.multiply(100, fixedPoint);
        case trsTypes.DELEGATE: // Delegate
            return Bignum.multiply(10000, fixedPoint);
        case trsTypes.VOTE: // Vote
            return Bignum.new(fixedPoint);
        default: {
            var fee = constants.fees.send;
            if (AssetUtils.isTypeValueExists(transaction.type)) {
                var trans = AssetUtils.getTransactionByTypeValue(transaction.type);
                var transCls = require(trans.package)[trans.name];
                var transInst = new transCls({
                    tokenSetting: {
                        fixedPoint: 100000000
                    }
                });
                fee = await transInst.calculateFee(transaction);
                transInst = null;
            }
            return fee;
        }
    }
}

async function sign(transaction, keys) {
    var hash = await getHash(transaction, true, true);
    var signature = nacl.sign.detached(hash, Buffer.from(keys.private_key, "hex"));

    if (!transaction.signature) {
        // eslint-disable-next-line require-atomic-updates
        transaction.signature = Buffer.from(signature).toString("hex");
        // return transaction; // fixme: 确认方法
    } else {
        return Buffer.from(signature).toString("hex");
    }
}

async function secondSign(transaction, keys) {
    var hash = await getHash(transaction);
    var signature = nacl.sign.detached(hash, Buffer.from(keys.private_key, "hex"));
    // eslint-disable-next-line require-atomic-updates
    transaction.sign_signature = Buffer.from(signature).toString("hex")    //wxm block database
}

function signBytes(bytes, keys) {
    var hash = sha256Bytes(Buffer.from(bytes, 'hex'))
    var signature = nacl.sign.detached(hash, Buffer.from(keys.private_key, "hex"));
    return Buffer.from(signature).toString("hex");
}

async function verify(transaction) {
    var remove = 64;

    if (transaction.signSignature) {
        remove = 128;
    }

    var bytes = await getBytes(transaction);
    var data2 = Buffer.allocUnsafe(bytes.length - remove);

    for (var i = 0; i < data2.length; i++) {
        data2[i] = bytes[i];
    }

    var hash = sha256Bytes(data2)

    var signatureBuffer = Buffer.from(transaction.signature, "hex");
    var senderPublicKeyBuffer = Buffer.from(transaction.sender_public_key, "hex");
    var res = nacl.sign.detached.verify(hash, signatureBuffer, senderPublicKeyBuffer);

    return res;
}

function verifySecondSignature(transaction, public_key) {
    var bytes = getBytes(transaction);
    var data2 = Buffer.allocUnsafe(bytes.length - 64);

    for (var i = 0; i < data2.length; i++) {
        data2[i] = bytes[i];
    }

    var hash = sha256Bytes(data2)

    var signSignatureBuffer = Buffer.from(transaction.signSignature, "hex");
    var publicKeyBuffer = Buffer.from(public_key, "hex");
    var res = nacl.sign.detached.verify(hash, signSignatureBuffer, publicKeyBuffer);

    return res;
}

function verifyBytes(bytes, signature, public_key) {
    var hash = sha256Bytes(Buffer.from(bytes, 'hex'))
    var signatureBuffer = Buffer.from(signature, "hex");
    var publicKeyBuffer = Buffer.from(public_key, "hex");
    var res = nacl.sign.detached.verify(hash, signatureBuffer, publicKeyBuffer);
    return res
}

// 根据助记词生成密钥对
function getKeys(secret) {
    var hash = sha256Bytes(Buffer.from(secret));
    var keypair = nacl.sign.keyPair.fromSeed(hash);

    return {
        public_key: Buffer.from(keypair.publicKey).toString("hex"),
        private_key: Buffer.from(keypair.secretKey).toString("hex")
    }
}

//根据公钥生成账户地址
function generateAddress(public_key) {
    return addressHelper.generateBase58CheckAddress(public_key)
}

//生成助记词
function generatePhasekey()
{
    var secret = new Mnemonic(128).toString();
    return secret;
}

function generateHash(content)
{
    var md5 = crypto.createHash('md5');
    var result = md5.update(content).digest('hex');
    return result;
}

module.exports = {
    getBytes: getBytes,
    getHash: getHash,
    getId: getId,
    getFee: getFee,
    sign: sign,
    secondSign: secondSign,
    getKeys: getKeys,
    generateAddress: generateAddress,
    verify: verify,
    verifySecondSignature: verifySecondSignature,
    fixedPoint: fixedPoint,
    signBytes: signBytes,
    toLocalBuffer: toLocalBuffer,
    verifyBytes: verifyBytes,
    isAddress: addressHelper.isAddress,
    isBase58CheckAddress: addressHelper.isBase58CheckAddress,
    generatePhasekey: generatePhasekey,
    generateHash: generateHash
}