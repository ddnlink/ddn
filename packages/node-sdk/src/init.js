import Asset from '@ddn/asset-base'
import options from './options'

// fixme: 已经修改为 config.js
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

  Asset.Utils.loadFromObject(assetPlugins)
}
