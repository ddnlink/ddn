import sha256 from "fast-sha256";
import DdnCrypto from "@ddn/crypto";
import DdnUtils from "@ddn/utils";
import Asset from '@ddn/asset-base';
import crypto from 'crypto';
import nacl from 'tweetnacl';

import constants from '../constants';

let Buffer;
if (typeof Buffer === "undefined") {
    Buffer = require("buffer/").Buffer;
}
const fixedPoint = constants.fixedPoint;

const { 
    getBytes,
    getHash,
    getId,
    generateSecret, // 重构： generatePhasekey() -> generateSecret()
    isValidSecret,
    sign, //一致
    secondSign, //一致
    getKeys, //一致

    verify, 
    verifySecondSignature,
 } = DdnCrypto;

function toLocalBuffer(buf) {
    if (typeof window !== 'undefined') {
        return new Uint8Array(buf.toArrayBuffer())
    } else {
        return buf.toBuffer()
    }
}

function sha256Bytes(data) {
    return Buffer.from(sha256.hash(data));
}

// function sha256Hex(data) {
//     return sha256Bytes(data).toString('hex');
// }

// async function getAssetBytes(transaction) {
//     if (Asset.Utils.isTypeValueExists(transaction.type)) {
//         const trans = Asset.Utils.getTransactionByTypeValue(transaction.type);
//         const transCls = require(trans.package).default[trans.name];
        
//         // fixme: 这里的 {} 应该不用传，因为有 context 存在？？
//         // let transInst = new transCls({
//         //     constants: {
//         //         tokenName: constants.nethash[options.get('nethash')].tokenName
//         //     }
//         // });
       
//         let transInst = new transCls();
//         const buf = await transInst.getBytes(transaction);
//         transInst = null;
//         return buf;
//     }
//     return null;
// }

// async function getBytes(transaction, skipSignature, skipSecondSignature) {
//     let assetSize = 0;
//     let assetBytes = null;

//     // TODO: 修改，将getBytes统一到 bytes 文件
//     // console.log('global= ', global);
//     // assetBytes = await global.assets.call(transaction.type, "getBytes", transaction, skipSignature, skipSecondSignature);
//     // assetSize = assetBytes ? assetBytes.length : 0;

//     switch (transaction.type) {
//         case DdnUtils.assetTypes.SIGNATURE: // Signature
//             {
//                 assetBytes = getSignatureBytes(transaction.asset.signature);
//                 break;
//             }

//         case DdnUtils.assetTypes.DELEGATE: // Delegate
//             {
//                 assetBytes = Buffer.from(transaction.asset.delegate.username, "utf8");
//                 break;
//             }

//         case DdnUtils.assetTypes.VOTE: // Vote
//             {
//                 assetBytes = Buffer.from(transaction.asset.vote.votes.join(""), "utf8");
//                 break;
//             }

//         case DdnUtils.assetTypes.MULTISIGNATURE: // Multi-Signature
//             {
//                 let keysgroupBuffer = Buffer.from(transaction.asset.multisignature.keysgroup.join(""), "utf8");
//                 let bb = new ByteBuffer(1 + 1 + keysgroupBuffer.length, true);

//                 bb.writeByte(transaction.asset.multisignature.min);
//                 bb.writeByte(transaction.asset.multisignature.lifetime);

//                 for (let i = 0; i < keysgroupBuffer.length; i++) {
//                     bb.writeByte(keysgroupBuffer[i]);
//                 }

//                 bb.flip();

//                 assetBytes = bb.toBuffer();
//                 break;
//             }

//         default:
//             {
//                 assetBytes = await getAssetBytes(transaction);
//             }
//     }

//     if (transaction.__assetBytes__) {
//         assetBytes = transaction.__assetBytes__;
//     }

//     if (assetBytes) assetSize = assetBytes.length

//     // fixme: please delete follower +32
//     // if (transaction.requesterPublicKey) {
//     // 	assetSize += 32;
//     // }
//     const size = 1 + // type (int)
//         4 + // timestamp (int)
//         8 + // nethash 8
//         32 + // senderPublicKey (int)
//         32 + // requesterPublicKey (long)
//         8 + // recipientId (long)
//         8 + // amount (long)
//         64 + // message
//         64; // args or unused
    
