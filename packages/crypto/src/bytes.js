import ByteBuffer from "bytebuffer";
import DdnUtils from '@ddn/utils';
import Asset from '@ddn/asset-base';

// TODO: 注意扩展更多交易类型
async function getBytes(transaction, skipSignature, skipSecondSignature) {
    let assetSize = 0;
    let assetBytes = null;

    // FIXME: 建议将 crypto 放在 context 里，并将peer/src/kernal/transaciton方法统一过来
    // switch (transaction.type) {
    //     case DdnUtils.assetTypes.SIGNATURE: // Signature
    //         {
    //             assetBytes = getSignatureBytes(transaction.asset.signature);
    //             break;
    //         }

    //     case DdnUtils.assetTypes.DELEGATE: // Delegate
    //         {
    //             assetBytes = Buffer.from(transaction.asset.delegate.username, "utf8");
    //             break;
    //         }

    //     case DdnUtils.assetTypes.VOTE: // Vote
    //         {
    //             assetBytes = Buffer.from(transaction.asset.vote.votes.join(""), "utf8");
    //             break;
    //         }

    //     case DdnUtils.assetTypes.MULTISIGNATURE: // Multi-Signature
    //         {
    //             let keysgroupBuffer = Buffer.from(transaction.asset.multisignature.keysgroup.join(""), "utf8");
    //             let bb = new ByteBuffer(1 + 1 + keysgroupBuffer.length, true);

    //             bb.writeByte(transaction.asset.multisignature.min);
    //             bb.writeByte(transaction.asset.multisignature.lifetime);

    //             for (let i = 0; i < keysgroupBuffer.length; i++) {
    //                 bb.writeByte(keysgroupBuffer[i]);
    //             }

    //             bb.flip();

    //             assetBytes = bb.toBuffer();
    //             break;
    //         }

    //     default:
    //         {
    //             assetBytes = await getAssetBytes(transaction);
    //         }
    // }

    assetBytes = await getAssetBytes(transaction);
    if (transaction.__assetBytes__) {
        assetBytes = transaction.__assetBytes__;
    }
    if (assetBytes) assetSize = assetBytes.length

    const size = 1 + // type (int)
        4 + // timestamp (int)
        8 + // nethash 8
        32 + // senderPublicKey (int)
        32 + // requesterPublicKey (long)
        8 + // recipientId (long)
        8 + // amount (long)
        64 + // message
        64; // args or unused

    const bb = new ByteBuffer(size + assetSize, true);

    // const bb = new ByteBuffer(1, true);
    bb.writeByte(transaction.type); // +1
    bb.writeInt(transaction.timestamp); // +4
    bb.writeString(transaction.nethash); // +8

    // +32
    const senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, "hex");
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
    if (transaction.recipientId) {
        bb.writeString(transaction.recipientId);
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

async function getAssetBytes(transaction) {
    if (Asset.Utils.isTypeValueExists(transaction.type)) {
        const trans = Asset.Utils.getTransactionByTypeValue(transaction.type);
        const transCls = require(trans.package).default[trans.name];
        // fixme: 这里的 {} 应该不用传，因为有 context 存在？？
        // let transInst = new transCls({
        //     constants: {
        //         // tokenName: constants.nethash[options.get('nethash')].tokenName
        //         tokenName
        //     }
        // });
        let transInst = new transCls();
        const buf = await transInst.getBytes(transaction);
        transInst = null;
        return buf;
    }
    return null;
}

// function getSignatureBytes({ publicKey }) {
//     const bb = new ByteBuffer(32, true);
//     const publicKeyBuffer = Buffer.from(publicKey, "hex");

//     for (let i = 0; i < publicKeyBuffer.length; i++) {
//         bb.writeByte(publicKeyBuffer[i]);
//     }

//     bb.flip();
//     return new Uint8Array(bb.toArrayBuffer());
// }

export {
    getBytes
}