/*---------------------------------------------------------------------------------------------
 *  Created by wangxm on Mon Mar 13 2019 8:52:48
 *
 *  Copyright (c) 2019 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * DDN Schema
 */
var Ajv = require("ajv");
var path = require("path");
var fs = require('fs');

var _singleton;

class DdnSchema {

    static singleton() {
        if (!_singleton) {
            _singleton = new DdnSchema();
        }
        return _singleton;
    }

    constructor() {
        this._ajv = new Ajv({schemaId: "auto", allErrors: true});

        this._attachFormatExt("format-ext");
    }

    _attachFormatExt(dir) {
        var extPath = path.resolve(__dirname, dir);

        var items = fs.readdirSync(extPath);
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var itemPath = path.resolve(extPath, item);
            var itemInfo = fs.statSync(itemPath);
            if (itemInfo.isFile()) {
                var pos = item.lastIndexOf(".");
                if (pos >= 0) {
                    var ext = item.substring(pos);
                    if (ext.toLowerCase() == ".js") {
                        var extFormat = global._require_runtime_(itemPath);
                        if (extFormat != null &&
                            typeof(extFormat.name) == "string" &&
                            typeof(extFormat.validate) == "function") {
                            this._ajv.addFormat(extFormat.name, extFormat.validate);
                        }
                    }
                }
            }
        }
    }

    async validateBlock(block) {
        var schemaFile = path.resolve(__dirname, './ddn-schemas/block.json');
        var blockSchema = global._require_runtime_(schemaFile);
        return await this.validate(blockSchema, block);
    }

    async validateTransaction(trs) {
        var schemaFile = path.resolve(__dirname, './ddn-schemas/transaction.json');
        var transactionSchema = global._require_runtime_(schemaFile);
        return await this.validate(transactionSchema, trs);
    }

    async validatePeer(peer) {
        var schemaFile = path.resolve(__dirname, './ddn-schemas/peer.json');
        var peerSchema = global._require_runtime_(schemaFile);
        return await this.validate(peerSchema, peer);
    }

    async validatePeers(peer) {
        var schemaFile = path.resolve(__dirname, './ddn-schemas/peers.json');
        var peerSchema = global._require_runtime_(schemaFile);
        return await this.validate(peerSchema, peer);
    }

    /**
     * 根据schema格式校验data数据是否合法，合法返回null，否则返回错误对象
     * @param {*} schema
     * @param {*} data
     */
    async validate(schema, data) {
        var result = this._ajv.validate(schema, data);
        if (!result) {
            return this._ajv.errors;
        }
        return null;
    }

}

module.exports = DdnSchema;
