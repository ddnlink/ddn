/* ---------------------------------------------------------------------------------------------
 *  Created by wxx on Sun May 06 2017 11:39:6
 *
 *  Copyright (c) 2018 DDN FOUNDATION. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
/**
 * 这是资产模型的基类
 *
 * 需要包含如下12个基本方法：
 * create，getBytes，calculateFee，verify，objectNormalize，dbRead，apply，undo，applyUnconfirmed，
 * undoUnconfirmed，ready，process
 */
import DdnUtils from '@ddn/utils'
import ByteBuffer from 'bytebuffer'
import _ from 'lodash'

import AssetUtils from './utils'
import CommonUtils from './common-utils'

/**
 * 定义字段相应规则
 */
const _assetFiledRules = {
  str1: {
    maxLen: 32
  },
  str2: {
    maxLen: 64
  },
  str3: {
    maxLen: 64
  },
  str4: {
    maxLen: 128
  },
  str5: {
    maxLen: 128
  },
  str6: {
    maxLen: 256
  },
  str7: {
    maxLen: 256
  },
  str8: {
    maxLen: 512
  },
  str9: {
    maxLen: 512
  },
  str10: {
    maxLen: 1024
  },
  int1: {
    minValue: -214748364,
    maxValue: 2147483647
  },
  int2: {
    minValue: -214748364,
    maxValue: 2147483647
  },
  int3: {
    minValue: -214748364,
    maxValue: 2147483647
  }
}

class AssetBase {
  constructor (context, transactionConfig) {
    Object.assign(this, context)
    this._context = context

    this._transactionConfig = transactionConfig
  }

  /**
     * 获取资产配置类型值
     */
  async getTransactionType () {
    return this._transactionConfig.type
  }

  /**
     * 获取资产配置名称
     */
  async getTransactionName () {
    return this._transactionConfig.name
  }

  /**
     * 获取资产所属包名
     */
  async getPackageName () {
    return this._transactionConfig.package
  }

  /**
     * transaction创建时调用，用来对输入参数根据资产进行个性化处理
     * @param {*} data
     * @param {*} trs
     */
  async create (trs) {
    return trs
  }

  /**
     * 计算该类型资产交易的手续费（方法内不允许使用context对象内容）
     * @param {*} trs
     * @param {*} sender
     */
  async calculateFee () {
    return DdnUtils.bignum.multiply(0.1, 100000000) // fixme: 这里应该可以定制 2020.5.31
  }

  /**
     * 定义资产属性和字段的对应关系
     * 最多支持定义15个属性
     * 字符串类型10个，名称分别是str1,str2,str3...str10，长度分别是32,64,64,128,128,256,256,512,512,1024，前4个有索引
     * 整数类型3个，名称分别是int1,int2,int3，类型为INT，前2个有索引
     * 时间戳类型2个，分别是timestamp1,timestamp2
     * 扩展类无上限，名称使用str_ext, int_ext, timestamp_ext，分别定义不同类型
     *
     * 以下属于系统属性，不可使用
     * amount：转账金额，默认为0，字符串类型
     * recipientId：收款地址，默认为null
     * message：备注信息
     */
  async propsMapping () {
    throw new Error('AssetBase子类必须重载propsMapping方法。')

    // 例如：员工资产类型有name、age、address 3个自定义属性，对应预设字段如下：
    // return [
    //     {"field": "str1", "prop": "name", required: true, minLen: 1, maxLen: 10},
    //     {"field": "int1", "prop": "age", required: true, minVaule: 0, maxValue: 40},
    //     {"field": "str2", "prop": "addr"},
    //     {"field": "str_ext", "prop": "ext1"}
    // ];
  }

  /**
     * 自定义资产Api
     * @param {*} router
     */
  async attachApi () {
  }

