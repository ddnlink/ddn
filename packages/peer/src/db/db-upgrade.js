import bluebird from 'bluebird'

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

  static async upgrade (context) {
    const self = this

    _context = context

    /**
         * 此处代码逻辑就是根据VersionChanges的版本改变历史，依次执行当前版本之后所有版本的改变的Sql语句
         *
         * 逻辑很简单，代码很崩溃，下一版本要改成async/await
         */
			let currVersion;
			try {
				currVersion = await _context.dbParams.get('version');
			} catch (e) {
				// TODO 2020-10-18
			}
      const migrations = self.getVersionChanges()
			const versionList = Object.keys(migrations).sort().filter(ver => ver > currVersion)
			await bluebird.each(versionList, async (ver) => {
				const changeList = migrations[ver]
        await _context.dao.transaction(async (dbTrans) => {
					await bluebird.each(changeList, async (command) => {
						if (!/^\s*$/.test(command)) {
							const result2 = _context.dao.execSql(command, dbTrans)
							return result2;
						} else {
							return resolve(true)
						}
					})
					await _context.dbParams.set('version', ver, dbTrans)
					return ver;
        })
			})
			return self;
  }
}

export default DBUpgrade
