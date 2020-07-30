import testUtils, { TestUtil } from '@ddn/test-utils'
import DdnJS from '../lib'
const { config, constants } = DdnJS
const nodeObj = new TestUtil(config, constants)

const node = Object.assign(nodeObj, testUtils)

export {
  DdnJS,
  node
}
