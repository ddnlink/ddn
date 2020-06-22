/**
 * passed
 */
import Debug from 'debug'
import node from '@ddn/node-sdk/lib/test'

import crypto from 'crypto'

const debug = Debug('debug')

const account = node.randomAccount()
const account2 = node.randomAccount()

// 这是 sdk 接口方法，注册受托人
describe('Registering a delegate', () => {
  it('Using invalid username. Should fail', done => {
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
      .end((err, {
        body
      }) => {
        debug('invalid username, open user', body)
        node.expect(err).to.be.not.ok

        account.address = body.account.address
        node.api.put('/transactions')
          .set('Accept', 'application/json')
          .set('version', node.version)
          .set('nethash', node.config.nethash)
          .set('port', node.config.port)
          .send({
            secret: node.Gaccount.password,
            amount: node.Fees.delegateRegistrationFee,
            recipientId: account.address
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            debug('invalid username, transfer ddn to the user', body)
            node.expect(err).to.be.not.ok

            node.onNewBlock(async err => {
              node.expect(err).to.be.not.ok
              const transaction = await node.ddn.delegate.createDelegate(crypto.randomBytes(64).toString('hex'), account.password)
              transaction.fee = node.Fees.delegateRegistrationFee

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
                .end((err, {
                  body
                }) => {
                  debug('invalid username to registration delegate', body)
                  node.expect(err).to.be.not.ok
                  node.expect(body).to.have.property('success').to.be.false
                  done()
                })
            })
          })
      })
  })

  it('When account has no funds. Should fail', async done => {
    const transaction = await node.ddn.delegate.createDelegate(node.randomDelegateName().toLowerCase(), node.randomPassword())
    transaction.fee = node.Fees.delegateRegistrationFee

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
      .end((err, {
        body
      }) => {
        debug('no funds', body)
        node.expect(err).to.be.not.ok
        node.expect(body).to.have.property('success').to.be.false
        done()
      })
  })

  it('When account has funds. Username is uppercase, Lowercase username already registered. Should fail', async done => {
    const transaction = await node.ddn.delegate.createDelegate(account.username.toUpperCase(), account2.password)

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
      .end((err, {
        body
      }) => {
        debug('uppercase username', body)
        node.expect(err).to.be.not.ok
        node.expect(body).to.have.property('success').to.be.false
        done()
      })
  })

  it('When account has funds. Username is lowercase. Should be ok', async done => {
    await node.onNewBlockAsync()

    debug('account.username 1', account.username)
    account.username = node.randomDelegateName().toLowerCase()
    const transaction = await node.ddn.delegate.createDelegate(account.username, account.password)
    debug('account.username 2', account.username)

    node.onNewBlock(err => {
      node.expect(err).to.be.not.ok
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
        .end((err, {
          body
        }) => {
          debug('lowercase username', body)
          node.expect(err).to.be.not.ok
          node.expect(body).to.have.property('success').to.be.true
          done()
        })
    })
  })

  it('Twice within the same block. Should fail', done => {
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
      .end((err, {
        body
      }) => {
        node.expect(err).to.be.not.ok

        account2.address = body.account.address
        // console.log(account2);
        node.api.put('/transactions')
          .set('Accept', 'application/json')
          .set('version', node.version)
          .set('nethash', node.config.nethash)
          .set('port', node.config.port)
          .send({
            secret: node.Gaccount.password,
            amount: node.Fees.delegateRegistrationFee,
            recipientId: account2.address
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            debug('no funds', body)

            node.expect(err).to.be.not.ok

            node.onNewBlock(async err => {
              node.expect(err).to.be.not.ok
              account2.username = node.randomDelegateName().toLowerCase()
              const transaction = await node.ddn.delegate.createDelegate(account2.username, account2.password)

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
                .end(async (err, {
                  body
                }) => {
                  debug('Twice 1', body)
                  node.expect(err).to.be.not.ok

                  node.expect(body).to.have.property('success').to.be.true

                  account2.username = node.randomDelegateName().toLowerCase()
                  const transaction2 = await node.ddn.delegate.createDelegate(account2.username, account2.password)

                  node.peer.post('/transactions')
                    .set('Accept', 'application/json')
                    .set('version', node.version)
                    .set('nethash', node.config.nethash)
                    .set('port', node.config.port)
                    .send({
                      transaction: transaction2
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, {
                      body
                    }) => {
                      debug('Twice 2', body)
                      node.expect(err).to.be.not.ok

                      node.expect(body).to.have.property('success').to.be.false
                      done()
                    })
                })
            })
          })
      })
  })
})
