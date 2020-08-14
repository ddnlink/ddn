import Asset from '@ddn/asset-base'
import constants from '../constants'
import ddnrc from './ddnrc'
import assets from './config.asset'

let config = ddnrc
if (process.env.DDN_ENV === 'custom') {
  config = require('./ddnrc.custom').default
}

constants.net = constants[config.net]

/**
 * 初始化 Sdk 的 插件，不然前端无法使用
 */
Asset.Utils.loadFromJson(assets)

export {
  config,
  constants
}
