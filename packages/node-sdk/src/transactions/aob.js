import DdnUtils from "@ddn/utils";

import crypto from '../utils/crypto';
// import crypto from "@ddn/crypto";
import constants from "../constants";
import slots from "../time/slots";
import options from "../options";

const {
    bignum
} = DdnUtils;

function getClientFixedTime() {
    return slots.getTime() - options.get("clientDriftSeconds");
}

async function createTransaction(
    asset,
    fee,
    type,
    recipientId,
    message,
    secret,
    secondSecret
) {
    const keys = crypto.getKeys(secret);

    const transaction = {
        type,
        nethash: options.get("nethash"),
        amount: "0",
        fee: `${fee}`,
        recipientId: recipientId,
        senderPublicKey: keys.publicKey,
        timestamp: getClientFixedTime(),
        message,
        asset
    };

    crypto.sign(transaction, keys);

    if (secondSecret) {
        const secondKeys = crypto.getKeys(secondSecret);
        crypto.secondSign(transaction, secondKeys);
    }

    // FIXME: 这里提供的id与写入时的id不一致，记得修改
    // transaction.id = await crypto.getId(transaction);
    return transaction;
}

export default {
    createIssuer(name, desc, secret, secondSecret) {
        const asset = {
            aobIssuer: {
                name,
                desc
            }
        };
        const fee = bignum.multiply(100, constants.fixedPoint);
        return createTransaction(
            asset,
            fee,
            DdnUtils.assetTypes.AOB_ISSUER,
            null,
            null,
            secret,
            secondSecret
        );
    },

    createAsset(
        name,
        desc,
        maximum,
        precision,
        strategy,
        allowWriteoff,
        allowWhitelist,
        allowBlacklist,
        secret,
        secondSecret
    ) {
        const asset = {
            aobAsset: {
                name,
                desc,
                maximum,
                precision,
                strategy,
                allow_blacklist: allowBlacklist,
                allow_whitelist: allowWhitelist,
                allow_writeoff: allowWriteoff
            }
        };
        // var fee = (500 + (Math.floor(bytes.length / 200) + 1) * 0.1) * constants.fixedPoint
        const fee = bignum.multiply(500, constants.fixedPoint);
        return createTransaction(
            asset,
            fee,
            DdnUtils.assetTypes.AOB_ASSET,
            null,
            null,
            secret,
            secondSecret
        );
    },

    createFlags(currency, flagType, flag, secret, secondSecret) {
        const asset = {
            aobFlags: {
                currency,
                flag_type: flagType,
                flag
            }
        };
        const fee = bignum.multiply(0.1, constants.fixedPoint);
        return createTransaction(
            asset,
            fee,
            DdnUtils.assetTypes.AOB_FLAGS,
            null,
            null,
            secret,
            secondSecret
        );
    },

    createAcl(currency, operator, flag, list, secret, secondSecret) {
        const asset = {
            aobAcl: {
                currency,
                operator,
                flag,
                list
            }
        };
        const fee = bignum.multiply(0.2, constants.fixedPoint);
        return createTransaction(
            asset,
            fee,
            DdnUtils.assetTypes.AOB_ACL,
            null,
            null,
            secret,
            secondSecret
        );
    },

    createIssue(currency, amount, secret, secondSecret) {
        const asset = {
            aobIssue: {
                currency,
                amount: `${amount}`
            }
        };
        const fee = bignum.multiply(0.1, constants.fixedPoint);
        return createTransaction(
            asset,
            fee,
            DdnUtils.assetTypes.AOB_ISSUE,
            null,
            null,
            secret,
            secondSecret
        );
    },

    createTransfer(
        currency,
        amount,
        recipientId,
        message,
        secret,
        secondSecret
    ) {
        const asset = {
            aobTransfer: {
                currency,
                amount: `${amount}`
            }
        };
        const fee = bignum.multiply(0.1, constants.fixedPoint);
        return createTransaction(
            asset,
            fee,
            DdnUtils.assetTypes.AOB_TRANSFER,
            recipientId,
            message,
            secret,
            secondSecret
        );
    }
};