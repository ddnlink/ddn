import { winPath } from 'umi-utils';
import { join } from 'path';
import { writeFileSync } from 'fs';
import rimraf from 'rimraf';
import slash2 from 'slash2';
import getUserConfig, {
  requireFile,
  getConfigFile,
  mergeConfigs,
  addAffix,
  getConfigPaths,
  cleanConfigRequireCache,
} from '../src/getUserConfig';

const fixtures = winPath(`${__dirname}/fixtures/getUserConfig`);

function stripPrefix(file) {
  return file.replace(`${fixtures}/`, '');
}

describe('getUserConfig', () => {
  it('addAffix', () => {
    expect(addAffix('/a/b.js', 'foo')).toEqual('/a/b.foo.js');
  });

  describe('getConfigFile', () => {
    it('.ddnrc.js', () => {
      expect(stripPrefix(getConfigFile(`${fixtures}/ddnrc`))).toEqual('ddnrc/.ddnrc.js');
    });

    it('config/config.js', () => {
      expect(stripPrefix(getConfigFile(`${fixtures}/config-directory`))).toEqual(
        'config-directory/config/config.js',
      );
    });

    it('conflicts', () => {
      expect(() => {
        getConfigFile(`${fixtures}/conflicts`);
      }).toThrow(/Multiple config files/);
    });
  });

  describe('mergeConfigs', () => {
    it('shallow', () => {
      expect(mergeConfigs({ foo: 1 }, { bar: 1 }, undefined, { bar: 2 })).toEqual({
        foo: 1,
        bar: 2,
      });
    });

    it('deep', () => {
      expect(mergeConfigs({ foo: { bar: 1, haa: 1 } }, { foo: { bar: 2, yaa: 1 } })).toEqual({
        foo: {
          bar: 2,
          haa: 1,
          yaa: 1,
        },
      });
    });
  });
});

test('config with empty directory', () => {
  const config = getUserConfig({
    cwd: join(fixtures, 'normal'),
  });
  expect(config).toEqual({});
});

test('config with .ddnrc.js', () => {
  const config = getUserConfig({
    cwd: join(fixtures, 'config-ddnrc'),
  });
  expect(config).toEqual({
    history: 'hash',
  });
});

test('config with DDN_CONFIG_FILE env', () => {
  process.env.DDN_CONFIG_FILE = 'foo.js';
  const config = getUserConfig({
    cwd: join(fixtures, 'config-DDN_CONFIG_FILE'),
  });
  expect(config).toEqual({
    history: 'hash',
  });
  process.env.DDN_CONFIG_FILE = '';
});

test('getConfigPaths', () => {
  function winPathFiles(files) {
    return files.map(f => slash2(f));
  }
  expect(winPathFiles(getConfigPaths('foo'))).toEqual([
    'foo/config/',
    'foo/.ddnrc.js',
    'foo/.ddnrc.ts',
    'foo/.ddnrc.local.js',
    'foo/.ddnrc.local.ts',
  ]);
  process.env.DDN_ENV = 'cloud';
  expect(winPathFiles(getConfigPaths('foo'))).toEqual([
    'foo/config/',
    'foo/.ddnrc.js',
    'foo/.ddnrc.ts',
    'foo/.ddnrc.local.js',
    'foo/.ddnrc.local.ts',
    'foo/.ddnrc.cloud.js',
    'foo/.ddnrc.cloud.ts',
  ]);
  process.env.DDN_ENV = '';
});

test('requireFile', () => {
  expect(requireFile('/file/not/exists')).toEqual({});
});

test('requireFile with syntax error', () => {
  let error;
  requireFile(join(fixtures, 'requireFile', 'syntaxError.js'), {
    onError(e) {
      error = e;
    },
  });
  expect(error.message).toEqual('a is not defined');
});

// Why xtest this: require.cache in jest in always empty ([])
xtest('cleanConfigRequireCache', () => {
  const cwd = join(fixtures, 'cleanConfigRequireCache');
  const configPath = join(cwd, '.ddnrc.js');
  writeFileSync(configPath, `export default { foo: 'bar' };`, 'utf-8');
  expect(
    getUserConfig({
      cwd,
    }),
  ).toEqual({ foo: 'bar' });
  cleanConfigRequireCache(cwd);
  writeFileSync(configPath, `export default { bar: 'foo' };`, 'utf-8');
  expect(
    getUserConfig({
      cwd,
    }),
  ).toEqual({ bar: 'foo' });
  rimraf.sync(configPath);
});
