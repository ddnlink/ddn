/*---------------------------------------------------------------------------------------------
 *  Created by imfly on Sun May 06 2017 11:39:6
 *
 *  Copyright (c) 2018 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/**
 * 这是资产模型的基类
 *
 * 需要包含如下12个基本方法：
 * create，getBytes，calculateFee，verify，objectNormalize，dbRead，apply，undo，applyUnconfirmed，
 * undoUnconfirmed，ready，process
 */
const AssetUtils = require('./asset-utils');
const ByteBuffer = require('bytebuffer');
const CommonUtils = require('./common-utils');
const bignum = require('bignum-utils');

let self;

/**
 * 定义字段相应规则
 */
const _assetFiledRules = {
    "str1": {
        maxLen: 32
    },
    "str2": {
        maxLen: 64
    },
    "str3": {
        maxLen: 64
    },
    "str4": {
        maxLen: 128
    },
    "str5": {
        maxLen: 128
    },
    "str6": {
        maxLen: 256
    },
    "str7": {
        maxLen: 256
    },
    "str8": {
        maxLen: 512
    },
    "str9": {
        maxLen: 512
    },
    "str10": {
        maxLen: 1024
    },
    "int1": {
        minValue: -214748364,
        maxValue: 2147483647
    },
    "int2": {
        minValue: -214748364,
        maxValue: 2147483647
    },
    "int3": {
        minValue: -214748364,
        maxValue: 2147483647
    },
};

class AssetBase {

    constructor(library, modules) {
        self = this;
        self.library = library;
        self.modules = modules;
    }

    /**
     * transaction创建时调用，用来对输入参数根据资产进行个性化处理
     * @param {*} data 
     * @param {*} trs 
     */
    create(data, trs) {
        return trs;
    }

    /**
     * 计算该类型资产交易的手续费
     * @param {*} trs 
     * @param {*} sender 
     */
    calculateFee(trs, sender) {
        return self.library.base.block.calculateFee();
    }

    /**
     * 定义资产属性和字段的对应关系
     * 最多支持定义15个属性
     * 字符串类型10个，名称分别是str1,str2,str3...str10，长度分别是32,64,64,128,128,256,256,512,512,1024，前4个有索引
     * 整数类型3个，名称分别是int1,int2,int3，类型为INT，前2个有索引
     * 时间戳类型2个，分别是timestamp1,timestamp2
     * 扩展类无上限，名称使用str_ext, int_ext, timestamp_ext，分别定义不同类型
     * 
     * 以下属于系统属性，不可使用
     * amount：转账金额，默认为0，字符串类型
     * receiveAddress，收款地址，默认为null
     * 
     * 注：此方法中不能使用self.library、self.modules
     */
    propsMapping() {
        throw new Error("AssetBase子类必须重载propsMapping方法。");

        //例如：员工资产类型有name、age、address 3个自定义属性，对应预设字段如下：
        // return [
        //     {"field": "str1", "prop": "name", required: true, minLen: 1, maxLen: 10},
        //     {"field": "int1", "prop": "age", required: true, minVaule: 0, maxValue: 40},
        //     {"field": "str2", "prop": "addr"},
        //     {"field": "str_ext", "prop": "ext1"}
        // ];
    }

    /**
     * 自定义资产Api
     */
    attachApi(config, router) {
    }

    /**
     * 判断是否包含Json扩展属性
     */
    hasExtProps(){
        if (this.isHasExtProps != null && typeof(this.isHasExtProps) != "undefined") {
            return this.isHasExtProps;
        }

        this.isHasExtProps = false;
        var mapping = this.propsMapping();
        for (var i = 0; i < mapping.length; i++) {
            var item = mapping[i];
            if (item) {
                if (item.field && item.field.substring(item.field.length - 4, item.field.length) == "_ext") {
                    this.isHasExtProps = true;
                }
            }
        }

        return this.isHasExtProps;
    }

