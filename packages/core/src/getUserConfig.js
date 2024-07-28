import { join, extname } from 'path'
import { existsSync } from 'fs'
import assert from 'assert'
import extend from 'extend2'
import winPath from './winPath'

/**
 * 获取指定目录下的配置文件
 * 如果环境变量 DDN_CONFIG_FILE 存在，通常是 .ddnrc.* 系列文件，将使用它的值来确定配置文件。否则，将检查默认的配置文件名列表。
 * 可以通过逗号分隔配置文件名列表，并且可以通过配置环境变量来指定配置文件。
 *
 * @param {string} cwd - 当前工作路径
 * @returns {string|undefined} - 如果找到配置文件，返回配置文件的完整路径；否则返回 undefined
 * @throws {Error} 如果找到多个配置文件，抛出错误
 */
export function getConfigFile (cwd) {
  const files = process.env.DDN_CONFIG_FILE
    ? process.env.DDN_CONFIG_FILE.split(',').filter(v => v && v.trim())
    : ['.ddnrc.ts', '.ddnrc.js', 'config/config.json', 'config/config.ts', 'config/config.js']

  // const validFiles = files.filter(f => {})
  const validFiles = files.filter(f => existsSync(join(cwd, f)))

  assert(
    validFiles.length <= 1,
    `Multiple config files (${validFiles.join(', ')}) were detected, please keep only one.`
  )
  if (validFiles[0]) {
    return winPath(join(cwd, validFiles[0]))
  }
}

export function addAffix (file, affix) {
  const ext = extname(file)
  return file.replace(new RegExp(`${ext}$`), `.${affix}${ext}`)
}

function defaultOnError (e) {
  console.error(e)
}

export async function requireFile (f, opts = {}) {
  if (!existsSync(f)) {
    return {}
  }

  const { onError = defaultOnError } = opts
  let ret = {}
  try {
    ret = (await import(f)) || {} // eslint-disable-line
  } catch (e) {
    onError(e, f)
  }
  // support esm + babel transform
  return ret.default || ret
}

export function mergeConfigs (...configs) {
  return extend(true, ...configs)
}

export async function getConfigByConfigFile (configFile, opts = {}) {
  const ddnEnv = process.env.DDN_ENV
  const isProd = process.env.NODE_ENV === 'production' // 默认是 false，即便 process.env.NODE_ENV 不提供
  const { defaultConfig, onError } = opts

  const requireOpts = { onError }

  /**
   * development:  config.testnet.* and config.local.*;
   * production: mainnet
   */
  const configs = [
    defaultConfig,
    await requireFile(configFile, requireOpts),
    ddnEnv && (await requireFile(addAffix(configFile, ddnEnv), requireOpts)),
    !isProd && (await requireFile(addAffix(configFile, 'testnet'), requireOpts)),
    !isProd && (await requireFile(addAffix(configFile, 'local'), requireOpts)),
    isProd && (await requireFile(addAffix(configFile, 'mainnet'), requireOpts))
  ]

  return mergeConfigs(...configs)
}

// Use DDN_ENV to add yourself config, e.g: DDN_ENV=prod config.prod.js
export function getConfigPaths (cwd) {
  const env = process.env.DDN_ENV
  return [
    join(cwd, 'config/'),
    join(cwd, '.ddnrc.js'),
    join(cwd, '.ddnrc.ts'),
    join(cwd, '.ddnrc.local.js'),
    join(cwd, '.ddnrc.local.ts'),
    ...(env ? [join(cwd, `.ddnrc.${env}.js`), join(cwd, `.ddnrc.${env}.ts`)] : [])
  ]
}

export function cleanConfigRequireCache (cwd) {
  const paths = getConfigPaths(cwd)
  Object.keys(require.cache).forEach(file => {
    if (
      paths.some(path => {
        return file.indexOf(path) === 0
      })
    ) {
      delete require.cache[file]
    }
  })
}

/**
 * 配置调用
 * 默认 .ddnrc.js，config/config.json, config/config.j(t)s是主要配置文件，
 * 当 DDN_ENV 给定值的时候，主配置文件不变，但是 在 .{DDN_ENV}.js 中的配置覆盖
 * 主配置文件而生效。
 * @param opts {cwd: cwd, defaultConfig: config.default.js }
 */
export async function getUserConfig (opts = {}) {
  const { cwd, defaultConfig } = opts
  const absConfigFile = getConfigFile(cwd)

  if (absConfigFile) {
    return await getConfigByConfigFile(absConfigFile, {
      defaultConfig
    })
  } else {
    return {}
  }
}
