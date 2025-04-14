import utils, { TestUtil } from '@ddn/test-utils'
import DdnJS from '../'

const mainnet_config = {
  port: 8001,
  address: '0.0.0.0',
  // net: 'testnet',
  // nethash: '0ab796cd',
  net: 'mainnet',
  nethash: 'm66gcvle',
  publicIp: '',
  logLevel: 'debug',
  clientDriftSeconds: 5
}

// todo: 确认一下，属性函数是否可以这样用
const { config, constants } = DdnJS.init(mainnet_config)

console.log('ddn-js config', config)
console.log('ddn-js constants', constants)

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