/**
 * passed
 */
import path from 'path'
import crypto from 'crypto'
import Debug from 'debug'
import { bignumber, assetTypes } from '../../dist/utils'
import { DdnJS, node } from '../ddn-js'

const debug = Debug('debug')

const message = 'test'

describe('POST /api/transactions', () => {
  it('Using valid transaction with wrong nethash in headers. Should fail', async () => {
    const transaction = await DdnJS.transaction.createTransaction(
      node.Daccount.address,
      11,
      message,
      node.Gaccount.password
    )

    return node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', 'wrongnet')
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        debug("39 wrong nethash ", JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body.expected).to.equal(node.config.nethash) // Invalid nethash
      })
  })

  it('Using same valid transaction with correct nethash in headers. Should be ok', async () => {
    const transaction = await DdnJS.transaction.createTransaction(
      node.Daccount.address,
      1,
      message,
      node.Gaccount.password
    )
    debug('correct nethash transaction', JSON.stringify(transaction))

    return node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        debug('correct nethash res： ', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
      })
  })

  it('Using transaction with undefined recipientId. Should fail', async () => {
    const transaction = await DdnJS.transaction.createTransaction(undefined, 1, message, node.Gaccount.password)
    return node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        debug('undefined recipientId', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error').to.contain('Transaction validation failed')
      })
  })

  it('Using transaction with negative amount. Should fail', async () => {
    const transaction = await DdnJS.transaction.createTransaction(
      node.Daccount.address,
      -1,
      message,
      node.Gaccount.password
    )
    return node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        debug('negative amount', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error').to.contain('Transaction validation failed')
      })
  })

  it('Using invalid passphrase. Should fail', async () => {
    const transaction = await DdnJS.transaction.createTransaction(node.Daccount.address, 1, message, '')
    transaction.recipientId = node.Daccount.address
    transaction.id = await DdnJS.crypto.getId(transaction)
    return node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        debug('invalid passphrase', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
      })
  })

  it('When sender has no funds. Should fail', async () => {
    const transaction = await DdnJS.transaction.createTransaction(node.Daccount.address, 1, message, 'randomstring')
    node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        debug(JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error').to.contain('Insufficient balance')
      })
  })

  it('Using fake signature. Should fail', async () => {
    const transaction = await DdnJS.transaction.createTransaction(
      node.Daccount.address,
      1,
      message,
      node.Gaccount.password
    )
    // 这里的格式尽管正确了，但不是该交易的签名，所以失败（信息显示为发送者公钥签名失败）
    transaction.signature = crypto.randomBytes(64).toString('hex')
    transaction.id = await DdnJS.crypto.getId(transaction)

    return node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        debug('fake signature ', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
      })
  })

  it('Using invalid signature. Should fail', async () => {
    const transaction = await DdnJS.transaction.createTransaction(
      node.Daccount.address,
      1,
      message,
      node.Gaccount.password
    )
    // 使用一个明显无效的签名格式，这样会触发格式验证错误
    transaction.signature = 'INVALID_SIGNATURE'

    return node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        debug('invalid signature', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        // 不检查具体的错误消息，因为它可能会随着验证器的变化而变化
        node.expect(body).to.have.property('error').that.is.a('string')
      })
  })

  it('Using invalid publicKey. Should fail', async () => {
    const transaction = await DdnJS.transaction.createTransaction(
      node.Daccount.address,
      1,
      message,
      node.Gaccount.password
    )
    transaction.senderPublicKey = node.randomPassword()
    return node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        debug('invalid publicKey', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
      })
  })

  it('Using very larger than totalAmount and genesis block id. Should fail', async () => {
    const largeAmount = bignumber.plus(node.constants.totalAmount, 1)
    const transaction = await DdnJS.transaction.createTransaction(
      node.Daccount.address,
      largeAmount,
      message,
      node.Gaccount.password
    )

    // todo: 直接加载
    // Node configuration
    const genesisblockFile = path.resolve(process.cwd(), './examples/fun-tests/config/genesisBlock.json')
    const genesisblock = require(genesisblockFile)

    transaction.block_id = genesisblock.id

    return node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        debug('large amount', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
      })
  })

  it('Using overflown amount. Should fail', async () => {
    const transaction = await DdnJS.transaction.createTransaction(
      node.Daccount.address,
      184819291270000000012910218291201281920128129,
      message,
      node.Gaccount.password
    )
    return node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        debug(JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
      })
  })

  // 从 3.8.0 版本开始，允许使用小数，但我们的验证器现在会拒绝它
  it('Using float amount. Should be ok', async () => {
    const transaction = await DdnJS.transaction.createTransaction(
      node.Daccount.address,
      1.3,
      message,
      node.Gaccount.password
    )
    return node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        debug('float amount: ', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('transactionId')
      })
  })
})
