const path = require('path');
const fs = require('fs');
const Sequelize = require('sequelize');
const { dbSettings } = require('../../../config.database');

const _sysModels = {};

const logOptions = {
    logging: (sql, time) => {
        // if (_logger) {
        //     _logger.info("====================== Executed SQL (" + time + " ms) ======================")
        //     _logger.info(sql);
        // }
    },
    benchmark: true
};

var sequelizeInst, _logger;

class DAO {

    static _registerModel(connection) {
        var modelDir = path.resolve(__dirname, "models");
        var files = fs.readdirSync(modelDir);
        for (var i = 0; i < files.length; i++) {
            var fullName = files[i];
            var pos = fullName.lastIndexOf(".");
            if (pos >= 0) {
                var name = fullName.substring(0, pos);
                var ext = fullName.substring(pos);
                if (ext.toLowerCase() == ".js") {
                    if (name.toLowerCase() != "index") {
                        var defineModel = require('./models/' + name);
                        this._addModel(name, defineModel(connection));
                    }
                }
            }
        }
    }

    static _addModel(name, model) {
        _sysModels[name.toLowerCase()] = model;
    }

    static _getModel(name) {
        return _sysModels[name.toLowerCase()];
    }

    // 增加方法 --> 创建aobAsset相关的数据表
    static buildModel(name, func) {
        this._addModel(name, func(sequelizeInst));
    }   

    static connect(logger, cb) {
        _logger = logger;

        sequelizeInst = new Sequelize(dbSettings.database,
            dbSettings.username, dbSettings.password, dbSettings.connection);

        sequelizeInst.authenticate()
            .then(err => {
                if (err) {
                    cb(err);
                } else {
                    this._registerModel(sequelizeInst);

                    sequelizeInst.sync(logOptions)
                        .then(() => {
                            cb(null, sequelizeInst);
                        }).catch(err3 => {
                            cb(err3);
                        });
                }
            }).catch(err2 => {
                cb(err2);
            });
    }

    static insert(modelName, modelObj, transaction, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (transaction) == "function") {
                cb = transaction;
                transaction = null;
            }

            var modelInst = this._getModel(modelName);
            if (modelInst) {
                if (modelObj) {
                    var options = Object.assign({}, logOptions, {
                        transaction: transaction ? transaction : null
                    });
                    modelInst.create(modelObj, options)
                        .then((newRecord) => {
                            if (typeof (cb) == "function") {
                                cb(null, newRecord);
                            }
                        }).catch(err2 => {
                            if (typeof (cb) == "function") {
                                var errMsg2 = err2.toString();
                                if (err2.errors && err2.errors.length > 0) {
                                    for (var i = 0; i < err2.errors.length; i++) {
                                        errMsg2 += ("\r\n" + err2.errors[i].message);
                                    }
                                }
                                cb(errMsg2);
                            }
                        });
                } else {
                    if (typeof (cb) == "function") {
                        cb("无效的数据输入：" + modelObj);
                    }
                }
            } else {
                if (typeof (cb) == "function") {
                    cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                var errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (var i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                cb(errMsg);
            }
        }
    }

    static insertOrUpdate(modelName, modelObj, transaction, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (transaction) == "function") {
                cb = transaction;
                transaction = null;
            }

            var modelInst = this._getModel(modelName);
            if (modelInst) {
                if (modelObj) {
                    var options = Object.assign({}, logOptions, {
                        transaction: transaction ? transaction : null
                    });
                    modelInst.upsert(modelObj, options)
                        .then((newRecord) => {
                            if (typeof (cb) == "function") {
                                cb(null, modelObj);
                            }
                        }).catch(err2 => {
                            if (typeof (cb) == "function") {
                                var errMsg2 = err2.toString();
                                if (err2.errors && err2.errors.length > 0) {
                                    for (var i = 0; i < err2.errors.length; i++) {
                                        errMsg2 += ("\r\n" + err2.errors[i].message);
                                    }
                                }
                                cb(errMsg2);
                            }
                        });
                } else {
                    if (typeof (cb) == "function") {
                        cb("无效的数据输入：" + modelObj);
                    }
                }
            } else {
                if (typeof (cb) == "function") {
                    cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                var errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (var i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                cb(errMsg);
            }
        }
    }

