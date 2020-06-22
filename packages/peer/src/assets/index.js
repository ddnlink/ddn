/**
 * 资产管理模块和方法
 * wangxm   2018-12-28
 */
import Loader from './loader'

let _singleton

class Assets {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new Assets(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context

    this._loader = new Loader(context)
    this._loader.init()
  }

  async execAssetFunc () {
    const args = []
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i])
    }
    await this._loader.execAssetFunc(...args)
  }

  mountAssetApis (expressApp) {
    this._loader.mountAssetApis(expressApp)
  }

  /**
     * 判断指定类型的资产是否存在
     * @param {*} type
     */
  hasType (type) {
    return this._loader.hasType(type)
  }

  /**
     * 根据资产配置名称获取资产实例
     * @param {*} assetName
     */
  findInstanceByName (assetName) {
    return this._loader.findInstanceByName(assetName)
  }

  /**
     * 判断指定类型的资产交易是否在账户锁定时禁止交易
     * @param {*} type
     */
  async isSupportLock (type) {
    return await this.call(type, 'isSupportLock')
  }

  /**
     * 调用指定类型资产的指定方法
     * @param {*} type
     * @param {*} method
     */
  async call (type, method) {
    const asset = this._loader.getAsset(type)

    if (asset && typeof (asset[method]) === 'function') {
      const args = []
      for (let i = 2; i < arguments.length; i++) {
        args.push(arguments[i])
      }
      return await asset[method](...args)
    }
    return null
  }
}

export default Assets
