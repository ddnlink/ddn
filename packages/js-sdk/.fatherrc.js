import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import replace from 'rollup-plugin-replace'

const isElectronStr = process.versions.electron

export default {
  browserFiles: ['index.browser.js'],
  // 这些包从外面引入，对应在 globals 里配置引入的名称
  extraExternals: [
    'memcpy', // bytebuffer-node 包使用的，但是该包已经无法使用
    'shelljs',
    'lodash'
  ],
  esm: 'rollup',
  umd: {
    name: 'DdnJS',
    minFile: true,
    sourcemap: true,
    globals: {
      "lodash": "_",
      "memcpy": "memcpy",
      "shelljs": "shell",
    }
  },

  // father-build 所未默认安装的插件, 将 fs 等 node 端的包打包给前端使用，其实一般不需要，应该排除
  extraRollupPlugins: [
    globals(), // 导致错误
    builtins(),
    replace({
      // process.versions is undefinded
      'process.versions.electron': JSON.stringify(isElectronStr)
    }),
  ],

  // Bug: 该参数不支持
  // onwarn: function (warning) {
  //   if (warning.code === 'THIS_IS_UNDEFINED') {
  //     return;
  //   }
  //   console.error(warning.message);
  // },
  
  // Non-existent export 'default' is imported from ../../node_modules/lodash/lodash.js
  // https://github.com/rollup/rollup-plugin-commonjs/issues/266
  // include: /node_modules/,
  // namedExports: {
  //   "../../node_modules/lodash/lodash.js": LODASH_METHODS_DECLARATION // 无效
  // },
  disableTypeCheck: false
};