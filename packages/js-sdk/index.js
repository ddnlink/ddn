const DdnJS = require('./lib/index').default
// 必须初始化
// DdnJS.init('0ab796cd', 'testnet')
window.DdnJS = DdnJS
module.exports = DdnJS
