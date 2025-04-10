import utils, { TestUtil } from '@ddn/test-utils'
import DdnJS from '../'

const mainnet_config = {
  port: 8001,
  address: '0.0.0.0',
  nethash: '0ab796cd',
  publicIp: '',
  logLevel: 'debug',
  net: 'testnet',
  clientDriftSeconds: 5
}

// todo: 确认一下，属性函数是否可以这样用
const { config, constants } = DdnJS.setup(mainnet_config)

// console.log('ddn-js config', config)
// console.log('ddn-js constants', constants)

const nodeApi = new TestUtil(config, constants)
const node = {
  ...nodeApi,
  ...utils
}

export {
  DdnJS,
  node,
  config,
  constants
}