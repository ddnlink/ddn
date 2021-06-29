import crypto from 'crypto'
import ed25519 from 'ed25519'
import Tester from '@ddn/test-utils'
import * as DdnCrypto from '../lib'

import Debug from 'debug'
import { Buffer } from 'buffer'

const debug = Debug('debug')
const expect = Tester.expect

describe('ED25519', () => {
  it('Length is 32', () => {
    const aliceSeed = crypto.randomBytes(32)
    const kp = ed25519.MakeKeypair(aliceSeed)

    const message = 'Hi Bob, How are your pet monkeys doing? What were their names again? -Alice'
    const signature = ed25519.Sign(Buffer.from(message, 'utf8'), kp)
    const signature2 = ed25519.Sign(Buffer.from(message, 'utf8'), kp.privateKey)
    const signature3 = ed25519.Sign(Buffer.from(message, 'utf8'), aliceSeed)

    // expect(kp.privateKey.length).be.equal(nacl.secretbox.keyLength)
    expect(ed25519.Verify(Buffer.from(message, 'utf8'), signature, kp.publicKey)).be.true
    expect(ed25519.Verify(Buffer.from(message, 'utf8'), signature2, kp.publicKey)).be.true
    expect(ed25519.Verify(Buffer.from(message, 'utf8'), signature3, kp.publicKey)).be.true
  })

  it('#createHash should be ok, and return a Buffer, Uint8Array too.', done => {
    const buf = Buffer.from('test') // 转化一下
    const hash1 = DdnCrypto.createHash(buf)

    debug(hash1)
    expect(hash1 instanceof Buffer).be.true
    expect(hash1 instanceof Uint8Array).be.true
    done()
  })
})
