import Sequelize from 'sequelize'
import sequelizeDB from './sequelize'

class DBUtils {
  /**
     * 数据库初始化
     * @param {*} logger 日志对象
     * @param {*} cb 回调函数
     */
  static async init (dbSettings, logger) {
		const sequelize = await sequelizeDB.connect(dbSettings, logger);
		this.initConstants(sequelize)
		this.initFuncs(sequelize)
		return this;
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

  /**
     * 此处用来保证代码中用到的全部是database导出的方法和对象
     */
  static initConstants (sequelize) {
    this.db_OP = Sequelize.Op
    this.db_TYPE = sequelize.dialect.name
  }

  /**
     * 增加方法 --> 创建aobAsset相关的数据表
     * @param {*} name
     * @param {*} func
     */
  static buildModel (name, func) {
    sequelizeDB.buildModel(name, func)
  }

  /**
     * 插入数据
     * @param {*} modelName 模型名称
     * @param {*} modelObj 模型数据
     * @param {*} transaction 事务对象
     */
  static async insert (modelName, modelObj, transaction) {
    return sequelizeDB.insert(modelName, modelObj, transaction)
  }

  /**
     * 插入或修改数据
     * @param {*} modelName 模型名称
     * @param {*} modelObj 模型数据
     * @param {*} transaction 事务对象
     */
  static async insertOrUpdate (modelName, modelObj, transaction) {
    return sequelizeDB.insertOrUpdate(modelName, modelObj, transaction)
  }

  /**
     * 更新模型数据
     * @param {*} modelName 模型名称
     * @param {*} modelObj 模型数据
     * @param {*} where 更新条件，指定更新范围，参考Sequelize的Query查询定义https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#where
     * @param {*} transaction 事务对象
     */
  static async update (modelName, modelObj, where, transaction) {
    return sequelizeDB.update(modelName, modelObj, where, transaction)
  }

  /**
     * 系统配置表专用，其他数据禁用，区块链数据不允许删除
     * @param {*} modelName
     * @param {*} where 查询条件，参考Sequelize的Query查询定义https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#where
     * @param {*} transaction 事务对象
     */
  static async remove (modelName, where, transaction) {
    return sequelizeDB.remove(modelName, where, transaction)
  }

  /**
     * 根据主键查询数据
     * @param {*} modelName 模型名称
     * @param {*} value 主键值
     * @param {*} attributes 定义查询返回的字段，默认为全部，具体定义规则参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/#attributes
     * @param {*} dbTrans 事务对象
     */
  static async findOneByPrimaryKey (modelName, value, attributes, dbTrans) {
    return sequelizeDB.findOneByPrimaryKey(modelName, value, attributes, dbTrans)
  }

  /**
     * 列表查询
     * @param {*} modelName 模型名称
     * @param {*} where 查询条件，参考Sequelize的Query查询定义https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#where
     * @param {*} attributes 定义查询返回的字段，默认为全部，参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/#attributes
     * @param {*} sorts 定义查询的排序方式，参考Sequelize的Query查询参数https://sequelize.readthedocs.io/en/latest/docs/querying/?q=Sequelize.fn&check_keywords=yes&area=default#ordering
     * @param {*} dbTrans 事务对象
     */
  static findList (modelName, where, attributes, sorts, dbTrans) {
    return sequelizeDB.findList(modelName, where, attributes, sorts, dbTrans)
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
     */
  static async findPage (modelName, where, limit, offset, returnTotal, attributes, sorts, dbTrans) {
    return sequelizeDB.findPage(modelName, where, limit, offset, returnTotal, attributes, sorts, dbTrans)
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
  static async findListByGroup (modelName, where, options, dbTrans) {
    return sequelizeDB.findListByGroup(modelName, where, options, dbTrans)
  }

  /**
     * 根据条件查询到一个对象
     * @param {*} modelName 模型名称
     * @param {*} where 查询条件
     * @param {*} attributes 返回字段
     * @param {*} dbTrans 事务对象
     */
  static async findOne (modelName, where, attributes, dbTrans) {
    return sequelizeDB.findOne(modelName, where, attributes, dbTrans)
  }

  /**
     * 根据条件查询到个数
     * @param {*} modelName 模型名称
     * @param {*} where 查询条件
     * @param {*} dbTrans 事务对象
     */
  static async count (modelName, where, dbTrans) {
    return sequelizeDB.count(modelName, where, dbTrans)
  }

  static async execSql (sql, transaction) {
    return sequelizeDB.execSql(sql, transaction)
  }

  /**
     *
     * @param {*} func 业务函数，由用户编写，系统会自动调用，并传入两个参数 trans-事务对象实例，done-回调方法
     */
  static async transaction (func) {
    return sequelizeDB.transaction(func)
  }

  /**
     * 创建指定对象的物理表格
     * @param {*} modelName
     * @param {*} force true - 如果存在的话，先删除再创建
     */
  static async createTable (modelName, force) {
    return sequelizeDB.createTable(modelName, force)
  }

  /**
     * 删除指定对象的物理表格
     * @param {*} modelName
     */
  static async removeTable (modelName) {
    return sequelizeDB.removeTable(modelName)
  }

  /**
     * 清除指定对象的所有数据
     * @param {*} modelName
     * @param {*} truncate 使用数据库TRUNCATE方法，释放空间和索引
     * @param {*} cb
     */
  static async clear (modelName, truncate) {
    return sequelizeDB.clear(modelName, truncate)
  }
}

export default DBUtils
