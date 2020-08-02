import utils, { TestUtil } from '@ddn/test-utils'
import config from './fixtures/config'
import constants from './fixtures/constants'
constants.net = constants[config.net]

const nodeApi = new TestUtil(config, constants)

const node = Object.assign(nodeApi, utils)

export {
  node
}
