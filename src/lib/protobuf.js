/*---------------------------------------------------------------------------------------------
 *  Created by imfly on Wed Mar 14 2017 16:10:18
 *
 *  Copyright (c) 2017 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const protobuf = require('protobufjs');
const extend = require('extend');
const { AssetTypes } = require('@ddn/ddn-utils');
const { AssetUtils } = require('@ddn/ddn-asset-base');

class Protobuf {
  constructor(root){
    this.root = root;
  }

  encodeBlock (block) {
    const obj = extend(true, {}, block);
    obj.payload_hash = new Buffer(obj.payload_hash, 'hex');  //wxm block database
    obj.generator_public_key = new Buffer(obj.generator_public_key, 'hex'); //wxm block database
    if (obj.block_signature) {  //wxm block database
      obj.block_signature = new Buffer(obj.block_signature, 'hex'); //wxm block database
    }
    for (let i = 0; i < obj.transactions.length; ++i) {
      this.transactionStringToBytes(obj.transactions[i]);
    }

    // Note: 当顶级Namespace为空的时候，下面的调用等同于 this.root.lookup('Block').encode(obj).finish()
    return this.root.Block.encode(obj).finish();
  }

  decodeBlock (data) {
    let obj = this.root.Block.decode(data);

    // obj = toNumber(obj);

    obj.payload_hash = obj.payload_hash.toString('hex');  //wxm block database
    obj.generator_public_key = obj.generator_public_key.toString('hex');    //wxm block database
    if (obj.block_signature) {   //wxm block database
      obj.block_signature = obj.block_signature.toString('hex');    //wxm block database
    }
    for (let i = 0; i < obj.transactions.length; ++i) {
      this.transactionBytesToString(obj.transactions[i]);
    }
    return obj;
  }

  encodeBlockPropose (propose) {
    const obj = extend(true, {}, propose);
    obj.generator_public_key = new Buffer(obj.generator_public_key, 'hex');   //wxm block database
    obj.hash = new Buffer(obj.hash, 'hex');
    obj.signature = new Buffer(obj.signature, 'hex');
    var err = this.root.BlockPropose.verify(obj);
    if (err){
      throw Error(err);
    }
    return this.root.BlockPropose.encode(obj).finish();
  }

  decodeBlockPropose (data) {
    let obj= this.root.BlockPropose.decode(data);
    // obj = toNumber(obj);
    obj.generator_public_key = obj.generator_public_key.toString('hex');    //wxm block database
    obj.hash = obj.hash.toString('hex');
    obj.signature = obj.signature.toString('hex');
    return obj;
  }

  encodeBlockVotes (obj) {
    for (let signature of obj.signatures) {
      signature.key = new Buffer(signature.key, 'hex');
      signature.sig = new Buffer(signature.sig, 'hex');
    }

    var err = this.root.BlockVotes.verify(obj);
    if (err){
      throw Error(err);
    }

    return this.root.BlockVotes.encode(obj).finish();
  }

  decodeBlockVotes (data) {
    let obj= this.root.BlockVotes.decode(data);
    // obj = toNumber(obj);

    for (let signature of obj.signatures) {
      signature.key = signature.key.toString('hex');
      signature.sig = signature.sig.toString('hex');
    }

    return obj;
  }

  encodeTransaction (trs) {
    const obj = extend(true, {}, trs);
    this.transactionStringToBytes(obj);

    var err = this.root.Transaction.verify(obj);
    if (err){
      throw Error(err);
    }

    return this.root.Transaction.encode(obj).finish();
  }

  decodeTransaction (data) {
    let obj = this.root.Transaction.decode(data).toJSON();
    this.transactionBytesToString(obj);
    return obj;
  }

  transactionStringToBytes (obj) {
    obj.sender_public_key = new Buffer(obj.sender_public_key, 'hex');   //wxm block database
    obj.signature = new Buffer(obj.signature, 'hex');
    if (obj.requester_public_key) {   //wxm block database
      obj.requester_public_key = new Buffer(obj.requester_public_key, 'hex');   //wxm block database
    }
    if (obj.sign_signature) {    //wxm block database
      obj.sign_signature = new Buffer(obj.sign_signature, 'hex'); //wxm block database
    }

    switch (obj.type) {
        case AssetTypes.DELEGATE:
            if (obj.asset.delegate) {
                obj.asset.delegate.public_key = new Buffer(obj.asset.delegate.public_key, 'hex');   //wxm block database
            }
            break;
        case AssetTypes.SIGNATURE:
            if (obj.asset.signature) {
                obj.asset.signature.public_key = new Buffer(obj.asset.signature.public_key, 'hex'); //wxm block database
            }
            break;
    }
  }

  transactionBytesToString (obj) {
    obj.sender_public_key = new Buffer(obj.sender_public_key, "base64").toString("hex");    // obj.sender_public_key.toString('hex');  //wxm block database
    obj.signature = new Buffer(obj.signature, "base64").toString("hex");    // obj.signature.toString('hex');
    if (obj.requester_public_key) {   //wxm block database
      obj.requester_public_key = new Buffer(obj.requester_public_key, "base64").toString("hex");    // obj.requester_public_key.toString('hex');  //wxm block database
    }
    if (obj.sign_signature) {    //wxm block database
      obj.sign_signature = new Buffer(obj.sign_signature, "base64").toString("hex");    // obj.sign_signature.toString('hex');    //wxm block database
    }

    switch (obj.type) {
        case AssetTypes.DELEGATE:
            if (obj.asset.delegate) {
                obj.asset.delegate.public_key = new Buffer(obj.asset.delegate.public_key, "base64").toString("hex");    // obj.asset.delegate.public_key.toString('hex');  //wxm block database
            }
            break;
        case AssetTypes.SIGNATURE:
            if (obj.asset.signature) {
                obj.asset.signature.public_key = new Buffer(obj.asset.signature.public_key, "base64").toString("hex");  // obj.asset.signature.public_key.toString('hex');    //wxm block database
            }
            break;
    }
  }
}

module.exports = (schemaFile, cb) => {
    var insertAssetMessage = async function(root) {
        var rootTemp = JSON.parse(JSON.stringify(root));

        var maxAssetId = 0;
        if (rootTemp.nested.Asset && rootTemp.nested.Asset.fields) {
            for (var p in rootTemp.nested.Asset.fields) {
                maxAssetId = Math.max(maxAssetId, rootTemp.nested.Asset.fields[p].id);
            }
        }

        var transCount = AssetUtils.getTransactionCount();
        for (var i = 0; i < transCount; i++) {
            var assetTrans = AssetUtils.getTransactionByIndex(i);
            if (assetTrans) {
                var assetJsonName = AssetUtils.getAssetJsonName(assetTrans.type);

                var transCls = _require_runtime_(assetTrans.package)[assetTrans.name];
                var transInst = new transCls();   //wxm 此处传的都是null，必须保证propsMapping里不要用到这传入的context参数
                var props = await transInst.propsMapping();
                var fields = {};
                for (var j = 0; j < props.length; j++) {
                    var pItem = props[j];
                    fields[pItem.prop] = {};

                    if (pItem.required) {
                        fields[pItem.prop].rule = "required";
                    }

                    var fieldType = pItem.field.replace(/[0-9]/g, "");
                    fieldType = fieldType.replace(/_ext$/, "");
                    if (fieldType == "int") {
                        fields[pItem.prop].type = "int32";
                    } else {
                        fields[pItem.prop].type = "string";
                    }

                    fields[pItem.prop].id = j + 1;
                }

                rootTemp.nested.Asset.oneofs.derivedAsset.oneof.push(assetJsonName);
                rootTemp.nested.Asset.fields[assetJsonName] ={
                    type: assetTrans.name,
                    id: maxAssetId + 1
                };
                rootTemp.nested[assetTrans.name] = {
                    fields: fields
                };

                maxAssetId++;
            }
        }

        return protobuf.Root.fromJSON(rootTemp);
    };

    //wxm block database
    protobuf.parse.defaults.keepCase = true

    protobuf.load(schemaFile, async (err, root) => {
        if (err){
            return cb(`Failed to read proto file: ${err}`);
        }

        root = await insertAssetMessage(root);
        cb(null, new Protobuf(root));
    });
}
