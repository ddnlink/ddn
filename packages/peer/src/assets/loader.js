/**
 * 资产加载注册器
 * @Author: wangxm
 * @Date: 2018-12-28 11:08:30
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2020-04-12 20:34:41
 */

import DdnUtils from '@ddn/utils'
import Transfer from './system/transfer'
import Signatures from './system/signature'
import Delegate from './system/delegate'
import Vote from './system/vote'
import Multisignatures from './system/multisignature'
import Lock from './system/lock'

import Router from './router'

const { assetTypes } = DdnUtils

class Loader {
  constructor (context) {
    Object.assign(this, context)
    this._context = context

    this._assets = {}
    this._assetsNames = {}

    this._router = new Router(this._context)
  }

  _getAssetKey (type) {
    return `asset_${type}`
  }

  _registerAsset (type, inst, assetName) {
    if (
      inst &&
      typeof inst.create === 'function' &&
      typeof inst.getBytes === 'function' &&
      typeof inst.calculateFee === 'function' &&
      typeof inst.verify === 'function' &&
      typeof inst.objectNormalize === 'function' &&
      typeof inst.dbRead === 'function' &&
      typeof inst.apply === 'function' &&
      typeof inst.undo === 'function' &&
      typeof inst.applyUnconfirmed === 'function' &&
      typeof inst.undoUnconfirmed === 'function' &&
      typeof inst.ready === 'function' &&
      typeof inst.process === 'function'
    ) {
      this._assets[this._getAssetKey(type)] = inst

      if (assetName) {
        this._assetsNames[assetName.toLowerCase()] = inst
      }
    } else {
      throw Error('Invalid asset interface')
    }
  }

  /**
   * 加载所有系统配置的资产插件
   */
  async _attachAssetPlugins () {
    for (let i = 0; i < this.assetPlugins.getTransactionCount(); i++) {
      const transConfig = this.assetPlugins.getTransactionByIndex(i)
      const TransCls = global._require_runtime_(transConfig.package)[transConfig.name]
      const transInst = new TransCls(this._context, transConfig)

      this._registerAsset(transConfig.type, transInst, transConfig.name)
      await this._router.attachAssetPluginApi(transConfig, transInst)
    }
  }

  mountAssetApis (expressApp) {
    this._router.mountAssetApis(expressApp)
  }

  /**
   * 根据资产配置名称获取资产实例
   * @param {*} assetName
   */
  findInstanceByName (assetName) {
    if (assetName) {
      const keys = Object.getOwnPropertyNames(this._assetsNames)
      for (const p in keys) {
        const key = keys[p]
        if (key.toLowerCase() === assetName.toLowerCase()) {
          return this._assetsNames[key]
        }
      }
    }
    return null
  }

  async _addAsesstModels () {
    const { dao } = this
    const assetsPackageList = []
    for (let i = 0; i < this.assetPlugins.getTransactionCount(); i++) {
      const trans = this.assetPlugins.getTransactionByIndex(i)
      if (!assetsPackageList.includes(trans.package)) {
        assetsPackageList.push(trans.package)
      }
    }

    assetsPackageList.map(packageName => {
      let assetModels
      try {
        assetModels = global._require_runtime_(`${packageName}/lib/define-models`) || []
      } catch (err) {
        this.logger.info(`${packageName} 资产包不包含自定义数据模型内容。`)
        return
      }

      if (assetModels) {
        assetModels.map(({ name, data }) => {
          // 挂载方法
          dao.buildModel(name, data)
          // 创建表
          dao.createTable(name, false, err => {
            if (err) {
              this.logger.error(`${packageName} 资产包自定义数据模型生成失败。`, err)
              process.emit('cleanup')
            }
          })
        })
      }
    })
  }

  async init () {
    const transfer = new Transfer(this._context)
    this._registerAsset(assetTypes.TRANSFER, transfer)

    const signature = new Signatures(this._context)
    this._registerAsset(assetTypes.SIGNATURE, signature)

    const delegate = new Delegate(this._context)
    this._registerAsset(assetTypes.DELEGATE, delegate)

    const vote = new Vote(this._context)
    this._registerAsset(assetTypes.VOTE, vote)

    const multisignature = new Multisignatures(this._context)
    this._registerAsset(assetTypes.MULTISIGNATURE, multisignature)

    const lock = new Lock(this._context)
    this._registerAsset(assetTypes.LOCK, lock)

    await this._attachAssetPlugins()
    await this._addAsesstModels()
  }

  hasType (type) {
    const key = this._getAssetKey(type)
    return !!this._assets[key]
  }

  getAsset (type) {
    if (this.hasType(type)) {
      const key = this._getAssetKey(type)
      return this._assets[key]
    }
    return null
  }

  /**
   * 在所有加载的扩展资产上执行指定方法
   * @param {*} funcName
   */
  async execAssetFunc (funcName) {
    const args = []
    for (let i = 1; i < arguments.length; i++) {
      args.push(arguments[i])
    }

    const keys = Object.getOwnPropertyNames(this._assets)
    for (const p in keys) {
      const key = keys[p]
      const inst = this._assets[key]
      if (inst !== null && typeof inst[funcName] === 'function') {
        try {
          await inst[funcName](...args)
        } catch (err) {
          this.logger.error(err)
        }
      }
    }
  }
}

export default Loader
