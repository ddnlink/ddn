import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'

export default {
  target: 'node',
  esm: 'rollup',
  // 涉及到大量 os，fs等node层面的用法，应该排除
  extraRollupPlugins: [
    globals(), // 导致错误
    builtins()
  ]
  // extraExternals: [
  //   'shelljs',
  // ],
}
