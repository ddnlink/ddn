var ByteBuffer = require('bytebuffer');
var crypto = require('./crypto.js');
var constants = require('../constants.js');
var trsTypes = require('../transaction-types');
var slots = require('../time/slots.js');
var options = require('../options');
var addressHelper = require('../address.js')

/**
 * Create org transaction
 * @param {Org} org object
 * @param {*} secret 
 * @param {*} secondSecret 
 */
function createOrg(org, secret, secondSecret) {
	var keys = crypto.getKeys(secret);
	var bytes = null;

	var sender = addressHelper.generateBase58CheckAddress(keys.publicKey)

	if (!org.address) {
		org.address = sender;
	}

	if (typeof org !== 'object') {
		throw new Error('The first argument should be a object!');
	}

	if (!org.orgId || org.orgId.length == 0) {
		throw new Error('Invalid orgId format');
	}

    var olen = org.orgId.length
    , feeBase = 1
    if ( olen > 10 ) { feeBase = 10
    }else if ( olen == 10) { feeBase = 50
    }else if ( olen == 9 ) { feeBase = 100
    }else if ( olen == 8 ) { feeBase = 200
    }else if ( olen == 7 ) { feeBase = 400
    }else if ( olen == 6 ) { feeBase = 800
    }else if ( olen == 5 ) { feeBase = 1600
    }else{ // length <= 4
      feeBase = 999999 // not allow
	}
	
	if(org.state == 1){
		feeBase = parseInt(feeBase / 10);
	}

	var transaction = {
		type: trsTypes.ORG,
		nethash: options.get('nethash'),
		amount: 0,
		fee: feeBase * 100000000,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			org: org
		}
	};

	crypto.sign(transaction, keys);

	if (secondSecret) {
		var secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = crypto.getId(transaction);
	return transaction;
}

function createTransfer(address, secret, secondSecret) {
    var keys = crypto.getKeys(secret);
    var fee = constants.fees.org;

    var transaction = {
        type: trsTypes.SEND,
        nethash: options.get('nethash'),
        amount: 100000000000,
        fee: fee,
        recipientId: address,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds')
    };

    crypto.sign(transaction, keys);
    
    if (secondSecret) {
        var secondKeys = crypto.getKeys(secondSecret);
        crypto.secondSign(transaction, secondKeys);
    }

    return transaction;
}

function createConfirmation(confirmation, secret, secondSecret, amount) {
    var keys = crypto.getKeys(secret);
    var bytes = null;

	if (typeof(confirmation) !== 'object') {
		throw new Error('The first argument should be a object!');
	}

	if (!confirmation.senderAddress || confirmation.senderAddress.length == 0) {
		throw new Error('Invalid senderAddress format');
	}
	
	if (!confirmation.receivedAddress || confirmation.receivedAddress.length == 0) {
		throw new Error('Invalid receivedAddress format');
	}

	if (!confirmation.contributionTrsId || confirmation.contributionTrsId.length == 0) {
		throw new Error('Invalid contributionTrsId format');
	}
    
	if (!confirmation.url || confirmation.url.length == 0) {
		throw new Error('Invalid url format');
    }
    
    if (confirmation.state != 0 && confirmation.state != 1) {
        throw new Error('Invalid state format');
    }

    var fee = constants.fees.org;

    var transaction = {
        type: trsTypes.CONFIRMATION,
        nethash: options.get('nethash'),
        amount: amount,
        fee: fee,
        recipientId: confirmation.receivedAddress,
        senderPublicKey: keys.publicKey,
        timestamp: slots.getTime() - options.get('clientDriftSeconds'),
        asset: {
            daoConfirmation: confirmation
        }
    };

    crypto.sign(transaction, keys);
    
    if (secondSecret) {
        var secondKeys = crypto.getKeys(secondSecret);
        crypto.secondSign(transaction, secondKeys);
    }

    // transaction.id = crypto.getId(transaction);
    return transaction;
}

/**
 * create contribution transaction
 * @param {*} contribution 
 * @param {*} secret 
 * @param {*} secondSecret 
 */
function createContribution(contribution, secret, secondSecret) {
	var keys = crypto.getKeys(secret);
	var bytes = null;

	if (typeof(contribution) !== 'object') {
		throw new Error('The first argument should be a object!');
	}

	if (!contribution.title || contribution.title.length == 0) {
		throw new Error('Invalid title format');
	}

	if (!contribution.senderAddress || contribution.senderAddress.length == 0) {
		throw new Error('Invalid senderAddress format');
	}
	
	if (!contribution.receivedAddress || contribution.receivedAddress.length == 0) {
		throw new Error('Invalid receivedAddress format');
	}

	if (!contribution.url || contribution.url.length == 0) {
		throw new Error('Invalid url format');
	}
	
	var fee = constants.fees.org;

	var transaction = {
		type: trsTypes.CONTRIBUTION,
		nethash: options.get('nethash'),
		amount: 0,
		fee: fee,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {
			daoContribution: contribution
		}
	};

	crypto.sign(transaction, keys);
	
	if (secondSecret) {
		var secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys);
	}

	// transaction.id = crypto.getId(transaction);
	return transaction;
}

module.exports = {
    createOrg: createOrg,
    createConfirmation: createConfirmation,
    createTransfer: createTransfer,
	createContribution: createContribution
};
