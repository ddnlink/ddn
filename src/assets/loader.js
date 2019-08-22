/**
 * 资产加载注册器
 * wangxm   2018-12-28
 */
const express = require('express');
const { AssetTypes } = require('@ddn/ddn-utils');
const Transfer = require('./system/transfer');
const Signatures = require('./system/signature');
const Delegate = require('./system/delegate');
const Vote = require('./system/vote');
const Multisignatures = require('./system/multisignature');
const Lock = require('./system/lock');

class Loader {

    constructor(context) {
        Object.assign(this, context);
        this._context = context;

        this._assets = {};
        this._assetsApi = [];

        this._assetsNames = {};
    }

    _getAssetKey(type) {
        return "asset_" + type;
    }

    _registerAsset(type, inst, assetName) {
        if (inst && typeof(inst.create) == 'function' && 
            typeof(inst.getBytes) == 'function' &&
            typeof(inst.calculateFee) == 'function' && 
            typeof(inst.verify) == 'function' &&
            typeof(inst.objectNormalize) == 'function' && 
            typeof(inst.dbRead) == 'function' &&
            typeof(inst.apply) == 'function' && 
            typeof(inst.undo) == 'function' &&
            typeof(inst.applyUnconfirmed) == 'function' && 
            typeof(inst.undoUnconfirmed) == 'function' &&
            typeof(inst.ready) == 'function' && 
            typeof(inst.process) == 'function') {

            this._assets[this._getAssetKey(type)] = inst;

            if (assetName)
            {
                this._assetsNames[assetName.toLowerCase()] = inst;
            }
        } else {
            throw Error('Invalid asset interface');
        }
    }

    /**
     * 加载所有系统配置的资产插件
     */
    async _attachAssetPlugins() {
        for (var i = 0; i < this.assetPlugins.getTransactionCount(); i++) {
            var transConfig = this.assetPlugins.getTransactionByIndex(i);
            var transCls = _require_runtime_(transConfig.package)[transConfig.name];
            var transInst = new transCls(this._context, transConfig);

            this._registerAsset(transConfig.type, transInst, transConfig.name);
            await this._attachAssetPluginApi(transConfig, transInst);
        }
    }

    /**
     * 根据资产配置名称获取资产实例
     * @param {*} assetName 
     */
    findInstanceByName(assetName)
    {
        if (assetName)
        {
            const keys = Object.getOwnPropertyNames(this._assetsNames)
            for (var p in keys)
            {
                const key = keys[p];
                if (key.toLowerCase() == assetName.toLowerCase())
                {
                    return this._assetsNames[key];
                }
            }
        }
        return null;
    }

    /**
     * 为指定的资产插件生成API路由
     * @param {*} assetConfig 
     * @param {*} assetInst 
     */
    async _attachAssetPluginApi(assetConfig, assetInst) {
        if (assetConfig && assetInst) {
            var apiSubPath = assetConfig.name.toLowerCase();
            // if (apiSubPath.length > 5) {
            //     if (apiSubPath.substring(0, 5) == "asset") {
            //         apiSubPath = apiSubPath.substring(5);
            //     }
            // }

            var router = express.Router();
            var apis = await this._attachAssetPluginApiRouter(router, assetConfig, assetInst);
            if (typeof(assetInst.attachApi) == "function") {
                await assetInst.attachApi(router);
            }

            this._assetsApi.push({
                path: '/api/' + apiSubPath,
                router: router,
                apis
            });
        }
    }

    mountAssetApis(expressApp) {
        for (var i = 0; i < this._assetsApi.length; i++) {
            var apiInfo = this._assetsApi[i];
            expressApp.use(apiInfo.path, apiInfo.router);

            for (var j = 0; j < apiInfo.apis.length; j++) {
                this.logger.info("mounted asset api: " + apiInfo.path + apiInfo.apis[j]);
            }
        }
    }

    _assetAssetPluginApiDetail(assetType, paramName, assetInst) {
        var func = function(req, res, next) {
            var parseSortItem = function(sort, item) {
                var subItems = item.split("=");
                if (subItems.length == 2) {
                    if (subItems[0].replace(/\s*/, "") != "") {
                        sort.push(subItems);
                    }
                }
            }
    
            var where = {
                trs_type: assetType,
                [paramName]: req.params[paramName]
            };
    
            var orders = [];
            var sortItems = req.query.sort;
    
            if (sortItems) {
                if (!sortItems.splice) {
                    sortItems = [sortItems];
                }
    
                for (var i = 0; i < sortItems.length; i++) {
                    var sortItem = sortItems[i];
                    if (sortItem.replace(/\s*/, "") != "") {
                        var pos = sortItem.indexOf("=");
                        if (pos >= 0) {
                            parseSortItem(orders, sortItem);
                        } else {
                            orders.push(sortItem);
                        }
                    }
                }
            }

            assetInst.queryAsset(where, orders, false, 1, 1)
                .then(rows => {
                    res.status(200).json({success: true, state: 0, data: rows && rows.length > 0 ? rows[0] : null});
                }).catch(err => {
                    res.status(200).json({success: false, state: -1, error: err.toString()});
                });
        };
    
        return func;
    }

