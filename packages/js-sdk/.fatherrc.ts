import {defineConfig} from 'father'

export default defineConfig({
  extends: '../../.fatherrc.base.js',

  define: {
    'process.env.DDN_NAME': JSON.stringify(process.env.DDN_NAME),
  },
  cjs: {
    output: 'dist',
  },
  esm: {
    output: 'build',
  },
})