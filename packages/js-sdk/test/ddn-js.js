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
const { config, constants } = DdnJS

// 覆盖测试网络的peer地址
config.address = "127.0.0.1"
config.port = "8001"

// console.log('ddn-js config', config)
// console.log('ddn-js constants', constants)

const nodeApi = new TestUtil(config, constants)
const node = {
  ...nodeApi,
  ...utils
}

// 准备一个有 Token 的主网账号，测试账号 node.Gaccount 是测试网络的，其他网络的 balance = 0
node.Gaccount = {
  balance: '40000000',
  address: 'DJvMzCWmA6foqJB9bXDLgXoyThnuDtRGdX',
  password: 'toddler chunk vicious swarm finish liar flat method cry timber wealth fiction'
}

export {
  DdnJS,
  node,
  config,
  constants
}
