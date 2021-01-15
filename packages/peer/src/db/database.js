import path from 'path'
import fs from 'fs'
import Sequelize from 'sequelize'

const _sysModels = {}

const logOptions = {
  logging: (sql, time) => {
    // if (_logger) {
    //     _logger.info("====================== Executed SQL (" + time + " ms) ======================")
    //     _logger.info(sql);
    // }
  },
  benchmark: true
}

let sequelizeInst

function callback (cb, err, result) {
  // console.log(cb, err, result)
  if (cb) cb(err, result)
  else if (err) throw new Error(err)
  else return result
}

class DAO {
  static _registerModel (connection) {
    const modelDir = path.resolve(__dirname, 'models')
    const files = fs.readdirSync(modelDir)
    for (let i = 0; i < files.length; i++) {
      const fullName = files[i]
      const pos = fullName.lastIndexOf('.')
      if (pos >= 0) {
        const name = fullName.substring(0, pos)
        const ext = fullName.substring(pos)
        if (ext.toLowerCase() === '.js') {
          if (name.toLowerCase() !== 'index') {
            const defineModel = require('./models/' + name).default
            this._addModel(name, defineModel(connection))
          }
        }
      }
    }
  }

  static _addModel (name, model) {
    _sysModels[name.toLowerCase()] = model
  }

  static _getModel (name) {
    return _sysModels[name.toLowerCase()]
  }

  /**
   * 增加方法 --> 创建aobAsset相关的数据表
   * @param {*} name
   * @param {*} func
   */
  static buildModel (name, func) {
    this._addModel(name, func(sequelizeInst))
  }

  /**
   * 数据库初始化
   * @param {*} logger 日志对象
   * @param {*} cb 回调函数
   */
  static async init (dbSetting, logger, cb) {
    if (typeof cb === 'undefined' && typeof logger === 'function') {
      cb = logger
      logger = null
    }

    try {
      // console.log(dbSetting)
      sequelizeInst = new Sequelize(dbSetting.database, dbSetting.username, dbSetting.password, dbSetting.options)

      await sequelizeInst.authenticate()
      this._registerModel(sequelizeInst)
      await sequelizeInst.sync(logOptions)

      this.initConstants(sequelizeInst)
      this.initFuncs(sequelizeInst)

      // FIXME: 这里返回this与返回DAO类都不报错，但返还DAO似乎更合理一些
      return callback(cb, null, this)
    } catch (err) {
      return callback(cb, err)
    }
  }

  /**
   * 此处用来保证代码中用到的全部是database导出的方法和对象
   */
  static initFuncs (sequelize) {
    this.db_fn = Sequelize.fn
    this.db_col = Sequelize.col
    this.db_str = Sequelize.literal

    this.db_fnRandom = this.fnRandom
    this.db_fnSum = this.fnSum
    this.db_fnGroupConcat = this.fnGroupConcat
    this.db_fnMax = this.fnMax
  }

  /**
   * 此处用来保证代码中用到的全部是database导出的方法和对象
   */
  static initConstants (sequelize) {
    this.db_OP = Sequelize.Op
    this.db_TYPE = sequelize.dialect.name
  }

  static fnRandom () {
    if (this.db_TYPE === 'mysql') {
      return this.db_fn('RAND')
    } else {
      return this.db_fn('RANDOM')
    }
  }

  /**
   * 对指定字段求和
   * @param {*} field 需要求和的字段名
   */
  static fnSum (field) {
    if (this.db_TYPE === 'postgres') {
      return this.db_fn('SUM', this.db_str('CAST(' + field + ' AS DECIMAL)'))
    } else {
      return this.db_fn('SUM', this.db_col(field))
    }
  }

  /**
   * 对指定字段的内容连接成一个字符串，逗号分隔
   * @param {*} field
   */
  static fnGroupConcat (field) {
    if (this.db_TYPE === 'postgres') {
      return this.db_str('STRING_AGG(CAST(' + field + " AS VARCHAR), ',')")
    } else {
      return this.db_fn('GROUP_CONCAT', this.db_col(field))
    }
  }

  /**
   * 对指定字段求取最大值（指定范围内）
   * @param {*} field
   */
  static fnMax (field) {
    return this.db_fn('MAX', this.db_col(field))
  }

  static async close () {
    await sequelizeInst.close()
  }