    getPropsMappingItemByProp(propName) {
        if (!self.propsMappingItems || 
            !self.propsMappingItems[propName.toLowerCase()]) {
            var props = this.propsMapping();
            for (var i = 0; i < props.length; i++) {
                var currProp = props[i];
                if (currProp.prop.toLowerCase() == propName.toLowerCase()) {
                    if (!self.propsMappingItems) {
                        self.propsMappingItems = {};
                    }
                    self.propsMappingItems[propName.toLowerCase()] = currProp;
                    break;
                }
            }
        }

        if (self.propsMappingItems && self.propsMappingItems[propName.toLowerCase()]) {
            return self.propsMappingItems[propName.toLowerCase()];
        } else {
            return null;
        }
    }

    getPropsMappingItemByField(fieldName) {
        if (!self.propsMappingItems || 
            !self.propsMappingItems[fieldName.toLowerCase()]) {
            var props = this.propsMapping();
            for (var i = 0; i < props.length; i++) {
                var currProp = props[i];
                if (currProp.field.toLowerCase() == fieldName.toLowerCase()) {
                    if (!self.propsMappingItems) {
                        self.propsMappingItems = {};
                    }
                    self.propsMappingItems[fieldName.toLowerCase()] = currProp;
                    break;
                }
            }
        }

        if (self.propsMappingItems && self.propsMappingItems[fieldName.toLowerCase()]) {
            return self.propsMappingItems[fieldName.toLowerCase()];
        } else {
            return null;
        }
    }

    /**
     * @param {*} condition 包括filter、pageSize、pageIndex、sort几个属性
     *                      filter用来定义查询条件，规则遵循jsonSql规则，使用prop的名称来定义
     *                      pageSize分页的大小，每页的记录条数
     *                      pageIndex查询的页码，从1开始
     *                      sort排序方式，遵循jsonSql写法
     */
    queryAsset(condition, cb) {
        condition = condition || {};
        
        var newConds = {};
        condition.filter = condition.filter || {};
        for (var p in condition.filter) {
            var condProp = this.getPropsMappingItemByProp(p);
            if (condProp) {
                newConds["trs_asset." + condProp.field] = condition.filter[p];
            } else {
                var pName = p.toLowerCase();
                if (pName == "trsid") {
                    newConds["trs_asset.transactionId"] = condition.filter[p];
                } else if (pName == "trstype") {
                    newConds["trs_asset.transactionType"] = condition.filter[p];
                }
            }
        }

        var newSorts = {};
        condition.sort = condition.sort || {};
        for (var p in condition.sort) {
            var condProp = this.getPropsMappingItemByProp(p);
            if (condProp) {
                newSorts["trs_asset." + condProp.field] = condition.sort[p];
            } else {
                var pName = p.toLowerCase();
                if (pName == "transactionid") {
                    newSorts["trs_asset.transactionId"] = condition.sort[p];
                } else if (pName == "transactiontype") {
                    newSorts["trs_asset.transactionType"] = condition.sort[p];
                } else if (pName == "timestamp") {
                    newSorts["trs_asset.timestamp"] = condition.sort[p];
                }
            }
        }

        self.library.model.getAssetBase(newConds, 
            this.hasExtProps(), condition.pageIndex,
            condition.pageSize, newSorts, (err, rows) => {
                if (err) {
                    return cb(err);
                }

                if (rows && rows.length > 0) {
                    var rowObjs = [];
                    for (var i = 0; i < rows.length; i++) {
                        var rowInfo = rows[i];
                        var rowObj = self.dbRead(rowInfo);
                        if (rowObj) {
                            var assetName = AssetUtils.getAssetJsonName(rowInfo.asset_trs_type);
                            rowObjs.push(rowObj[assetName]);
                        }
                    }
                    return cb(null, rowObjs);
                } else {
                    return cb(null, []);
                }
            });
    }

