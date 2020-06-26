/**
 * passed
 */
import Debug from 'debug'
import node from '@ddn/node-sdk/lib/test'

import crypto from 'crypto'
import DdnUtils from '@ddn/utils'

const debug = Debug('debug')

async function createTransfer (address, amount, secret, secondPassword) {
  return await node.ddn.transaction.createTransaction(address, amount, null, secret, secondPassword)
}

jest.setTimeout(50000)

describe('Test second passphrase', () => {
  let account
  let account2

  beforeAll(() => {
    account = node.randomAccount()
    account2 = node.randomAccount()
  })

  describe('Enabling second passphrase', () => {
    it('When accounts has no funds. Should fail', async done => {
      const transaction = await node.ddn.signature.createSignature(node.randomPassword(), node.randomPassword())
      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          debug('no funds fail', JSON.stringify(body))
          node.expect(body).to.have.property('success').to.be.false
          done()
        })
    })

    it('When accounts has funds. Should be ok.', done => {
      node.api.post('/accounts/open')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          secret: account.password
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          account.address = body.account.address
          debug('account', account)
          node.api.put('/transactions')
            .set('Accept', 'application/json')
            .set('version', node.version)
            .set('nethash', node.config.nethash)
            .set('port', node.config.port)
            .send({
              secret: node.Gaccount.password,

              // Testing 1 delegate registration + 1 transaction sending 1DDN
              amount: DdnUtils.bignum.plus(node.Fees.secondPasswordFee, 10000000000).toString(),
              recipientId: account.address
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end((_err, { body }) => {
              debug('Transfer DDN', JSON.stringify(body))
              node.expect(body).to.have.property('success').to.be.true

              node.onNewBlock(async err => {
                node.expect(err).to.be.not.ok
                const transaction = await node.ddn.signature.createSignature(account.password, account.secondPassword)
                debug('has funds ok', transaction)

                node.peer.post('/transactions')
                  .set('Accept', 'application/json')
                  .set('version', node.version)
                  .set('nethash', node.config.nethash)
                  .set('port', node.config.port)
                  .send({
                    transaction
                  })
                  .expect('Content-Type', /json/)
                  .expect(200)
                  .end((_err, { body }) => {
                    debug('has funds ok', body)
                    node.expect(body).to.have.property('success').to.be.true
                    done()
                  })
              })
            })
        })
    })
  })

  describe('Sending normal transaction with second passphrase now enabled', () => {
    // 确保账户有钱
    beforeAll(async (done) => {
      await node.giveMoneyAndWaitAsync([account.address])

      node.api.post('/accounts/open')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          secret: account2.password
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end(async (_err, { body }) => {
          debug('open account2', JSON.stringify(body))
          account2.address = body.account.address

          await node.giveMoneyAndWaitAsync([account2.address])
          done()
        })
    })

    it("When account doesn't have a second passphrase. Should fail", async done => {
      const transaction = await createTransfer(node.Eaccount.address, 1, node.Gaccount.password, account.secondPassword)
      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          debug("doesn't have a second passphrase fail", JSON.stringify(body))
          node.expect(body).to.have.property('success').to.be.false
          // Sender account does not have a second signature
          done()
        })
    })

    it('Using blank second signature. Should fail', async done => {
      const transaction = await createTransfer(node.Eaccount.address, 1, account.password, '')

      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          debug('blank second signature fail', JSON.stringify(transaction))
          debug('blank second signature fail', JSON.stringify(body))
          node.expect(body).to.have.property('success').to.be.false
          done()
        })
    })

    it('Using fake second signature. Should fail', async done => {
      const transaction = await createTransfer(node.Eaccount.address, 1, account.password, account2.secondPassword)
      transaction.sign_signature = crypto.randomBytes(64).toString('hex')
      transaction.id = await node.ddn.crypto.getId(transaction)
      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          debug('fake second signature fail', JSON.stringify(transaction))
          debug('fake second signature fail', JSON.stringify(body))
          node.expect(body).to.have.property('success').to.be.false
          done()
        })
    })

    it('Using valid second signature. Should be ok', async done => {
      const transaction = await createTransfer(node.Eaccount.address, 1, account.password, account.secondPassword)
      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          debug('valid second signature ok', JSON.stringify(transaction))
          debug('valid second signature ok', JSON.stringify(body))
          node.expect(body).to.have.property('success').to.be.true
          done()
        })
    })
  })
})
