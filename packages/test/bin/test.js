#!/usr/bin/env node

import yParser from 'yargs-parser'
import ddnTest from '../src/index.js'

const args = yParser(process.argv.slice(2), {
  alias: {
    watch: ['w'],
    version: ['v']
  }
})

if (args.version) {
  import('../package.json').then(pkg => {
    console.log(pkg.version)
    process.exit(0)
  })
}

console.log('ddnTest', ddnTest)

ddnTest(args).catch(e => {
  console.error(e)
  process.exit(1)
})

// require('../dist')
//   .default({
//     ...args
//   })
//   .catch(e => {
//     console.error(e)
//     process.exit(1)
//   })
