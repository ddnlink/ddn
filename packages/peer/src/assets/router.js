/**
 * 资产路由注册器
 * 为指定的资产插件生成API路由
 * @Author: wangxm
 * @Date: 2018-12-28 11:08:30
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2020-04-12 20:34:41
 */
import express from 'express'
import pluralize from 'pluralize'
import _ from 'lodash'

class Router {
  constructor (context) {
    Object.assign(this, context)
    this._context = context

    this._assetsApi = []
  }

  /**
     * 为指定的资产插件生成API路由
     * @param {*} assetConfig
     * @param {*} assetInst
     */
  async attachAssetPluginApi (assetConfig, assetInst) {
    if (assetConfig && assetInst) {
      const apiSubPaths = pluralize.plural(assetConfig.name)
      const apiSubPath = _.snakeCase(apiSubPaths).replace('_', '/')

      const router = express.Router()
      // Asset attachApi firstly
      if (typeof (assetInst.attachApi) === 'function') {
        await assetInst.attachApi(router)
      }

      // Common api secendly
      const apis = await this._attachAssetPluginApiRouter(router, assetConfig, assetInst)

      // rustful api, for example: new api: /api/aob/assets -> old api: /api/aobasset/all
      this._assetsApi.push({
        path: `/api/${apiSubPath}`,
        router,
        apis
      })
    }
  }

  // 用于在 asset 位置，手动加载 asset 的路由，只有在调用了 attachAssetPluginApi 并给 this._assetsApi 之后，该方法才有用
  mountAssetApis (expressApp) {
    for (let i = 0; i < this._assetsApi.length; i++) {
      const apiInfo = this._assetsApi[i]
      expressApp.use(apiInfo.path, apiInfo.router)

      // for (let j = 0; j < apiInfo.apis.length; j++) {
      //     this.logger.info(`mounted asset api: ${apiInfo.path}${apiInfo.apis[j]}`);
      // }
    }
  }

  _assetAssetPluginApiDetail (assetType, paramName, assetInst) {
    const func = ({ params, query }, res, next) => {
      const parseSortItem = (sort, item) => {
        const subItems = item.split('=')
        if (subItems.length === 2) {
          if (subItems[0].replace(/\s*/, '') !== '') {
            sort.push(subItems)
          }
        }
      }

      const where = {
        trs_type: assetType,
        [paramName]: params[paramName]
      }

      const orders = []
      let sortItems = query.sort

      if (sortItems) {
        if (!sortItems.splice) {
          sortItems = [sortItems]
        }

        for (let i = 0; i < sortItems.length; i++) {
          const sortItem = sortItems[i]
          if (sortItem.replace(/\s*/, '') !== '') {
            const pos = sortItem.indexOf('=')
            if (pos >= 0) {
              parseSortItem(orders, sortItem)
            } else {
              orders.push(sortItem)
            }
          }
        }
      }

      assetInst.queryAsset(where, orders, false, 1, 1)
        .then(rows => {
          res.status(200).json({ success: true, result: rows && rows.length > 0 ? rows[0] : null })
        }).catch(err => {
          res.status(200).json({ success: false, error: err.toString() })
        })
    }

    return func
  }

  _assetAssetPluginApiList (assetType, paramName, assetInst) {
    const func = ({ params, query }, res, next) => {
      const parseSortItem = (sort, item) => {
        const subItems = item.split(':')
        if (subItems.length === 2) {
          if (subItems[0].replace(/\s*/, '') !== '') {
            sort.push(subItems)
          }
        }
      }

      const where = {
        trs_type: assetType
      }
      if (paramName) {
        where[paramName] = params[paramName]
      }

      const pageIndex = query.pageindex || 1
      const pageSize = query.pagesize || 50
      delete query.pageindex
      delete query.pagesize

      const orders = []
      let sortItems = query.sort
      delete query.sort

      // 请求参数 /?pagesize=1&sort=id 不在 where 里
      if (query) {
        for (const p in query) {
          where[p] = query[p]
        }
      }

      if (sortItems) {
        if (!sortItems.splice) {
          sortItems = [sortItems]
        }

        for (let i = 0; i < sortItems.length; i++) {
          const sortItem = sortItems[i]
          if (sortItem.replace(/\s*/, '') !== '') {
            const pos = sortItem.indexOf(':')
            if (pos >= 0) {
              parseSortItem(orders, sortItem)
            } else {
              orders.push(sortItem)
            }
          }
        }
      }

      assetInst.queryAsset(where, orders, true, pageIndex, pageSize)
        .then(rows => {
          res.status(200).json({ success: true, result: rows })
        }).catch(err => {
          res.status(200).json({ success: false, error: err.toString() })
        })
    }

    return func
  }

  // TODO: 优化路由，使其更符合 rustful api
  async _attachAssetPluginApiRouter (router, { type }, assetInst) {
    const allApis = []

    const props = await assetInst.propsMapping()
    for (let i = 0; i < props.length; i++) {
      const currProp = props[i]
      if (currProp.required) {
        if (!/_ext$/.test(currProp.field)) {
          // 根据某个属性，获取单条记录
          const detailPath = `/${currProp.prop.toLowerCase()}/:${currProp.prop.toLowerCase()}`
          router.get(detailPath, this._assetAssetPluginApiDetail(type, currProp.prop.toLowerCase(), assetInst))
          allApis.push(detailPath)

          // 根据某个属性，获取多条记录
          const listPath = `/${currProp.prop.toLowerCase()}/:${currProp.prop.toLowerCase()}/all`
          router.get(listPath, this._assetAssetPluginApiList(type, currProp.prop.toLowerCase(), assetInst))
          allApis.push(listPath)
        }
      }
    }

    // 资产的某个交易
    router.get('/transaction/:trs_id', this._assetAssetPluginApiDetail(type, 'trs_id', assetInst))
    allApis.push('/transaction/:trs_id')

    // 该方法可以被插件对应方法覆盖，本方法将不再有意义
    router.get('/all', this._assetAssetPluginApiList(type, null, assetInst))
    allApis.push('/')

    return allApis
  }
}

export default Router
