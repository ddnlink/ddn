import {defineConfig} from 'father'

export default defineConfig({
  extends: '../../.fatherrc.base.js',
  esm: {
    output: 'lib',
  }
})
