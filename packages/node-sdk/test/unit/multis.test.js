/**
 * passed
 */
import Debug from 'debug'
import DdnUtils from '@ddn/utils'
import DdnJS from '../ddn-js'

const debug = Debug('debug')
const Tester = DdnUtils.Tester

async function createTransfer (address, amount, secret, second_secret) {
  return await DdnJS.transaction.createTransaction(address, amount, null, secret, second_secret)
}

async function newAccount () {
  return new Promise((resolve, reject) => {
    Tester.api.get('/accounts/new')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, {
        body
      }) => {
        Tester.expect(body).to.have.property('secret')

        if (err) {
          return reject(err)
        }

        resolve(body)
      })
  })
}

async function multiSign ({
  secret,
  address
}, trsId) {
  return new Promise((resolve, reject) => {
    Tester.api.post('/multisignatures/sign')
      .set('Accept', 'application/json')
      .send({
        secret,
        transactionId: trsId
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, {
        body
      }) => {
        if (err) {
          return reject(err)
        }

        debug(`${address} sign:${JSON.stringify(body)}`)

        Tester.expect(body).to.have.property('success').to.be.true

        resolve()
      })
  })
}

describe('PUT /multisignatures', () => {
  let multiAccount
  const accounts = []

  let multiTrsId

  it('get multiAccount should be ok', async (done) => {
    multiAccount = await newAccount()
    debug(`Multi Account: ${JSON.stringify(multiAccount)}`)
    debug('\r\n')

    const transaction = await createTransfer(multiAccount.address, '100000000000', Tester.Gaccount.password)
    // await new Promise((resolve, reject) => {
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
        debug('multi Account2 ', JSON.stringify(body))
        Tester.expect(err).be.not.ok
        Tester.expect(body).to.have.property('success').to.be.true

        done()
      })
    // });

    const account = await newAccount()
    // debug(`account: ${JSON.stringify(account)}`);
    // debug("\r\n");
    accounts.push(account)

    const account2 = await newAccount()
    // debug(`account2: ${JSON.stringify(account2)}`);
    // debug("\r\n");
    accounts.push(account2)

    const account3 = await newAccount()
    // debug(`account3: ${JSON.stringify(account3)}`);
    // debug("\r\n");
    accounts.push(account3)
  })

  // 创建多重签名账号
  it('PUT /multisignatures. Should be ok', (done) => {
    Tester.onNewBlock(() => {
      const kg = []
      for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i]
        kg.push(`+${acc.publicKey}`)
      }
      debug(`keysgroup: ${JSON.stringify(kg)}`)
      debug('\r\n')

      Tester.api.put('/multisignatures')
        .set('Accept', 'application/json')
        .send({
          secret: multiAccount.secret,
          min: 3,
          lifetime: 24,
          keysgroup: kg
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('PUT /multisignatures', JSON.stringify(body))
          Tester.expect(err).be.not.ok
          Tester.expect(body).to.have.property('success').to.be.true

          multiTrsId = body.transactionId
          debug('multiTrsId', multiTrsId)

          done()
        })
    })
  })

  it('POST /multisignatures/sign. Should be ok', async (done) => {
    let result = false

    debug('multiTrsId', multiTrsId)

    for (let i = 0; i < accounts.length; i++) {
      try {
        const account = accounts[i]
        await multiSign(account, multiTrsId)
        result = true
      } catch (err) {
        result = false
      }
    }
    Tester.expect(result).be.true
    done()
  })
})