    /**
     * 
     * $and, $or, $ne, $in, $not, $notIn, $gte, $gt, $lte, $lt, $like, $ilike/$iLike, $notLike, $notILike, '..'/$between, '!..'/$notBetween, '&&'/$overlap, '@>'/$contains, '<@'/$contained
     * 
     * @param {*} modelName 
     * @param {*} modelObj 
     * @param {*} where 
     * @param {*} transaction 
     * @param {*} cb 
     */
    static update(modelName, modelObj, where, transaction, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (transaction) == "function") {
                cb = transaction;
                transaction = null;
            }

            var modelInst = this._getModel(modelName);
            if (modelInst) {
                if (modelObj) {
                    var options = Object.assign({}, logOptions, {
                        where: where,
                        transaction: transaction ? transaction : null
                    });
                    modelInst.update(modelObj, options)
                        .then((result) => {
                            if (typeof (cb) == "function") {
                                cb(null, (result && result.length > 0 ? result[0] : 0));
                            }
                        }).catch(err2 => {
                            if (typeof (cb) == "function") {
                                var errMsg2 = err2.toString();
                                if (err2.errors && err2.errors.length > 0) {
                                    for (var i = 0; i < err2.errors.length; i++) {
                                        errMsg2 += ("\r\n" + err2.errors[i].message);
                                    }
                                }
                                cb(errMsg2);
                            }
                        });
                } else {
                    if (typeof (cb) == "function") {
                        cb("无效的数据输入：" + modelObj);
                    }
                }
            } else {
                if (typeof (cb) == "function") {
                    cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                var errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (var i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                cb(errMsg);
            }
        }
    }

    static remove(modelName, where, transaction, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (transaction) == "function") {
                cb = transaction;
                transaction = null;
            }

            var modelInst = this._getModel(modelName);
            if (modelInst) {
                if (where) {
                    var options = Object.assign({}, logOptions, {
                        where: where,
                        transaction: transaction ? transaction : null,
                        cascade: true
                    });
                    modelInst.destroy(options)
                        .then((result) => {
                            if (typeof (cb) == "function") {
                                cb(null, result);
                            }
                        }).catch(err2 => {
                            if (typeof (cb) == "function") {
                                var errMsg2 = err2.toString();
                                if (err2.errors && err2.errors.length > 0) {
                                    for (var i = 0; i < err2.errors.length; i++) {
                                        errMsg2 += ("\r\n" + err2.errors[i].message);
                                    }
                                }
                                cb(errMsg2);
                            }
                        });
                } else {
                    if (typeof (cb) == "function") {
                        cb("where参数是必须的：" + where);
                    }
                }
            } else {
                if (typeof (cb) == "function") {
                    cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                var errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (var i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                cb(errMsg);
            }
        }
    }

    static findOneByPrimaryKey(modelName, value, attributes, dbTrans, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
                cb = dbTrans;
                dbTrans = null;
            }

            var modelInst = this._getModel(modelName);
            if (modelInst) {
                if (value) {
                    modelInst.findByPk(value, Object.assign({}, logOptions, {
                        attributes: attributes ? attributes : undefined,
                        transaction: dbTrans ? dbTrans : undefined
                    })).then((result) => {
                        if (typeof (cb) == "function") {
                            if (result && result.toJSON) {
                                cb(null, result.toJSON());
                            } else {
                                cb(null, result);
                            }
                        }
                    }).catch(err2 => {
                        if (typeof (cb) == "function") {
                            var errMsg2 = err2.toString();
                            if (err2.errors && err2.errors.length > 0) {
                                for (var i = 0; i < err2.errors.length; i++) {
                                    errMsg2 += ("\r\n" + err2.errors[i].message);
                                }
                            }
                            cb(errMsg2);
                        }
                    });
                } else {
                    if (typeof (cb) == "function") {
                        cb("无效的数据输入：" + value);
                    }
                }
            } else {
                if (typeof (cb) == "function") {
                    cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                var errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (var i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                cb(errMsg);
            }
        }
    }

    static findList(modelName, where, attributes, orders, dbTrans, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
                cb = dbTrans;
                dbTrans = null;
            }

