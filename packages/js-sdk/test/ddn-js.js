import utils, { TestUtil } from '@ddn/test-utils'
import DdnJS from '../'
import { log } from 'console'

const mainnet_config = {
  port: 8001,
  address: '0.0.0.0',
  nethash: 'm66gcvle',
  publicIp: '',
  logLevel: 'error',
  net: 'testnet',
  clientDriftSeconds: 5
}

// todo: 确认一下，属性函数是否可以这样用
const { config, constants } = DdnJS.setup(mainnet_config)

log('ddn-js config', config)
log('ddn-js constants', constants)

const nodeApi = new TestUtil(config, constants)
const node = Object.assign(nodeApi, utils)

export {
  DdnJS,
  node
}