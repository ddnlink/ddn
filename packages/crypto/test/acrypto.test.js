import Debug from 'debug'

import * as crypto from '../src'
// import { getId } from '../src'

const debug = Debug('crypto')

describe('crypto', () => {
  it('export is right', done => {
    debug('crypto', crypto)

    // expect(getId === crypto.getId).toBeTrue()
    expect(crypto).to.have.property('getId')

    done()
  })
})
