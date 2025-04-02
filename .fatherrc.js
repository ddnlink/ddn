import {readdirSync} from 'fs'
import {join} from 'path'

const headPkgs = ['utils', 'core', 'crypto']
const tailPkgs = ['peer', 'test-utils', 'node-sdk', 'js-sdk']
// 开源插件包
const otherPkgs = readdirSync(join(__dirname, 'packages')).filter(
  pkg => pkg.charAt(0) !== '.' && !headPkgs.includes(pkg) && !tailPkgs.includes(pkg)
)
// 企业插件包
const proPkgs = readdirSync(join(__dirname, 'pro-packages')).filter(
  pkg => pkg.charAt(0) !== '.' && !headPkgs.includes(pkg) && !tailPkgs.includes(pkg)
)

export default {
  target: 'node',
  cjs: {type: 'babel', lazy: false, minify: true},
  disableTypeCheck: false,
  pkgs: [...headPkgs, ...otherPkgs, ...proPkgs, ...tailPkgs],
  doc: {
    themeConfig: {mode: 'light'},
    base: '/docs'
  },
  extraBabelPlugins: [['@babel/plugin-transform-classes']]
}
