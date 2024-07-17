// import builtins from "rollup-plugin-node-builtins";

/**
 * 
 */

// export default {
//   cjs: { type: 'rollup', minify: false },
//   // esm: { type: 'rollup', minify: false },
//   disableTypeCheck: false,

//   // 这些包从外面引入，就不用打包进来了
//   // extraExternals: [
//   //   'memcpy', // bytebuffer-node 包使用的，但是该包已经无法使用
//   //   'shelljs',
//   // ],

//   // father-build 所未默认安装的插件, 将 fs 等 node 端的包打包给前端使用，其实一般不需要，应该排除
//   extraRollupPlugins: [
//     // globals(), // 导致错误
//     // builtins(),
//     // replace({
//     //   // process.versions is undefinded
//     //   'process.versions.electron': JSON.stringify(isElectronStr)
//     // }),
//   ],
// };

export default {
  entry: ['src/index.js'],
  overridesByEntry: {
    'src/index.js': {
      file: 'index',
    }
  },
  target: 'node',
  cjs: { type: 'rollup', minify: false },
  esm: { type: 'rollup', minify: false },
  disableTypeCheck: false,
  extraRollupPlugins: [], 
  extraBabelPlugins: [
    ['@babel/plugin-transform-classes'],
  ],
};