            var modelInst = this._getModel(modelName);
            if (modelInst) {
                var invokeMethod = modelInst.findAll;

                var options = Object.assign({}, logOptions, {
                    attributes: attributes ? attributes : undefined,
                    where: where ? where : undefined,
                    order: orders ? orders : undefined
                });

                invokeMethod.call(modelInst, options)
                    .then((results) => {
                        if (typeof (cb) == "function") {
                            var jsonResults = [];
                            var foundRows = results.rows ? results.rows : results;
                            for (var i = 0; i < foundRows.length; i++) {
                                jsonResults.push(foundRows[i].toJSON());
                            }

                            if (results.rows) {
                                cb(null, {
                                    rows: jsonResults,
                                    total: results.count
                                });
                            } else {
                                cb(null, jsonResults);
                            }
                        }
                    }).catch(err2 => {
                        if (typeof (cb) == "function") {
                            var errMsg2 = err2.toString();
                            if (err2.errors && err2.errors.length > 0) {
                                for (var i = 0; i < err2.errors.length; i++) {
                                    errMsg2 += ("\r\n" + err2.errors[i].message);
                                }
                            }
                            cb(errMsg2);
                        }
                    });
            } else {
                if (typeof (cb) == "function") {
                    cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) 
        {
            if (typeof (cb) == "function") {
                var errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (var i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                cb(errMsg);
            }
        }
    }

    static findPage(modelName, where, limit, offset, returnTotal, attributes, orders, dbTrans, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
                cb = dbTrans;
                dbTrans = null;
            }

            var modelInst = this._getModel(modelName);
            if (modelInst) {
                var invokeMethod = modelInst.findAll;
                if (returnTotal) {
                    invokeMethod = modelInst.findAndCountAll;
                }

                var options = Object.assign({}, logOptions, {
                    attributes: attributes ? attributes : undefined,
                    where: where ? where : undefined,
                    order: orders ? orders : undefined,
                    limit: limit ? limit : 100,
                    offset: offset ? offset : 0
                });

                invokeMethod.call(modelInst, options)
                    .then((results) => {
                        if (typeof (cb) == "function") {
                            var jsonResults = [];
                            var foundRows = results.rows ? results.rows : results;
                            for (var i = 0; i < foundRows.length; i++) {
                                jsonResults.push(foundRows[i].toJSON());
                            }

                            if (results.rows) {
                                cb(null, {
                                    rows: jsonResults,
                                    total: results.count
                                });
                            } else {
                                cb(null, jsonResults);
                            }
                        }
                    }).catch(err2 => {
                        if (typeof (cb) == "function") {
                            var errMsg2 = err2.toString();
                            if (err2.errors && err2.errors.length > 0) {
                                for (var i = 0; i < err2.errors.length; i++) {
                                    errMsg2 += ("\r\n" + err2.errors[i].message);
                                }
                            }
                            cb(errMsg2);
                        }
                    });
            } else {
                if (typeof (cb) == "function") {
                    cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) 
        {
            if (typeof (cb) == "function") {
                var errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (var i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                cb(errMsg);
            }
        }
    }

    static findListByGroup(modelName, where, options, dbTrans, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
                cb = dbTrans;
                dbTrans = null;
            }
            let { limit, offset, attributes, orders, group } = options

            var modelInst = this._getModel(modelName);
            if (modelInst) {
                var invokeMethod = modelInst.findAll;

                var options = Object.assign({}, logOptions, {
                    attributes: attributes ? attributes : undefined,
                    where: where ? where : undefined,
                    order: orders,
                    group,
                    limit: limit ? limit : undefined,
                    offset: offset ? offset : undefined,
                    transaction: dbTrans ? dbTrans : undefined
                });

                invokeMethod.call(modelInst, options)
                    .then((results) => {
                        if (typeof (cb) == "function") {
                            var jsonResults = [];
                            var foundRows = results.rows ? results.rows : results;
                            for (var i = 0; i < foundRows.length; i++) {
                                jsonResults.push(foundRows[i].toJSON());
                            }

                            if (results.rows) {
                                cb(null, {
                                    rows: jsonResults,
                                    total: results.count
                                });
                            } else {
                                cb(null, jsonResults);
                            }
                        }
                    }).catch(err2 => {
                        if (typeof (cb) == "function") {
                            var errMsg2 = err2.toString();
                            if (err2.errors && err2.errors.length > 0) {
                                for (var i = 0; i < err2.errors.length; i++) {
                                    errMsg2 += ("\r\n" + err2.errors[i].message);
                                }
                            }
                            cb(errMsg2);
                        }
                    });
            } else {
                if (typeof (cb) == "function") {
                    cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                var errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (var i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                cb(errMsg);
            }
        }
    }

    static findOne(modelName, where, attributes, dbTrans, cb) {
        if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
            cb = dbTrans;
            dbTrans = null;
        }

        const options = Object.assign({}, logOptions, {
            attributes: attributes ? attributes : undefined,
            where: where ? where : undefined
        });
        
        if (dbTrans) {
            options.transaction = dbTrans;
        }
        this._getModel(modelName).findOne(options).then(
            (data) => {
                cb(null, data ? data.toJSON() : null);
            }
        ).catch(cb);
    }

    static count(modelName, where, dbTrans, cb) {
        if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
            cb = dbTrans;
            dbTrans = null;
        }

        var options = Object.assign({}, logOptions, {
            where: where ? where : undefined
        });
        
        if (dbTrans) {
            options.transaction = dbTrans;
        }
        this._getModel(modelName).count(options).then(
            (data) => {
                cb(null, data);
            }
        ).catch(cb);
    }

