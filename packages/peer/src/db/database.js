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
   */
  static async init (dbSetting, logger) {
    // console.log(dbSetting)
    sequelizeInst = new Sequelize(dbSetting.database, dbSetting.username, dbSetting.password, dbSetting.options)

    if (logger) {
      logOptions.logging = (sql, time) => {
        logger.debug(`${sql}: excuting time: ${time} `)
      }
    }

    await sequelizeInst.authenticate()
    this._registerModel(sequelizeInst)
    await sequelizeInst.sync(logOptions)

    this.initConstants(sequelizeInst)
    this.initFuncs(sequelizeInst)

    // FIXME: 这里返回this与返回DAO类都不报错，但返还DAO似乎更合理一些
    return this
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
   */
  static async insert (modelName, modelObj, transaction) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }
    if (!modelObj) {
      throw new Error('无效的数据输入：' + modelObj)
    }
    const options = {
      ...logOptions,
      transaction
    }
    // console.log(modelName)
    return await modelInst.create(modelObj, options)
  }

  /**
   * 插入或修改数据
   * @param {*} modelName 模型名称
   * @param {*} modelObj 模型数据
   * @param {*} transaction 事务对象
   */
  static async insertOrUpdate (modelName, modelObj, transaction) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }
    if (!modelObj) {
      throw new Error('无效的数据输入：' + modelObj)
    }
    const options = {
      ...logOptions,
      transaction
    }
    await modelInst.upsert(modelObj, options)
    return modelObj
  }

  /**
   * 更新模型数据
   * $and, $or, $ne, $in, $not, $notIn, $gte, $gt, $lte, $lt, $like, $ilike/$iLike, $notLike, $notILike, '..'/$between, '!..'/$notBetween, '&&'/$overlap, '@>'/$contains, '<@'/$contained
   * @param {*} modelName 模型名称
   * @param {*} modelObj 模型数据
   * @param {*} where 更新条件，指定更新范围，参考Sequelize的Query查询定义https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#where
   * @param {*} transaction 事务对象
   */
  static async update (modelName, modelObj, where, transaction) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }

    if (!modelObj) {
      throw new Error('无效的数据输入：' + modelObj)
    }

    const options = {
      ...logOptions,
      where,
      transaction
    }
    const result = await modelInst.update(modelObj, options)
    return result && result.length > 0 ? result[0] : 0
  }

  /**
   * 系统配置表专用，其他数据禁用，区块链数据不允许删除
   * @param {*} modelName
   * @param {*} where 查询条件，参考Sequelize的Query查询定义https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#where
   * @param {*} transaction 事务对象
   */
  static async remove (modelName, where, transaction) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }

    if (!where) {
      throw new Error('where参数是必须的：' + where)
    }

    const options = {
      ...logOptions,
      where,
      transaction,
      cascade: true
    }
    return await modelInst.destroy(options)
  }

  /**
   * 根据条件查询到一个对象
   * @param {*} modelName 模型名称
   * @param {*} where 查询条件
   * @param {*} attributes 返回字段
   * @param {*} dbTrans 事务对象
   */
  static async findOne (modelName, where, attributes, dbTrans) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }

    const options = {
      ...logOptions,
      attributes,
      where
    }

    if (dbTrans) {
      options.transaction = dbTrans
    }
    const result = await modelInst.findOne(options)
    return result ? result.toJSON() : null
  }

  /**
   * 根据主键查询数据
   * @param {*} modelName 模型名称
   * @param {*} value 主键值
   * @param {*} attributes 定义查询返回的字段，默认为全部，具体定义规则参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/#attributes
   * @param {*} dbTrans 事务对象
   */
  static async findOneByPrimaryKey (modelName, value, attributes, dbTrans) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }
    if (!value) {
      throw new Error(`无效的数据输入：${value}`)
    }

    const result = await modelInst.findByPk(value, {
      ...logOptions,
      attributes,
      transaction: dbTrans || undefined
    })
    return result && result.toJSON ? result.toJSON() : result
  }

  /**
   * 列表查询
   * @param {*} modelName 模型名称
   * @param {*} options where 查询条件，参考Sequelize的Query查询定义https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#where
   * @param {*} options attributes 定义查询返回的字段，默认为全部，参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/#attributes
   * @param {*} options sorts 定义查询的排序方式，参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#ordering
   * @param {*} dbTrans 事务对象
   */
  static async findList (modelName, options, dbTrans) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }

    const opts = {
      ...logOptions,
      ...(options || {})
    }

    if (dbTrans) {
      opts.transaction = dbTrans
    }

    const results = await modelInst.findAll(opts)
    const jsonResults = []
    const foundRows = results.rows ? results.rows : results
    for (let i = 0; i < foundRows.length; i++) {
      jsonResults.push(foundRows[i].toJSON())
    }

    return results && results.rows
      ? {
        rows: jsonResults,
        total: results.count
      }
      : jsonResults
  }

  /**
   * 分页查询
   * @param {*} modelName 模型名称
   * @param {*} options where 查询条件，参考Sequelize的Query查询定义https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#where
   * @param {*} options limit 分页大小
   * @param {*} options offset 分页位置
   * @param {*} options returnTotal 是否返回记录总数
   * @param {*} options attributes 定义查询返回的字段，默认为全部，参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/#attributes
   * @param {*} options order 定义查询的排序方式，参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#ordering
   * @param {*} dbTrans 事务对象
   */
  static async findPage (modelName, options, dbTrans) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }

    let invokeMethod = modelInst.findAll
    if (options && options.returnTotal) {
      invokeMethod = modelInst.findAndCountAll
    }

    const opts = {
      ...logOptions,
      ...(options || {}),
      limit: options.limit || 100,
      offset: options.offset || 0
    }

    if (dbTrans) {
      opts.transaction = dbTrans
    }

    const results = await invokeMethod.call(modelInst, opts)
    const jsonResults = []
    const foundRows = results.rows ? results.rows : results

    for (let i = 0; i < foundRows.length; i++) {
      jsonResults.push(foundRows[i].toJSON())
    }

    return results && results.rows
      ? {
        rows: jsonResults,
        total: results.count
      }
      : jsonResults
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
   */
  static async findListByGroup (modelName, options = {}, dbTrans) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }

    const invokeMethod = modelInst.findAll

    const opts = {
      ...logOptions,
      ...(options || {})
    }

    if (dbTrans) {
      opts.transaction = dbTrans
    }

    const results = await invokeMethod.call(modelInst, opts)
    const jsonResults = []
    const foundRows = results.rows ? results.rows : results
    for (let i = 0; i < foundRows.length; i++) {
      jsonResults.push(foundRows[i].toJSON())
    }
    return results && results.rows
      ? {
        rows: jsonResults,
        total: results.count
      }
      : jsonResults
  }

  /**
   * 根据条件查询到个数
   * @param {*} modelName 模型名称
   * @param {*} where 查询条件
   * @param {*} dbTrans 事务对象
   */
  static async count (modelName, where, dbTrans) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }

    const options = { ...logOptions, where: where || undefined }
    if (dbTrans) {
      options.transaction = dbTrans
    }

    return await modelInst.count(options)
  }

  static async execSql (sql, transaction) {
    const [results] = await sequelizeInst.query(sql, { ...logOptions, transaction })

    return results
  }

  /**
   * @param {*} func 业务函数，由用户编写，系统会自动调用，并传入两个参数 trans-事务对象实例，done-回调方法
   */
  static async transaction (func) {
    if (!sequelizeInst) {
      throw new Error('数据库未连接')
    }
    const t = await sequelizeInst.transaction(logOptions)
    try {
      await func(t)
      await t.commit()
      return
    } catch (err) {
      await t.rollback()
      return 'rollback success err: ' + err
    }
  }

  /**
   * 创建指定对象的物理表格
   * @param {*} modelName
   * @param {*} force true - 如果存在的话，先删除再创建
   */
  static async createTable (modelName, force) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }

    await modelInst.sync({ ...logOptions, force })
    return true
  }

  /**
   * 删除指定对象的物理表格
   * @param {*} modelName
   */
  static async removeTable (modelName) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }

    await modelInst.drop(logOptions)
    return true
  }

  /**
   * 清除指定对象的所有数据
   * @param {*} modelName
   * @param {*} truncate 使用数据库TRUNCATE方法，释放空间和索引
   */
  static async clear (modelName, truncate) {
    const modelInst = this._getModel(modelName)
    if (!modelInst) {
      throw new Error(`Data model not defined: ${modelName}`)
    }

    await modelInst.destroy({ ...logOptions, truncate })
    return true
  }
}

export default DAO
