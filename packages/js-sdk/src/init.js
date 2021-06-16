import Asset from '@ddn/asset-base'
import options from './utils/options'

import assetPlugins from './config.asset'

/**
 * 用于初始化 Sdk
 * @param {string} nethash 网络标识，用于标识网络
 */
export default function (nethash) {
  if (nethash) {
    options.set('nethash', nethash)
  }

  // Todo: sdk 不需要完整加载资产插件包，仅仅注册名称即可，这里可以简化成配置式的，让打包之后更小
  Asset.Utils.loadFromJson(assetPlugins)
}
