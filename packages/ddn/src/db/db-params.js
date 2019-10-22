var _dao;

class DBParams {

    static init(dao, cb) {
        _dao = dao;
        cb(null, this);
    }

    static set(name, value, dbTrans, cb) {
        if (_dao) {
            _dao.insertOrUpdate("param", {
                name: name,
                value: value
            }, dbTrans, cb);
        } else {
            if (typeof(cb) == "function") {
                cb("数据库未初始化");
            }
        }
    }

    static get(name, cb) {
        if (_dao) {
            _dao.findOneByPrimaryKey("param", name, null, 
                (err, result) => {
                    if (err) {
                        cb(err);
                    }

                    if (result && result.value) {
                        cb(null, result.value);
                    } else {
                        cb(null, null);
                    }
                }
            );
        } else {
            if (typeof(cb) == "function") {
                cb("数据库未初始化");
            }
        }
    }

    static remove(name, cb) {
        if (_dao) {
            _dao.remove("param", {
                name: name
            }, (err, result) => {
                if (err) {
                    cb(err);
                }

                cb(null, result);
            });
        } else {
            if (typeof(cb) == "function") {
                cb("数据库未初始化");
            }
        }
    }

}

module.exports = DBParams;