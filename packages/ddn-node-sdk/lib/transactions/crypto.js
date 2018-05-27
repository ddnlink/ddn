var sha256 = require("fast-sha256");
var addressHelper = require('../address.js')

if (typeof Buffer === "undefined") {
  Buffer = require("buffer/").Buffer;
}

var ByteBuffer = require("bytebuffer");
var bignum = require("browserify-bignum");
var nacl = require('tweetnacl')

var fixedPoint = Math.pow(10, 8);

function getSignatureBytes(signature) {
  var bb = new ByteBuffer(32, true);
  var publicKeyBuffer = new Buffer(signature.publicKey, "hex");

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
    bb.writeInt(dapp.unlockDelegates);
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
    var dappId = new Buffer(inTransfer.dappId, "utf8");
    var currency = new Buffer(inTransfer.currency, "utf8")
    buf = Buffer.concat([buf, dappId, currency]);
    if (inTransfer.currency !== 'DDN') {
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
    var dappIdBuf = new Buffer(outTransfer.dappId, 'utf8');
    var transactionIdBuff = new Buffer(outTransfer.transactionId, 'utf8');
    var currencyBuff = new Buffer(outTransfer.currency, 'utf8')
    var amountBuff = new Buffer(outTransfer.amount, 'utf8')
    buf = Buffer.concat([buf, dappIdBuf, transactionIdBuff, currencyBuff, amountBuff]);
  } catch (e) {
    throw Error(e.toString());
  }

  return buf;
}

getEvidenceBytes = function(evidence) {
  let buf;

  try {
    buf = new Buffer([]);

    const ipidBuf = new Buffer(evidence.ipid, 'utf8');
    const titleBuf = new Buffer(evidence.title, 'utf8');
    const tagsBuf = new Buffer(evidence.tags, 'utf8');
    const urlBuf = new Buffer(evidence.url, 'utf8');
    const authorBuf = new Buffer(evidence.author, 'utf8');

    buf = Buffer.concat([buf, ipidBuf, titleBuf, tagsBuf, urlBuf, authorBuf]);

    const bb = new ByteBuffer();
    bb.writeString(evidence.hash);
    bb.writeString(evidence.size ? evidence.size : '');
    bb.writeString(evidence.type);

    bb.flip();

    buf = Buffer.concat([buf, bb.toBuffer()]);
  } catch (e) {
    throw Error(e.toString());
  }

  return buf;
}