//     const bb = new ByteBuffer(size + assetSize, true);

//     // const bb = new ByteBuffer(1, true);
//     bb.writeByte(transaction.type); // +1
//     bb.writeInt(transaction.timestamp); // +4
//     bb.writeString(transaction.nethash); // +8

//     // +32
//     const senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, "hex");
//     for (let i = 0; i < senderPublicKeyBuffer.length; i++) {
//         bb.writeByte(senderPublicKeyBuffer[i]);
//     }

//     // +32
//     if (transaction.requester_public_key) { //wxm block database
//         let requesterPublicKey = Buffer.from(transaction.requester_public_key, "hex"); //wxm block database

//         for (let i = 0; i < requesterPublicKey.length; i++) {
//             bb.writeByte(requesterPublicKey[i]);
//         }
//     }

//     // +8 这里？？
//     if (transaction.recipientId) {
//         bb.writeString(transaction.recipientId);
//     } else {
//         for (let i = 0; i < 8; i++) {
//             bb.writeByte(0);
//         }
//     }

//     // +8
//     bb.writeString(transaction.amount);

//     // +64
//     if (transaction.message) bb.writeString(transaction.message)

//     // +64
//     if (transaction.args) {
//         let args = transaction.args
//         for (let i = 0; i < args.length; ++i) {
//             bb.writeString(args[i])
//         }
//     }

//     if (assetSize > 0) {
//         for (let i = 0; i < assetSize; i++) {
//             bb.writeByte(assetBytes[i]);
//         }
//     }

//     if (!skipSignature && transaction.signature) {
//         let signatureBuffer = Buffer.from(transaction.signature, "hex");
//         for (let i = 0; i < signatureBuffer.length; i++) {
//             bb.writeByte(signatureBuffer[i]);
//         }
//     }

//     if (!skipSecondSignature && transaction.sign_signature) {  //wxm block database
//         let signSignatureBuffer = Buffer.from(transaction.sign_signature, "hex"); //wxm block database
//         for (let i = 0; i < signSignatureBuffer.length; i++) {
//             bb.writeByte(signSignatureBuffer[i]);
//         }
//     }

//     bb.flip();

//     // competifined browser
//     const arrayBuffer = new Uint8Array(bb.toArrayBuffer());
//     const buffer = [];

//     for (let i = 0; i < arrayBuffer.length; i++) {
//         buffer[i] = arrayBuffer[i];
//     }

//     return Buffer.from(buffer);
// }

// async function getHash(transaction, skipSignature, skipSecondSignature) {
//     console.log('getBytes= ', getBytes);
    
//     const bytes = await getBytes(transaction, skipSignature, skipSecondSignature);
//     const result = Buffer.from(sha256.hash(bytes));

//     return result;
// }

// id: 不含签名的hash值
// async function getId(transaction) {
//     const result = await getHash(transaction);
//     return result.toString('hex');
// }

