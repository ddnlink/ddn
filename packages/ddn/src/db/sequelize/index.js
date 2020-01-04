import path from 'path';
import fs from 'fs';
import Sequelize from 'sequelize';

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

let sequelizeInst;

class DAO {

    static _registerModel(connection) {
        const modelDir = path.resolve(__dirname, "models");
        const files = fs.readdirSync(modelDir);
        for (let i = 0; i < files.length; i++) {
            const fullName = files[i];
            const pos = fullName.lastIndexOf(".");
            if (pos >= 0) {
                const name = fullName.substring(0, pos);
                const ext = fullName.substring(pos);
                if (ext.toLowerCase() == ".js") {
                    if (name.toLowerCase() != "index") {
                        const defineModel = require('./models/' + name);
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

    static connect(dbSetting, logger, cb) {
        sequelizeInst = new Sequelize(dbSetting.database,
            dbSetting.username, dbSetting.password, dbSetting.options);

        sequelizeInst.authenticate()
            .then(err => {
                if (err) {
                    return cb(err);
                } else {
                    this._registerModel(sequelizeInst);

                    return sequelizeInst.sync(logOptions)
                        .then(() => {
                            return cb(null, sequelizeInst);
                        }).catch(err3 => {
                            return cb(err3);
                        });
                }
            }).catch(err2 => {
                return cb(err2);
            });
    }

    static insert(modelName, modelObj, transaction, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (transaction) == "function") {
                cb = transaction;
                transaction = null;
            }

            const modelInst = this._getModel(modelName);
            if (modelInst) {
                if (modelObj) {
                    const options = Object.assign({}, logOptions, {
                        transaction: transaction ? transaction : null
                    });
                    modelInst.create(modelObj, options)
                        .then((newRecord) => {
                            if (typeof (cb) == "function") {
                                return cb(null, newRecord);
                            }
                        }).catch(err2 => {
                            if (typeof (cb) == "function") {
                                let errMsg2 = err2.toString();
                                if (err2.errors && err2.errors.length > 0) {
                                    for (let i = 0; i < err2.errors.length; i++) {
                                        errMsg2 += ("\r\n" + err2.errors[i].message);
                                    }
                                }
                                return cb(errMsg2);
                            }
                        });
                } else {
                    if (typeof (cb) == "function") {
                        return cb("无效的数据输入：" + modelObj);
                    }
                }
            } else {
                if (typeof (cb) == "function") {
                    return cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                let errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (let i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                return cb(errMsg);
            }
        }
    }

    static insertOrUpdate(modelName, modelObj, transaction, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (transaction) == "function") {
                cb = transaction;
                transaction = null;
            }

            const modelInst = this._getModel(modelName);
            if (modelInst) {
                if (modelObj) {
                    const options = Object.assign({}, logOptions, {
                        transaction: transaction ? transaction : null
                    });
                    modelInst.upsert(modelObj, options)
                        .then((newRecord) => {
                            if (typeof (cb) == "function") {
                                return cb(null, newRecord);
                            }
                        }).catch(err2 => {
                            if (typeof (cb) == "function") {
                                let errMsg2 = err2.toString();
                                if (err2.errors && err2.errors.length > 0) {
                                    for (let i = 0; i < err2.errors.length; i++) {
                                        errMsg2 += ("\r\n" + err2.errors[i].message);
                                    }
                                }
                                return cb(errMsg2);
                            }
                        });
                } else {
                    if (typeof (cb) == "function") {
                        return cb("无效的数据输入：" + modelObj);
                    }
                }
            } else {
                if (typeof (cb) == "function") {
                    return cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                let errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (let i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                return cb(errMsg);
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

            const modelInst = this._getModel(modelName);
            if (modelInst) {
                if (modelObj) {
                    const options = Object.assign({}, logOptions, {
                        where: where,
                        transaction: transaction ? transaction : null
                    });
                    modelInst.update(modelObj, options)
                        .then((result) => {
                            if (typeof (cb) == "function") {
                                return cb(null, (result && result.length > 0 ? result[0] : 0));
                            }
                        }).catch(err2 => {
                            if (typeof (cb) == "function") {
                                let errMsg2 = err2.toString();
                                if (err2.errors && err2.errors.length > 0) {
                                    for (let i = 0; i < err2.errors.length; i++) {
                                        errMsg2 += ("\r\n" + err2.errors[i].message);
                                    }
                                }
                                return cb(errMsg2);
                            }
                        });
                } else {
                    if (typeof (cb) == "function") {
                        return cb("无效的数据输入：" + modelObj);
                    }
                }
            } else {
                if (typeof (cb) == "function") {
                    return cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                let errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (let i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                return cb(errMsg);
            }
        }
    }

    static remove(modelName, where, transaction, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (transaction) == "function") {
                cb = transaction;
                transaction = null;
            }

            const modelInst = this._getModel(modelName);
            if (modelInst) {
                if (where) {
                    const options = Object.assign({}, logOptions, {
                        where: where,
                        transaction: transaction ? transaction : null,
                        cascade: true
                    });
                    modelInst.destroy(options)
                        .then((result) => {
                            if (typeof (cb) == "function") {
                                return cb(null, result);
                            }
                        }).catch(err2 => {
                            if (typeof (cb) == "function") {
                                let errMsg2 = err2.toString();
                                if (err2.errors && err2.errors.length > 0) {
                                    for (let i = 0; i < err2.errors.length; i++) {
                                        errMsg2 += ("\r\n" + err2.errors[i].message);
                                    }
                                }
                                return cb(errMsg2);
                            }
                        });
                } else {
                    if (typeof (cb) == "function") {
                        return cb("where参数是必须的：" + where);
                    }
                }
            } else {
                if (typeof (cb) == "function") {
                    return cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                let errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (let i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                return cb(errMsg);
            }
        }
    }

    static findOneByPrimaryKey(modelName, value, attributes, dbTrans, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
                cb = dbTrans;
                dbTrans = null;
            }

            const modelInst = this._getModel(modelName);
            if (modelInst) {
                if (value) {
                    modelInst.findByPk(value, Object.assign({}, logOptions, {
                        attributes: attributes ? attributes : undefined,
                        transaction: dbTrans ? dbTrans : undefined
                    })).then((result) => {
                        if (typeof (cb) == "function") {
                            if (result && result.toJSON) {
                                return cb(null, result.toJSON());
                            } else {
                                return cb(null, result);
                            }
                        }
                    }).catch(err2 => {
                        if (typeof (cb) == "function") {
                            let errMsg2 = err2.toString();
                            if (err2.errors && err2.errors.length > 0) {
                                for (let i = 0; i < err2.errors.length; i++) {
                                    errMsg2 += ("\r\n" + err2.errors[i].message);
                                }
                            }
                            return cb(errMsg2);
                        }
                    });
                } else {
                    if (typeof (cb) == "function") {
                        return cb("无效的数据输入：" + value);
                    }
                }
            } else {
                if (typeof (cb) == "function") {
                    return cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                let errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (let i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                return cb(errMsg);
            }
        }
    }

    static findList(modelName, where, attributes, orders, dbTrans, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
                cb = dbTrans;
                dbTrans = null;
            }

            const modelInst = this._getModel(modelName);
            if (modelInst) {
                const invokeMethod = modelInst.findAll;

                const options = Object.assign({}, logOptions, {
                    attributes: attributes ? attributes : undefined,
                    where: where ? where : undefined,
                    order: orders ? orders : undefined
                });

                invokeMethod.call(modelInst, options)
                    .then((results) => {
                        if (typeof (cb) == "function") {
                            const jsonResults = [];
                            const foundRows = results.rows ? results.rows : results;
                            for (let i = 0; i < foundRows.length; i++) {
                                jsonResults.push(foundRows[i].toJSON());
                            }

                            if (results.rows) {
                                return cb(null, {
                                    rows: jsonResults,
                                    total: results.count
                                });
                            } else {
                                return cb(null, jsonResults);
                            }
                        }
                    }).catch(err2 => {
                        if (typeof (cb) == "function") {
                            let errMsg2 = err2.toString();
                            if (err2.errors && err2.errors.length > 0) {
                                for (let i = 0; i < err2.errors.length; i++) {
                                    errMsg2 += ("\r\n" + err2.errors[i].message);
                                }
                            }
                            return cb(errMsg2);
                        }
                    });
            } else {
                if (typeof (cb) == "function") {
                    return cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err)
        {
            if (typeof (cb) == "function") {
                let errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (let i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                return cb(errMsg);
            }
        }
    }

    static findPage(modelName, where, limit, offset, returnTotal, attributes, orders, dbTrans, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
                cb = dbTrans;
                dbTrans = null;
            }

            const modelInst = this._getModel(modelName);
            if (modelInst) {
                let invokeMethod = modelInst.findAll;
                if (returnTotal) {
                    invokeMethod = modelInst.findAndCountAll;
                }

                const options = Object.assign({}, logOptions, {
                    attributes: attributes ? attributes : undefined,
                    where: where ? where : undefined,
                    order: orders ? orders : undefined,
                    limit: limit ? limit : 100,
                    offset: offset ? offset : 0
                });

                invokeMethod.call(modelInst, options)
                    .then((results) => {
                        if (typeof (cb) == "function") {
                            const jsonResults = [];
                            const foundRows = results.rows ? results.rows : results;
                            for (let i = 0; i < foundRows.length; i++) {
                                jsonResults.push(foundRows[i].toJSON());
                            }

                            if (results.rows) {
                                return cb(null, {
                                    rows: jsonResults,
                                    total: results.count
                                });
                            } else {
                                return cb(null, jsonResults);
                            }
                        }
                    }).catch(err2 => {
                        if (typeof (cb) == "function") {
                            let errMsg2 = err2.toString();
                            if (err2.errors && err2.errors.length > 0) {
                                for (let i = 0; i < err2.errors.length; i++) {
                                    errMsg2 += ("\r\n" + err2.errors[i].message);
                                }
                            }
                            return cb(errMsg2);
                        }
                    });
            } else {
                if (typeof (cb) == "function") {
                    return cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err)
        {
            if (typeof (cb) == "function") {
                let errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (let i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                return cb(errMsg);
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

            const modelInst = this._getModel(modelName);
            if (modelInst) {
                const invokeMethod = modelInst.findAll;

                let opts = Object.assign({}, logOptions, {
                    attributes: attributes ? attributes : undefined,
                    where: where ? where : undefined,
                    order: orders,
                    group,
                    limit: limit ? limit : undefined,
                    offset: offset ? offset : undefined,
                    transaction: dbTrans ? dbTrans : undefined
                });

                invokeMethod.call(modelInst, opts)
                    .then((results) => {
                        if (typeof (cb) == "function") {
                            const jsonResults = [];
                            const foundRows = results.rows ? results.rows : results;
                            for (let i = 0; i < foundRows.length; i++) {
                                jsonResults.push(foundRows[i].toJSON());
                            }

                            if (results.rows) {
                                return cb(null, {
                                    rows: jsonResults,
                                    total: results.count
                                });
                            } else {
                                return cb(null, jsonResults);
                            }
                        }
                    }).catch(err2 => {
                        if (typeof (cb) == "function") {
                            let errMsg2 = err2.toString();
                            if (err2.errors && err2.errors.length > 0) {
                                for (let i = 0; i < err2.errors.length; i++) {
                                    errMsg2 += ("\r\n" + err2.errors[i].message);
                                }
                            }
                            return cb(errMsg2);
                        }
                    });
            } else {
                if (typeof (cb) == "function") {
                    return cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                let errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (let i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                return cb(errMsg);
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
                return cb(null, data ? data.toJSON() : null);
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
                return cb(null, data);
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
                return cb(null, results);
                // cb(null, true);
            }).catch(err => {
                if (typeof (cb) == "function") {
                    let errMsg = err.toString();
                    if (err.errors && err.errors.length > 0) {
                        for (let i = 0; i < err.errors.length; i++) {
                            errMsg += ("\r\n" + err.errors[i].message);
                        }
                    }
                    return cb(errMsg);
                }
            });
        }
        catch (err) {
            if (typeof (cb) == "function") {
                let errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (let i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                return cb(errMsg);
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
                                return cb('rollback--' + err, true);
                            }).catch(err2 => {
                                return cb('rollback--' + err2, false);
                            })
                        } else {
                            t.commit().then(() => {
                                return cb(null, true);
                            }).catch(err2 => {
                                return cb('commit--' + err2, false);
                            })
                        }
                    });
                }
                catch(err3)
                {
                    t.rollback().then(() => {
                        return cb('rollback--' + err3, true);
                    }).catch(err4 => {
                        return cb('rollback--' + err4, false);
                    })
                }
            });
        } else {
            return cb("数据库未连接", false);
        }
    }

    static createTable(modelName, force, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (force) == "function") {
                cb = force;
                force = null;
            }

            const modelInst = this._getModel(modelName);
            if (modelInst) {
                modelInst.sync(Object.assign({}, logOptions, {
                    force: force ? force : undefined
                })).then(() => {
                    if (typeof (cb) == "function") {
                        return cb(null, true);
                    }
                }).catch(err2 => {
                    if (typeof (cb) == "function") {
                        return cb(err2);
                    }
                });
            } else {
                if (typeof (cb) == "function") {
                    return cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                let errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (let i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                return cb(errMsg);
            }
        }
    }

    static removeTable(modelName, cb) {
        try {
            const modelInst = this._getModel(modelName);
            if (modelInst) {
                modelInst.drop(logOptions).then(() => {
                    if (typeof (cb) == "function") {
                        return cb(null, true);
                    }
                }).catch(err2 => {
                    if (typeof (cb) == "function") {
                        return cb(err2);
                    }
                });
            } else {
                if (typeof (cb) == "function") {
                    return cb("数据模型未定义：" + modelName);
                }
            }
        }
        catch (err) {
            if (typeof (cb) == "function") {
                let errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (let i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                return cb(errMsg);
            }
        }
    }

    static clear(modelName, truncate, cb) {
        try {
            if (typeof (cb) == "undefined" && typeof (truncate) == "function") {
                cb = truncate;
                truncate = null;
            }

            const modelInst = this._getModel(modelName);
            if (modelInst) {
                modelInst.destroy(Object.assign({}, logOptions, {
                    truncate: truncate ? truncate : undefined
                })).then(() => {
                    if (typeof (cb) == "function") {
                        return cb(null, true);
                    }
                }).catch(err2 => {
                    if (typeof (cb) == "function") {
                        return cb(err2);
                    }
                });
            } else {
                if (typeof (cb) == "function") {
                    return cb("数据模型未定义：" + modelName);
                }
            }
        } catch (err) {
            if (typeof (cb) == "function") {
                let errMsg = err.toString();
                if (err.errors && err.errors.length > 0) {
                    for (let i = 0; i < err.errors.length; i++) {
                        errMsg += ("\r\n" + err.errors[i].message);
                    }
                }
                return cb(errMsg);
            }
        }
    }

}

module.exports = DAO;