    /**
     * 校验输入数据格式是否符合规则（_assetFiledRules负责定义规则）
     * @param {*} trs 
     */
    fieldsIsValid(trs) {
        var err = null;

        var assetJsonName = AssetUtils.getAssetJsonName(trs.type);

        if (!trs.asset || !trs.asset[assetJsonName]) {
            return cb('Invalid transaction asset');
        }
      
        const asset = trs.asset[assetJsonName];

        var mapping = this.propsMapping();
        for (var i = 0; i < mapping.length; i++) {
            var item = mapping[i];
            if (item) {
                var itemRule = _assetFiledRules[item.field];
                var fieldType = item.field.replace(/[0-9]/g, "");
                fieldType = fieldType.replace(/_ext$/, "");
                if (fieldType == "str") {
                    var strValue = asset[item.prop];
                    if (strValue != null && typeof(strValue) != "undefined") {
                        if (typeof(strValue) != "string") {
                            err = "The '" + item.prop + "' attribute type of '" + assetJsonName + "' must be a string.";
                            break;
                        }

                        var minLen = item.minLen;
                        var maxLen = item.maxLen;
                        if (itemRule) {
                            minLen = itemRule.minLen;
                            maxLen = itemRule.maxLen;
                        }

                        if (minLen != null && typeof(minLen) != "undefined") {
                            try
                            {
                                minLen = parseInt(minLen);
                            }
                            catch(err3) 
                            {
                                err = "The '" + item.prop + "' attribute min length of '" + assetJsonName + "' must be greater than " + minLen;
                                break;
                            }

                            if (strValue.length < minLen){
                                err = "The '" + item.prop + "' attribute min length of '" + assetJsonName + "' must be greater than " + minLen;
                                break;
                            }
                        }
                        if (maxLen != null && typeof(maxLen) != "undefined") {
                            if (strValue.length > maxLen) {
                                err = "The '" + item.prop + "' attribute max length of '" + assetJsonName + "' must be less than " + maxLen;
                                break;
                            }
                        }
                    } else if (item.required) {
                        err = "The '" + item.prop + "' attribute of '" + assetJsonName + "' is required.";
                        break;
                    }
                } else if (fieldType == "int") {
                    var intValue = asset[item.prop];
                    if (intValue != null && typeof(intValue) != "undefined") {
                        if (typeof(intValue) != "number") {
                            err = "The '" + item.prop + "' attribute type of '" + assetJsonName + "' must be a integer.";
                            break;
                        }

                        if (itemRule) {
                            if (itemRule.maxValue != null && typeof(itemRule.maxValue) != "undefined") {
                                if (intValue > itemRule.maxValue) {
                                    err = "The '" + item.prop + "' attribute max value of '" + assetJsonName + "' must be less than " + itemRule.maxValue;
                                    break;
                                }
                            }

                            if (itemRule.minValue != null && typeof(itemRule.minValue) != "undefined") {
                                if (intValue < itemRule.minValue) {
                                    err = "The '" + item.prop + "' attribute min value of '" + assetJsonName + "' must be greater than " + itemRule.maxValue;
                                    break;
                                }
                            }
                        }
                    } else if (item.required) {
                        err = "The '" + item.prop + "' attribute of '" + assetJsonName + "' is required.";
                        break;
                    }
                } else if (fieldType == "timestamp") {
                    var timestampValue = asset[item.prop];
                    if (timestampValue != null && typeof(timestampValue) != "undefined") {
                        if (typeof(timestampValue) != "object" && typeof(timestampValue.getDate) != "function") {
                            try {
                                var dt = new Date(timestampValue);
                            } catch(error) {
                                err = "The '" + item.prop + "' attribute type of '" + assetJsonName + "' must be a datetime.";
                                break;
                            }
                        }
                    } else if (item.required) {
                        err = "The '" + item.prop + "' attribute of '" + assetJsonName + "' is required.";
                        break;
                    }
                }
            }
        }

        return err;
    }

    /**
     * 
     * @param {*} trs 
     * @param {*} sender 
     * @param {*} cb 
     */
    verify(trs, sender, cb) {
        if (bignum.isZero(trs.amount)) { //等于0
            if (trs.recipientId) {
                return cb("The recipientId attribute of the transaction must be null.");
            }
        } else if (bignum.isLessThan(trs.amount, 0)) {  //小于0
            return cb("Invalid amount: " + trs.amount);
        } else {    //大于0
            if (!trs.recipientId) {
                return cb("The recipientId attribute of the transaction can not be null.");
            }
        }

        var err = this.fieldsIsValid(trs);
        if (!err) {
            return cb(err);
        } else {
            return cb(null, trs);
        }
    }

