import path from 'path'
import Debug from 'debug'

import Asset from '@ddn/asset-base'
import defaultConstants from './constants.ddn'
import defaultConfig from './ddnrc'

const debug = Debug('debug')

let config = defaultConfig;
let constants = defaultConstants;

// 前端自定义的配置，可将其赋值给 window.jsSdk.* 变量
if (typeof window !== 'undefined' && window.jsSdk) {
    debug('window.jsSdk 存在。。。。')
    if (typeof (window.jsSdk.config) !== 'undefined') {
        config = Object.assign(defaultConfig, window.jsSdk.config)
    }

    if (typeof (window.jsSdk.constants) !== 'undefined') {
        constants = Object.assign(defaultConstants, window.jsSdk.constants)
    }
}

/**
 * 初始化 Sdk 的 插件，不然前端无法使用
 */
Asset.Utils.loadFromJson(config.assets)

export { config, constants }
