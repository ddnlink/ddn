/**
 * 运行时上下文
 * wangxm   2018-12-25
 */
import DdnUtils from '@ddn/utils'
import Asset from '@ddn/asset-base'
import Bus from '../lib/bus'
import protobuf from '../lib/protobuf'
import Sequence from '../lib/sequence'
import Address from '../helpers/address'
import BalanceManager from '../helpers/balance-manager'
import database from '../db/database'
import dbParams from '../db/db-params'
import DdnSchema from '../schema/ddn-schema'
import constants from '../constants'

class Context {
  async init (options) {
    if (!options.configObject.publicIp) {
      options.configObject.publicIp = DdnUtils.system.getPublicIp()
    }

    this.isDaemonMode = options.isDaemonMode

    // 运行目录
    this.baseDir = options.baseDir

    // 系统配置JSON对象
    this.config = options.configObject

    // 区块链基本配置
    this.constants = constants

    // 地址操作 常用操作和常量放在上下文
    this.address = new Address(constants.tokenPrefix)

    // 创世区块JSON对象
    this.genesisblock = options.genesisblockObject

    // 日志对象
    this.logger = options.logger

    // 订阅/广播管理器
    this.bus = new Bus()

    // 全局键值对对象
    this.oneoff = new Map()

    this.balanceCache = new BalanceManager()

    // 参数数据校验对象
    this.ddnSchema = DdnSchema.singleton()

    // 资产插件配置对象
    this.assetPlugins = Asset.Utils.loadFromObject(options.configObject.assets)

    // console.log('this.assetPlugins= ', this.assetPlugins.isTypeValueExists(40));

    // 二进制序列化对象
    this.protobuf = await this._buildProtobuf(options.protoFile)

    this.sequence = new Sequence({
      name: 'normal',
      onWarning (current, limit) {
        options.logger.warn('Main queue exceeding ', current)
      }
    })

    this.dbSequence = new Sequence({
      name: 'db',
      onWarning (current, limit) {
        options.logger.warn('DB queue exceeding ', current)
      }
    })

    this.balancesSequence = new Sequence({
      name: 'balance',
      onWarning (current, limit) {
        options.logger.warn('Balance queue exceeding ', current)
      }
    })

    // 数据库操作对象
    this.dao = await this._buildDataAccessObject(this.config.database, options.logger)

    // 数据库参数对象，Key/Value类型
    this.dbParams = await this._buildDataParams(this.dao)

    // 运行时核心逻辑处理模块组
    this.runtime = {}
  }

  async _buildProtobuf (protoFile) {
    return new Promise((resolve, reject) => {
      protobuf(protoFile, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  async _buildDataAccessObject (dbSetting, logger) {
    return new Promise((resolve, reject) => {
      database.init(dbSetting, logger, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  async _buildDataParams (dao) {
    return new Promise((resolve, reject) => {
      dbParams.init(dao, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }
}

export default Context
