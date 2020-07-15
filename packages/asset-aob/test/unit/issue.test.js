import Debug from 'debug'
import { expect } from '@ddn/test-utils'
import Issue from '../../src/issue'

const debug = Debug('debug')

// TODO: 实现更加细粒度的单元测试，必须提供相关方法的mock方法
describe('issue.js', () => {
  it('getBytes should be ok', async () => {
    const issue = new Issue(null, {})
    const getBytes = issue.getBytes
    // const issueTrans = {
    //   type: 64,
    //   asset: {
    //     aobIssue: {
    //       currency: 'DDN.CNY',
    //       amount: '1234'
    //     }
    //   }
    // }
    // const buffer = await getBytes(issueTrans)
    debug('issue', issue)
    expect(getBytes).be.a('Function')
  })
})
