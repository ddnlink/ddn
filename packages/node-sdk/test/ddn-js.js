import utils, { TestUtil } from '@ddn/test-utils'
import DdnJS from '../'

const { config, constants } = DdnJS
const nodeApi = new TestUtil(config, constants)
const node = Object.assign(nodeApi, utils)

export {
  DdnJS,
  node
}
