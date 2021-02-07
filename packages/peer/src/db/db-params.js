let _dao

class DBParams {
  static async init (dao, cb) {
    _dao = dao
    return this
  }

  static async set (name, value, dbTrans, cb) {
    if (!_dao) {
      throw new Error('数据库未初始化')
    }
    return await _dao.insertOrUpdate('param', { name, value }, { transaction: dbTrans })
  }

  static async get (name, cb) {
    if (!_dao) {
      throw new Error('数据库未初始化')
    }
    const result = await _dao.findOneByPrimaryKey('param', name)
    return result && result.value
  }

  static async remove (name, cb) {
    if (!_dao) {
      throw new Error('数据库未初始化')
    }
    return await _dao.remove('param', { where: { name } })
  }
}

export default DBParams
