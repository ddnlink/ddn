import builtins from "rollup-plugin-node-builtins";

/**
 * Non-existent export 'default' is imported from ../../node_modules/lodash/lodash.js
 * 请安装使用 lodash-es 模块，因为 lodash 默认是 cjs 的
 * 参考：https://stackoverflow.com/questions/51846889/rollup-import-of-non-existent-export-when-importing-function-from-lodash
 * 
 * 其他有用插件，必须时可以使用
 * import globals from 'rollup-plugin-node-globals'
 * import replace from 'rollup-plugin-replace'
 */

export default {
  // target: "browser",
  // cjs: { type: "rollup", lazy: false },
  esm: { type: "rollup" },
  disableTypeCheck: false,

  // 这些包从外面引入，就不用打包进来了
  // extraExternals: [
  //   'memcpy', // bytebuffer-node 包使用的，但是该包已经无法使用
  //   'shelljs',
  // ],

  // father-build 所未默认安装的插件, 将 fs 等 node 端的包打包给前端使用，其实一般不需要，应该排除
  extraRollupPlugins: [
    // globals(), // 导致错误
    builtins(),
    // replace({
    //   // process.versions is undefinded
    //   'process.versions.electron': JSON.stringify(isElectronStr)
    // }),
  ],

  // 下面的问题未解决
  // The 'this' keyword is equivalent to 'undefined' at the top level of an ES module, and has been rewritten
  // https://github.com/rollup/rollup/issues/794
  // onwarn: function(warning) {
  //   // Skip certain warnings

  //   // should intercept ... but doesn't in some rollup versions
  //   if (warning.code === "THIS_IS_UNDEFINED") {
  //     return;
  //   }

  //   // console.warn everything else
  //   console.error(warning.message);
  // },
};