    process(trs, sender, cb) {
        setImmediate(cb, null, trs);
    }

    /**
     * 获取资产的字节格式数据，用于签名计算
     * @param {*} trs 
     * 
     * 注：此方法中不能使用self.library、self.modules
     */
    getBytes(trs) {
        var err = this.fieldsIsValid(trs);
        if (err) {
            throw new Error(err);
        }

        var assetName = AssetUtils.getAssetJsonName(trs.type);
        var asset = trs.asset[assetName];
        var mapping = this.propsMapping();

        var bb = new ByteBuffer();
        for (var i = 0; i < mapping.length; i++) {
            var item = mapping[i];
            if (item && item.required) {
                var fieldType = item.field.replace(/[0-9]/g, "");
                fieldType = fieldType.replace(/_ext$/, "");
                if (fieldType == "str") {
                    var strValue = asset[item.prop];
                    bb.writeUTF8String(strValue);
                } else if (fieldType == "int") {
                    var intValue = asset[item.prop];
                    bb.writeInt(intValue);
                } else if (fieldType == "timestamp") {
                    var timestampValue = asset[item.prop];
                    bb.writeUTF8String(CommonUtils.formatDate("yyyy-MM-dd hh:mm:ss", timestampValue));
                }
            }
        }
        bb.flip();

        if (typeof window !== 'undefined') {
            return new Uint8Array(bb.toArrayBuffer())
        } else {
            return bb.toBuffer()
        }
    }

    apply(trs, block, sender, cb) {
        if (bignum.isGreaterThan(trs.amount, 0)) {
            self.modules.accounts.setAccountAndGet({ address: trs.recipientId }, (err, recipient) => {
                if (err) {
                    return cb(err);
                }
                self.modules.accounts.mergeAccountAndGet(
                    {
                        address: trs.recipientId,
                        balance: trs.amount,
                        u_balance: trs.amount,
                        blockId: block.id,
                        round: self.modules.round.calc(block.height)
                    },
                    (err) => {
                        cb(err);
                    }
                );
            });
        } else {
            setImmediate(cb);
        }
    }

    undo(trs, block, sender, cb) {
        if (bignum.isGreaterThan(trs.amount, 0)) {
            self.modules.accounts.setAccountAndGet({ address: trs.recipientId }, (err, recipient) => {
                if (err) {
                    return cb(err);
                }
                var amountStr = bignum.minus(0, trs.amount).toString();
                self.modules.accounts.mergeAccountAndGet(
                    {
                        address: trs.recipientId,
                        balance: amountStr,
                        u_balance: amountStr,
                        blockId: block.id,
                        round: self.modules.round.calc(block.height)
                    },
                    (err) => {
                        cb(err);
                    }
                );
            });
        } else {
            setImmediate(cb);
        }
    }

    applyUnconfirmed(trs, sender, cb) {
        const key = trs.type + "_" + trs.id;
        if (self.library.oneoff.has(key)) {
            return setImmediate(cb, "The transaction has been confirmed: " + trs.id + ".");
        }

        setImmediate(cb);
        self.library.oneoff.set(key, true);
    }

    undoUnconfirmed(trs, sender, cb) {
        const key = trs.type + "_" + trs.id;
        self.library.oneoff.delete(key);

        setImmediate(cb);
    }

    objectNormalize(trs) {
        var assetName = AssetUtils.getAssetJsonName(trs.type);

        var propsRules = {};
        var requiredFields = [];

        var props = this.propsMapping();
        for (var i = 0; i < props.length; i++) {
            var currProp = props[i];
            propsRules[currProp.prop] = {};

            var fieldType = currProp.field.replace(/[0-9]/g, "");
            fieldType = fieldType.replace(/_ext$/, "");
            if (fieldType == "str") {
                propsRules[currProp.prop].type = "string";
            } else if (fieldType == "int") {
                propsRules[currProp.prop].type = "integer";
            } else if (fieldType == "timestamp") {
                propsRules[currProp.prop].type = "string";
                propsRules[currProp.prop].format = "datetime";
            }

            if (currProp.required) {
                requiredFields.push(currProp.prop);
            }
        }

        const isValid = self.library.scheme.validate({
            type: 'object',
            properties: propsRules,
            required: requiredFields
        }, trs.asset[assetName]);

        if (!isValid) {
            const err = library.scheme.errors[0];
            const msg = err.dataPath + " " + err.message;
            library.logger.error(`can't parse asset ${assetName}: ${msg}`);

            throw Error(`can't parse asset data: ${msg}`);
        }

        return trs;
    }

