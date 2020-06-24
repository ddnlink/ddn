let _dao

class DBParams {
  static init (dao, cb) {
    _dao = dao
    cb(null, this)
  }

  static set (name, value, dbTrans, cb) {
    if (_dao) {
      _dao.insertOrUpdate('param', {
        name,
        value
      }, dbTrans, cb)
    } else {
      if (typeof (cb) === 'function') {
        return cb('数据库未初始化')
      }
    }
  }

  static get (name, cb) {
    if (_dao) {
      _dao.findOneByPrimaryKey('param', name, null,
        (err, result) => {
          if (err) {
            return cb(err)
          }

          if (result && result.value) {
            return cb(null, result.value)
          } else {
            // console.log('db-params.js cb= ', cb);

            return cb(null, null)
          }
        }
      )
    } else {
      if (typeof (cb) === 'function') {
        return cb('数据库未初始化')
      }
    }
  }

  static remove (name, cb) {
    if (_dao) {
      _dao.remove('param', {
        name
      }, (err, result) => {
        if (err) {
          return cb(err)
        }

        cb(null, result)
      })
    } else {
      if (typeof (cb) === 'function') {
        return cb('数据库未初始化')
      }
    }
  }
}

export default DBParams
