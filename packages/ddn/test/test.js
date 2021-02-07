// import handlebars from 'handlebars'
const fs = require('fs')
const handlebars = require('handlebars')
// const handlebarHelpers = require('handlebars-helpers')
// import handlebarHelpers from 'handlebars-helpers'
// const helpers = handlebarHelpers(['math', 'string', 'number'])
var helpers = require('handlebars-helpers')(['math', 'string', 'number'])

// const content = fs.readFileSync('test.json').toString()
// const delegates = 'abs defg hkg'

// const meta = { category: 3, delegates: [delegates.split(',').map(d => JSON.stringify(d, null, 2))] }
const meta = { value: 'a,b,c' }
const template = handlebars.compile('{{split value}}')
const result = template(meta, helpers)
fs.writeFileSync('test.log', result)

console.log('result: ', result)
