import { winPath } from 'umi-utils'
import { join } from 'path'
import { writeFileSync } from 'fs'
import rimraf from 'rimraf'
import slash2 from 'slash2'
import getUserConfig, {
  requireFile,
  getConfigFile,
  mergeConfigs,
  addAffix,
  getConfigPaths,
  cleanConfigRequireCache
} from '../lib/getUserConfig'

const fixtures = winPath(`${__dirname}/fixtures/getUserConfig`)

function stripPrefix (file) {
  return file.replace(`${fixtures}/`, '')
}

describe('getUserConfig', () => {
  test('addAffix', () => {
    expect(addAffix('/a/b.js', 'foo')).toEqual('/a/b.foo.js')
  })

  describe('getConfigFile', () => {
    test('.ddnrc.js', () => {
      expect(stripPrefix(getConfigFile(`${fixtures}/ddnrc`))).toEqual('ddnrc/.ddnrc.js')
    })

    test('config/config.json', () => {
      expect(stripPrefix(getConfigFile(`${fixtures}/config-configjson`))).toEqual(
        'config-configjson/config/config.json'
      )
    })

    test('config/config.js', () => {
      expect(stripPrefix(getConfigFile(`${fixtures}/config-directory`))).toEqual(
        'config-directory/config/config.js'
      )
    })

    test('conflicts', () => {
      expect(() => {
        getConfigFile(`${fixtures}/conflicts`)
      }).toThrow(/Multiple config files/)
    })
  })

  describe('mergeConfigs', () => {
    test('shallow', () => {
      expect(mergeConfigs({ foo: 1 }, { bar: 1 }, undefined, { bar: 2 })).toEqual({
        foo: 1,
        bar: 2
      })
    })

    test('deep', () => {
      expect(mergeConfigs({ foo: { bar: 1, haa: 1 } }, { foo: { bar: 2, yaa: 1 } })).toEqual({
        foo: {
          bar: 2,
          haa: 1,
          yaa: 1
        }
      })
    })
  })
})

test('config with empty directory', () => {
  const config = getUserConfig({
    cwd: join(fixtures, 'normal')
  })
  expect(config).toEqual({})
})

test('config with .ddnrc.js', () => {
  const config = getUserConfig({
    cwd: join(fixtures, 'config-ddnrc')
  })
  expect(config).toEqual({
    history: 'hash'
  })
})

test('config with mergeConfigs .ddnrc.local.js', () => {
  process.env.NODE_ENV = 'development'

  const config = getUserConfig({
    cwd: join(fixtures, 'config-ddnrc')
  })

  expect(config).toEqual({
    history: 'testnet',
    story: 'yes'
  })

  process.env.NODE_ENV = ''
})

test('config with mergeConfigs .ddnrc.prod.js', () => {
  process.env.DDN_ENV = 'prod'

  const config = getUserConfig({
    cwd: join(fixtures, 'config-ddnrc')
  })
  expect(config).toEqual({
    history: 'prod',
    story: 'ok'
  })

  process.env.DDN_ENV = ''
})

test('config with mergeConfigs config/config.local.json and config.jsons', () => {
  process.env.NODE_ENV = 'development'

  const config = getUserConfig({
    cwd: join(fixtures, 'config-configjson')
  })
  expect(config).toEqual({
    port: 7000,
    address: '127.0.0.1',
    publicIp: '',
    logLevel: 'info',
    net: 'testnet',
    nethash: '3ab796cd',
    api: {
      access: {
        whiteList: []
      }
    }
  })

  process.env.NODE_ENV = ''
})

test('config with DDN_CONFIG_FILE env', () => {
  process.env.DDN_CONFIG_FILE = 'foo.js'
  const config = getUserConfig({
    cwd: join(fixtures, 'config-DDN_CONFIG_FILE')
  })
  expect(config).toEqual({
    history: 'hash'
  })
  process.env.DDN_CONFIG_FILE = ''
})

test('getConfigPaths', () => {
  function winPathFiles (files) {
    return files.map(f => slash2(f))
  }
  process.env.DDN_ENV = ''
  expect(winPathFiles(getConfigPaths('foo'))).toEqual([
    'foo/config/',
    'foo/.ddnrc.js',
    'foo/.ddnrc.ts',
    'foo/.ddnrc.local.js',
    'foo/.ddnrc.local.ts'
  ])
  process.env.DDN_ENV = 'cloud'
  expect(winPathFiles(getConfigPaths('foo'))).toEqual([
    'foo/config/',
    'foo/.ddnrc.js',
    'foo/.ddnrc.ts',
    'foo/.ddnrc.local.js',
    'foo/.ddnrc.local.ts',
    'foo/.ddnrc.cloud.js',
    'foo/.ddnrc.cloud.ts'
  ])
  process.env.DDN_ENV = ''
})

test('requireFile', () => {
  expect(requireFile('/file/not/exists')).toEqual({})
})

test('requireFile from config.json', () => {
  expect(requireFile(join(fixtures, 'requireFile', 'config.json'))).toEqual({
    a: 1,
    b: 2
  })
})

test('requireFile with syntax error', () => {
  let error
  requireFile(join(fixtures, 'requireFile', 'syntaxError.js'), {
    onError (e) {
      error = e
    }
  })
  expect(error.message).toEqual('a is not defined')
})

// Why xtest this: require.cache in jest in always empty ([])
xtest('cleanConfigRequireCache', () => {
  const cwd = join(fixtures, 'cleanConfigRequireCache')
  const configPath = join(cwd, '.ddnrc.js')
  writeFileSync(configPath, 'export default { foo: \'bar\' };', 'utf-8')
  expect(
    getUserConfig({
      cwd
    })
  ).toEqual({ foo: 'bar' })
  cleanConfigRequireCache(cwd)
  writeFileSync(configPath, 'export default { bar: \'foo\' };', 'utf-8')
  expect(
    getUserConfig({
      cwd
    })
  ).toEqual({ bar: 'foo' })
  rimraf.sync(configPath)
})
