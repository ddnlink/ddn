import {defineConfig} from 'father'

export default defineConfig({
  extends: '../../.fatherrc.base.js',
  // 增加 esm 配置，用于构建 ESM 格式的包
  // esm: {
  //   output: 'lib',
  // }
})
