import DdnJS from '../ddn.min.js'
// const DdnJS = require('../build.js')

describe('DdnJS', () => {
  it('ok', () => {
    console.log(DdnJS)
    expect(typeof DdnJS).toBe('object')
  })
})