    static execSql(sql, transaction, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (transaction) == "function") {
                cb = transaction;
                transaction = null;
            }

            sequelizeInst.query(sql, Object.assign({}, logOptions, {
                transaction: transaction ? transaction : null
            })).spread((results, metadata) => {
                cb(null, results);
                // cb(null, true);
            }).catch(err => {
                if (typeof (cb) == "function") {
                    var errMsg = err.toString();
                    if (err.errors && err.errors.length > 0) {
                        for (var i = 0; i < err.errors.length; i++) {
                            errMsg += ("\r\n" + err.errors[i].message);
                        }
                    }
                    cb(errMsg);
                }
            });
        }
        catch (err) {
            if (typeof (cb) == "function") {
                var errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (var i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                cb(errMsg);
            }
        }
    }

    static transaction(func, cb) {
        if (sequelizeInst) {
            sequelizeInst.transaction(logOptions)
            .then((t) => {
                try
                {
                    func(t, err => {
                        if (err) {
                            t.rollback().then(() => {
                                cb('rollback--' + err, true);
                            }).catch(err2 => {
                                cb('rollback--' + err2, false);
                            })
                        } else {
                            t.commit().then(() => {
                                cb(null, true);
                            }).catch(err2 => {
                                cb('commit--' + err2, false);
                            })
                        }
                    });
                }
                catch(err3)
                {
                    t.rollback().then(() => {
                        cb('rollback--' + err3, true);
                    }).catch(err4 => {
                        cb('rollback--' + err4, false);
                    })
                }
            });
        } else {
            cb("数据库未连接", false);
        }
    }

    static createTable(modelName, force, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (force) == "function") {
                cb = force;
                force = null;
            }

            var modelInst = this._getModel(modelName);
            if (modelInst) {
                modelInst.sync(Object.assign({}, logOptions, {
                    force: force ? force : undefined
                })).then(() => {
                    if (typeof (cb) == "function") {
                        cb(null, true);
                    }
                }).catch(err2 => {
                    if (typeof (cb) == "function") {
                        cb(err2);
                    }
                });
            } else {
                if (typeof (cb) == "function") {
                    cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                var errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (var i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                cb(errMsg);
            }
        }
    }

    static removeTable(modelName, cb) {
        try {
            var modelInst = this._getModel(modelName);
            if (modelInst) {
                modelInst.drop(logOptions).then(() => {
                    if (typeof (cb) == "function") {
                        cb(null, true);
                    }
                }).catch(err2 => {
                    if (typeof (cb) == "function") {
                        cb(err2);
                    }
                });
            } else {
                if (typeof (cb) == "function") {
                    cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                var errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (var i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                cb(errMsg);
            }
        }
    }

    static clear(modelName, truncate, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (truncate) == "function") {
                cb = truncate;
                truncate = null;
            }

            var modelInst = this._getModel(modelName);
            if (modelInst) {
                modelInst.destroy(Object.assign({}, logOptions, {
                    truncate: truncate ? truncate : undefined
                })).then(() => {
                    if (typeof (cb) == "function") {
                        cb(null, true);
                    }
                }).catch(err2 => {
                    if (typeof (cb) == "function") {
                        cb(err2);
                    }
                });
            } else {
                if (typeof (cb) == "function") {
                    cb("数据模型未定义：" + modelName);
                }
            }
        } catch (err) {
            if (typeof (cb) == "function") {
                var errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (var i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                cb(errMsg);
            }
        }
    }

}

module.exports = DAO;