  /**
   * 插入数据
   * @param {*} modelName 模型名称
   * @param {*} modelObj 模型数据
   * @param {*} transaction 事务对象
   * @param {*} cb 回调函数
   */
  static async insert (modelName, modelObj, transaction, cb) {
    if (typeof cb === 'undefined' && typeof transaction === 'function') {
      cb = transaction
      transaction = null
    }

    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }
    if (!modelObj) {
      return callback(cb, '无效的数据输入：' + modelObj)
    }
    try {
      const options = {
        ...logOptions,
        transaction
      }
      // console.log(modelName)
      const result = await modelInst.create(modelObj, options)
      // console.log(result && result.dataValues)
      return callback(cb, null, result)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      return callback(cb, errMsg)
    }
  }

  /**
   * 插入或修改数据
   * @param {*} modelName 模型名称
   * @param {*} modelObj 模型数据
   * @param {*} transaction 事务对象
   * @param {*} cb 回调函数
   */
  static async insertOrUpdate (modelName, modelObj, transaction, cb) {
    if (typeof cb === 'undefined' && typeof transaction === 'function') {
      cb = transaction
      transaction = null
    }

    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }
    if (!modelObj) {
      return callback(cb, '无效的数据输入：' + modelObj)
    }
    try {
      const options = {
        ...logOptions,
        transaction
      }
      await modelInst.upsert(modelObj, options)
      return callback(cb, null, modelObj)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      return callback(cb, errMsg)
    }
  }

  /**
   * 更新模型数据
   * $and, $or, $ne, $in, $not, $notIn, $gte, $gt, $lte, $lt, $like, $ilike/$iLike, $notLike, $notILike, '..'/$between, '!..'/$notBetween, '&&'/$overlap, '@>'/$contains, '<@'/$contained
   * @param {*} modelName 模型名称
   * @param {*} modelObj 模型数据
   * @param {*} where 更新条件，指定更新范围，参考Sequelize的Query查询定义https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#where
   * @param {*} transaction 事务对象
   * @param {*} cb 回调函数
   */
  static async update (modelName, modelObj, where, transaction, cb) {
    if (typeof cb === 'undefined' && typeof transaction === 'function') {
      cb = transaction
      transaction = null
    }

    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }

    if (!modelObj) {
      return callback(cb, '无效的数据输入：' + modelObj)
    }

    try {
      const options = {
        ...logOptions,
        where,
        transaction
      }
      const result = await modelInst.update(modelObj, options)
      return callback(cb, null, result && result.length > 0 ? result[0] : 0)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      return callback(cb, errMsg)
    }
  }

  /**
   * 系统配置表专用，其他数据禁用，区块链数据不允许删除
   * @param {*} modelName
   * @param {*} where 查询条件，参考Sequelize的Query查询定义https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#where
   * @param {*} transaction 事务对象
   * @param {*} cb 回调函数
   */
  static async remove (modelName, where, transaction, cb) {
    if (typeof cb === 'undefined' && typeof transaction === 'function') {
      cb = transaction
      transaction = null
    }

    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }

    if (!where) {
      return callback(cb, 'where参数是必须的：' + where)
    }

    try {
      const options = {
        ...logOptions,
        where,
        transaction,
        cascade: true
      }
      const result = await modelInst.destroy(options)
      return callback(cb, null, result)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      return callback(cb, errMsg)
    }
  }

  /**
   * 根据条件查询到一个对象
   * @param {*} modelName 模型名称
   * @param {*} where 查询条件
   * @param {*} attributes 返回字段
   * @param {*} dbTrans 事务对象
   * @param {*} cb 回调
   */
  static async findOne (modelName, where, attributes, dbTrans, cb) {
    if (typeof cb === 'undefined' && typeof dbTrans === 'function') {
      cb = dbTrans
      dbTrans = null
    }

    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }

    try {
      const options = {
        ...logOptions,
        attributes,
        where
      }

      if (dbTrans) {
        options.transaction = dbTrans
      }
      const result = await modelInst.findOne(options)
      return callback(cb, null, result ? result.toJSON() : null)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      return callback(cb, errMsg)
    }
  }

  /**
   * 根据主键查询数据
   * @param {*} modelName 模型名称
   * @param {*} value 主键值
   * @param {*} attributes 定义查询返回的字段，默认为全部，具体定义规则参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/#attributes
   * @param {*} dbTrans 事务对象
   * @param {*} cb 回调函数
   */
  static async findOneByPrimaryKey (modelName, value, attributes, dbTrans, cb) {
    if (typeof cb === 'undefined' && typeof dbTrans === 'function') {
      cb = dbTrans
      dbTrans = null
    }

    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }
    if (!value) {
      return callback(cb, `无效的数据输入：${value}`)
    }

    try {
      const result = await modelInst.findByPk(value, {
        ...logOptions,
        attributes,
        transaction: dbTrans || undefined
      })
      return callback(cb, null, result && result.toJSON ? result.toJSON() : result)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      return callback(cb, errMsg)
    }
  }

  /**
   * 列表查询
   * @param {*} modelName 模型名称
   * @param {*} where 查询条件，参考Sequelize的Query查询定义https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#where
   * @param {*} attributes 定义查询返回的字段，默认为全部，参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/#attributes
   * @param {*} sorts 定义查询的排序方式，参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#ordering
   * @param {*} dbTrans 事务对象
   * @param {*} cb 回调函数
   */
  static async findList (modelName, where, attributes, orders, dbTrans, cb) {
    if (typeof cb === 'undefined' && typeof dbTrans === 'function') {
      cb = dbTrans
      dbTrans = null
    }

    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }

    try {
      const options = {
        ...logOptions,
        attributes,
        where,
        order: orders || undefined
      }

      const results = await modelInst.findAll(options)
      const jsonResults = []
      const foundRows = results.rows ? results.rows : results
      for (let i = 0; i < foundRows.length; i++) {
        jsonResults.push(foundRows[i].toJSON())
      }
      const result =
        results && results.rows
          ? {
            rows: jsonResults,
            total: results.count
          }
          : jsonResults

      return callback(cb, null, result)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      return callback(cb, errMsg)
    }
  }

  /**
   * 分页查询
   * @param {*} modelName 模型名称
   * @param {*} where 查询条件，参考Sequelize的Query查询定义https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#where
   * @param {*} limit 分页大小
   * @param {*} offset 分页位置
   * @param {*} returnTotal 是否返回记录总数
   * @param {*} attributes 定义查询返回的字段，默认为全部，参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/#attributes
   * @param {*} sorts 定义查询的排序方式，参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#ordering
   * @param {*} dbTrans 事务对象
   * @param {*} cb 回调函数
   */
  static async findPage (modelName, where, limit, offset, returnTotal, attributes, orders, dbTrans, cb) {
    if (typeof cb === 'undefined' && typeof dbTrans === 'function') {
      cb = dbTrans
      dbTrans = null
    }

    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }

    try {
      let invokeMethod = modelInst.findAll
      if (returnTotal) {
        invokeMethod = modelInst.findAndCountAll
      }

      const options = {
        ...logOptions,
        where,
        attributes,
        order: orders,
        limit: limit || 100,
        offset: offset || 0
      }

      const results = await invokeMethod.call(modelInst, options)
      const jsonResults = []
      const foundRows = results.rows ? results.rows : results

      for (let i = 0; i < foundRows.length; i++) {
        jsonResults.push(foundRows[i].toJSON())
      }

      const result =
        results && results.rows
          ? {
            rows: jsonResults,
            total: results.count
          }
          : jsonResults
      return callback(cb, null, result)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      console.log('findPage err 3.................')

      return callback(cb, errMsg)
    }
  }

  /**
   * 分组
   * @param {*} modelName 模型名称
   * @param {*} where 查询条件，参考Sequelize的Query查询定义https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#where
   * @param {*} limit 分页大小
   * @param {*} offset 分页位置
   * @param {*} group 是否返回记录总数
   * @param {*} attributes 定义查询返回的字段，默认为全部，参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/#attributes
   * @param {*} orders 定义查询的排序方式，参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#ordering
   * @param {*} dbTrans 事务对象
   * @param {*} cb 回调函数
   */
  static async findListByGroup (modelName, where, options, dbTrans, cb) {
    if (typeof cb === 'undefined' && typeof dbTrans === 'function') {
      cb = dbTrans
      dbTrans = null
    }

    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }

    try {
      const { limit, offset, attributes, orders, group } = options

      const invokeMethod = modelInst.findAll

      const opts = {
        ...logOptions,
        where,
        attributes,
        group,
        limit,
        offset,
        order: orders,
        transaction: dbTrans
      }

      const results = await invokeMethod.call(modelInst, opts)
      const jsonResults = []
      const foundRows = results.rows ? results.rows : results
      for (let i = 0; i < foundRows.length; i++) {
        jsonResults.push(foundRows[i].toJSON())
      }
      const result =
        results && results.rows
          ? {
            rows: jsonResults,
            total: results.count
          }
          : jsonResults
      return callback(cb, null, result)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }

      console.log('findListByGroup error 2', err)

      return callback(cb, errMsg)
    }
  }

  /**
   * 根据条件查询到个数
   * @param {*} modelName 模型名称
   * @param {*} where 查询条件
   * @param {*} dbTrans 事务对象
   * @param {*} cb 回调
   */
  static async count (modelName, where, dbTrans, cb) {
    if (typeof cb === 'undefined' && typeof dbTrans === 'function') {
      cb = dbTrans
      dbTrans = null
    }

    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }

    try {
      const options = { ...logOptions, where: where || undefined }
      if (dbTrans) {
        options.transaction = dbTrans
      }

      const result = await modelInst.count(options)
      return callback(cb, null, result)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      return callback(cb, errMsg)
    }
  }

  static async execSql (sql, transaction, cb) {
    try {
      if (typeof cb === 'undefined' && typeof transaction === 'function') {
        cb = transaction
        transaction = null
      }

      const [results] = await sequelizeInst.query(sql, { ...logOptions, transaction })

      return callback(cb, null, results)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      return callback(cb, errMsg)
    }
  }

  /**
   *
   * @param {*} func 业务函数，由用户编写，系统会自动调用，并传入两个参数 trans-事务对象实例，done-回调方法
   * @param {*} cb 回调函数
   */
  static async transaction (func, cb) {
    if (!sequelizeInst) {
      return callback(cb, '数据库未连接', false)
    }
    const t = await sequelizeInst.transaction(logOptions)
    try {
      await func(t, async err => {
        if (err) {
          try {
            await t.rollback()
            return callback(cb, 'rollback--, err1+true: ' + err, true)
          } catch (err2) {
            return callback(cb, 'rollback--, err2+false: ' + err2, false)
          }
        } else {
          try {
            await t.commit()
            return callback(cb, null, true)
          } catch (err2) {
            return callback(cb, 'commit--' + err2, false)
          }
        }
      })
    } catch (err3) {
      try {
        await t.rollback()
        return callback(cb, 'rollback--, err3+true: ' + err3, true)
      } catch (err4) {
        return callback(cb, 'rollback--, err4+false:' + err4, false)
      }
    }
  }

  /**
   * 创建指定对象的物理表格
   * @param {*} modelName
   * @param {*} force true - 如果存在的话，先删除再创建
   * @param {*} cb
   */
  static async createTable (modelName, force, cb) {
    if (typeof cb === 'undefined' && typeof force === 'function') {
      cb = force
      force = undefined
    }

    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }

    try {
      await modelInst.sync({ ...logOptions, force })
      return callback(cb, null, true)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      return callback(cb, errMsg)
    }
  }

  /**
   * 删除指定对象的物理表格
   * @param {*} modelName
   * @param {*} cb
   */
  static async removeTable (modelName, cb) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }

    try {
      await modelInst.drop(logOptions)
      return callback(cb, null, true)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      return callback(cb, errMsg)
    }
  }

  /**
   * 清除指定对象的所有数据
   * @param {*} modelName
   * @param {*} truncate 使用数据库TRUNCATE方法，释放空间和索引
   * @param {*} cb
   */
  static async clear (modelName, truncate, cb) {
    if (typeof cb === 'undefined' && typeof truncate === 'function') {
      cb = truncate
      truncate = undefined
    }

    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      return callback(cb, `Data model not defined: ${modelName}`)
    }

    try {
      await modelInst.destroy({ ...logOptions, truncate })
      return callback(cb, null, true)
    } catch (err) {
      let errMsg = err.toString()
      if (err.errors && err.errors.length > 0) {
        for (let i = 0; i < err.errors.length; i++) {
          errMsg += '\r\n' + err.errors[i].message
        }
      }
      return callback(cb, errMsg)
    }
  }
}

export default DAO
