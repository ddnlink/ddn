var crypto = require('./crypto.js');
var constants = require('../constants.js');
var slots = require('../time/slots.js');
var options = require('../options');
var { AssetUtils } = require('ddn-asset-base');

function createPluginAsset(trsType, assetInfo, secret, secondSecret) {
	var keys = crypto.getKeys(secret);
	
	var fee = constants.fees.org;

	var transaction = {
		type: trsType,
		nethash: options.get('nethash'),
		amount: assetInfo.amount ? assetInfo.amount + "" : "0",
		fee: fee + "",
		recipient_id: assetInfo.receive_address ? assetInfo.receive_address : null,
		sender_public_key: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {}
    };
    
    delete assetInfo.amount;
    delete assetInfo.receiveAddress;

    var assetJsonName = AssetUtils.getAssetJsonName(trsType);
    transaction.asset[assetJsonName] = assetInfo;

	crypto.sign(transaction, keys);
	
	if (secondSecret) {
		var secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys);
	}

	// transaction.id = crypto.getId(transaction);
	return transaction;
}

module.exports = {
    createPluginAsset: createPluginAsset
};