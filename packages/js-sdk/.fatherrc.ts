import {defineConfig} from 'father'

export default defineConfig({
  extends: '../../.fatherrc.base.js',
  // esm: {
  //   input: 'src', // 默认编译目录
  //   platform: 'browser', // 默认构建为 Browser 环境的产物
  //   transformer: 'babel', // 默认使用 babel 以提供更好的兼容性
  //   output: 'lib',
  //   // testEnvironment: 'jsdom'
  // }
  define: {
    'process.env.DDN_NAME': JSON.stringify(process.env.DDN_NAME),
  },
  cjs: undefined,
  esm: {
    output: 'dist',
  },
})