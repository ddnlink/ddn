import Asset from '@ddn/asset-base'
import options from './options'
import constantsDefault from './constants'
import defaultPlugins from './config.asset'

/**
 * 用于初始化 Sdk
 * @param {object} args nethash 网络标识，用于标识网络; net 主网还是测试网, testnet 或 mainnet; constants 网络的 constants ，默认是 DDN 测试网络的;assets 插件列表，默认是 DDN 全部插件
 */
export default function (args) {
  if (args && args.nethash) {
    options.set('nethash', args.nethash)
  }

  if (args && args.net) {
    options.set('net', args.net)
  }

  const constants = Object.assign({}, constantsDefault, args && args.constants)
  constants.net = constants[options.get('net')]

  options.set('constants', constants)

  if (options.get('nethash') !== constants.nethash) {
    throw new Error(`Your nethash ${options.get('nethash')} or ${constants.nethash} is invalid, Please set it again!`)
  }

  // Todo: sdk 不需要完整加载资产插件包，仅仅注册名称即可，这里可以简化成配置式的，让打包之后更小
  const assetObj = Object.assign({}, defaultPlugins, args && args.assets)

  Asset.Utils.loadFromObject(assetObj)
}
