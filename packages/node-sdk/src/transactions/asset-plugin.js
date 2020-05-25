import Asset from '@ddn/asset-base';
import DdnUtils from '@ddn/utils';
import crypto from '../utils/crypto';
import slots from '../time/slots';
import options from '../options';

async function createPluginAsset(trsType, assetInfo, secret, secondSecret) {
    const keys = crypto.getKeys(secret);

    console.log("createPluginAsset assetInfo 1", assetInfo);
    
    // var fee = assetInfo.fee || constants.net.fees.org;
    // delete assetInfo.fee;
    const transaction = {
        type: trsType,
        nethash: options.get('nethash'),
        amount: assetInfo.amount ? `${assetInfo.amount}` : "0",
        // fee: fee + "",
        recipientId: assetInfo.recipientId ? assetInfo.recipientId : null,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        message: assetInfo.message ? `${assetInfo.message}` : null,
        asset: {}
    };

    delete assetInfo.amount;
    delete assetInfo.recipientId;
    delete assetInfo.message;

    if (assetInfo.aobAmount) {
        assetInfo.amount = assetInfo.aobAmount;
        delete assetInfo.aobAmount;
    }

    // fix 这个是创建二级密码使用的 这个条件是否应该再次检查一下或优化一下
    if (assetInfo.secondSecret && trsType === DdnUtils.assetTypes.SIGNATURE) { // == 1
        const secondSecretKeys = crypto.getKeys(assetInfo.secondSecret);
        assetInfo = { publicKey: secondSecretKeys.publicKey };
        delete transaction.message;
    }

    const assetJsonName = Asset.Utils.getAssetJsonName(trsType);
    transaction.asset[assetJsonName] = assetInfo;

    console.log("createPluginAsset assetInfo 2", assetInfo);

    if (assetInfo.fee) {
        transaction.fee = assetInfo.fee;
    } else {
        transaction.fee = await crypto.getFee(transaction);
    }
    
    transaction.signature = await crypto.sign(transaction, keys);

    if (secondSecret) {
        const secondKeys = crypto.getKeys(secondSecret);
        transaction.sign_signature = await crypto.secondSign(transaction, secondKeys);
    }

    transaction.id = await crypto.getId(transaction);
    
    return transaction;
}

export default {
    createPluginAsset
};