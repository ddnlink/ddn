/**
 * passed
 */
import Debug from 'debug'
import crypto from 'crypto'
import Tester from '@ddn/test-utils'
import DdnJS from '../ddn-js'

const debug = Debug('debug')

const account = Tester.randomAccount()
const account2 = Tester.randomAccount()

// 这是 sdk 接口方法，注册受托人
describe('Registering a delegate', () => {
  it('Using invalid username. Should fail', done => {
    Tester.api.post('/accounts/open')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        secret: account.password
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, {
        body
      }) => {
        debug('invalid username, open user', body)
        Tester.expect(err).to.be.not.ok

        account.address = body.account.address
        Tester.api.put('/transactions')
          .set('Accept', 'application/json')
          .set('version', Tester.version)
          .set('nethash', Tester.config.nethash)
          .set('port', Tester.config.port)
          .send({
            secret: Tester.Gaccount.password,
            amount: Tester.Fees.delegateRegistrationFee,
            recipientId: account.address
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            debug('invalid username, transfer ddn to the user', body)
            Tester.expect(err).to.be.not.ok

            Tester.onNewBlock(async err => {
              Tester.expect(err).to.be.not.ok
              const transaction = await DdnJS.delegate.createDelegate(crypto.randomBytes(64).toString('hex'), account.password)
              transaction.fee = Tester.Fees.delegateRegistrationFee

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
                .end((err, {
                  body
                }) => {
                  debug('invalid username to registration delegate', body)
                  Tester.expect(err).to.be.not.ok
                  Tester.expect(body).to.have.property('success').to.be.false
                  done()
                })
            })
          })
      })
  })

  it('When account has no funds. Should fail', async done => {
    const transaction = await DdnJS.delegate.createDelegate(Tester.randomDelegateName().toLowerCase(), Tester.randomPassword())
    transaction.fee = Tester.Fees.delegateRegistrationFee

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
      .end((err, {
        body
      }) => {
        debug('no funds', body)
        Tester.expect(err).to.be.not.ok
        Tester.expect(body).to.have.property('success').to.be.false
        done()
      })
  })

  it('When account has funds. Username is uppercase, Lowercase username already registered. Should fail', async done => {
    const transaction = await DdnJS.delegate.createDelegate(account.username.toUpperCase(), account2.password)

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
      .end((err, {
        body
      }) => {
        debug('uppercase username', body)
        Tester.expect(err).to.be.not.ok
        Tester.expect(body).to.have.property('success').to.be.false
        done()
      })
  })

  it('When account has funds. Username is lowercase. Should be ok', async done => {
    await Tester.onNewBlockAsync()

    debug('account.username 1', account.username)
    account.username = Tester.randomDelegateName().toLowerCase()
    const transaction = await DdnJS.delegate.createDelegate(account.username, account.password)
    debug('account.username 2', account.username)

    Tester.onNewBlock(err => {
      Tester.expect(err).to.be.not.ok
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
        .end((err, {
          body
        }) => {
          debug('lowercase username', body)
          Tester.expect(err).to.be.not.ok
          Tester.expect(body).to.have.property('success').to.be.true
          done()
        })
    })
  })

  it('Twice within the same block. Should fail', done => {
    Tester.api.post('/accounts/open')
      .set('Accept', 'application/json')
      .set('version', Tester.version)
      .set('nethash', Tester.config.nethash)
      .set('port', Tester.config.port)
      .send({
        secret: account2.password
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, {
        body
      }) => {
        Tester.expect(err).to.be.not.ok

        account2.address = body.account.address
        // console.log(account2);
        Tester.api.put('/transactions')
          .set('Accept', 'application/json')
          .set('version', Tester.version)
          .set('nethash', Tester.config.nethash)
          .set('port', Tester.config.port)
          .send({
            secret: Tester.Gaccount.password,
            amount: Tester.Fees.delegateRegistrationFee,
            recipientId: account2.address
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            debug('no funds', body)

            Tester.expect(err).to.be.not.ok

            Tester.onNewBlock(async err => {
              Tester.expect(err).to.be.not.ok
              account2.username = Tester.randomDelegateName().toLowerCase()
              const transaction = await DdnJS.delegate.createDelegate(account2.username, account2.password)

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
                .end(async (err, {
                  body
                }) => {
                  debug('Twice 1', body)
                  Tester.expect(err).to.be.not.ok

                  Tester.expect(body).to.have.property('success').to.be.true

                  account2.username = Tester.randomDelegateName().toLowerCase()
                  const transaction2 = await DdnJS.delegate.createDelegate(account2.username, account2.password)

                  Tester.peer.post('/transactions')
                    .set('Accept', 'application/json')
                    .set('version', Tester.version)
                    .set('nethash', Tester.config.nethash)
                    .set('port', Tester.config.port)
                    .send({
                      transaction: transaction2
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, {
                      body
                    }) => {
                      debug('Twice 2', body)
                      Tester.expect(err).to.be.not.ok

                      Tester.expect(body).to.have.property('success').to.be.false
                      done()
                    })
                })
            })
          })
      })
  })
})
