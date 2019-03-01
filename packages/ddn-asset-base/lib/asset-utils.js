var _transConfigs = [];

var _transTypeValues = [];
var _transTypeNames = [];

class AssetUtils
{
    static loadFromObject(assetPlugins) {
        for (var p in assetPlugins) {
            var currAsset = assetPlugins[p];
            if (currAsset) {
                if (currAsset.package && !/^\s*$/.test(currAsset.package)) {
                    var assetTransactions = currAsset.transactions;
                    if (assetTransactions && assetTransactions.length > 0) {
                        //测试资产插件包配置是否正确
                        require(currAsset.package);

                        for (var i = 0; i < assetTransactions.length; i++) {
                            var currTrans = assetTransactions[i];
                            if (!(currTrans.name && !/^\s*$/.test(currTrans.name))) {
                                throw new Error("The asset.plugin.js error: name property required.");
                            }
                            if (!(currTrans.type && /^[1-9][0-9]*$/.test(currTrans.type))) {
                                throw new Error("The asset.plugin.js error: type property required.");
                            }

                            if (_transTypeNames[currTrans.type]) {
                                throw new Error("The asset.plugin.js error: type " + currTrans.type + " is conflicting.");
                            }

                            currTrans.package = currAsset.package;

                            _transConfigs.push(currTrans);
                            _transTypeValues[currTrans.name] = currTrans;
                            _transTypeNames[currTrans.type] = currTrans;
                        }
                    }
                }
                else
                {
                    throw new Error("The asset.plugin.js error: package property required.");
                }
            }
        }

        return this;
    }

    static loadFromFile(file) {
        _transConfigs.length = 0;
        _transTypeValues.length = 0;
        _transTypeNames.length = 0;

        var assetPlugins = require(file);
        return this.loadFromObject(assetPlugins);
    }

    static getTypeValue(typeName) {
        if (_transTypeValues[typeName]) {
            return _transTypeValues[typeName].type;
        }
        return -1;
    }

    static getTypeName(typeValue) {
        if (_transTypeNames[typeValue]) {
            return _transTypeNames[typeValue].name;
        }
        return null;
    }

    static isTypeValueExists(typeValue) {
        return !!_transTypeNames[typeValue];
    }

    static getAssetJsonName(typeValue) {
        var result = "";
        var typeName = this.getTypeName(typeValue) + "";
        var subNames = typeName.split(/[-_]/);
        for (var i = 0; i < subNames.length; i++) {
            var sn = subNames[i];
            if (sn && !/^\s*$/.test(sn)) {
                if (i == 0) {
                    var camelSN = sn.substring(0, 1).toLowerCase() + sn.substring(1);
                    result += camelSN;
                } else {
                    var camelSN = sn.substring(0, 1).toUpperCase()  + sn.substring(1);
                    result += camelSN;
                }
            }
        }
        return result;
    }

    static getTransactionCount() {
        return _transConfigs.length;
    }

    static getTransactionByIndex(index) {
        if (index >= 0 && index < _transConfigs.length) {
            return _transConfigs[index];
        }
        return null;
    }

    static getTransactionByTypeValue(typeValue) {
        return _transTypeNames[typeValue];
    }
}

module.exports = AssetUtils;