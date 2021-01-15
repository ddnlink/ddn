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

  static async upgrade (context, cb) {
    const self = this

    _context = context

    /**
     * 此处代码逻辑就是根据VersionChanges的版本改变历史，依次执行当前版本之后所有版本的改变的Sql语句
     *
     * 逻辑很简单，代码很崩溃，下一版本要改成async/await
     */
    try {
      const currVersion = await _context.dbParams.get('version')

      const migrations = self.getVersionChanges()
      const versionList = Object.keys(migrations)
        .sort()
        .filter(ver => ver > (currVersion || 0))
      for (const ver of versionList) {
        const changeList = migrations[ver]
        await _context.dao.transaction(async (dbTrans, done) => {
          try {
            for (const command of changeList) {
              if (!/^\s*$/.test(command)) {
                await _context.dao.execSql(command, dbTrans)
              }
            }
            await _context.dbParams.set('version', ver, dbTrans)
            done()
          } catch (err) {
            done(err)
          }
        })
      }
      return true
    } catch (err) {
      _context.logger.error(err)
      return false
    }
  }
}

export default DBUpgrade
