/**
 * passed
 */
import Debug from 'debug'
import DdnUtils from '@ddn/utils'
import Tester from '@ddn/test-utils'
import DdnJS from '../ddn-js'

const debug = new Debug('debug')

const account = Tester.randomAccount()
const voterAccount = Tester.randomAccount()

let delegate1_pubKey
let delegate2_pubKey

describe('POST /peer/transactions', () => {
  beforeAll(done => {
    Tester.api.post('/accounts/open')
      .set('Accept', 'application/json')
      .send({
        secret: voterAccount.password
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        Tester.expect(err).to.be.not.ok

        Tester.expect(body).to.have.property('success').to.be.true
        if (body.success === true && body.account !== null) {
          voterAccount.address = body.account.address
          voterAccount.publicKey = body.account.publicKey
          voterAccount.balance = body.account.balance
        } else {
          debug('Unable to open voterAccount, tests will fail')
          debug(`Data sent: secret: ${voterAccount.password} , secondSecret: ${voterAccount.secondPassword}`)
          Tester.expect('TEST').to.equal('FAILED')
        }

        // Send random DDN amount from genesis account to Random account
        const randomCoin = Tester.randomCoin()
        Tester.api.put('/transactions')
          .set('Accept', 'application/json')
          .send({
            secret: Tester.Gaccount.password,
            amount: `${randomCoin}`,
            recipientId: voterAccount.address
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            Tester.expect(err).to.be.not.ok

            debug(JSON.stringify(body))
            Tester.expect(body).to.have.property('success').to.be.true
            Tester.expect(body).to.have.property('transactionId')
            if (body.success === true && body.transactionId !== null) {
              Tester.expect(body.transactionId).to.be.a('string')
              voterAccount.amount = DdnUtils.bignum.plus(voterAccount.amount, randomCoin).toString()
            } else {
              debug('Sent: secret: ' + Tester.Gaccount.password + ', amount: ' + randomCoin + ', recipientId: ' + voterAccount.address)
              Tester.expect('TEST').to.equal('FAILED')
            }
            Tester.onNewBlock(done)
          })
      })
  })

  beforeAll(done => {
    Tester.api.get('/delegates/')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(async (err, { body }) => {
        Tester.expect(err).to.be.not.ok

        Tester.expect(body).to.have.property('success').to.be.true
        delegate1_pubKey = body.delegates[0].publicKey
        delegate2_pubKey = body.delegates[1].publicKey
        const votes = []
        votes.push(`+${delegate1_pubKey}`)
        votes.push(`+${delegate2_pubKey}`)
        const transaction = await DdnJS.vote.createVote(votes, voterAccount.password)
        // debug('createVote transaction', transaction);
        if (transaction !== null) {
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
            .end((_err, { body }) => {
              debug('Sent vote fix for delegates')
              debug(`Sent: ${JSON.stringify(transaction)} Got reply: ${JSON.stringify(body)}`)
              Tester.expect(body).to.have.property('success').to.be.true
              done()
            })
        } else {
          done()
        }
      })
  })

  it('Voting twice for a delegate. Should fail', done => {
    Tester.onNewBlock(async err => {
      Tester.expect(err).to.be.not.ok

      const transaction = await DdnJS.vote.createVote([`+${delegate1_pubKey}`], voterAccount.password)
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
        .end((err, { body }) => {
          Tester.expect(err).to.be.not.ok

          debug('Sending POST /transactions with data: ' + JSON.stringify(transaction) + ' Got reply: ' + JSON.stringify(body))
          Tester.expect(body).to.have.property('success').to.be.false
          done()
        })
    })
  })

  it('Removing votes from a delegate. Should be ok', async done => {
    await Tester.onNewBlockAsync()

    const transaction = await DdnJS.vote.createVote([`-${delegate1_pubKey}`], voterAccount.password)
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
      .end((err, { body }) => {
        Tester.expect(err).to.be.not.ok

        debug('Removing votes, ok', JSON.stringify(body))
        Tester.expect(body).to.have.property('success').to.be.true
        done()
      })
  })

  it('Removing votes from a delegate and then voting again. Should fail', done => {
    Tester.onNewBlock(async err => {
      Tester.expect(err).to.be.not.ok

      const transaction = await DdnJS.vote.createVote([`-${delegate2_pubKey}`], voterAccount.password)
      debug('Removing votes, ok', JSON.stringify(transaction))
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
        .end(async (err, { body }) => {
          Tester.expect(err).to.be.not.ok

          debug('Sent POST /transactions with data:' + JSON.stringify(transaction) + '! Got reply:' + JSON.stringify(body))
          Tester.expect(body).to.have.property('success').to.be.true
          const transaction2 = await DdnJS.vote.createVote([`+${delegate2_pubKey}`], voterAccount.password)
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
            .end((err, { body }) => {
              Tester.expect(err).to.be.not.ok

              debug('Sent POST /transactions with data: ' + JSON.stringify(transaction2) + '!. Got reply: ' + body)
              Tester.expect(body).to.have.property('success').to.be.false
              done()
            })
        })
    })
  })

  // 不能投给普通用户
  it('Voting for an common user. Should be fail', async done => {
    const transaction = await DdnJS.vote.createVote([`+${account.publicKey}`], account.password)
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
        .end((err, { body }) => {
          Tester.expect(err).to.be.not.ok

          debug('Voting for an common user, fail', body)
          Tester.expect(body).to.have.property('success').to.be.false
          Tester.expect(body).to.have.property('error').to.equal('Delegate not found')
          done()
        })
    })
  })

  // Not right test, because sometimes new block comes and we don't have time to vote
  it('Registering a new delegate. Should be ok', done => {
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
      .end((err, { body }) => {
        Tester.expect(err).to.be.not.ok

        if (body.success === true && body.account !== null) {
          account.address = body.account.address
          account.publicKey = body.account.publicKey
        } else {
          // debug("Open account failed or account object is null");
          Tester.expect(true).to.equal(false)
          done()
        }

        Tester.api.put('/transactions')
          .set('Accept', 'application/json')
          .set('version', Tester.version)
          .set('nethash', Tester.config.nethash)
          .set('port', Tester.config.port)
          .send({
            secret: Tester.Gaccount.password,
            amount: DdnUtils.bignum.plus(Tester.Fees.delegateRegistrationFee, Tester.Fees.voteFee),
            recipientId: account.address
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, _res) => {
            Tester.expect(err).to.be.not.ok

            Tester.onNewBlock(async err => {
              Tester.expect(err).to.be.not.ok
              account.username = Tester.randomDelegateName().toLowerCase()
              const transaction = await DdnJS.delegate.createDelegate(account.username, account.password)
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
                .end((err, { body }) => {
                  Tester.expect(err).to.be.not.ok
                  Tester.expect(body).to.have.property('success').to.be.true
                  done()
                })
            })
          })
      })
  })

  // 只有受托人才能接受投票
  it('Voting for a delegate. Should be ok', async done => {
    const transaction = await DdnJS.vote.createVote([`+${delegate2_pubKey}`], account.password)
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
        .end((err, { body }) => {
          Tester.expect(err).to.be.not.ok

          debug('Voting for a delegate ok', body)
          Tester.expect(body).to.have.property('success').to.be.true
          done()
        })
    })
  })
})