  /**
     * 判断是否包含Json扩展属性
     */
  async hasExtProps () {
    if (this.isHasExtProps !== null && typeof (this.isHasExtProps) !== 'undefined') {
      return this.isHasExtProps
    }

    this.isHasExtProps = false
    const mapping = await this.propsMapping()

    mapping.forEach(item => {
      if (item) {
        if (item.field && item.field.substring(item.field.length - 4, item.field.length) === '_ext') {
          this.isHasExtProps = true
        }
      }
    })

    return this.isHasExtProps
  }

  async getPropsMappingItemByProp (propName) {
    if (!this.propsMappingItems ||
            !this.propsMappingItems[propName.toLowerCase()]) {
      const props = await this.propsMapping()

      for (const currProp of props) {
        if (currProp.prop.toLowerCase() === propName.toLowerCase()) {
          if (!this.propsMappingItems) {
            this.propsMappingItems = {}
          }
          this.propsMappingItems[propName.toLowerCase()] = currProp
          break
        }
      }
    }

    if (this.propsMappingItems && this.propsMappingItems[propName.toLowerCase()]) {
      return this.propsMappingItems[propName.toLowerCase()]
    } else {
      return null
    }
  }

  async getPropsMappingItemByField (fieldName) {
    if (!this.propsMappingItems ||
            !this.propsMappingItems[fieldName.toLowerCase()]) {
      const props = await this.propsMapping()

      for (const currProp of props) {
        if (currProp.field.toLowerCase() === fieldName.toLowerCase()) {
          if (!this.propsMappingItems) {
            this.propsMappingItems = {}
          }
          this.propsMappingItems[fieldName.toLowerCase()] = currProp
          break
        }
      }
    }

    if (this.propsMappingItems && this.propsMappingItems[fieldName.toLowerCase()]) {
      return this.propsMappingItems[fieldName.toLowerCase()]
    } else {
      return null
    }
  }

  /**
     * 获取资产在交易对象中的名称
     * @param {*} type
     */
  async getAssetJsonName (type) {
    if (!type) {
      type = await this.getTransactionType()
    }
    return AssetUtils.getAssetJsonName(type)
  }

  /**
     * 获得交易信息中的当前资产对象
     * @param {*} trs
     */
  async getAssetObject (trs) {
    if (!trs || !trs.asset) {
      return null
    }
    const assetJsonName = AssetUtils.getAssetJsonName(trs.type)
    return trs.asset[assetJsonName]
  }

  /**
     * 根据资产配置名称获取资产对应实例
     * @param {*} assetName
     */
  async getAssetInstanceByName (assetName) {
    return AssetUtils.getAssetInstanceByName(this._context, assetName)
  }

  // 资产模块相关方法
  /**
     *
     * @param {*} filter 查询条件，遵循jsonSql规则
     * @param {*} hasExtProps 是否包含扩展内容，布尔值
     * @param {*} pageIndex 查询的页码，从1开始
     * @param {*} pageSize 页码的记录条数，默认50
     * @param {*} cb
     */
  async getAssetBase (filter, hasExtProps, pageIndex, pageSize, orders, returnTotal, attributes) {
    attributes = [
      ['transaction_id', 'asset_trs_id'],
      ['transaction_type', 'asset_trs_type'],
      ['timestamp', 'asset_timestamp'],
      ['str1', 'asset_str1'],
      ['str2', 'asset_str2'],
      ['str3', 'asset_str3'],
      ['str4', 'asset_str4'],
      ['str5', 'asset_str5'],
      ['str6', 'asset_str6'],
      ['str7', 'asset_str7'],
      ['str8', 'asset_str8'],
      ['str9', 'asset_str9'],
      ['str10', 'asset_str10'],
      ['int1', 'asset_int1'],
      ['int2', 'asset_int2'],
      ['int3', 'asset_int3'],
      ['timestamp1', 'asset_timestamp1'],
      ['timestamp2', 'asset_timestamp2']
    ]

    // ---！wly修改
    pageIndex = pageIndex || 1
    pageSize = pageSize || 50

    const limit = pageSize
    const offset = (pageIndex - 1) * pageSize

    let result
    return new Promise((resolve, reject) => {
      this.dao.findPage('trs_asset', filter, limit, offset, returnTotal, attributes,
        orders, (err, rows) => {
          if (err) {
            reject(err)
          } else {
            result = rows

            let trsIds = []
            if (returnTotal) {
              trsIds = _.map(rows.rows, 'asset_trs_id')
            } else {
              trsIds = _.map(rows, 'asset_trs_id')
            }

            if (hasExtProps) {
              this.dao.findPage('trs_asset_ext', { transaction_id: { $in: trsIds } },
                limit, null, null, [['json_ext', 'asset_ext_json'], 'transaction_id'],
                null, (err2, rows2) => {
                  if (err2) {
                    reject(err2)
                  } else {
                    if (rows2 && rows2.length > 0) {
                      const obj = _.keyBy(rows2, 'transaction_id')
                      if (returnTotal) {
                        result.rows = _.map(result.rows, num => {
                          num = _.extend(num, obj[num.asset_trs_id])
                          return num
                        })
                      } else {
                        result = _.map(result, num => {
                          num = _.extend(num, obj[num.asset_trs_id])
                          return num
                        })
                      }
                    }

                    resolve(result)
                  }
                })
            } else {
              resolve(result)
            }
          }
        })
    })
  }

