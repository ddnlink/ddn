import async from 'async'

let _context

class DBUpgrade {
  /**
     * 升级代码写在方法返回中
     *
     * 每个升级都是一个新版本，指数据库版本，不是区块链本身版本
     * 每个升级里可以有多个Sql语句，写在对应版本的数组中
     */
  static getVersionChanges () {
    return {
      1: []
    }
  }

  static upgrade (context, cb) {
    const self = this

    _context = context

    /**
         * 此处代码逻辑就是根据VersionChanges的版本改变历史，依次执行当前版本之后所有版本的改变的Sql语句
         *
         * 逻辑很简单，代码很崩溃，下一版本要改成async/await
         */
    _context.dbParams.get('version', (err, currVersion) => {
      const migrations = self.getVersionChanges()
      const versionList = Object.keys(migrations).sort().filter(ver => ver > currVersion)
      return async.eachSeries(versionList, (ver, cb2) => {
        const changeList = migrations[ver]
        _context.dao.transaction((dbTrans, done) => {
          async.eachSeries(changeList, (command, cb3) => {
            if (!/^\s*$/.test(command)) {
              _context.dao.execSql(command, dbTrans, (err3, result2) => {
                if (err3) {
                  return cb3(err3)
                } else {
                  return cb3(null, result2)
                }
              })
            } else {
              return cb3(null, true)
            }
          }, (err2) => {
            if (err2) {
              return done(err2)
            } else {
              _context.dbParams.set('version', ver, dbTrans, (err5) => {
                return done(err5)
              })
            }
          })
        }, (err4) => {
          if (err4) {
            return cb2(err4)
          } else {
            return cb2(null, ver)
          }
        })
      }, (err) => {
        if (err) {
          return cb(err)
        } else {
          return cb(null, self)
        }
      })
    })
  }
}

export default DBUpgrade
