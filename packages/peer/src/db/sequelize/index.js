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

  // 增加方法 --> 创建aobAsset相关的数据表
  static buildModel (name, func) {
    this._addModel(name, func(sequelizeInst))
  }

  static async connect (dbSetting, logger) {
    sequelizeInst = new Sequelize(dbSetting.database, dbSetting.username, dbSetting.password, dbSetting.options)

    await sequelizeInst.authenticate();
		this._registerModel(sequelizeInst);

		await sequelizeInst.sync(logOptions);
		return sequelizeInst;
  }

  static async insert(modelName, modelObj, transaction) {
    const modelInst = this._getModel(modelName);
    if (!modelInst) {
      throw new Error('Data model not defined: ' + modelName);
    }
    if (!modelObj) {
      throw new Error('无效的数据输入：' + modelObj);
    }
    const options = Object.assign({}, logOptions, {
      transaction: transaction || null,
    });
    return modelInst.create(modelObj, options);
  }

  static async insertOrUpdate (modelName, modelObj, transaction) {
		const modelInst = this._getModel(modelName)
		if (!modelInst) {
			throw new Error('Data model not defined: ' + modelName);
		}
		const options = Object.assign({}, logOptions, {
			transaction: transaction || null
		})
		// FIX 这里旧的代码返回了传入的 Obj，正常应该返回数据库的 Obj
		await modelInst.upsert(modelObj, options)
		return modelObj;
  }

  /**
   *
   * $and, $or, $ne, $in, $not, $notIn, $gte, $gt, $lte, $lt, $like, $ilike/$iLike, $notLike, $notILike, '..'/$between, '!..'/$notBetween, '&&'/$overlap, '@>'/$contains, '<@'/$contained
   *
   * @param {*} modelName
   * @param {*} modelObj
   * @param {*} where
   * @param {*} transaction
   * @param {*} cb
   */
  static async update (modelName, modelObj, where, transaction) {
		const modelInst = this._getModel(modelName)
		if (!modelInst) {
			throw new Error('Data model not defined: ' + modelName);
		}
    if (!modelObj) {
      throw new Error('无效的数据输入：' + modelObj);
    }
		const options = Object.assign({}, logOptions, {
			where: where,
			transaction: transaction || null
		})
		const result = await modelInst.update(modelObj, options);
		return result && result.length > 0 ? result[0] : 0;
  }

  static async remove (modelName, where, transaction) {
		const modelInst = this._getModel(modelName)
		if (!modelInst) {
			throw new Error('Data model not defined: ' + modelName)
		}
		if (!where) {
			throw new Error('where参数是必须的：' + where)
		}
		const options = Object.assign({}, logOptions, {
			where: where,
			transaction: transaction || null,
			cascade: true
		})
		const result = await modelInst.destroy(options);
		return result;
  }

  static async findOneByPrimaryKey (modelName, value, attributes, dbTrans) {
		const modelInst = this._getModel(modelName)
		if (!modelInst) {
			throw new Error('Data model not defined: ' + modelName)
		}
		if (!value) {
			throw new Error('无效的数据输入：' + value)
		}
		const result = await modelInst
		.findByPk(
			value,
			Object.assign({}, logOptions, {
				attributes: attributes || undefined,
				transaction: dbTrans || undefined
			})
		);
		// FIX 不知道这里为什么这么写 应该直接 toJSON 返回即可 不存在直接返回 result
		if (result && result.toJSON) {
			return result.toJSON()
		}
		return result;
  }

  static async findList (modelName, where, attributes, orders, dbTrans) {
		const modelInst = this._getModel(modelName)
		if (!modelInst) {
			throw new Error('Data model not defined: ' + modelName)
		}

		const invokeMethod = modelInst.findAll

		const options = Object.assign({}, logOptions, {
			attributes: attributes || undefined,
			where: where || undefined,
			order: orders || undefined
		})

		const results = await invokeMethod.call(modelInst, options);
		const jsonResults = []
		const foundRows = results.rows ? results.rows : results
		for (let i = 0; i < foundRows.length; i++) {
			jsonResults.push(foundRows[i].toJSON())
		}

		if (results.rows) {
			return {
				rows: jsonResults,
				total: results.count
			}
		} else {
			return jsonResults
		}
  }

  static async findPage (modelName, where, limit, offset, returnTotal, attributes, orders, dbTrans) {
		const modelInst = this._getModel(modelName)
		if (!modelInst) {
			throw new Error('Data model not defined: ' + modelName)
		}

		let invokeMethod = modelInst.findAll
		if (returnTotal) {
			invokeMethod = modelInst.findAndCountAll
		}

		const options = Object.assign({}, logOptions, {
			attributes: attributes || undefined,
			where: where || undefined,
			order: orders || undefined,
			limit: limit || 100,
			offset: offset || 0
		})

		const results = await invokeMethod.call(modelInst, options);
		const jsonResults = []
		const foundRows = results.rows ? results.rows : results

		for (let i = 0; i < foundRows.length; i++) {
			jsonResults.push(foundRows[i].toJSON())
		}

		if (results.rows) {
			return {
				rows: jsonResults,
				total: results.count
			}
		} else {
			return jsonResults
		}
  }

  static async findListByGroup (modelName, where, options, dbTrans) {
		const modelInst = this._getModel(modelName)
		if (!modelInst) {
			throw new Error('Data model not defined: ' + modelName)
		}
		const { limit, offset, attributes, orders, group } = options

		const invokeMethod = modelInst.findAll

		const opts = Object.assign({}, logOptions, {
			attributes: attributes || undefined,
			where: where || undefined,
			order: orders,
			group,
			limit: limit || undefined,
			offset: offset || undefined,
			transaction: dbTrans || undefined
		})

		const results = await invokeMethod.call(modelInst, opts)
		const jsonResults = []
		const foundRows = results.rows ? results.rows : results
		for (let i = 0; i < foundRows.length; i++) {
			jsonResults.push(foundRows[i].toJSON())
		}

		if (results.rows) {
			return {
				rows: jsonResults,
				total: results.count
			}
		} else {
			return jsonResults
		}
  }

  static async findOne(modelName, where, attributes, dbTrans) {
    const options = Object.assign({}, logOptions, {
      attributes: attributes || undefined,
      where: where || undefined,
    });

    if (dbTrans) {
      options.transaction = dbTrans;
    }
    const result = await this._getModel(modelName).findOne(options);
    return result ? result.toJSON() : null
  }

  static async count (modelName, where, dbTrans) {
    var options = Object.assign({}, logOptions, {
      where: where || undefined
    })

    if (dbTrans) {
      options.transaction = dbTrans
    }
    return this._getModel(modelName).count(options)
  }

  static async execSql (sql, transaction) {
		const result = await new Promise((resolve) => {
			sequelizeInst
				.query(
					sql,
					Object.assign({}, logOptions, {
						transaction: transaction || null
					})
				)
				.spread((results, metadata) => {
					resolve(results)
				})
		})
		return result;
  }

  static async transaction (func) {
		if (!sequelizeInst) {
			throw new Error("数据库未连接")
		}
		const t = await sequelizeInst.transaction(logOptions);
		try {
			await func(t);
			try {
				await t.commit();
			} catch (e) {
				throw new Error('commit--' + e);
			}
		} catch (e) {
			try {
				await t.rollback()
				throw new Error('rollback--, err1+true: ' + e);
			} catch (err) {
				throw new Error('rollback--, err2+false: ' + err);
			}
		}
  }

  static async createTable (modelName, force) {
		const modelInst = this._getModel(modelName)
		if (!modelInst) {
			throw new Error('Data model not defined: ' + modelName);
		}
		await modelInst.sync(
			Object.assign({}, logOptions, {
				force: force || undefined
			})
		)
  }

  static async removeTable (modelName) {
		const modelInst = this._getModel(modelName)
		if (!modelInst) {
			throw new Error('Data model not defined: ' + modelName);
		}
		await modelInst.drop(logOptions)
  }

  static async clear (modelName, truncate) {
		const modelInst = this._getModel(modelName)
		if (!modelInst) {
			throw new Error('Data model not defined: ' + modelName);
		}
		await  modelInst.destroy(
			Object.assign({}, logOptions, {
				truncate: truncate || undefined
			})
		);
  }
}

export default DAO