  /**
     * 查询规定条件的资产数据
     * @param {*} where 查询条件，遵循sequelize规则，使用prop的名称定义
     * @param {*} orders 排序条件，遵循sequelize规则，使用prop的名称定义
     * @param {*} returnTotal 是否返回总条数，true/false
     * @param {*} pageIndex 查询的页码，从1开始
     * @param {*} pageSize 分页的大小，每页的返回的最大记录条数
     * @param {*} asset 资产交易的配置name或type（config.asset.js文件中定义）
     */
  async queryAsset (where, orders, returnTotal, pageIndex, pageSize, asset, defaultTrsType) {
    let assetInst = this
    if (asset) {
      let assetTrans
      if (/^[0-9]*$/.test(asset)) {
        assetTrans = AssetUtils.getTransactionByTypeValue(asset)
      } else {
        const assetValue = AssetUtils.getTypeValue(asset)
        assetTrans = AssetUtils.getTransactionByTypeValue(assetValue)
      }

      if (assetTrans) {
        // Fixme: 2020.5.31 这里没有 npm i 相关的包，require 不到，所以尽量不要提供 Asset 参数
        const assetCls = require(assetTrans.package)[assetTrans.name]
        assetInst = new assetCls(this._context, assetTrans)
      }
    }

    // 构建返回字段数组
    const attributes = [
      ['transaction_id', 'asset_trs_id'],
      ['transaction_type', 'asset_trs_type'],
      ['timestamp', 'asset_timestamp']
    ]
    const propsMapping = await assetInst.propsMapping()

    propsMapping.forEach(propMapping => {
      const field = propMapping.field
      if (field !== 'str_ext' &&
                field !== 'int_ext' &&
                field !== 'timestamp_ext') {
        attributes.push([field, `asset_${field}`])
      }
    })

    let useDefaultTrsType = true
    if (typeof (defaultTrsType) !== 'undefined' && defaultTrsType !== null) {
      useDefaultTrsType = !!defaultTrsType
    }

    // 解析查询条件
    const newConds = {}
    where = where || {}
    if (useDefaultTrsType) {
      where.trs_type = await assetInst.getTransactionType()
    }

    for (const p in where) {
      const condProp = await assetInst.getPropsMappingItemByProp(p)
      if (condProp) {
        newConds[condProp.field] = where[p]
      } else {
        const pName = p.toLowerCase()
        if (pName === 'trs_id' || pName === 'transaction_id') {
          newConds.transaction_id = where[p]
        } else if (pName === 'trs_type' || pName === 'transaction_type') {
          newConds.transaction_type = where[p]
        } else if (pName === 'trs_timestamp' || pName === 'timestamp') {
          newConds.timestamp = where[p]
        } else {
          newConds[pName] = where[p]
        }
      }
    }
    // 解析排序条件
    orders = orders || []
    let newOrders = []
    if (CommonUtils.isArray(orders) && orders.length > 0) {
      const getFieldName = async (prop) => {
        const condProp = await assetInst.getPropsMappingItemByProp(prop)
        if (condProp) {
          return condProp.field
        } else {
          const pName = prop.toLowerCase()
          if (pName === 'trs_id') {
            return 'transaction_id'
          } else if (pName === 'trs_type') {
            return 'transaction_type'
          } else if (pName === 'trs_timestamp' || pName === 'timestamp') {
            return 'timestamp'
          } else if (pName === '$or' || pName === '$and' || pName === '$in' || pName === '$like' ||
                        pName === '$in' || pName === '$lt' || pName === '$lte' || pName === '$gt' || pName === '$gte') {
            newConds[pName] = where[pName]
          } else {
            this.logger.warn(`Invalid order field: ${prop}`)
            return null
          }
        }
      }

      for (const orderItem of orders) {
        if (CommonUtils.isArray(orderItem)) {
          if (orderItem.length === 2) {
            if (typeof (orderItem[0]) === 'string' && typeof (orderItem[1]) === 'string') {
              const fieldName = await getFieldName(orderItem[0])
              if (fieldName) {
                newOrders.push([fieldName, orderItem[1]])
              } else {
                this.logger.warn(`Invalid order field: ${JSON.stringify(orderItem)}`)
              }
            } else {
              // 如果传入排序参数不是数组，就直接使用，这里其实有隐患，这里使用的字段名只能使用真正的数据库字段名，str1..str9等等，不能用prop名称
              newOrders.push(orderItem)
            }
          } else {
            this.logger.warn(`Invalid order item: ${JSON.stringify(orderItem)}`)
          }
        } else {
          if (CommonUtils.isString(orderItem)) {
            const fieldName = await getFieldName(orderItem)
            if (fieldName) {
              newOrders.push(fieldName)
            }
          } else {
            // 如果传入排序参数不是数组，就直接使用，这里其实有隐患，这里使用的字段名只能使用真正的数据库字段名，str1..str9等等，不能用prop名称
            newOrders.push(orderItem)
          }
        }
      }
    } else {
      // 如果传入排序参数不是数组，就直接使用，这里其实有隐患，这里使用的字段名只能使用真正的数据库字段名，str1..str9等等，不能用prop名称
      newOrders = orders
    }

    const data = await this.getAssetBase(newConds, await assetInst.hasExtProps(),
      pageIndex, pageSize, newOrders, returnTotal, attributes)

    const rows = data && data.rows ? data.rows : data

    if (rows && rows.length > 0) {
      const rowObjs = []

      for (const rowInfo of rows) {
        const rowObj = await assetInst.dbRead(rowInfo)
        if (rowObj) {
          const assetName = AssetUtils.getAssetJsonName(rowInfo.asset_trs_type)
          rowObjs.push(rowObj[assetName])
        }
      }

      if (returnTotal) {
        return {
          rows: rowObjs,
          total: data.total
        }
      } else {
        return rowObjs
      }
    } else {
      if (returnTotal) {
        return {
          rows: [],
          total: 0
        }
      } else {
        return []
      }
    }
  }

