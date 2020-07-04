/**
 * passed
 */
import crypto from 'crypto'
import path from 'path'
import Debug from 'debug'
import DdnUtils from '@ddn/utils'
import Tester from '@ddn/test-utils'
import DdnJS from '../ddn-js'

import {
  requireFile
} from '@ddn/core/lib/getUserConfig'

const debug = Debug('debug')

const message = 'test'

// Node configuration
const genesisblockFile = path.resolve(process.cwd(), './examples/fun-tests/config/genesisBlock.json')
const genesisblock = requireFile(genesisblockFile)

describe('POST /peer/transactions', () => {
  it('Using valid transaction with wrong nethash in headers. Should fail', async done => {
    const transaction = await DdnJS.transaction.createTransaction(Tester.Daccount.address, 1, message, Tester.Gaccount.password)

    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', 'wrongnet')
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug(JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.false
        Tester.expect(body.expected).to.equal(Tester.config.nethash)
        done()
      })
  })

  it('Using same valid transaction with correct nethash in headers. Should be ok', async done => {
    const transaction = await DdnJS.transaction.createTransaction(Tester.Daccount.address, 1, message, Tester.Gaccount.password)

    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        console.log('correct nethash', JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.true
        done()
      })
  })

  it('Using transaction with undefined recipientId. Should fail', async done => {
    const transaction = await DdnJS.transaction.createTransaction(undefined, 1, message, Tester.Gaccount.password)
    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug('undefined recipientId', JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.false
        Tester.expect(body).to.have.property('error').to.contain('Invalid recipient')
        done()
      })
  })

  it('Using transaction with negative amount. Should fail', async done => {
    const transaction = await DdnJS.transaction.createTransaction(Tester.Daccount.address, -1, message, Tester.Gaccount.password)
    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug('negative amount', JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.false
        Tester.expect(body).to.have.property('error').to.contain('Invalid transaction amount')
        done()
      })
  })

  it('Using invalid passphrase. Should fail', async done => {
    const transaction = await DdnJS.transaction.createTransaction(Tester.Daccount.address, 1, message, '')
    transaction.recipientId = Tester.Daccount.address
    transaction.id = await DdnJS.crypto.getId(transaction) // 这里提供是不对的
    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug('invalid passphrase', JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.false
        Tester.expect(body).to.have.property('error')
        done()
      })
  })

  it('When sender has no funds. Should fail', async done => {
    const transaction = await DdnJS.transaction.createTransaction(Tester.Daccount.address, 1, message, 'randomstring')
    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug(JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.false
        Tester.expect(body).to.have.property('error').to.contain('Insufficient balance')
        done()
      })
  })

  it('Usin fake signature. Should fail', async done => {
    const transaction = await DdnJS.transaction.createTransaction(Tester.Daccount.address, 1, message, Tester.Gaccount.password)
    transaction.signature = crypto.randomBytes(64).toString('hex')
    transaction.id = await DdnJS.crypto.getId(transaction)
    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug(JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.false
        Tester.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using invalid signature. Should fail', async done => {
    const transaction = await DdnJS.transaction.createTransaction(Tester.Daccount.address, 1, message, Tester.Gaccount.password)
    transaction.signature = Tester.randomPassword()
    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug('invalid signature', JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.false
        Tester.expect(body).to.have.property('error').to.include('should match format "signature"')
        done()
      })
  })

  it('Using invalid publicKey. Should fail', async done => {
    const transaction = await DdnJS.transaction.createTransaction(Tester.Daccount.address, 1, message, Tester.Gaccount.password)
    transaction.senderPublicKey = Tester.randomPassword()
    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug('invalid publicKey', JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.false
        Tester.expect(body).to.have.property('error').to.include('should match format "publicKey"')
        done()
      })
  })

  it('Using very larger than totalAmount and genesis block id. Should fail', async done => {
    const largeAmount = DdnUtils.bignum.plus(Tester.constants.totalAmount, 1)
    const transaction = await DdnJS.transaction.createTransaction(Tester.Daccount.address, largeAmount, message, Tester.Gaccount.password)
    transaction.block_id = genesisblock.id

    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug('large amount', JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.false
        done()
      })
  })

  it('Using overflown amount. Should fail', async done => {
    const transaction = await DdnJS.transaction.createTransaction(Tester.Daccount.address, 184819291270000000012910218291201281920128129, message, Tester.Gaccount.password)
    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug(JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.false
        Tester.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using float amount. Should fail', async done => {
    const transaction = await DdnJS.transaction.createTransaction(Tester.Daccount.address, 1.3, message, Tester.Gaccount.password)
    Tester.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug(JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.false
        Tester.expect(body).to.have.property('error')
        done()
      })
  })
})
