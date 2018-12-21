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
        this.library = library;
        this.modules = modules;
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
        return this.library.base.block.calculateFee();
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
     * receive_address，收款地址，默认为null
     * 
     * 注：此方法中不能使用this.library、this.modules
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
        if (!this.propsMappingItems || 
            !this.propsMappingItems[propName.toLowerCase()]) {
            var props = this.propsMapping();
            for (var i = 0; i < props.length; i++) {
                var currProp = props[i];
                if (currProp.prop.toLowerCase() == propName.toLowerCase()) {
                    if (!this.propsMappingItems) {
                        this.propsMappingItems = {};
                    }
                    this.propsMappingItems[propName.toLowerCase()] = currProp;
                    break;
                }
            }
        }

        if (this.propsMappingItems && this.propsMappingItems[propName.toLowerCase()]) {
            return this.propsMappingItems[propName.toLowerCase()];
        } else {
            return null;
        }
    }

    getPropsMappingItemByField(fieldName) {
        if (!this.propsMappingItems || 
            !this.propsMappingItems[fieldName.toLowerCase()]) {
            var props = this.propsMapping();
            for (var i = 0; i < props.length; i++) {
                var currProp = props[i];
                if (currProp.field.toLowerCase() == fieldName.toLowerCase()) {
                    if (!this.propsMappingItems) {
                        this.propsMappingItems = {};
                    }
                    this.propsMappingItems[fieldName.toLowerCase()] = currProp;
                    break;
                }
            }
        }

        if (this.propsMappingItems && this.propsMappingItems[fieldName.toLowerCase()]) {
            return this.propsMappingItems[fieldName.toLowerCase()];
        } else {
            return null;
        }
    }

    /**
     * 查询规定条件的资产数据
     * @param {*} where 查询条件，遵循sequelize规则，使用prop的名称定义
     * @param {*} orders 排序条件，遵循sequelize规则，使用prop的名称定义
     * @param {*} returnTotal 是否返回总条数，true/false
     * @param {*} pageIndex 查询的页码，从1开始
     * @param {*} pageSize 分页的大小，每页的返回的最大记录条数
     * @param {*} cb 回调
     */
    async queryAsset(where, orders, returnTotal, pageIndex, pageSize, cb) {
        //构建返回字段数组
        var attributes = [
            ['transaction_id', 'asset_trs_id'],
            ['transaction_type', 'asset_trs_type'],
            ['timestamp', 'asset_timestamp']
        ];
        var propsMapping =  this.propsMapping();
        for (var i = 0; i < propsMapping.length; i++) {
            var propMapping = propsMapping[i];
            var field = propMapping.field;
            if (field != "str_ext" && 
                field != "int_ext" && 
                field != "timestamp_ext") {
                attributes.push([field, 'asset_' + field]);
            }
        }

        //解析查询条件
        var newConds = {};
        where = where || {};
        for (var p in where) {
            var condProp = this.getPropsMappingItemByProp(p);
            if (condProp) {
                newConds[condProp.field] = where[p];
            } else {
                var pName = p.toLowerCase();
                if (pName == "trs_id") {
                    newConds["transaction_id"] = where[p];
                } else if (pName == "trs_type") {
                    newConds["transaction_type"] = where[p];
                } else if (pName == "trs_timestamp") {
                    newConds["timestamp"] = where[p];
                }
            }
        }

        //解析排序条件
        orders = orders || [];
        var newOrders = [];
        if (CommonUtils.isArray(orders) && orders.length > 0) {
            var getFieldName = (prop) => {
                var condProp = this.getPropsMappingItemByProp(prop);
                if (condProp) {
                    return condProp.field;
                } else {
                    var pName = prop.toLowerCase();
                    if (pName == "trs_id") {
                        return "transaction_id";
                    } else if (pName == "trs_type") {
                        return "transaction_type";
                    } else if (pName == "trs_timestamp") {
                        return "timestamp";
                    } else {
                        this.library.logger.warn("Invalid order field: " + prop);
                        return null;
                    }
                }
            }

            for (var i = 0; i < orders.length; i++) {
                var orderItem = orders[i];
                if (CommonUtils.isArray(orderItem)) {
                    if (orderItem.length == 2) {
                        if (typeof(orderItem[0]) == "string" && typeof(orderItem[1]) == "string") {
                            var fieldName = getFieldName(orderItem[0]);
                            if (fieldName) {
                                newOrders.push([fieldName, orderItem[1]]);
                            } else {
                                this.library.logger.warn("Invalid order field: " + JSON.stringify(orderItem));
                            }
                        } else {
                            //如果传入排序参数不是数组，就直接使用，这里其实有隐患，这里使用的字段名只能使用真正的数据库字段名，str1..str9等等，不能用prop名称
                            newOrders.push(orderItem);
                        }
                    } else {
                        this.library.logger.warn("Invalid order item: " + JSON.stringify(orderItem));
                    }
                } else {
                    if (CommonUtils.isString(orderItem)) {
                        var fieldName = getFieldName(p);
                        if (fieldName) {
                            newOrders.push(fieldName);
                        }
                    } else {
                        //如果传入排序参数不是数组，就直接使用，这里其实有隐患，这里使用的字段名只能使用真正的数据库字段名，str1..str9等等，不能用prop名称
                        newOrders.push(orderItem);
                    }
                }
            }
        } else {
            //如果传入排序参数不是数组，就直接使用，这里其实有隐患，这里使用的字段名只能使用真正的数据库字段名，str1..str9等等，不能用prop名称
            newOrders = orders;
        }

        return new Promise((resolve, reject) => {
            this.library.model.getAssetBase(newConds, 
                this.hasExtProps(), pageIndex, pageSize, 
                newOrders, returnTotal, attributes, (err, data) => {
                    if (err) {
                        reject(err);
                    }

                    var rows = data && data.rows ? data.rows : data;
                    if (rows && rows.length > 0) {
                        var rowObjs = [];
                        for (var i = 0; i < rows.length; i++) {
                            var rowInfo = rows[i];
                            var rowObj = this.dbRead(rowInfo);
                            if (rowObj) {
                                var assetName = AssetUtils.getAssetJsonName(rowInfo.asset_trs_type);
                                rowObjs.push(rowObj[assetName]);
                            }
                        }
                        if (returnTotal) {
                            resolve({
                                rows: rowObjs,
                                total: data.total
                            });
                        } else {
                            resolve(rowObjs);
                        }
                    } else {
                        if (returnTotal) {
                            resolve({
                                rows: [],
                                total: 0
                            });
                        } else {
                            resolve([]);
                        }
                    }
                }
            );
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
            return 'Invalid transaction asset';
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
            if (trs.recipient_id) { //wxm block database
                return cb("The recipient_id attribute of the transaction must be null.");
            }
        } else if (bignum.isLessThan(trs.amount, 0)) {  //小于0
            return cb("Invalid amount: " + trs.amount);
        } else {    //大于0
            if (!trs.recipient_id) {    //wxm block database
                return cb("The recipient_id attribute of the transaction can not be null.");
            }
        }

        var err = this.fieldsIsValid(trs);
        if (!err) {
            return cb(null, trs);
        } else {
            return cb(err);
        }
    }

    process(trs, sender, cb) {
        setImmediate(cb, null, trs);
    }

    /**
     * 获取资产的字节格式数据，用于签名计算
     * @param {*} trs 
     * 
     * 注：此方法中不能使用this.library、this.modules
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

    apply(trs, block, sender, dbTrans, cb) {
        if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
            cb = dbTrans;
            dbTrans = null;
        }

        if (bignum.isGreaterThan(trs.amount, 0)) {
            this.modules.accounts.setAccountAndGet({ address: trs.recipient_id },    //wxm block database
                dbTrans, (err, recipient) => {
                if (err) {
                    return cb(err);
                }
                this.modules.accounts.mergeAccountAndGet(
                    {
                        address: trs.recipient_id,   //wxm block database
                        balance: trs.amount,
                        u_balance: trs.amount,
                        block_id: block.id,  //wxm block database
                        round: this.modules.round.calc(block.height)
                    }, dbTrans,
                    (err) => {
                        cb(err);
                    }
                );
            });
        } else {
            setImmediate(cb);
        }
    }

    undo(trs, block, sender, dbTrans, cb) {
        if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
            cb = dbTrans;
            dbTrans = null;
        }

        if (bignum.isGreaterThan(trs.amount, 0)) {
            this.modules.accounts.setAccountAndGet({ address: trs.recipient_id },    //wxm block database
                dbTrans, (err, recipient) => {
                if (err) {
                    return cb(err);
                }
                var amountStr = bignum.minus(0, trs.amount).toString();
                this.modules.accounts.mergeAccountAndGet(
                    {
                        address: trs.recipient_id,   //wxm block database
                        balance: amountStr,
                        u_balance: amountStr,
                        block_id: block.id,  //wxm block database
                        round: this.modules.round.calc(block.height)
                    }, dbTrans,
                    (err) => {
                        cb(err);
                    }
                );
            });
        } else {
            setImmediate(cb);
        }
    }

    applyUnconfirmed(trs, sender, dbTrans, cb) {
        if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
            cb = dbTrans;
            dbTrans = null;
        }

        const key = trs.type + "_" + trs.id;
        if (this.library.oneoff.has(key)) {
            return setImmediate(cb, "The transaction has been confirmed: " + trs.id + ".");
        }

        setImmediate(cb);
        this.library.oneoff.set(key, true);
    }

    undoUnconfirmed(trs, sender, dbTrans, cb) {
        if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
            cb = dbTrans;
            dbTrans = null;
        }

        const key = trs.type + "_" + trs.id;
        this.library.oneoff.delete(key);

        setImmediate(cb);
    }

    objectNormalize(trs) {
        console.log("wxm 1111111111111111111111111111111111111111111111111111: " + JSON.stringify(trs));
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

        const isValid = this.library.scheme.validate({
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
                transaction_id: raw.asset_trs_id,
                transaction_type: raw.asset_trs_type,
                timestamp: raw.asset_timestamp
            };

            var props = this.propsMapping();
            if (props && props.length > 0) {
                for (var i = 0; i < props.length; i++) {
                    var mapping = props[i];

                    var fieldType = mapping.field.replace(/[0-9]/g, "");
                    fieldType = fieldType.replace(/_ext$/, "");
                    if (fieldType == "str") {
                        result[mapping.prop] = raw["asset_" + mapping.field] || "";
                    } else {
                        result[mapping.prop] = raw["asset_" + mapping.field];
                    }
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

    dbSave(trs, dbTrans, cb) {
        if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
            cb = dbTrans;
            dbTrans = null;
        }

        var assetName = AssetUtils.getAssetJsonName(trs.type);
        var asset = trs.asset[assetName];

        var assetInst = {
            transaction_id: trs.id,
            transaction_type: trs.type,
            timestamp: trs.timestamp
        }

        var jsonExtObj = {};
        var hasJsonExt = false;

        var mapping = this.propsMapping();
        for (var i = 0; i < mapping.length; i++) {
            var item = mapping[i];
            if (item) {
                var itemValue = asset[item.prop];
                if (itemValue) {
                    assetInst[item.field] = itemValue;

                    var fieldType = item.field.replace(/[0-9]/g, "");
                    if (fieldType == "str_ext" || 
                        fieldType == "int_ext" || 
                        fieldType == "timestamp_ext") {
                        hasJsonExt = true;
                        jsonExtObj[item.prop] = itemValue;
                    }
                }
            }
        }

        this.library.dao.insert("trs_asset", assetInst, dbTrans, (err, result) => {
            if (err) {
                return cb(err);
            }

            if (hasJsonExt) {
                var assetExtInst = {
                    transaction_id: trs.id,
                    json_ext: JSON.stringify(jsonExtObj)
                }
                this.library.dao.insert("trs_asset_ext", assetExtInst, dbTrans, cb);
            } else {
                cb();
            }
        })
    }

    ready(trs, sender) {
        if (sender.multisignatures && sender.multisignatures.length) {
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