  /**
     *
     * @param {*} obj 模型数据, 必传
     * @param {*} asset type
     * @param {*} dbTrans
     * @param {*} cb
     */
  async update (obj, where, dbTrans, asset) {
    let assetInst = this
    if (asset) {
      let assetTrans
      if (/^[0-9]*$/.test(asset)) {
        assetTrans = AssetUtils.getTransactionByTypeValue(asset)
      } else {
        const assetValue = AssetUtils.getTypeValue(asset)
        assetTrans = AssetUtils.getTransactionByTypeValue(assetValue)
      }
      if (assetTrans) {
        const assetCls = require(assetTrans.package)[assetTrans.name]
        assetInst = new assetCls(this._context, assetTrans)
      }
    }
    // 解析obj
    const newObj = {}
    obj = obj || {}
    for (const p in obj) {
      const condProp = await assetInst.getPropsMappingItemByProp(p)
      if (condProp) {
        newObj[condProp.field] = obj[p]
      } else {
        const pName = p.toLowerCase()
        if (pName === 'trs_id') {
          newObj.transaction_id = obj[p]
        } else if (pName === 'trs_type') {
          newObj.transaction_type = obj[p]
        } else if (pName === 'trs_timestamp') {
          newObj.timestamp = obj[p]
        }
      }
    }
    // 解析where
    const newWhere = {}
    where = where || {}
    where.trs_type = await assetInst.getTransactionType()

    for (const p in where) {
      const condProp = await assetInst.getPropsMappingItemByProp(p)
      if (condProp) {
        newWhere[condProp.field] = where[p]
      } else {
        const pName = p.toLowerCase()
        if (pName === 'trs_id' || pName === 'transaction_id') {
          newWhere.transaction_id = where[p]
        } else if (pName === 'trs_type' || pName === 'transaction_type') {
          newWhere.transaction_type = where[p]
        } else if (pName === 'trs_timestamp' || pName === 'timestamp') {
          newWhere.timestamp = where[p]
        }
      }
    }

    return new Promise((resolve, reject) => {
      this.dao.update('trs_asset', newObj, newWhere, dbTrans, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
     * 查询规定条件的资产数据的个数
     * @param {*} where 查询条件，遵循sequelize规则，使用prop的名称定义
     * @param {*} asset 资产交易的配置name或type（config.asset.js文件中定义）
     */
  async queryAssetCount (where, asset) {
    let assetInst = this
    if (asset) {
      let assetTrans
      if (/^[0-9]*$/.test(asset)) {
        assetTrans = AssetUtils.getTransactionByTypeValue(asset)
      } else {
        const assetValue = AssetUtils.getTypeValue(asset)
        assetTrans = AssetUtils.getTransactionByTypeValue(assetValue)
      }
      if (assetTrans) {
        const assetCls = require(assetTrans.package)[assetTrans.name]
        assetInst = new assetCls(this._context, assetTrans)
      }
    }

    // 解析where
    const newWhere = {}
    where = where || {}
    where.trs_type = await assetInst.getTransactionType()

    for (const p in where) {
      const condProp = await assetInst.getPropsMappingItemByProp(p)
      if (condProp) {
        newWhere[condProp.field] = where[p]
      } else {
        const pName = p.toLowerCase()
        if (pName === 'trs_id' || pName === 'transaction_id') {
          newWhere.transaction_id = where[p]
        } else if (pName === 'trs_type' || pName === 'transaction_type') {
          newWhere.transaction_type = where[p]
        } else if (pName === 'trs_timestamp' || pName === 'timestamp') {
          newWhere.timestamp = where[p]
        }
      }
    }

    return new Promise((resolve, reject) => {
      this.dao.count('trs_asset', newWhere, (err, count) => {
        if (err) {
          reject(err)
        } else {
          resolve(count)
        }
      })
    })
  }

  /**
     * 校验输入数据格式是否符合规则（_assetFiledRules负责定义规则）
     * @param {*} trs
     */
  async fieldsIsValid (trs) {
    const assetJsonName = AssetUtils.getAssetJsonName(trs.type)
    if (!trs.asset || !trs.asset[assetJsonName]) {
      throw new Error('Invalid transaction asset')
    }

    const asset = trs.asset[assetJsonName]

    const mapping = await this.propsMapping()
    for (let i = 0; i < mapping.length; i++) {
      const item = mapping[i]
      if (item) {
        const itemRule = _assetFiledRules[item.field]
        let fieldType = item.field.replace(/[0-9]/g, '')
        fieldType = fieldType.replace(/_ext$/, '')
        if (fieldType === 'str') {
          const strValue = asset[item.prop]
          if (strValue !== null && typeof (strValue) !== 'undefined') {
            if (typeof (strValue) !== 'string') {
              var err = `The '${item.prop}' attribute type of '${assetJsonName}' must be a string.`
              throw new Error(err)
            }

            let minLen = item.minLen
            let maxLen = item.maxLen
            if (itemRule) {
              minLen = itemRule.minLen
              maxLen = itemRule.maxLen
            }

            if (minLen !== null && typeof (minLen) !== 'undefined') {
              try {
                minLen = parseInt(minLen)
              } catch (err3) {
                const err = `The '${item.prop}' attribute min length of '${assetJsonName}' must be greater than ${minLen}`
                throw new Error(err)
              }

              if (strValue.length < minLen) {
                const err = `The '${item.prop}' attribute min length of '${assetJsonName}' must be greater than ${minLen}`
                throw new Error(err)
              }
            }
            if (maxLen !== null && typeof (maxLen) !== 'undefined') {
              if (strValue.length > maxLen) {
                const err = `The '${item.prop}' attribute max length of '${assetJsonName}' must be less than ${maxLen}`
                throw new Error(err)
              }
            }
          } else if (item.required) {
            const err = `The '${item.prop}' attribute of '${assetJsonName}' is required.`
            throw new Error(err)
          }
        } else if (fieldType === 'int') {
          const intValue = asset[item.prop]
          if (intValue !== null && typeof (intValue) !== 'undefined') {
            if (typeof (intValue) !== 'number') {
              const err = `The '${item.prop}' attribute type of '${assetJsonName}' must be a integer.`
              throw new Error(err)
            }

            if (itemRule) {
              if (itemRule.maxValue !== null && typeof (itemRule.maxValue) !== 'undefined') {
                if (intValue > itemRule.maxValue) {
                  const err = `The '${item.prop}' attribute max value of '${assetJsonName}' must be less than ${itemRule.maxValue}`
                  throw new Error(err)
                }
              }

              if (itemRule.minValue !== null && typeof (itemRule.minValue) !== 'undefined') {
                if (intValue < itemRule.minValue) {
                  const err = `The '${item.prop}' attribute min value of '${assetJsonName}' must be greater than ${itemRule.maxValue}`
                  throw new Error(err)
                }
              }
            }
          } else if (item.required) {
            const err = `The '${item.prop}' attribute of '${assetJsonName}' is required.`
            throw new Error(err)
          }
        } else if (fieldType === 'timestamp') {
          const timestampValue = asset[item.prop]
          if (timestampValue !== null && typeof (timestampValue) !== 'undefined') {
            if (typeof (timestampValue) !== 'object' && typeof (timestampValue.getDate) !== 'function') {
              try {
                // FIXME: 你要干嘛？
                console.log('Todo: what will you do?')
              } catch (error) {
                const err = `The '${item.prop}' attribute type of '${assetJsonName}' must be a datetime.`
                throw new Error(err)
              }
            }
          } else if (item.required) {
            const err = `The '${item.prop}' attribute of '${assetJsonName}' is required.`
            throw new Error(err)
          }
        }
      }
    }
  }

  /**
     *
     * @param {*} trs
     * @param {*} sender
     * @param {*} cb
     */
  async verify (trs) {
    if (DdnUtils.bignum.isZero(trs.amount)) { // 等于0
      if (trs.recipientId) { // wxm block database
        throw new Error('The recipientId attribute of the transaction must be null.')
      }
    } else if (DdnUtils.bignum.isLessThan(trs.amount, 0)) { // 小于0
      throw new Error(`Invalid amount: ${trs.amount}`)
    } else { // 大于0
      if (!trs.recipientId) { // wxm block database
        throw new Error('The recipientId attribute of the transaction can not be null.')
      }
    }

    await this.fieldsIsValid(trs)

    return trs
  }

  /**
     *
     * @param {*} trs
     * @param {*} sender
     */
  async process (trs) {
    return trs
  }

  /**
     * 获取资产的字节格式数据，用于签名计算
     * @param {*} trs
     */
  async getBytes (trs) {
    await this.fieldsIsValid(trs)

    const assetName = AssetUtils.getAssetJsonName(trs.type)
    const asset = trs.asset[assetName]
    const mapping = await this.propsMapping()

    const bb = new ByteBuffer()
    for (let i = 0; i < mapping.length; i++) {
      const item = mapping[i]
      if (item && item.required) {
        let fieldType = item.field.replace(/[0-9]/g, '')
        fieldType = fieldType.replace(/_ext$/, '')
        if (fieldType === 'str') {
          const strValue = asset[item.prop]
          bb.writeUTF8String(strValue)
        } else if (fieldType === 'int') {
          const intValue = asset[item.prop]
          bb.writeInt(intValue)
        } else if (fieldType === 'timestamp') {
          const timestampValue = asset[item.prop]
          bb.writeUTF8String(CommonUtils.formatDate('yyyy-MM-dd hh:mm:ss', timestampValue))
        }
      }
    }
    bb.flip()

    if (typeof window !== 'undefined') {
      return new Uint8Array(bb.toArrayBuffer())
    } else {
      return bb.toBuffer()
    }
  }

  async isSupportLock () {
    return true
  }

  /**
     * 应用交易业务金额，进行转账操作
     * @param {*} trs
     * @param {*} block
     * @param {*} sender
     * @param {*} dbTrans
     */
  async apply ({ amount, recipientId }, { id, height }, dbTrans) {
    if (DdnUtils.bignum.isGreaterThan(amount, 0)) {
      await this.runtime.account.setAccount({ address: recipientId }, dbTrans)

      await this.runtime.account.merge(recipientId, {
        address: recipientId, // wxm block database
        balance: amount,
        u_balance: amount,
        block_id: id, // wxm block database
        round: await this.runtime.round.calc(height)
      }, dbTrans)
    }
  }

  /**
     * 回滚交易业务金额，进行退回操作
     * @param {*} trs
     * @param {*} block
     * @param {*} sender
     * @param {*} dbTrans
     */
  async undo ({ amount, recipientId }, { id, height }, dbTrans) {
    if (DdnUtils.bignum.isGreaterThan(amount, 0)) {
      await this.runtime.account.setAccount({ address: recipientId }, dbTrans)

      const amountStr = DdnUtils.bignum.minus(0, amount).toString()
      await this.runtime.account.merge(recipientId, {
        address: recipientId, // wxm block database
        balance: amountStr,
        u_balance: amountStr,
        block_id: id, // wxm block database
        round: await this.runtime.round.calc(height)
      }, dbTrans)
    }
  }

  /**
     * 应用未确认交易，锁定转账金额
     * @param {*} trs
     * @param {*} sender
     * @param {*} dbTrans
     */
  async applyUnconfirmed ({ type, id }) {
    const key = `${type}_${id}`

    if (this.oneoff.has(key)) {
      throw new Error(`The transaction has been confirmed: ${id}.`)
    }

    this.oneoff.set(key, true)
  }

  /**
     * 回滚未确认交易，解锁转账金额
     * @param {*} trs
     * @param {*} sender
     * @param {*} dbTrans
     */
  async undoUnconfirmed ({ type, id }) {
    const key = `${type}_${id}`
    this.oneoff.delete(key)
  }

  /**
     * 校验交易传入数据是否符合规范，从数据格式、数据长度、是否必须角度进行
     * @param {*} trs
     */
  async objectNormalize (trs) {
    const assetName = AssetUtils.getAssetJsonName(trs.type)

    const propsRules = {}
    const requiredFields = []

    const props = await this.propsMapping()
    for (let i = 0; i < props.length; i++) {
      const currProp = props[i]
      propsRules[currProp.prop] = {}

      let fieldType = currProp.field.replace(/[0-9]/g, '')
      fieldType = fieldType.replace(/_ext$/, '')
      if (fieldType === 'str') {
        propsRules[currProp.prop].type = 'string'
      } else if (fieldType === 'int') {
        propsRules[currProp.prop].type = 'integer'
      } else if (fieldType === 'timestamp') {
        propsRules[currProp.prop].type = 'string'
        propsRules[currProp.prop].format = 'datetime'
      }

      if (currProp.required) {
        requiredFields.push(currProp.prop)
      }
    }

    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: propsRules,
      required: requiredFields
    }, trs.asset[assetName])
    if (validateErrors) {
      this.logger.error(`Can't parse asset ${assetName}: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
      throw new Error(`Can't parse asset data: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    return trs
  }

  /**
     * 读取数据库数据并反序列成交易对象体
     * @param {*} raw
     */
  async dbRead (raw) {
    if (raw && raw.asset_trs_id) {
      const result = {
        transaction_id: raw.asset_trs_id,
        transaction_type: raw.asset_trs_type,
        timestamp: raw.asset_timestamp
      }

      const props = await this.propsMapping()
      if (props && props.length > 0) {
        for (let i = 0; i < props.length; i++) {
          const mapping = props[i]

          let fieldType = mapping.field.replace(/[0-9]/g, '')
          fieldType = fieldType.replace(/_ext$/, '')
          if (fieldType === 'str') {
            result[mapping.prop] = raw[`asset_${mapping.field}`] || ''
          } else {
            result[mapping.prop] = raw[`asset_${mapping.field}`]
          }
        }
      }

      const json = raw.asset_ext_json
      if (json !== null && typeof (json) !== 'undefined' && json !== '') {
        try {
          const jsonObj = JSON.parse(json)
          Object.assign(result, jsonObj)
        } catch (err2) {
          // todo
          throw new Error('Can\'t parse asset extend data')
        }
      }

      const retObj = {}
      const assetName = AssetUtils.getAssetJsonName(raw.asset_trs_type)
      retObj[assetName] = result
      return retObj
    } else {
      return null
    }
  }

  /**
     * 将交易存储到数据库中
     * @param {*} trs
     * @param {*} dbTrans
     */
  async dbSave (trs, dbTrans) {
    const assetName = AssetUtils.getAssetJsonName(trs.type)
    const asset = trs.asset[assetName]

    const assetInst = {
      transaction_id: trs.id,
      transaction_type: trs.type,
      timestamp: trs.timestamp
    }

    const jsonExtObj = {}
    let hasJsonExt = false

    const mapping = await this.propsMapping()
    for (let i = 0; i < mapping.length; i++) {
      const item = mapping[i]
      if (item) {
        const itemValue = asset[item.prop]
        if (itemValue !== null && itemValue !== undefined) {
          assetInst[item.field] = itemValue

          const fieldType = item.field.replace(/[0-9]/g, '')
          if (fieldType === 'str_ext' ||
                        fieldType === 'int_ext' ||
                        fieldType === 'timestamp_ext') {
            hasJsonExt = true
            jsonExtObj[item.prop] = itemValue
          }
        }
      }
    }

    return new Promise((resolve, reject) => {
      this.dao.insert('trs_asset', assetInst, dbTrans, (err, result) => {
        if (err) {
          reject(err)
        } else {
          if (hasJsonExt) {
            const assetExtInst = {
              transaction_id: trs.id,
              json_ext: JSON.stringify(jsonExtObj)
            }

            this.dao.insert('trs_asset_ext', assetExtInst, dbTrans, (err2, result2) => {
              if (err2) {
                reject(err2)
              } else {
                resolve(result2)
              }
            })
          } else {
            resolve(result)
          }
        }
      })
    })
  }

  /**
     * 确认交易当前状态是否可以打包进当前区块
     * @param {*} trs
     * @param {*} sender
     */
  async ready ({ signatures }, { multisignatures, multimin }) {
    if (multisignatures && multisignatures.length) {
      if (!signatures) {
        return false
      }
      return signatures.length >= multimin - 1
    } else {
      return true
    }
  }

  /**
     * 区块链启动成功后执行
     */
  async onBlockchainReady () {
  }
}

export default AssetBase
