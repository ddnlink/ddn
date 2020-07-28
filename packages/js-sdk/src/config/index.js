import Asset from '@ddn/asset-base'
import constants from '../constants'
import config from './ddnrc'
import assets from './config.asset'

constants.net = constants[config.net]

/**
 * 初始化 Sdk 的 插件，不然前端无法使用
 */
Asset.Utils.loadFromJson(assets)

export {
  config,
  constants
}