async function getFee(transaction) {
    switch (transaction.type) {
        case DdnUtils.assetTypes.TRANSFER: // Normal
            return DdnUtils.bignum.multiply(0.1, fixedPoint);
        case DdnUtils.assetTypes.SIGNATURE: // Signature
            return DdnUtils.bignum.multiply(100, fixedPoint);
        case DdnUtils.assetTypes.DELEGATE: // Delegate
            return DdnUtils.bignum.multiply(10000, fixedPoint);
        case DdnUtils.assetTypes.VOTE: // Vote
            return DdnUtils.bignum.new(fixedPoint);
        default: {
            let fee = constants.net.fees.send;
            if (Asset.Utils.isTypeValueExists(transaction.type)) {
                const trans = Asset.Utils.getTransactionByTypeValue(transaction.type);
                const transCls = require(trans.package).default[trans.name];
                let transInst = new transCls({
                    constants: {
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

// async function sign(transaction, {privateKey}) {
//     const hash = await getHash(transaction, true, true);
//     const signature = nacl.sign.detached(hash, Buffer.from(privateKey, "hex"));

//     if (!transaction.signature) {
//         // eslint-disable-next-line require-atomic-updates
//         transaction.signature = Buffer.from(signature).toString("hex");
//     } else {
//         return Buffer.from(signature).toString("hex");
//     }
// }

// async function secondSign(transaction, {privateKey}) {
//     const hash = await getHash(transaction);
//     const signature = nacl.sign.detached(hash, Buffer.from(privateKey, "hex"));
//     // eslint-disable-next-line require-atomic-updates
//     transaction.sign_signature = Buffer.from(signature).toString("hex")    //wxm block database
// }

function signBytes(bytes, {privateKey}) {
    const hash = sha256Bytes(Buffer.from(bytes, 'hex'));
    const signature = nacl.sign.detached(hash, Buffer.from(privateKey, "hex"));
    return Buffer.from(signature).toString("hex");
}

// async function verify(transaction) {
//     let remove = 64;

//     if (transaction.signSignature) {
//         remove = 128;
//     }

//     const bytes = await getBytes(transaction);
//     const data2 = Buffer.allocUnsafe(bytes.length - remove);

//     for (let i = 0; i < data2.length; i++) {
//         data2[i] = bytes[i];
//     }

//     const hash = sha256Bytes(data2);

//     const signatureBuffer = Buffer.from(transaction.signature, "hex");
//     const senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, "hex");
//     const res = nacl.sign.detached.verify(hash, signatureBuffer, senderPublicKeyBuffer);

//     return res;
// }

// function verifySecondSignature(transaction, publicKey) {
//     const bytes = getBytes(transaction);
//     const data2 = Buffer.allocUnsafe(bytes.length - 64);

//     for (let i = 0; i < data2.length; i++) {
//         data2[i] = bytes[i];
//     }

//     const hash = sha256Bytes(data2);

//     const signSignatureBuffer = Buffer.from(transaction.signSignature, "hex");
//     const publicKeyBuffer = Buffer.from(publicKey, "hex");
//     const res = nacl.sign.detached.verify(hash, signSignatureBuffer, publicKeyBuffer);

//     return res;
// }


// 根据助记词生成密钥对
// function getKeys(secret) {
//     const hash = sha256Bytes(Buffer.from(secret));
//     const keypair = nacl.sign.keyPair.fromSeed(hash);

//     return {
//         publicKey: Buffer.from(keypair.publicKey).toString("hex"),
//         privateKey: Buffer.from(keypair.secretKey).toString("hex")
//     }
// }

//根据公钥生成账户地址 fixme: delete it
// function generateAddress(publicKey) {
//     return addressHelper.generateBase58CheckAddress(publicKey) // -> ../address.js -> crypto.generateAddress() 请直接使用 crypto
// } 

// 生成助记词，重构： generatePhasekey() -> generateSecret()
// function generatePhasekey()
// {
//     const secret = new Mnemonic(128).toString();
//     return secret;
// }

function isAddress(address) {
    return DdnCrypto.isAddress(address, constants.tokenPrefix)
}

// fixme: 将所有 generateBase58CheckAddress -> generateAddress
function generateAddress(publicKey) {        
    return DdnCrypto.generateAddress(publicKey, constants.tokenPrefix)
}

function generateMd5Hash(content) {
    const md5 = crypto.createHash('md5');
    const result = md5.update(content).digest('hex');
    return result;
}

// 注意接口变更说明
export default {
    getBytes,
    getHash,
    getId,
    getFee,
    sign, //一致
    secondSign, //一致
    getKeys, //一致
    generateAddress, // 测试和前端用 一致
    isAddress, 

    // 验证
    verify, 
    verifySecondSignature,
    
    fixedPoint, // 测试和前端用
    signBytes,
    toLocalBuffer, // 测试和前端用
    generateSecret, // 测试和前端用,重构： generatePhasekey() -> generateSecret()
    isValidSecret,
    generateMd5Hash // 测试和前端用
};

