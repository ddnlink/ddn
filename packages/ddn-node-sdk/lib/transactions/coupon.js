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

function createIssuerFreeze(address, orgName, orgId, orgOwner, orgOwnerPhone, secret, secondSecret) {
    var keys = crypto.getKeys(secret);
    
    var fee = constants.fees.send;

    var transaction = {
        type: trsTypes.COUPON_ISSUER_FREEZE,
        nethash: options.get('nethash'),
        amount: "0",
        fee: fee + "",
        recipientId: null,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            couponIssuerFreeze: {
                address: address,
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

function createIssuerUnfreeze(address, orgName, orgId, orgOwner, orgOwnerPhone, state, secret, secondSecret) {
    var keys = crypto.getKeys(secret);
    
    var fee = constants.fees.send;

    var transaction = {
        type: trsTypes.COUPON_ISSUER_UNFREEZE,
        nethash: options.get('nethash'),
        amount: "0",
        fee: fee + "",
        recipientId: null,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            couponIssuerUnfreeze: {
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

function createIssueNew(goodsName, goodsSpecs, goodsUnit, goodsNum, unitPrice, 
    batchValue, issueNum, issueTime, expireTime, secret, secondSecret) {
    var keys = crypto.getKeys(secret);
    
    var fee = constants.fees.send;

    var transaction = {
        type: trsTypes.COUPON_ISSUE_NEW,
        nethash: options.get('nethash'),
        amount: "0",
        fee: fee + "",
        recipientId: null,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            couponIssueNew: {
                address: addressHelper.generateBase58CheckAddress(keys.publicKey),
                goodsName: goodsName,
                goodsSpecs: goodsSpecs,
                goodsUnit: goodsUnit,
                goodsNum: goodsNum,
                unitPrice: unitPrice,
                batchValue: batchValue,
                issueNum: issueNum,
                issueTime: issueTime,
                expireTime: expireTime
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

function createIssueClose(goodsName, goodsSpecs, goodsUnit, goodsNum, unitPrice, 
    batchValue, issueNum, issueTime, expireTime, secret, secondSecret) {
    var keys = crypto.getKeys(secret);
    
    var fee = constants.fees.send;

    var transaction = {
        type: trsTypes.COUPON_ISSUE_CLOSE,
        nethash: options.get('nethash'),
        amount: "0",
        fee: fee + "",
        recipientId: null,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            couponIssueClose: {
                address: addressHelper.generateBase58CheckAddress(keys.publicKey),
                goodsName: goodsName,
                goodsSpecs: goodsSpecs,
                goodsUnit: goodsUnit,
                goodsNum: goodsNum,
                unitPrice: unitPrice,
                batchValue: batchValue,
                issueNum: issueNum,
                issueTime: issueTime,
                expireTime: expireTime
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

function createIssueReopen(goodsName, goodsSpecs, goodsUnit, goodsNum, unitPrice, 
    batchValue, issueNum, issueTime, expireTime, secret, secondSecret) {
    var keys = crypto.getKeys(secret);
    
    var fee = constants.fees.send;

    var transaction = {
        type: trsTypes.COUPON_ISSUE_REOPEN,
        nethash: options.get('nethash'),
        amount: "0",
        fee: fee + "",
        recipientId: null,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            couponIssueReopen: {
                address: addressHelper.generateBase58CheckAddress(keys.publicKey),
                goodsName: goodsName,
                goodsSpecs: goodsSpecs,
                goodsUnit: goodsUnit,
                goodsNum: goodsNum,
                unitPrice: unitPrice,
                batchValue: batchValue,
                issueNum: issueNum,
                issueTime: issueTime,
                expireTime: expireTime
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

function createExchangeBuy(batchValue, code, receivedAddress, 
    price, secret, secondSecret) {

    var keys = crypto.getKeys(secret);
    
    var fee = constants.fees.send;

    var transaction = {
        type: trsTypes.COUPON_EXCH_BUY,
        nethash: options.get('nethash'),
        amount: price,
        fee: fee + "",
        recipientId: receivedAddress,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            couponExcBuy: {
                batchValue: batchValue,
                code: code,
                senderAddress: addressHelper.generateBase58CheckAddress(keys.publicKey),
                receivedAddress: receivedAddress,
                price: price
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

function createExchangePay(batchValue, code, receivedAddress, 
    secret, secondSecret) {

    var keys = crypto.getKeys(secret);
    
    var fee = constants.fees.send;

    var transaction = {
        type: trsTypes.COUPON_EXCH_PAY,
        nethash: options.get('nethash'),
        amount: "0",
        fee: fee + "",
        recipientId: null,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            couponExcPay: {
                batchValue: batchValue,
                code: code,
                senderAddress: addressHelper.generateBase58CheckAddress(keys.publicKey),
                receivedAddress: receivedAddress,
                price: "0"
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

function createExchangeTransferConfirm(batchValue, code, receivedAddress, 
    price, relatedTrsId, state, secret, secondSecret) {

    var keys = crypto.getKeys(secret);
    
    var fee = constants.fees.send;

    var transaction = {
        type: trsTypes.COUPON_EXCH_TRANSFER_CONFIRM,
        nethash: options.get('nethash'),
        amount: price,
        fee: fee + "",
        recipientId: null,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            couponExcTransferConfirm: {
                batchValue: batchValue,
                code: code,
                senderAddress: addressHelper.generateBase58CheckAddress(keys.publicKey),
                receivedAddress: receivedAddress,
                price: price,
                relatedTrsId: relatedTrsId,
                transferState: state
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

function createExchangeTransferAsk(batchValue, code, receivedAddress, 
    price, secret, secondSecret) {

    var keys = crypto.getKeys(secret);
    
    var fee = constants.fees.send;

    var transaction = {
        type: trsTypes.COUPON_EXCH_TRANSFER_ASK,
        nethash: options.get('nethash'),
        amount: "0",
        fee: fee + "",
        recipientId: null,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            couponExcTransferAsk: {
                batchValue: batchValue,
                code: code,
                senderAddress: addressHelper.generateBase58CheckAddress(keys.publicKey),
                receivedAddress: receivedAddress,
                price: price
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
    createIssuerUpdate: createIssuerUpdate,
    createIssuerFreeze: createIssuerFreeze,
    createIssuerUnfreeze: createIssuerUnfreeze,
    createIssueNew: createIssueNew,
    createIssueClose: createIssueClose,
    createIssueReopen: createIssueReopen,
    createExchangeBuy: createExchangeBuy,
    createExchangePay: createExchangePay,
    createExchangeTransferAsk: createExchangeTransferAsk,
    createExchangeTransferConfirm: createExchangeTransferConfirm
};