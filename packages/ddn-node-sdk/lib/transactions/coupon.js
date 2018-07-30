var crypto = require('./crypto.js');
var constants = require('../constants.js');
var trsTypes = require('../transaction-types');
var options = require('../options');
var slots = require('../time/slots.js');
var addressHelper = require('../address.js');

function createIssuerApply(orgName, orgId, orgOwner, orgOwnerPhone, secret, secondSecret) {
    var keys = crypto.getKeys(secret);

    var fee = constants.fees.send;

    var transaction = {
        type: trsTypes.COUPON_ISSUER_APPLY,
        nethash: options.get('nethash'),
        amount: "0",
        fee: fee + "",
		recipientId: null,
		senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            couponIssuerApply: {
                address: addressHelper.generateBase58CheckAddress(keys.publicKey),
                orgName: orgName,
                orgId: orgId,
                orgOwner: orgOwner,
                orgOwnerPhone: orgOwnerPhone
            }
        }
    };

	crypto.sign(transaction, keys);
	
	if (secondSecret) {
		var secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys);
	}

    return transaction;
}

function createIssuerUpdate(orgName, orgId, orgOwner, orgOwnerPhone, secret, secondSecret) {
    var keys = crypto.getKeys(secret);
    
    var fee = constants.fees.send;

    var transaction = {
        type: trsTypes.COUPON_ISSUER_UPDATE,
        nethash: options.get('nethash'),
        amount: "0",
        fee: fee + "",
        recipientId: null,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            couponIssuerUpdate: {
                address: addressHelper.generateBase58CheckAddress(keys.publicKey),
                orgName: orgName,
                orgId: orgId,
                orgOwner: orgOwner,
                orgOwnerPhone: orgOwnerPhone
            }
        }
    };

    crypto.sign(transaction, keys);
    
    if (secondSecret) {
        var secondKeys = crypto.getKeys(secondSecret);
        crypto.secondSign(transaction, secondKeys);
    }

    return transaction;
}

function createIssuerCheck(address, orgName, orgId, orgOwner, orgOwnerPhone, state, secret, secondSecret) {
    var keys = crypto.getKeys(secret);
    
    var fee = constants.fees.send;

    var transaction = {
        type: trsTypes.COUPON_ISSUER_CHECK,
        nethash: options.get('nethash'),
        amount: "0",
        fee: fee + "",
        recipientId: null,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            couponIssuerCheck: {
                address: address,
                orgName: orgName,
                orgId: orgId,
                orgOwner: orgOwner,
                orgOwnerPhone: orgOwnerPhone,
                state: state
            }
        }
    };

    crypto.sign(transaction, keys);
    
    if (secondSecret) {
        var secondKeys = crypto.getKeys(secondSecret);
        crypto.secondSign(transaction, secondKeys);
    }

    return transaction;
}

module.exports = {
    createIssuerApply: createIssuerApply,
    createIssuerCheck: createIssuerCheck,
    createIssuerUpdate: createIssuerUpdate
};