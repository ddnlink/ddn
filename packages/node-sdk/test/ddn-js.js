import testUtils, { TestUtil } from '@ddn/test-utils'
import DdnJS, { config, constants } from '../lib'

// Test configuration
const nodeObj = new TestUtil(config, constants)

// const node = Object.assign(testUtils, nodeObj)
const node = testUtils
// console.log('node........', node)

export {
  DdnJS,
  node,
  nodeObj
}
