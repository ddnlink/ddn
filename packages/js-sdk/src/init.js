import Asset from '@ddn/asset-base'
import options from './utils/options'

import assetPlugins from './config.asset'

/**
 * 用于初始化 Sdk
 * @param {string} nethash 网络标识，用于标识网络
 * @param {string} net 主网还是测试网, testnet 或 mainnet，与 constants 里的网络类型对应
 */
export default function (nethash, net) {
  if (nethash) {
    options.set('nethash', nethash)
  }

  if (net) {
    options.set('net', net)
  }

  // Todo: sdk 不需要完整加载资产插件包，仅仅注册名称即可，这里可以简化成配置式的，让打包之后更小
  Asset.Utils.loadFromJson(assetPlugins)
}
