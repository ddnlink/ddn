let _dao

class DBParams {
  static init (dao) {
    _dao = dao
    return this;
  }

	static old_init (dao, cb) {
    _dao = dao
    cb(null, this)
  }

  static async set (name, value, dbTrans) {
		if (_dao) {
			throw new Error('数据库未初始化')
		}
		const result = await _dao.insertOrUpdate('param', {
			name,
			value
		}, dbTrans)
		return result;
  }

  static async get (name) {
		if (_dao) {
			throw new Error('数据库未初始化')
		}
		const result = await _dao.findOneByPrimaryKey('param', name, null);
		if (result && result.value) {
			return result.value
		}
		// console.log('db-params.js cb= ', cb);
		return result;
  }

  static async remove (name) {
		if (!_dao) {
			throw new Error('数据库未初始化')
		}
		const result = await _dao.remove('param', {
			name
		});
		return result;
  }
}

export default DBParams
