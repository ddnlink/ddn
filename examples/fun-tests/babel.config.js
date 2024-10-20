module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
  // 在项目根目录下查找 .babelrc 或 babel.config.js 文件，如果没有就创建一个（两者其一即可），配置如下：

  // 解决 The code generator has deoptimised the styling of xxxx.js as it exceeds the max of 500kb
  compact: false
}