    _assetAssetPluginApiList(assetType, paramName, assetInst) {
        var func = function(req, res, next) {
            var parseSortItem = function(sort, item) {
                var subItems = item.split(":");
                if (subItems.length == 2) {
                    if (subItems[0].replace(/\s*/, "") != "") {
                        sort.push(subItems);
                    }
                }
            }
    
            var where = {
                trs_type: assetType
            };
            if (paramName) {
                where[paramName] = req.params[paramName];
            }
            if (req.query) {
                for (var p in req.query) {
                    where[p] = req.query[p];
                }
            }
    
            var pageIndex = req.query.pageindex || 1;
            var pageSize = req.query.pagesize || 50;
    
            var orders = [];
            var sortItems = req.query.sort;
    
            if (sortItems) {
                if (!sortItems.splice) {
                    sortItems = [sortItems];
                }
    
                for (var i = 0; i < sortItems.length; i++) {
                    var sortItem = sortItems[i];
                    if (sortItem.replace(/\s*/, "") != "") {
                        var pos = sortItem.indexOf(":");
                        if (pos >= 0) {
                            parseSortItem(orders, sortItem);
                        } else {
                            orders.push(sortItem);
                        }
                    }
                }
            }

            assetInst.queryAsset(where, orders, true, pageIndex, pageSize)
                .then(rows => {
                    res.status(200).json({success: true, state: 0, data: rows});
                }).catch(err => {
                    res.status(200).json({success: false, state: -1, error: err.toString()});
                });
        }
    
        return func;
    }

    async _attachAssetPluginApiRouter(router, assetConfig, assetInst) {
        var allApis = [];

        var props = await assetInst.propsMapping();
        for (var i = 0; i < props.length; i++) {
            var currProp = props[i];
            if (currProp.required) {
                if (!/_ext$/.test(currProp.field)) {
                    var detailPath = "/" + currProp.prop.toLowerCase() + "/:" + currProp.prop.toLowerCase();
                    router.get(detailPath, this._assetAssetPluginApiDetail(assetConfig.type, currProp.prop.toLowerCase(), assetInst));
                    allApis.push(detailPath);

                    var listPath = "/" + currProp.prop.toLowerCase() + "/:" + currProp.prop.toLowerCase() + "/list";
                    router.get(listPath, this._assetAssetPluginApiList(assetConfig.type, currProp.prop.toLowerCase(), assetInst));
                    allApis.push(listPath);
                }
            }
        }

        router.get("/transaction/:trs_id", this._assetAssetPluginApiDetail(assetConfig.type, "trs_id", assetInst));
        allApis.push("/transaction/:trs_id");

        router.get("/list", this._assetAssetPluginApiList(assetConfig.type, null, assetInst));
        allApis.push("/list");

        return allApis;
    }


    async _addAsesstModels () {
        const { dao } = this;
        const assetsPackageList = [];
        for (var i = 0; i < this.assetPlugins.getTransactionCount(); i++) {
            var trans = this.assetPlugins.getTransactionByIndex(i);
            if(assetsPackageList.indexOf(trans.package) === -1){
                assetsPackageList.push(trans.package);
            }
        }

        assetsPackageList.map((packageName) => {
            var assetModels;
            try {
                assetModels = _require_runtime_(packageName + '/define-models') || [];
            } catch (err){
                this.logger.info(packageName + ' 资产包不包含自定义数据模型内容。');
                return;
            }

            if (assetModels) {
                assetModels.map((model) => {
                    // 挂载方法
                    dao.buildModel(model.name, model.data);
                    // 创建表
                    dao.createTable(model.name, false, (err) => {
                        if(err){
                            this.logger.err(packageName + ' 资产包自定义数据模型生成失败。', err);
                            process.emit('cleanup');
                        }
                    });
                })
            }
        }) 
    }

    async init() {
        var transfer = new Transfer(this._context);
        this._registerAsset(AssetTypes.TRANSFER, transfer);

        var signature = new Signatures(this._context);
        this._registerAsset(AssetTypes.SIGNATURE, signature);

        var delegate = new Delegate(this._context);
        this._registerAsset(AssetTypes.DELEGATE, delegate);

        var vote = new Vote(this._context);
        this._registerAsset(AssetTypes.VOTE, vote);

        var multisignature = new Multisignatures(this._context);
        this._registerAsset(AssetTypes.MULTISIGNATURE, multisignature);

        var lock = new Lock(this._context);
        this._registerAsset(AssetTypes.LOCK, lock);

        await this._attachAssetPlugins();
        await this._addAsesstModels();
    }

    hasType(type) {
        var key = this._getAssetKey(type);
        return !!this._assets[key];
    }

    getAsset(type) {
        if (this.hasType(type)) {
            var key = this._getAssetKey(type);
            return this._assets[key];
        }
        return null;
    }

    /**
     * 在所有加载的扩展资产上执行指定方法
     * @param {*} funcName 
     */
    async execAssetFunc(funcName) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        const keys = Object.getOwnPropertyNames(this._assets)
        for (var p in keys) {
            const key = keys[p];
            const inst = this._assets[key];
            if (inst != null && 
                typeof(inst[funcName]) == "function") {
                try {
                    await inst[funcName].apply(inst, args);
                } catch (err) {
                    this.logger.error(err);
                }
            }
        }
    }

}

module.exports = Loader;