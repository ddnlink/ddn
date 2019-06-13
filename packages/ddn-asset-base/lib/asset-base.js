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
const _ = require('underscore');

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

    constructor(context, transactionConfig) {
        Object.assign(this, context);
        this._context = context;

        this._transactionConfig = transactionConfig;
    }

    async getTransactionType() {
        return this._transactionConfig.type;
    }

    async getTransactionName() {
        return this._transactionConfig.name;
    }

    async getPackageName() {
        return this._transactionConfig.package;
    }

    /**
     * transaction创建时调用，用来对输入参数根据资产进行个性化处理
     * @param {*} data 
     * @param {*} trs 
     */
    async create(data, trs) {
        return trs;
    }

    /**
     * 计算该类型资产交易的手续费（方法内不允许使用context对象内容）
     * @param {*} trs 
     * @param {*} sender 
     */
    async calculateFee(trs, sender) {
        return bignum.multiply(0.1, 100000000);
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
     */
    async propsMapping() {
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
    async attachApi(router) {
    }

    /**
     * 判断是否包含Json扩展属性
     */
    async hasExtProps(){
        if (this.isHasExtProps != null && typeof(this.isHasExtProps) != "undefined") {
            return this.isHasExtProps;
        }

        this.isHasExtProps = false;
        var mapping = await this.propsMapping();
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

    async getPropsMappingItemByProp(propName) {
        if (!this.propsMappingItems || 
            !this.propsMappingItems[propName.toLowerCase()]) {
            var props = await this.propsMapping();
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

    async getPropsMappingItemByField(fieldName) {
        if (!this.propsMappingItems || 
            !this.propsMappingItems[fieldName.toLowerCase()]) {
            var props = await this.propsMapping();
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

    async getAssetJsonName(type) {
        if (!type) {
            type = await this.getTransactionType();
        }
        return AssetUtils.getAssetJsonName(type);
    }

    /**
     * 获得交易信息中的当前资产对象
     * @param {*} trs 
     */
    async getAssetObject(trs) {
        if (!trs || !trs.asset) {
            return null;
        }
        var assetJsonName = AssetUtils.getAssetJsonName(trs.type);
        return trs.asset[assetJsonName];
    }

    async getAssetInstanceByClass(cls) {
        return AssetUtils.getAssetInstanceByClass(this._context, cls);
    }

    //资产模块相关方法
    /**
     * 
     * @param {*} filter 查询条件，遵循jsonSql规则
     * @param {*} hasExtProps 是否包含扩展内容，布尔值
     * @param {*} pageIndex 查询的页码，从1开始
     * @param {*} pageSize 页码的记录条数，默认50
     * @param {*} cb 
     */
    async getAssetBase(filter, hasExtProps, pageIndex, pageSize, orders, returnTotal, attributes) {
        attributes = [
            ['transaction_id', 'asset_trs_id'],
            ['transaction_type', 'asset_trs_type'],
            ['timestamp', 'asset_timestamp'],
            ['str1', 'asset_str1'],
            ['str2', 'asset_str2'],
            ['str3', 'asset_str3'],
            ['str4', 'asset_str4'],
            ['str5', 'asset_str5'],
            ['str6', 'asset_str6'],
            ['str7', 'asset_str7'],
            ['str8', 'asset_str8'],
            ['str9', 'asset_str9'],
            ['str10', 'asset_str10'],
            ['int1', 'asset_int1'],
            ['int2', 'asset_int2'],
            ['int3', 'asset_int3'],
            ['timestamp1', 'asset_timestamp1'],
            ['timestamp2', 'asset_timestamp2']
        ];

        // ---！wly修改
        pageIndex = pageIndex || 1;
        pageSize = pageSize || 50;
        let limit = pageSize;
        let offset = (pageIndex - 1) * pageSize;

        let result, total = 0;
        return new Promise((resolve, reject) => {
            this.dao.findPage('trs_asset', filter, limit, offset, returnTotal, attributes, 
                orders, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    result = rows;

                    var trsIds = [];
                    if (returnTotal) {
                        trsIds = _.pluck(rows.rows, 'asset_trs_id');
                    } else {
                        trsIds = _.pluck(rows, 'asset_trs_id');
                    }

                    if(hasExtProps) {
                        this.dao.findPage('trs_asset_ext', {transaction_id: { '$in': trsIds }},
                            limit, null, null, [['json_ext', 'asset_ext_json'], 'transaction_id'], 
                            null, (err2, rows2) => {
                                if (err2) {
                                    reject(err2);
                                } else {
                                    if (rows2 && rows2.length > 0) {
                                        const obj = _.indexBy(rows2, 'transaction_id');
                                        if (returnTotal) {
                                            result.rows = _.map(result.rows, num => {
                                                num = _.extend(num, obj[num.asset_trs_id]);
                                                return num;
                                            });
                                        } else {
                                            result = _.map(result, num => {
                                                num = _.extend(num, obj[num.asset_trs_id]);
                                                return num;
                                            });
                                        }
                                    }

                                    resolve(result);
                                }
                            });
                    } else {
                        resolve(result);
                    }
                }
            });
        });
    }
    

    /**
     * 查询规定条件的资产数据
     * @param {*} where 查询条件，遵循sequelize规则，使用prop的名称定义
     * @param {*} orders 排序条件，遵循sequelize规则，使用prop的名称定义
     * @param {*} returnTotal 是否返回总条数，true/false
     * @param {*} pageIndex 查询的页码，从1开始
     * @param {*} pageSize 分页的大小，每页的返回的最大记录条数
     * @param {*} asset 资产交易的配置name或type（config.asset.js文件中定义）
     */
    //TODO 此处应该默认加上trs_type的查询条件，只能查询本资产的内容
    async queryAsset(where, orders, returnTotal, pageIndex, pageSize, asset) {
        var assetInst = this;
        if (asset) {
            var assetTrans;
            if (/^[0-9]*$/.test(asset)) {
                assetTrans = AssetUtils.getTransactionByTypeValue(asset);
            } else {
                var assetValue = AssetUtils.getTypeValue(asset);
                assetTrans = AssetUtils.getTransactionByTypeValue(assetValue);
            }
            if (assetTrans) {
                var assetCls = require(assetTrans.package)[assetTrans.name];
                assetInst = new assetCls(this._context);
            }
        }

        //构建返回字段数组
        var attributes = [
            ['transaction_id', 'asset_trs_id'],
            ['transaction_type', 'asset_trs_type'],
            ['timestamp', 'asset_timestamp']
        ];
        var propsMapping = await assetInst.propsMapping();
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
        where.trs_type = await this.getTransactionType();

        for (var p in where) {
            var condProp = await assetInst.getPropsMappingItemByProp(p);
            if (condProp) {
                newConds[condProp.field] = where[p];
            } else {
                var pName = p.toLowerCase();
                if (pName == "trs_id" || pName == "transaction_id") {
                    newConds["transaction_id"] = where[p];
                } else if (pName == "trs_type" || pName == "transaction_type") {
                    newConds["transaction_type"] = where[p];
                } else if (pName == "trs_timestamp" || pName == "timestamp") {
                    newConds["timestamp"] = where[p];
                }
            }
        }

        //解析排序条件
        orders = orders || [];
        var newOrders = [];
        if (CommonUtils.isArray(orders) && orders.length > 0) {
            var getFieldName = async (prop) => {
                var condProp = await assetInst.getPropsMappingItemByProp(prop);
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
                        this.logger.warn("Invalid order field: " + prop);
                        return null;
                    }
                }
            }

            for (var i = 0; i < orders.length; i++) {
                var orderItem = orders[i];
                if (CommonUtils.isArray(orderItem)) {
                    if (orderItem.length == 2) {
                        if (typeof(orderItem[0]) == "string" && typeof(orderItem[1]) == "string") {
                            var fieldName = await getFieldName(orderItem[0]);
                            if (fieldName) {
                                newOrders.push([fieldName, orderItem[1]]);
                            } else {
                                this.logger.warn("Invalid order field: " + JSON.stringify(orderItem));
                            }
                        } else {
                            //如果传入排序参数不是数组，就直接使用，这里其实有隐患，这里使用的字段名只能使用真正的数据库字段名，str1..str9等等，不能用prop名称
                            newOrders.push(orderItem);
                        }
                    } else {
                        this.logger.warn("Invalid order item: " + JSON.stringify(orderItem));
                    }
                } else {
                    if (CommonUtils.isString(orderItem)) {
                        var fieldName = await getFieldName(p);
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

        var data = await this.getAssetBase(newConds, await assetInst.hasExtProps(), 
            pageIndex, pageSize, newOrders, returnTotal, attributes);

        var rows = data && data.rows ? data.rows : data;
        if (rows && rows.length > 0) {
            var rowObjs = [];
            for (var i = 0; i < rows.length; i++) {
                var rowInfo = rows[i];
                var rowObj = await assetInst.dbRead(rowInfo);
                if (rowObj) {
                    var assetName = AssetUtils.getAssetJsonName(rowInfo.asset_trs_type);
                    rowObjs.push(rowObj[assetName]);
                }
            }
            if (returnTotal) {
                return {
                    rows: rowObjs,
                    total: data.total
                };
            } else {
                return rowObjs;
            }
        } else {
            if (returnTotal) {
                return {
                    rows: [],
                    total: 0
                };
            } else {
                return [];
            }
        }

        // return new Promise((resolve, reject) => {
        //     this.library.model.getAssetBase(newConds, 
        //         assetInst.hasExtProps(), pageIndex, pageSize, 
        //         newOrders, returnTotal, attributes, (err, data) => {
        //             if (err) {
        //                 reject(err);
        //             }

        //             var rows = data && data.rows ? data.rows : data;
        //             if (rows && rows.length > 0) {
        //                 var rowObjs = [];
        //                 for (var i = 0; i < rows.length; i++) {
        //                     var rowInfo = rows[i];
        //                     var rowObj = assetInst.dbRead(rowInfo);
        //                     if (rowObj) {
        //                         var assetName = AssetUtils.getAssetJsonName(rowInfo.asset_trs_type);
        //                         rowObjs.push(rowObj[assetName]);
        //                     }
        //                 }
        //                 if (returnTotal) {
        //                     resolve({
        //                         rows: rowObjs,
        //                         total: data.total
        //                     });
        //                 } else {
        //                     resolve(rowObjs);
        //                 }
        //             } else {
        //                 if (returnTotal) {
        //                     resolve({
        //                         rows: [],
        //                         total: 0
        //                     });
        //                 } else {
        //                     resolve([]);
        //                 }
        //             }
        //         }
        //     );
        // });
    }

    /**
     * 
     * @param {*} obj 模型数据, 必传
     * @param {*} asset type
     * @param {*} dbTrans 
     * @param {*} cb 
     */
    async update(obj, where, asset, dbTrans) {
        var assetInst = this;
        if (asset) {
            var assetTrans;
            if (/^[0-9]*$/.test(asset)) {
                assetTrans = AssetUtils.getTransactionByTypeValue(asset);
            } else {
                var assetValue = AssetUtils.getTypeValue(asset);
                assetTrans = AssetUtils.getTransactionByTypeValue(assetValue);
            }
            if (assetTrans) {
                var assetCls = require(assetTrans.package)[assetTrans.name];
                assetInst = new assetCls(this._context, assetTrans);
            }
        }
        // 解析obj
        var newObj = {};
        obj = obj || {};
        for (var p in obj) {
            var condProp = await assetInst.getPropsMappingItemByProp(p);
            if (condProp) {
                newObj[condProp.field] = obj[p];
            } else {
                var pName = p.toLowerCase();
                if (pName == "trs_id") {
                    newObj["transaction_id"] = obj[p];
                } else if (pName == "trs_type") {
                    newObj["transaction_type"] = obj[p];
                } else if (pName == "trs_timestamp") {
                    newObj["timestamp"] = obj[p];
                }
            }
        }
        // 解析where
        var newWhere = {};
        where = where || {};
        for (var p in where) {
            var condProp = await assetInst.getPropsMappingItemByProp(p);
            if (condProp) {
                newWhere[condProp.field] = where[p];
            } else {
                var pName = p.toLowerCase();
                if (pName == "trs_id") {
                    newWhere["transaction_id"] = where[p];
                } else if (pName == "trs_type") {
                    newWhere["transaction_type"] = where[p];
                } else if (pName == "trs_timestamp") {
                    newWhere["timestamp"] = where[p];
                }
            }
        } 

        return new Promise((resolve, reject) => {
            this.dao.update("trs_asset", newObj, newWhere, dbTrans, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * 查询规定条件的资产数据的个数
     * @param {*} where 查询条件，遵循sequelize规则，使用prop的名称定义
     * @param {*} asset 资产交易的配置name或type（config.asset.js文件中定义）
     */
    async queryAssetCount(where, asset) {
        var assetInst = this;
        if (asset) {
            var assetTrans;
            if (/^[0-9]*$/.test(asset)) {
                assetTrans = AssetUtils.getTransactionByTypeValue(asset);
            } else {
                var assetValue = AssetUtils.getTypeValue(asset);
                assetTrans = AssetUtils.getTransactionByTypeValue(assetValue);
            }
            if (assetTrans) {
                var assetCls = require(assetTrans.package)[assetTrans.name];
                assetInst = new assetCls(this._context);
            }
        }

        // 解析where
        var newWhere = {};
        where = where || {};
        for (var p in where) {
            var condProp = await assetInst.getPropsMappingItemByProp(p);
            if (condProp) {
                newWhere[condProp.field] = where[p];
            } else {
                var pName = p.toLowerCase();
                if (pName == "trs_id") {
                    newWhere["transaction_id"] = where[p];
                } else if (pName == "trs_type") {
                    newWhere["transaction_type"] = where[p];
                } else if (pName == "trs_timestamp") {
                    newWhere["timestamp"] = where[p];
                }
            }
        }

        return new Promise((resolve, reject) => {
            this.dao.count("trs_asset", newWhere, (err, count) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(count);
                }
            });
        });
    }

    /**
     * 校验输入数据格式是否符合规则（_assetFiledRules负责定义规则）
     * @param {*} trs 
     */
    async fieldsIsValid(trs) {
        var assetJsonName = AssetUtils.getAssetJsonName(trs.type);
        if (!trs.asset || !trs.asset[assetJsonName]) {
            throw new Error('Invalid transaction asset');
        }
      
        const asset = trs.asset[assetJsonName];

        var mapping = await this.propsMapping();
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
                            var err = "The '" + item.prop + "' attribute type of '" + assetJsonName + "' must be a string.";
                            throw new Error(err);
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
                                var err = "The '" + item.prop + "' attribute min length of '" + assetJsonName + "' must be greater than " + minLen;
                                throw new Error(err);
                            }

                            if (strValue.length < minLen){
                                var err = "The '" + item.prop + "' attribute min length of '" + assetJsonName + "' must be greater than " + minLen;
                                throw new Error(err);
                            }
                        }
                        if (maxLen != null && typeof(maxLen) != "undefined") {
                            if (strValue.length > maxLen) {
                                var err = "The '" + item.prop + "' attribute max length of '" + assetJsonName + "' must be less than " + maxLen;
                                throw new Error(err);
                            }
                        }
                    } else if (item.required) {
                        var err = "The '" + item.prop + "' attribute of '" + assetJsonName + "' is required.";
                        throw new Error(err);
                    }
                } else if (fieldType == "int") {
                    var intValue = asset[item.prop];
                    if (intValue != null && typeof(intValue) != "undefined") {
                        if (typeof(intValue) != "number") {
                            var err = "The '" + item.prop + "' attribute type of '" + assetJsonName + "' must be a integer.";
                            throw new Error(err);
                        }

                        if (itemRule) {
                            if (itemRule.maxValue != null && typeof(itemRule.maxValue) != "undefined") {
                                if (intValue > itemRule.maxValue) {
                                    var err = "The '" + item.prop + "' attribute max value of '" + assetJsonName + "' must be less than " + itemRule.maxValue;
                                    throw new Error(err);
                                }
                            }

                            if (itemRule.minValue != null && typeof(itemRule.minValue) != "undefined") {
                                if (intValue < itemRule.minValue) {
                                    var err = "The '" + item.prop + "' attribute min value of '" + assetJsonName + "' must be greater than " + itemRule.maxValue;
                                    throw new Error(err);
                                }
                            }
                        }
                    } else if (item.required) {
                        var err = "The '" + item.prop + "' attribute of '" + assetJsonName + "' is required.";
                        throw new Error(err);
                    }
                } else if (fieldType == "timestamp") {
                    var timestampValue = asset[item.prop];
                    if (timestampValue != null && typeof(timestampValue) != "undefined") {
                        if (typeof(timestampValue) != "object" && typeof(timestampValue.getDate) != "function") {
                            try {
                                var dt = new Date(timestampValue);
                            } catch(error) {
                                var err = "The '" + item.prop + "' attribute type of '" + assetJsonName + "' must be a datetime.";
                                throw new Error(err);
                            }
                        }
                    } else if (item.required) {
                        var err = "The '" + item.prop + "' attribute of '" + assetJsonName + "' is required.";
                        throw new Error(err);
                    }
                }
            }
        }
    }

    /**
     * 
     * @param {*} trs 
     * @param {*} sender 
     * @param {*} cb 
     */
    async verify(trs, sender) {
        if (bignum.isZero(trs.amount)) { //等于0
            if (trs.recipient_id) { //wxm block database
                throw new Error("The recipient_id attribute of the transaction must be null.");
            }
        } else if (bignum.isLessThan(trs.amount, 0)) {  //小于0
            throw new Error("Invalid amount: " + trs.amount);
        } else {    //大于0
            if (!trs.recipient_id) {    //wxm block database
                throw new Error("The recipient_id attribute of the transaction can not be null.");
            }
        }

        await this.fieldsIsValid(trs);

        return trs;
    }

    async process(trs, sender) {
        return trs;
    }

    /**
     * 获取资产的字节格式数据，用于签名计算
     * @param {*} trs 
     */
    async getBytes(trs) {
        await this.fieldsIsValid(trs);

        var assetName = AssetUtils.getAssetJsonName(trs.type);
        var asset = trs.asset[assetName];
        var mapping = await this.propsMapping();

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

    async isSupportLock() {
        return true;
    }

    async apply(trs, block, sender, dbTrans) {
        if (bignum.isGreaterThan(trs.amount, 0)) {
            await this.runtime.account.setAccount({ address: trs.recipient_id }, dbTrans);

            await this.runtime.account.merge(trs.recipient_id, {
                address: trs.recipient_id,   //wxm block database
                balance: trs.amount,
                u_balance: trs.amount,
                block_id: block.id,  //wxm block database
                round: await this.runtime.round.calc(block.height)
            }, dbTrans);
        }
        return;
    }

    async undo(trs, block, sender, dbTrans) {
        if (bignum.isGreaterThan(trs.amount, 0)) {
            await this.runtime.account.setAccount({address: trs.recipient_id}, dbTrans);

            var amountStr = bignum.minus(0, trs.amount).toString();
            await this.runtime.account.merge(trs.recipient_id, {
                address: trs.recipient_id,   //wxm block database
                balance: amountStr,
                u_balance: amountStr,
                block_id: block.id,  //wxm block database
                round: await this.runtime.round.calc(block.height)
            }, dbTrans);
        }
        return;
    }

    async applyUnconfirmed(trs, sender, dbTrans) {
        const key = trs.type + "_" + trs.id;
        if (this.oneoff.has(key)) {
            throw new Error("The transaction has been confirmed: " + trs.id + ".");
        }

        this.oneoff.set(key, true);
        return;
    }

    async undoUnconfirmed(trs, sender, dbTrans) {
        const key = trs.type + "_" + trs.id;
        this.oneoff.delete(key);
        return;
    }

    async objectNormalize(trs) {
        var assetName = AssetUtils.getAssetJsonName(trs.type);

        var propsRules = {};
        var requiredFields = [];

        var props = await this.propsMapping();
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

        var validateErrors = await this.ddnSchema.validate({
            type: 'object',
            properties: propsRules,
            required: requiredFields
        }, trs.asset[assetName]);
        if (validateErrors) {
            this.logger.error(`Can't parse asset ${assetName}: ${validateErrors[0].message}`);
            throw new Error(`Can't parse asset data: ${validateErrors[0].message}`);
        }

        return trs;
    }

    async dbRead(raw) {
        if (raw && raw.asset_trs_id) {
            var result = {
                transaction_id: raw.asset_trs_id,
                transaction_type: raw.asset_trs_type,
                timestamp: raw.asset_timestamp
            };
    
            var props = await this.propsMapping();
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

    async dbSave(trs, dbTrans) {
        var assetName = AssetUtils.getAssetJsonName(trs.type);
        var asset = trs.asset[assetName];

        var assetInst = {
            transaction_id: trs.id,
            transaction_type: trs.type,
            timestamp: trs.timestamp
        }

        var jsonExtObj = {};
        var hasJsonExt = false;

        var mapping = await this.propsMapping();
        for (var i = 0; i < mapping.length; i++) {
            var item = mapping[i];
            if (item) {
                var itemValue = asset[item.prop];
                if (itemValue !== null && itemValue !== undefined) {
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

        return new Promise((resolve, reject) => {
            this.dao.insert("trs_asset", assetInst, dbTrans, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    if (hasJsonExt) {
                        var assetExtInst = {
                            transaction_id: trs.id,
                            json_ext: JSON.stringify(jsonExtObj)
                        }

                        this.dao.insert("trs_asset_ext", assetExtInst, dbTrans, (err2, result2) => {
                            if (err2) {
                                reject(err2);
                            } else {
                                resolve(result2);
                            }
                        })
                    } else {
                        resolve(result);
                    }
                }
            });
        });
    }

    async ready(trs, sender) {
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
