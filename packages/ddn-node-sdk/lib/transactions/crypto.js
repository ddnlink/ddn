var sha256 = require("fast-sha256");
var addressHelper = require('../address.js');
var options = require('../options');
var constants = require('../constants');
var trsTypes = require('../transaction-types');
var { AssetUtils } = require('ddn-asset-base');

if (typeof Buffer === "undefined") {
  Buffer = require("buffer/").Buffer;
}

var ByteBuffer = require("bytebuffer");
var bignum = require("bignum-utils");
var nacl = require('tweetnacl')

var fixedPoint = Math.pow(10, 8);

function getSignatureBytes(signature) {
  var bb = new ByteBuffer(32, true);
  var publicKeyBuffer = new Buffer(signature.public_key, "hex");

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

function getDAppBytes(dapp) {
  try {
    var buf = new Buffer([]);
    var nameBuf = new Buffer(dapp.name, "utf8");
    buf = Buffer.concat([buf, nameBuf]);

    if (dapp.description) {
      var descriptionBuf = new Buffer(dapp.description, "utf8");
      buf = Buffer.concat([buf, descriptionBuf]);
    }

    if (dapp.tags) {
      var tagsBuf = new Buffer(dapp.tags, "utf8");
      buf = Buffer.concat([buf, tagsBuf]);
    }

    if (dapp.link) {
      buf = Buffer.concat([buf, new Buffer(dapp.link, "utf8")]);
    }

    if (dapp.icon) {
      buf = Buffer.concat([buf, new Buffer(dapp.icon, "utf8")]);
    }

    var bb = new ByteBuffer(1, true);
    bb.writeInt(dapp.type);
    bb.writeInt(dapp.category);
    bb.writeString(dapp.delegates.join(','));
    bb.writeInt(dapp.unlock_delegates);
    bb.flip();

    buf = Buffer.concat([buf, bb.toBuffer()]);
  } catch (e) {
    throw Error(e.toString());
  }

  return buf;
}

function getInTransferBytes(inTransfer) {
  try {
    var buf = new Buffer([]);
    var dapp_id = new Buffer(inTransfer.dapp_id, "utf8");
    var currency = new Buffer(inTransfer.currency, "utf8");
    buf = Buffer.concat([buf, dapp_id, currency]);
    if (inTransfer.currency !== constants.nethash[options.get('nethash')].tokenName) {
      var amount = new Buffer(inTransfer.amount, "utf8")
      buf = Buffer.concat([buf, amount])
    }
  } catch (e) {
    throw Error(e.toString());
  }

  return buf;
}

function getOutTransferBytes(outTransfer) {
  try {
    var buf = new Buffer([]);
    var dappId_buf = new Buffer(outTransfer.dapp_id, 'utf8');
    var transactionId_buff = new Buffer(outTransfer.transaction_id, 'utf8');
    var currency_buff = new Buffer(outTransfer.currency, 'utf8')
    var amountBuff = new Buffer(outTransfer.amount, 'utf8')
    buf = Buffer.concat([buf, dappId_buf, transactionId_buff, currency_buff, amountBuff]);
  } catch (e) {
    throw Error(e.toString());
  }

  return buf;
}

function getOrgBytes(org) {
  const bb = new ByteBuffer();
  try {
    bb.writeUTF8String(org.org_id.toLowerCase());
    bb.writeUTF8String(org.name ? org.name : '');
    bb.writeUTF8String(org.address ? org.address : '');
    bb.writeUTF8String(org.url ? org.url : '');
    bb.writeUTF8String(org.tags);
    bb.writeInt8(org.state);

    bb.flip();
  } catch (e) {
    throw Error(e.toString());
  }

  return toLocalBuffer(bb);
}

function getExchangeBytes(asset) {
  const bb = new ByteBuffer();
  try {
    bb.writeString(asset.org_id.toLowerCase())
    bb.writeString(asset.exchange_trs_id)
    bb.writeString(asset.price);
    bb.writeInt8(asset.state);
    bb.writeString(asset.sender_address)
    bb.writeString(asset.received_address)

    bb.flip();
  } catch (e) {
    throw Error(e.toString());
  }
  return toLocalBuffer(bb);
}

function getContributionBytes(asset) {
  const bb = new ByteBuffer();
  bb.writeUTF8String(asset.title);
  bb.writeUTF8String(asset.received_address);
  bb.writeUTF8String(asset.sender_address);
  bb.writeUTF8String(asset.price);
  bb.writeUTF8String(asset.url);
  bb.flip();

  return toLocalBuffer(bb);
}

function getConfirmationBytes(asset) {
    const bb = new ByteBuffer();
    bb.writeUTF8String(asset.received_address);
    bb.writeUTF8String(asset.sender_address);
    // bb.writeUTF8String(asset.contributionTrsId);
    bb.writeUTF8String(asset.contribution_trs_id);
    bb.writeUTF8String(asset.url);
    bb.writeInt32(asset.state);
    bb.flip();

    return toLocalBuffer(bb);
}

function getEvidenceBytes(evidence) {
  const bb = new ByteBuffer();

  try {
    bb.writeUTF8String(evidence.ipid);
    bb.writeUTF8String(evidence.title);
    bb.writeUTF8String(evidence.description ? evidence.description : '');
    bb.writeUTF8String(evidence.tags);
    bb.writeUTF8String(evidence.url);
    bb.writeUTF8String(evidence.author);
    
    bb.writeUTF8String(evidence.hash);
    bb.writeUTF8String(evidence.size ? evidence.size : '');
    bb.writeUTF8String(evidence.type);

    bb.flip();

  } catch (e) {
    throw Error(e.toString());
  }

  return toLocalBuffer(bb);
}

function getCouponIssuerAuditorBuy(trs) {
    const bb = new ByteBuffer();
    
    try {
        bb.writeUTF8String(trs.asset.couponIssuerAuditorBuy.address);
        bb.writeUTF8String(trs.amount);
        bb.flip();
    } catch (e) {
        throw Error(e.toString());
    }

    return toLocalBuffer(bb);
}

function getCouponIssuerApplyBytes(asset) {
    const bb = new ByteBuffer();
    
    try {
        bb.writeUTF8String(asset.address);
        bb.writeUTF8String(asset.orgName || "");
        bb.writeUTF8String(asset.org_id || "");
        bb.writeUTF8String(asset.orgOwner || "");
        bb.writeUTF8String(asset.orgOwnerPhone || "");
        bb.flip();
    } catch (e) {
        throw Error(e.toString());
    }

    return toLocalBuffer(bb);
}

function getCouponIssuerCheckBytes(asset) {
    const bb = new ByteBuffer();
    
    try {
        bb.writeUTF8String(asset.address);
        bb.writeUTF8String(asset.orgName || "");
        bb.writeUTF8String(asset.org_id || "");
        bb.writeUTF8String(asset.orgOwner || "");
        bb.writeUTF8String(asset.orgOwnerPhone || "");
        bb.writeInt(asset.state);
        bb.flip();
    } catch (e) {
        throw Error(e.toString());
    }

    return toLocalBuffer(bb);
}

function getCouponIssuerUpdateBytes(asset) {
    const bb = new ByteBuffer();
    
    try {
        bb.writeUTF8String(asset.address);
        bb.writeUTF8String(asset.orgName || "");
        bb.writeUTF8String(asset.org_id || "");
        bb.writeUTF8String(asset.orgOwner || "");
        bb.writeUTF8String(asset.orgOwnerPhone || "");
        bb.flip();
    } catch (e) {
        throw Error(e.toString());
    }

    return toLocalBuffer(bb);
}

function getCouponIssuerFreezeBytes(asset) {
    const bb = new ByteBuffer();
    
    try {
        bb.writeUTF8String(asset.address);
        bb.writeUTF8String(asset.orgName || "");
        bb.writeUTF8String(asset.org_id || "");
        bb.writeUTF8String(asset.orgOwner || "");
        bb.writeUTF8String(asset.orgOwnerPhone || "");
        bb.flip();
    } catch (e) {
        throw Error(e.toString());
    }

    return toLocalBuffer(bb);
}

function getCouponIssuerUnfreezeBytes(asset) {
    const bb = new ByteBuffer();
    
    try {
        bb.writeUTF8String(asset.address);
        bb.writeUTF8String(asset.orgName || "");
        bb.writeUTF8String(asset.org_id || "");
        bb.writeUTF8String(asset.orgOwner || "");
        bb.writeUTF8String(asset.orgOwnerPhone || "");
        bb.writeInt(asset.state);
        bb.flip();
    } catch (e) {
        throw Error(e.toString());
    }

    return toLocalBuffer(bb);
}

function getCouponIssueNewBytes(asset) {
    const bb = new ByteBuffer();
    try
    {
        bb.writeUTF8String(asset.address);
        bb.writeUTF8String(asset.goodsName);
        bb.writeUTF8String(asset.goodsSpecs);
        bb.writeInt(asset.goodsNum);
        bb.writeUTF8String(asset.goodsUnit);
        bb.writeUTF8String(asset.unitPrice + "");
        bb.writeUTF8String(asset.batchValue);
        bb.writeInt(asset.issueNum);
        bb.writeUTF8String(asset.issueTime);
        bb.writeUTF8String(asset.expireTime);
        bb.flip();
    }
    catch (e) 
    {
        throw Error(e.toString());
    }
    return toLocalBuffer(bb);
}

function getCouponIssueCloseBytes(asset) {
    const bb = new ByteBuffer();
    try
    {
        bb.writeUTF8String(asset.address);
        bb.writeUTF8String(asset.goodsName);
        bb.writeUTF8String(asset.goodsSpecs);
        bb.writeInt(asset.goodsNum);
        bb.writeUTF8String(asset.goodsUnit);
        bb.writeUTF8String(asset.unitPrice + "");
        bb.writeUTF8String(asset.batchValue);
        bb.writeInt(asset.issueNum);
        bb.writeUTF8String(asset.issueTime);
        bb.writeUTF8String(asset.expireTime);
        bb.flip();
    }
    catch (e) 
    {
        throw Error(e.toString());
    }
    return toLocalBuffer(bb);
}

function getCouponIssueReopenBytes(asset) {
    const bb = new ByteBuffer();
    try
    {
        bb.writeUTF8String(asset.address);
        bb.writeUTF8String(asset.goodsName);
        bb.writeUTF8String(asset.goodsSpecs);
        bb.writeInt(asset.goodsNum);
        bb.writeUTF8String(asset.goodsUnit);
        bb.writeUTF8String(asset.unitPrice + "");
        bb.writeUTF8String(asset.batchValue);
        bb.writeInt(asset.issueNum);
        bb.writeUTF8String(asset.issueTime);
        bb.writeUTF8String(asset.expireTime);
        bb.flip();
    }
    catch (e) 
    {
        throw Error(e.toString());
    }
    return toLocalBuffer(bb);
}

function getCouponExchangeBuyBytes(asset) {
    const bb = new ByteBuffer();
    try
    {
        bb.writeUTF8String(asset.batchValue);
        bb.writeUTF8String(asset.code);
        bb.writeUTF8String(asset.sender_address);
        bb.writeUTF8String(asset.received_address);
        bb.writeUTF8String(asset.price);
        bb.flip();
    }
    catch (e) 
    {
        throw Error(e.toString());
    }
    return toLocalBuffer(bb);
}

function getCouponExchangePayBytes(asset) {
    const bb = new ByteBuffer();
    try
    {
        bb.writeUTF8String(asset.batchValue);
        bb.writeUTF8String(asset.code);
        bb.writeUTF8String(asset.sender_address);
        bb.writeUTF8String(asset.received_address);
        bb.flip();
    }
    catch (e) 
    {
        throw Error(e.toString());
    }
    return toLocalBuffer(bb);
}

function getCouponExchangeTransferAskBytes(asset) {
    const bb = new ByteBuffer();
    try
    {
        bb.writeUTF8String(asset.batchValue);
        bb.writeUTF8String(asset.code);
        bb.writeUTF8String(asset.sender_address);
        bb.writeUTF8String(asset.received_address);
        bb.writeUTF8String(asset.price);
        bb.flip();
    }
    catch (e) 
    {
        throw Error(e.toString());
    }
    return toLocalBuffer(bb);
}

function getCouponExchangeTransferConfirmBytes(asset) {
    const bb = new ByteBuffer();
    try
    {
        bb.writeUTF8String(asset.batchValue);
        bb.writeUTF8String(asset.code);
        bb.writeUTF8String(asset.sender_address);
        bb.writeUTF8String(asset.received_address);
        bb.writeUTF8String(asset.related_trs_id);
        bb.writeUTF8String(asset.price);
        bb.writeInt(asset.transferState);
        bb.flip();
    }
    catch (e) 
    {
        throw Error(e.toString());
    }
    return toLocalBuffer(bb);
}

function getAssetBytes(transaction) {
    if (AssetUtils.isTypeValueExists(transaction.type)) {
        var trans = AssetUtils.getTransactionByTypeValue(transaction.type);
        var transCls = require(trans.package)[trans.name];
        var transInst = new transCls();
        var buf = transInst.getBytes(transaction);
        transInst = null;
        return buf;
    }
    return null;
}

function getBytes(transaction, skipSignature, skipSecondSignature) {
  var assetSize = 0,
    assetBytes = null;

  switch (transaction.type) {
    case trsTypes.SIGNATURE: // Signature
      assetBytes = getSignatureBytes(transaction.asset.signature);
      break;

    case trsTypes.DELEGATE: // Delegate
      assetBytes = new Buffer(transaction.asset.delegate.username, "utf8");
      break;

    case trsTypes.VOTE: // Vote
      assetBytes = new Buffer(transaction.asset.vote.votes.join(""), "utf8");
      break;

    case trsTypes.MULTI: // Multi-Signature
      var keysgroupBuffer = new Buffer(transaction.asset.multisignature.keysgroup.join(""), "utf8");
      var bb = new ByteBuffer(1 + 1 + keysgroupBuffer.length, true);

      bb.writeByte(transaction.asset.multisignature.min);
      bb.writeByte(transaction.asset.multisignature.lifetime);

      for (var i = 0; i < keysgroupBuffer.length; i++) {
        bb.writeByte(keysgroupBuffer[i]);
      }

      bb.flip();

      assetBytes = bb.toBuffer();
      break;

    case trsTypes.DAPP: // Dapp
      assetBytes = getDAppBytes(transaction.asset.dapp);
      break;

    case trsTypes.IN_TRANSFER: // In Transfer (Dapp Deposit)
      assetBytes = getInTransferBytes(transaction.asset.inTransfer);
      break;
    case trsTypes.OUT_TRANSFER:
      assetBytes = getOutTransferBytes(transaction.asset.outTransfer)
      break;
    // evidence
    case trsTypes.EVIDENCE: 
      assetBytes = getEvidenceBytes(transaction.asset.evidence);
      break;  

    // dao 
    case trsTypes.ORG:
      assetBytes = getOrgBytes(transaction.asset.org);
      break;
    case trsTypes.EXCHANGE:
      assetBytes = getExchangeBytes(transaction.asset.exchange);
      break;
    case trsTypes.CONTRIBUTION:
      assetBytes = getContributionBytes(transaction.asset.daoContribution);
      // assetBytes = getContributionBytes(transaction.asset.daoContribution);
      break;
    case trsTypes.CONFIRMATION:
      assetBytes = getConfirmationBytes(transaction.asset.daoConfirmation);
      break;

    // coupon
    case trsTypes.COUPON_ISSUER_AUDITOR_BUY:
      assetBytes = getCouponIssuerAuditorBuy(transaction);
      break;
    case trsTypes.COUPON_ISSUER_APPLY:
      assetBytes = getCouponIssuerApplyBytes(transaction.asset.couponIssuerApply);
      break;
    case trsTypes.COUPON_ISSUER_CHECK:
      assetBytes = getCouponIssuerCheckBytes(transaction.asset.couponIssuerCheck);
      break;
    case trsTypes.COUPON_ISSUER_UPDATE:
      assetBytes = getCouponIssuerUpdateBytes(transaction.asset.couponIssuerUpdate);
      break;
    case trsTypes.COUPON_ISSUER_FREEZE:
      assetBytes = getCouponIssuerFreezeBytes(transaction.asset.couponIssuerFreeze);
      break;
    case trsTypes.COUPON_ISSUER_UNFREEZE:
      assetBytes = getCouponIssuerUnfreezeBytes(transaction.asset.couponIssuerUnfreeze);
      break;
    case trsTypes.COUPON_ISSUE_NEW:
      assetBytes = getCouponIssueNewBytes(transaction.asset.couponIssueNew);
      break;
    case trsTypes.COUPON_ISSUE_CLOSE:
      assetBytes = getCouponIssueCloseBytes(transaction.asset.couponIssueClose);
      break;
    case trsTypes.COUPON_ISSUE_REOPEN:
      assetBytes = getCouponIssueReopenBytes(transaction.asset.couponIssueReopen);
      break;
    case trsTypes.COUPON_EXCH_BUY:
      assetBytes = getCouponExchangeBuyBytes(transaction.asset.couponExcBuy);
      break;
    case trsTypes.COUPON_EXCH_PAY:
      assetBytes = getCouponExchangePayBytes(transaction.asset.couponExcPay);
      break;
    case trsTypes.COUPON_EXCH_TRANSFER_ASK:
      assetBytes = getCouponExchangeTransferAskBytes(transaction.asset.couponExcTransferAsk);
      break;
    case trsTypes.COUPON_EXCH_TRANSFER_CONFIRM:
      assetBytes = getCouponExchangeTransferConfirmBytes(transaction.asset.couponExcTransferConfirm);
      break;

    // aob
    case trsTypes.AOB_ISSUER:
      var bb = new ByteBuffer(1, true)
      var asset = transaction.asset.aobIssuer
      bb.writeString(asset.name)
      bb.writeString(asset.desc)
      bb.flip()
      assetBytes = toLocalBuffer(bb)
      break;
    case trsTypes.AOB_ASSET:
      var bb = new ByteBuffer(1, true)
      var asset = transaction.asset.aobAsset
      bb.writeString(asset.name)
      bb.writeString(asset.desc)
      bb.writeString(asset.maximum)
      bb.writeByte(asset.precision)
      if (typeof asset.strategy === 'string' && asset.strategy.length > 0) {
        bb.writeString(asset.strategy)
      }
      bb.writeByte(asset.allow_writeoff)
      bb.writeByte(asset.allow_whitelist)
      bb.writeByte(asset.allow_blacklist)
      bb.flip()
      assetBytes = toLocalBuffer(bb)
      break;
    case trsTypes.AOB_FLAGS:
      var bb = new ByteBuffer(1, true)
      var asset = transaction.asset.aobFlags
      bb.writeString(asset.currency)
      bb.writeByte(asset.flag_type)
      bb.writeByte(asset.flag)
      bb.flip()
      assetBytes = toLocalBuffer(bb)
      break;
    case trsTypes.AOB_ACL:
      var bb = new ByteBuffer(1, true)
      var asset = transaction.asset.aobAcl
      bb.writeString(asset.currency)
      bb.writeString(asset.operator)
      bb.writeByte(asset.flag)
      for (var i = 0; i < asset.list.length; ++i) {
        bb.writeString(asset.list[i])
      }
      bb.flip()
      assetBytes = toLocalBuffer(bb)
      break;
    case trsTypes.AOB_ISSUE:
      var bb = new ByteBuffer(1, true)
      var asset = transaction.asset.aobIssue
      bb.writeString(asset.currency)
      bb.writeString(asset.amount)
      bb.flip()
      assetBytes = toLocalBuffer(bb)
      break;
    case trsTypes.AOB_TRANSFER:
      var bb = new ByteBuffer(1, true)
      var asset = transaction.asset.aobTransfer
      bb.writeString(asset.currency)
      bb.writeString(asset.amount)
      bb.flip()
      assetBytes = toLocalBuffer(bb)
      break;
    case trsTypes.MULTITRANSFER:
      var bb = new ByteBuffer(1, true);
      var asset = transaction.asset.output
      for (var i = 0; i < asset.outputs.length; i++) {
        var output = asset.outputs[i]

        if (/^[0-9]{1,20}$/g.test(output.recipientId)) {
          
          var recipient = bignum.new(output.recipientId).toBuffer({
            size: 8
          });

          for (var i = 0; i < 8; i++) {
            bb.writeByte(recipient[i] || 0);
          }
        } else {
          bb.writeString(output.recipientId);
        }

        bb.writeString(output.amount);
      }
      bb.flip();
      assetBytes = toLocalBuffer(bb)
      break;
    default:
      assetBytes = getAssetBytes(transaction);  
  }

  if (transaction.__assetBytes__) {
    assetBytes = transaction.__assetBytes__;
  }
  if (assetBytes) assetSize = assetBytes.length

  // fixme: please delete follower +32
  // if (transaction.requesterPublicKey) {
  // 	assetSize += 32;
  // }

  var bb = new ByteBuffer(1, true);
  bb.writeByte(transaction.type); // +1
  bb.writeInt(transaction.timestamp); // +4
  bb.writeString(transaction.nethash); // +8

  // +32
  var senderPublicKeyBuffer = new Buffer(transaction.sender_public_key, "hex");
  // var senderPublicKeyBuffer = new Buffer(transaction.senderPublicKey, "hex");
  for (var i = 0; i < senderPublicKeyBuffer.length; i++) {
    bb.writeByte(senderPublicKeyBuffer[i]);
  }

  // +32
  if (transaction.requester_public_key) { //wxm block database
    var requesterPublicKey = new Buffer(transaction.requester_public_key, "hex"); //wxm block database

    for (var i = 0; i < requesterPublicKey.length; i++) {
      bb.writeByte(requesterPublicKey[i]);
    }
  }

  // +8
  if (transaction.recipient_id) {
    bb.writeString(transaction.recipient_id);
  } else {
    for (var i = 0; i < 8; i++) {
      bb.writeByte(0);
    }
  }

  // +8
  bb.writeString(transaction.amount);

  // +64
  if (transaction.message) bb.writeString(transaction.message)

  // +64
  if (transaction.args) {
    var args = transaction.args
    for (var i = 0; i < args.length; ++i) {
      bb.writeString(args[i])
    }
  }

  if (assetSize > 0) {
    for (var i = 0; i < assetSize; i++) {
      bb.writeByte(assetBytes[i]);
    }
  }

  if (!skipSignature && transaction.signature) {
    var signatureBuffer = new Buffer(transaction.signature, "hex");
    for (var i = 0; i < signatureBuffer.length; i++) {
      bb.writeByte(signatureBuffer[i]);
    }
  }

  if (!skipSecondSignature && transaction.sign_signature) {  //wxm block database
    var signSignatureBuffer = new Buffer(transaction.sign_signature, "hex"); //wxm block database
    for (var i = 0; i < signSignatureBuffer.length; i++) {
      bb.writeByte(signSignatureBuffer[i]);
    }
  }

  bb.flip();

  // competifined browser
  var arrayBuffer = new Uint8Array(bb.toArrayBuffer());
  var buffer = [];

  for (var i = 0; i < arrayBuffer.length; i++) {
  	buffer[i] = arrayBuffer[i];
  }

  return new Buffer(buffer);
  // return bb.toBuffer();
}

function getId(transaction) {
  return sha256Hex(getBytes(transaction))
}

function getHash(transaction, skipSignature, skipSecondSignature) {
  return sha256Bytes(getBytes(transaction, skipSignature, skipSecondSignature))
}

function getFee(transaction) {
  switch (transaction.type) {
    case trsTypes.SEND: // Normal
        return bignum.multiply(0.1, fixedPoint);
      break;

    case trsTypes.SIGNATURE: // Signature
        return bignum.multiply(100, fixedPoint);

      break;

    case trsTypes.DELEGATE: // Delegate
        return bignum.multiply(10000, fixedPoint);

      break;

    case trsTypes.VOTE: // Vote
        return bignum.new(fixedPoint);

      break;
  }
}

function sign(transaction, keys) {
  var hash = getHash(transaction, true, true);
  var signature = nacl.sign.detached(hash, new Buffer(keys.private_key, "hex"));

  if (!transaction.signature) {
    transaction.signature = new Buffer(signature).toString("hex");
  } else {
    return new Buffer(signature).toString("hex");
  }
}

function secondSign(transaction, keys) {
  var hash = getHash(transaction);
  var signature = nacl.sign.detached(hash, new Buffer(keys.private_key, "hex"));
  transaction.sign_signature = new Buffer(signature).toString("hex")    //wxm block database
}

function signBytes(bytes, keys) {
  var hash = sha256Bytes(new Buffer(bytes, 'hex'))
  var signature = nacl.sign.detached(hash, new Buffer(keys.private_key, "hex"));
  return new Buffer(signature).toString("hex");
}

function verify(transaction) {
  var remove = 64;

  if (transaction.signSignature) {
    remove = 128;
  }

  var bytes = getBytes(transaction);
  var data2 = new Buffer(bytes.length - remove);

  for (var i = 0; i < data2.length; i++) {
    data2[i] = bytes[i];
  }

  var hash = sha256Bytes(data2)

  var signatureBuffer = new Buffer(transaction.signature, "hex");
  var senderPublicKeyBuffer = new Buffer(transaction.sender_public_key, "hex");
  var res = nacl.sign.detached.verify(hash, signatureBuffer, senderPublicKeyBuffer);

  return res;
}

function verifySecondSignature(transaction, public_key) {
  var bytes = getBytes(transaction);
  var data2 = new Buffer(bytes.length - 64);

  for (var i = 0; i < data2.length; i++) {
    data2[i] = bytes[i];
  }

  var hash = sha256Bytes(data2)

  var signSignatureBuffer = new Buffer(transaction.signSignature, "hex");
  var publicKeyBuffer = new Buffer(public_key, "hex");
  var res = nacl.sign.detached.verify(hash, signSignatureBuffer, publicKeyBuffer);

  return res;
}

function verifyBytes(bytes, signature, public_key) {
  var hash = sha256Bytes(new Buffer(bytes, 'hex'))
  var signatureBuffer = new Buffer(signature, "hex");
  var publicKeyBuffer = new Buffer(public_key, "hex");
  var res = nacl.sign.detached.verify(hash, signatureBuffer, publicKeyBuffer);
  return res
}

function getKeys(secret) {
  var hash = sha256Bytes(new Buffer(secret));
  var keypair = nacl.sign.keyPair.fromSeed(hash);

  return {
    public_key: new Buffer(keypair.publicKey).toString("hex"),
    private_key: new Buffer(keypair.secretKey).toString("hex")
  }
}

function getAddress(public_key) {
  return addressHelper.generateBase58CheckAddress(public_key)
}

module.exports = {
  getBytes: getBytes,
  getHash: getHash,
  getId: getId,
  getFee: getFee,
  sign: sign,
  secondSign: secondSign,
  getKeys: getKeys,
  getAddress: getAddress,
  verify: verify,
  verifySecondSignature: verifySecondSignature,
  fixedPoint: fixedPoint,
  signBytes: signBytes,
  toLocalBuffer: toLocalBuffer,
  verifyBytes: verifyBytes,
  isAddress: addressHelper.isAddress,
  isBase58CheckAddress: addressHelper.isBase58CheckAddress
}