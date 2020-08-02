import { getUserConfig, requireFile, mergeConfigs } from '@ddn/core'
import path from 'path'

import Asset from '@ddn/asset-base'
import defaultConstants from './constants.default'
import defaultConfig from './ddnrc.default'

const baseDir = path.resolve(process.cwd(), './')
const userConfig = getUserConfig({ cwd: baseDir })

/**
 * 请在项目根目录 新增 .ddnrc.js 配置文件，或者 config/config.js 等，参考 DDN 配置文档
 */
export const config = mergeConfigs(defaultConfig, userConfig)

/**
 * 请将对应网络的 常量文件 拷贝到你的项目的 config 文件夹下
 */
const constantsFile = path.resolve(process.cwd(), './config/constants.js')
const userConstants = requireFile(constantsFile)

const constantsMerge = mergeConfigs(defaultConstants, userConstants)
constantsMerge.net = constantsMerge[config.net]

export const constants = constantsMerge

/**
 * 用于初始化 Sdk 的 插件
 */
function addAssets () {
  if (config.nethash !== constants.nethash) {
    throw new Error(`Your nethash ${config.nethash} or ${constants.nethash} is invalid, Please set it again!`)
  }

  Asset.Utils.loadFromObject(config.assets)
}

addAssets()