function getBytes(transaction, skipSignature, skipSecondSignature) {
  var assetSize = 0,
    assetBytes = null;

  switch (transaction.type) {
    case 1: // Signature
      assetBytes = getSignatureBytes(transaction.asset.signature);
      break;

    case 2: // Delegate
      assetBytes = new Buffer(transaction.asset.delegate.username, "utf8");
      break;

    case 3: // Vote
      assetBytes = new Buffer(transaction.asset.vote.votes.join(""), "utf8");
      break;

    case 4: // Multi-Signature
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

    case 5: // Dapp
      assetBytes = getDAppBytes(transaction.asset.dapp);
      break;

    case 6: // In Transfer (Dapp Deposit)
      assetBytes = getInTransferBytes(transaction.asset.inTransfer);
      break;
    case 7:
      assetBytes = getOutTransferBytes(transaction.asset.outTransfer)
      break;
    case 8:
      assetBytes = toLocalBuffer(ByteBuffer.fromHex(transaction.asset.storage.content))
      break;
    case 9:
      var bb = new ByteBuffer(1, true)
      var asset = transaction.asset.aobIssuer
      bb.writeString(asset.name)
      bb.writeString(asset.desc)
      bb.flip()
      assetBytes = toLocalBuffer(bb)
      break;
    case 10:
      var bb = new ByteBuffer(1, true)
      var asset = transaction.asset.aobAsset
      bb.writeString(asset.name)
      bb.writeString(asset.desc)
      bb.writeString(asset.maximum)
      bb.writeByte(asset.precision)
      if (typeof asset.strategy === 'string' && asset.strategy.length > 0) {
        bb.writeString(asset.strategy)
      }
      bb.writeByte(asset.allowWriteoff)
      bb.writeByte(asset.allowWhitelist)
      bb.writeByte(asset.allowBlacklist)
      bb.flip()
      assetBytes = toLocalBuffer(bb)
      break;
    case 11:
      var bb = new ByteBuffer(1, true)
      var asset = transaction.asset.aobFlags
      bb.writeString(asset.currency)
      bb.writeByte(asset.flagType)
      bb.writeByte(asset.flag)
      bb.flip()
      assetBytes = toLocalBuffer(bb)
      break;
    case 12:
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
    case 13:
      var bb = new ByteBuffer(1, true)
      var asset = transaction.asset.aobIssue
      bb.writeString(asset.currency)
      bb.writeString(asset.amount)
      bb.flip()
      assetBytes = toLocalBuffer(bb)
      break;
    case 14:
      var bb = new ByteBuffer(1, true)
      var asset = transaction.asset.aobTransfer
      bb.writeString(asset.currency)
      bb.writeString(asset.amount)
      bb.flip()
      assetBytes = toLocalBuffer(bb)
      break;
    case 16:
      var bb = new ByteBuffer(1, true);
      var asset = transaction.asset.output
      for (var i = 0; i < asset.outputs.length; i++) {
        var output = asset.outputs[i]

        if (/^[0-9]{1,20}$/g.test(output.recipientId)) {
          var recipient = bignum(output.recipientId).toBuffer({
            size: 8
          });
          for (var i = 0; i < 8; i++) {
            bb.writeByte(recipient[i] || 0);
          }
        } else {
          bb.writeString(output.recipientId);
        }

        bb.writeLong(output.amount);
      }
      bb.flip();
      assetBytes = toLocalBuffer(bb)
      break;
    case 20: // evidence
      assetBytes = getEvidenceBytes(transaction.asset.evidence);
      break;
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
  var senderPublicKeyBuffer = new Buffer(transaction.senderPublicKey, "hex");
  for (var i = 0; i < senderPublicKeyBuffer.length; i++) {
    bb.writeByte(senderPublicKeyBuffer[i]);
  }

  // +32
  if (transaction.requesterPublicKey) {
    var requesterPublicKey = new Buffer(transaction.requesterPublicKey, "hex");

    for (var i = 0; i < requesterPublicKey.length; i++) {
      bb.writeByte(requesterPublicKey[i]);
    }
  }

  // +8
  if (transaction.recipientId) {
    bb.writeString(transaction.recipientId);
  } else {
    for (var i = 0; i < 8; i++) {
      bb.writeByte(0);
    }
  }

  // +8
  bb.writeLong(transaction.amount);

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

  if (!skipSecondSignature && transaction.signSignature) {
    var signSignatureBuffer = new Buffer(transaction.signSignature, "hex");
    for (var i = 0; i < signSignatureBuffer.length; i++) {
      bb.writeByte(signSignatureBuffer[i]);
    }
  }

  bb.flip();
  // var arrayBuffer = new Uint8Array(bb.toArrayBuffer());
  // var buffer = [];

  // for (var i = 0; i < arrayBuffer.length; i++) {
  // 	buffer[i] = arrayBuffer[i];
  // }

  // return new Buffer(buffer);
  return bb.toBuffer();
}

function getId(transaction) {
  return sha256Hex(getBytes(transaction))
}

function getHash(transaction, skipSignature, skipSecondSignature) {
  return sha256Bytes(getBytes(transaction, skipSignature, skipSecondSignature))
}

function getFee(transaction) {
  switch (transaction.type) {
    case 0: // Normal
      return 0.1 * fixedPoint;
      break;

    case 1: // Signature
      return 100 * fixedPoint;
      break;

    case 2: // Delegate
      return 10000 * fixedPoint;
      break;

    case 3: // Vote
      return 1 * fixedPoint;
      break;
  }
}

function sign(transaction, keys) {
  var hash = getHash(transaction, true, true);
  var signature = nacl.sign.detached(hash, new Buffer(keys.privateKey, "hex"));

  if (!transaction.signature) {
    transaction.signature = new Buffer(signature).toString("hex");
  } else {
    return new Buffer(signature).toString("hex");
  }
}

function secondSign(transaction, keys) {
  var hash = getHash(transaction);
  var signature = nacl.sign.detached(hash, new Buffer(keys.privateKey, "hex"));
  transaction.signSignature = new Buffer(signature).toString("hex")
}

function signBytes(bytes, keys) {
  var hash = sha256Bytes(new Buffer(bytes, 'hex'))
  var signature = nacl.sign.detached(hash, new Buffer(keys.privateKey, "hex"));
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
  var senderPublicKeyBuffer = new Buffer(transaction.senderPublicKey, "hex");
  var res = nacl.sign.detached.verify(hash, signatureBuffer, senderPublicKeyBuffer);

  return res;
}

function verifySecondSignature(transaction, publicKey) {
  var bytes = getBytes(transaction);
  var data2 = new Buffer(bytes.length - 64);

  for (var i = 0; i < data2.length; i++) {
    data2[i] = bytes[i];
  }

  var hash = sha256Bytes(data2)

  var signSignatureBuffer = new Buffer(transaction.signSignature, "hex");
  var publicKeyBuffer = new Buffer(publicKey, "hex");
  var res = nacl.sign.detached.verify(hash, signSignatureBuffer, publicKeyBuffer);

  return res;
}

function verifyBytes(bytes, signature, publicKey) {
  var hash = sha256Bytes(new Buffer(bytes, 'hex'))
  var signatureBuffer = new Buffer(signature, "hex");
  var publicKeyBuffer = new Buffer(publicKey, "hex");
  var res = nacl.sign.detached.verify(hash, signatureBuffer, publicKeyBuffer);
  return res
}

function getKeys(secret) {
  var hash = sha256Bytes(new Buffer(secret))
  var keypair = nacl.sign.keyPair.fromSeed(hash);

  return {
    publicKey: new Buffer(keypair.publicKey).toString("hex"),
    privateKey: new Buffer(keypair.secretKey).toString("hex")
  }
}

function getAddress(publicKey) {
  return addressHelper.generateBase58CheckAddress(publicKey)
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
