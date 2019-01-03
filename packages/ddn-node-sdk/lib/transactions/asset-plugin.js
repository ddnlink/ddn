var crypto = require('./crypto.js');
var constants = require('../constants.js');
var slots = require('../time/slots.js');
var options = require('../options');
var { AssetUtils } = require('ddn-asset-base');

function createPluginAsset(trsType, assetInfo, secret, secondSecret) {
	var keys = crypto.getKeys(secret);
	
	var fee = assetInfo.fee || constants.fees.org;
	delete assetInfo.fee;
	var transaction = {
		type: trsType,
		nethash: options.get('nethash'),
		amount: assetInfo.amount ? assetInfo.amount + "" : "0",
		fee: fee + "",
		recipient_id: assetInfo.receive_address ? assetInfo.receive_address : null,
		sender_public_key: keys.public_key,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		message: assetInfo.message ? assetInfo.message + "" : null,
		asset: {}
  };
    
  delete assetInfo.amount;
	delete assetInfo.receive_address;
	delete assetInfo.message;

	if(assetInfo.aobAmount) {
		assetInfo.amount = assetInfo.aobAmount;
		delete assetInfo.aobAmount;
	}

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