let _dao

function callback (cb, err, result) {
  // console.log(cb, err, result)
  if (cb) cb(err, result)
  else if (err) throw new Error(err)
  else return result
}

class DBParams {
  static async init (dao, cb) {
    _dao = dao
    return callback(cb, null, this)
  }

  static async set (name, value, dbTrans, cb) {
    if (!_dao) {
      return callback(cb, '数据库未初始化')
    }
    const result = await _dao.insertOrUpdate(
      'param',
      {
        name,
        value
      },
      dbTrans
    )

    return callback(cb, null, result)
  }

  static async get (name, cb) {
    if (!_dao) {
      return callback(cb, '数据库未初始化')
    }
    const result = _dao.findOneByPrimaryKey('param', name, null)
    return callback(cb, null, result && result.value)
  }

  static async remove (name, cb) {
    if (!_dao) {
      return callback(cb, '数据库未初始化')
    }
    const result = await _dao.remove('param', {
      name
    })
    return callback(cb, null, result)
  }
}

export default DBParams
