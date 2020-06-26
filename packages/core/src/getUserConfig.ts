import { join, extname } from 'path'
import { existsSync } from 'fs'
import assert from 'assert'
import extend from 'extend2'
import winPath from './winPath'
import { IConfig } from 'umi-types'

interface IOpts {
    cwd?: string;
    defaultConfig?: IConfig;
    onError?: Function;
}

export function getConfigFile (cwd) {
  const files = process.env.DDN_CONFIG_FILE
    ? process.env.DDN_CONFIG_FILE.split(',').filter(v => v && v.trim())
    : [
      '.ddnrc.ts',
      '.ddnrc.js',
      'config/config.json',
      'config/config.ts',
      'config/config.js'
    ]

  const validFiles = files.filter(f => existsSync(join(cwd, f)))

  assert(
    validFiles.length <= 1,
        `Multiple config files (${validFiles.join(
            ', '
        )}) were detected, please keep only one.`
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

export function requireFile (f, opts: IOpts = {}) {
  if (!existsSync(f)) {
    return {}
  }

  const { onError = defaultOnError } = opts
  let ret: any = {}
  try {
        ret = require(f) || {}; // eslint-disable-line
  } catch (e) {
    onError(e, f)
  }
  // support esm + babel transform
  return ret.default || ret
}

export function mergeConfigs (...configs): IConfig {
  return extend(true, ...configs)
}

export function getConfigByConfigFile (configFile, opts: IOpts = {}): IConfig {
  const ddnEnv = process.env.DDN_ENV
  const isDev = process.env.NODE_ENV === 'development'
  const { defaultConfig, onError } = opts

  const requireOpts = { onError }

  /**
     * development: config.local.* and config.testnet.*;
     * other: mainnet
     */
  const configs = [
    defaultConfig,
    requireFile(configFile, requireOpts),
    ddnEnv && requireFile(addAffix(configFile, ddnEnv), requireOpts),
    isDev && requireFile(addAffix(configFile, 'testnet'), requireOpts),
    isDev && requireFile(addAffix(configFile, 'local'), requireOpts),
    !isDev && requireFile(addAffix(configFile, 'mainnet'), requireOpts)
  ]

  return mergeConfigs(...configs)
}

// Use DDN_ENV to add yoursef config, e.g: DDN_ENV=prod config.prod.js
export function getConfigPaths (cwd): string[] {
  const env = process.env.DDN_ENV
  return [
    join(cwd, 'config/'),
    join(cwd, '.ddnrc.js'),
    join(cwd, '.ddnrc.ts'),
    join(cwd, '.ddnrc.local.js'),
    join(cwd, '.ddnrc.local.ts'),
    ...(env
      ? [join(cwd, `.ddnrc.${env}.js`), join(cwd, `.ddnrc.${env}.ts`)]
      : [])
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
export default function (opts: IOpts = {}): IConfig {
  const { cwd, defaultConfig } = opts
  const absConfigFile = getConfigFile(cwd)

  if (absConfigFile) {
    return getConfigByConfigFile(absConfigFile, {
      defaultConfig
    })
  } else {
    return {}
  }
}
