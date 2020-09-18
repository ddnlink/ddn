const ddn = require('./config.ddn')

// 默认是输出 ddn-docs
let config = ddn
if (process.env.DDN_ENV === 'docs') {
  config = require('./config.docs')
}

// 暂时为了方便在根目录下测试 node_sdk
if (process.env.DDN_ENV === 'custom') {
  config = require('./config.custom')
}

export default config