    dbRead(raw) {
        if (raw && raw.asset_trs_id) {
            var result = {
                transactionId: raw.asset_trs_id,
                transactionType: raw.asset_trs_type,
                timestamp: raw.asset_timestamp
            };

            var props = this.propsMapping();
            if (props && props.length > 0) {
                for (var i = 0; i < props.length; i++) {
                    var mapping = props[i];
                    result[mapping.prop] = raw["asset_" + mapping.field];
                }
            }

            var json = raw.asset_ext_json;
            if (json != null && typeof(json) != "undefined" && json != "") {
                try
                {
                    var jsonObj = JSON.parse(json);
                    Object.assign(result, jsonObj);
                }
                catch(err2)
                {
                    ;
                }
            }

            var retObj = {};
            var assetName = AssetUtils.getAssetJsonName(raw.asset_trs_type);
            retObj[assetName] = result;
            return retObj;
        } else {
            return null;
        }
    }

    dbSave(trs, cb) {
        var assetName = AssetUtils.getAssetJsonName(trs.type);
        var asset = trs.asset[assetName];

        var fields = ['transactionId', 'transactionType', 'timestamp'];
        var values = ['$trsid', '$trstype', '$timestamp'];
        var params = {
            trsid: trs.id,
            trstype: trs.type,
            timestamp: trs.timestamp
        };

        var jsonExtObj = {};
        var hasJsonExt = false;

        var mapping = this.propsMapping();
        for (var i = 0; i < mapping.length; i++) {
            var item = mapping[i];
            if (item) {
                var itemValue = asset[item.prop];
                if (itemValue) {
                    var fieldType = item.field.replace(/[0-9]/g, "");
                    if (fieldType == "str") {
                        fields.push(item.field);
                        values.push("$" + item.field);
                        params[item.field] = itemValue + "";
                    } else if (fieldType == "int") {
                        fields.push(item.field);
                        values.push("$" + item.field);
                        params[item.field] = itemValue;
                    } else if (fieldType == "timestamp") {
                        fields.push(item.field);
                        values.push("$" + item.field);
                        params[item.field] = itemValue;
                    } else if (fieldType == "str_ext" || 
                        fieldType == "int_ext" || 
                        fieldType == "timestamp_ext") {
                        hasJsonExt = true;
                        jsonExtObj[item.prop] = itemValue;
                    }
                }
            }
        }

        var sql = "INSERT INTO trs_asset (" + fields.join(",") + ") VALUES(" + values.join(",") + ")";
        self.library.dbLite.query(sql, params,
            (err, result) => {
                if (err) {
                    return cb(err.toString());
                }

                if (hasJsonExt) {
                    //保存jsonExt
                    var sqlExt = "INSERT INTO trs_asset_ext (transactionId, jsonExt) VALUES($trsId, $jsonExt)";
                    var paramsExt = {
                        trsId: trs.id,
                        jsonExt: JSON.stringify(jsonExtObj)
                    };
                    self.library.dbLite.query(sqlExt, paramsExt,
                        (errExt, resultExt) => {
                            if (errExt) {
                                return cb(errExt.toString());
                            }

                            setImmediate(cb);
                        }
                    );
                } else {
                    setImmediate(cb);
                }
            }
        );
    }

    ready(trs, sender) {
        if (sender.multisignatures.length) {
            if (!trs.signatures) {
                return false;
            }
            return trs.signatures.length >= sender.multimin - 1;
        } else {
            return true;
        }
    }
}

module.exports = AssetBase;
