import testUtils, { TestUtil } from '@ddn/test-utils'
import DdnJS, { config, constants } from '../lib'

const nodeObj = new TestUtil(config, constants)
const node = Object.assign(nodeObj, testUtils)

export {
  DdnJS,
  node
}
