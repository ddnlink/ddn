/**
 * passed
 */
import node from '@ddn/node-sdk/lib/test'
import Debug from 'debug'

const debug = Debug('debug')
const expect = node.expect

const totalMembers = 3 // node.randomNumber(2, 16);
const requiredSignatures = node.randomNumber(2, totalMembers + 1)

const NoDDNAccount = node.randomAccount()
NoDDNAccount.name = 'noddn'

const MultisigAccount = node.randomAccount()
MultisigAccount.name = 'multi'

const Accounts = []
for (let i = 0; i < totalMembers; i++) {
  Accounts[i] = node.randomAccount()
}

const MultiSigTX = {
  lifetime: 0,
  min: 0,
  members: [],
  txId: ''
}

let accountOpenTurn = 0

async function openAccount ({ password, name }, i) {
  if (i !== null) {
    console.log(
            `Opening Account ${i} with password: ${password}`
    )
  }

  const res = await node.openAccountAsync({ secret: password })
  const body = res.body

  if (body.account !== null && i !== null) {
    Accounts[i].address = body.account.address
    Accounts[i].publicKey = body.account.publicKey
    debug('Open body.account ' + i, body.account)
  } else if (name === 'noddn') {
    NoDDNAccount.address = body.account.address
    NoDDNAccount.publicKey = body.account.publicKey
  } else if (name === 'multi') {
    MultisigAccount.address = body.account.address
    MultisigAccount.publicKey = body.account.publicKey
    debug('Open MultisigAccount', body.account)
  }
}

async function sendDDN ({ address }, i) {
  await node.onNewBlockAsync()

  await new Promise((resolve, reject) => {
    const randomCoin = node.randomCoin()

    node.api
      .put('/transactions')
      .set('Accept', 'application/json')
      .send({
        secret: node.Gaccount.password,
        amount: `${randomCoin}`,
        recipientId: address
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        if (err) {
          return reject(err)
        }

        // debug(JSON.stringify(res.body));
        debug(`sendDDN Sending ${randomCoin} DDN to ${address}`)
        expect(body).to.have.property('success').to.be.true
        if (body.success === true && i !== null) {
          // fixme: Bignumber
          Accounts[i].balance = randomCoin / node.normalizer
        }

        resolve()
      })
  })
}

async function sendDDNfromMultisigAccount (amount, recipient) {
  return await new Promise((resolve, reject) => {
    node.api
      .put('/transactions')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        amount: `${amount}`,
        recipientId: recipient
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        if (err) {
          return reject(err)
        }

        debug('sendDDNfromMultisigAccount: ', JSON.stringify(body))
        debug('Sending ' + amount + ' DDN to ' + recipient)
        expect(body).to.have.property('success').to.be.true
        if (body.success === true) {
          expect(body).to.have.property('transactionId')
        }

        resolve(body.transactionId)
      })
  })
}

async function confirmTransaction ({ password }, id) {
  await new Promise((resolve, reject) => {
    node.api
      .post('/multisignatures/sign')
      .set('Accept', 'application/json')
      .send({
        secret: password,
        transactionId: id
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        if (err) {
          return reject(err)
        }
        debug('Signing Tx ID = ' + id + ' from account with password = ' + password + ' Got reply: ' + JSON.stringify(body))
        expect(body).to.have.property('success').to.be.true

        resolve()
      })
  })
}

let Keys

async function makeKeysGroup () {
  debug('makeKeysGroup Accounts', Accounts[0], Accounts[1])
  const keysgroup = []
  for (let i = 0; i < totalMembers; i++) {
    const member = `+${Accounts[i].publicKey}`
    keysgroup.push(member)
  }
  return keysgroup
}

// 耗时太长，增加默认超时时间
jest.setTimeout(50000)

beforeAll(async done => {
  for (let i = 0; i < Accounts.length; i++) {
    if (Accounts[i] !== null) {
      await openAccount(Accounts[i], i)
      setTimeout(function () {
        if (accountOpenTurn < totalMembers) {
          accountOpenTurn += 1
        }
      }, 2000)
    }
  }
  await openAccount(NoDDNAccount, null)
  await openAccount(MultisigAccount, null)
  done()
})

// 分别转账
beforeAll(async done => {
  for (let i = 0; i < Accounts.length; i++) {
    if (Accounts[i] !== null) {
      await sendDDN(Accounts[i], i)
    }
  }

  done()
})

beforeAll(async done => {
  await sendDDN(MultisigAccount, null)
  done()
})

// Wait for two new blocks to ensure all data has been recieved
beforeAll(async done => {
  await node.onNewBlockAsync()
  await node.onNewBlockAsync()
  done()
})

describe('PUT /multisignatures', () => {
  beforeAll(async done => {
    Keys = await makeKeysGroup()
    done()
  })

  it("When owner's public key in keysgroup. Should fail", done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: Accounts[Accounts.length - 1].password,
        lifetime: 1,
        min: requiredSignatures,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('keysgroup', JSON.stringify(body))
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When account has 0 DDN. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: NoDDNAccount.password,
        lifetime: 1,
        min: requiredSignatures,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When keysgroup is empty. Should fail', done => {
    const emptyKeys = []

    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: 1,
        min: requiredSignatures,
        keysgroup: emptyKeys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When no keygroup is given. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: 1,
        min: requiredSignatures
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When keysgroup is a string. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: 1,
        min: requiredSignatures,
        keysgroup: 'invalid'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When no passphase is given. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        lifetime: 1,
        min: requiredSignatures,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When an invalid passphrase is given. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: `${MultisigAccount.password}invalid`,
        lifetime: 1,
        min: requiredSignatures,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When no lifetime is given. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        min: requiredSignatures,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When lifetime is a string. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: 'invalid',
        min: requiredSignatures,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When lifetime is greater than the maximum allowed. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: 99999999,
        min: requiredSignatures,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When lifetime is zero. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: 0,
        min: requiredSignatures,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When lifetime is negative. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: -1,
        min: requiredSignatures,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When lifetime is a string. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: '2',
        min: requiredSignatures,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When no min is given. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: 1,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When min is invalid. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: 1,
        min: 'invalid',
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When min is greater than the total members. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: 1,
        min: totalMembers + 5,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When min is zero. Should fail', done => {
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: 1,
        min: 0,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When min is negative. Should fail', done => {
    const minimum = -1 * requiredSignatures

    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: 1,
        min: minimum,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When min is a string. Should fail', done => {
    const minimum = toString(requiredSignatures)

    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: 1,
        min: minimum,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('/multisignatures min is a string', JSON.stringify(body))
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('When data is valid. Should be ok', async done => {
    const life = parseInt(node.randomNumber(1, 25))
    node.api
      .put('/multisignatures')
      .set('Accept', 'application/json')
      .send({
        secret: MultisigAccount.password,
        lifetime: life,
        min: requiredSignatures,
        keysgroup: Keys
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('should be ok: ', JSON.stringify(body))
        expect(body).to.have.property('success').to.be.true
        expect(body).to.have.property('transactionId')
        MultiSigTX.txId = body.transactionId
        MultiSigTX.lifetime = life
        MultiSigTX.members = Keys
        MultiSigTX.min = requiredSignatures
        done()
      })
  })
})

describe('GET /multisignatures/pending', () => {
  it('Using invalid public key. Should fail', done => {
    const publicKey = 'abcd'

    node.api
      .get(`/multisignatures/pending?publicKey=${publicKey}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('GET /multisignatures/pending', JSON.stringify(body))
        expect(body).to.have.property('success').to.be.false
        expect(body).to.have.property('error')
        done()
      })
  })

  it('Using no public key. Should be ok', done => {
    node.api
      .get('/multisignatures/pending?publicKey=')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success')
        expect(body).to.have.property('success').to.be.true
        expect(body)
          .to.have.property('transactions')
          .that.is.an('array')
        expect(body.transactions.length).to.equal(0)
        done()
      })
  })

  it('Using valid public key. Should be ok', done => {
    // node.onNewBlock(function (err) {
    node.api
      .get(
                `/multisignatures/pending?publicKey=${MultisigAccount.publicKey}`
      )
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug('res.body', res.body)
        expect(body).to.have.property('success').to.be.true
        expect(body)
          .to.have.property('transactions')
          .that.is.an('array')
        expect(body.transactions.length).to.be.at.least(1)
        let flag = 0
        for (let i = 0; i < body.transactions.length; i++) {
          // debug(MultisigAccount.publicKey);
          if (
            body.transactions[i].transaction.senderPublicKey ==
                        MultisigAccount.publicKey
          ) {
            flag += 1
            expect(body.transactions[i].transaction)
              .to.have.property('type')
              .to.equal(node.AssetTypes.MULTISIGNATURE)
            expect(body.transactions[i].transaction)
              .to.have.property('amount')
              .to.equal('0')
            expect(body.transactions[i].transaction)
              .to.have.property('asset')
              .that.is.an('object')
            expect(body.transactions[i].transaction)
              .to.have.property('fee')
              .to.equal(
                String(
                  node.Fees.multisignatureRegistrationFee *
                                    (Keys.length + 1)
                )
              )
            expect(body.transactions[i].transaction)
              .to.have.property('id')
              .to.equal(MultiSigTX.txId)
            expect(body.transactions[i].transaction)
              .to.have.property('senderPublicKey')
              .to.equal(MultisigAccount.publicKey)
            expect(body.transactions[i])
              .to.have.property('lifetime')
              .to.equal(Number(MultiSigTX.lifetime))
            expect(body.transactions[i])
              .to.have.property('min')
              .to.equal(MultiSigTX.min)
          }
        }
        expect(flag).to.equal(1)
        done()
      })
    // });
  })
})

// 多重签名
describe('POST /multisignatures/sign', () => {
  it('Using invalid passphrase. Should fail', done => {
    node.api
      .post('/multisignatures/sign')
      .set('Accept', 'application/json')
      .send({
        secret: 1234,
        transactionId: MultiSigTX.txId
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        done()
      })
  })

  it('Using null passphrase. Should fail', done => {
    node.api
      .post('/multisignatures/sign')
      .set('Accept', 'application/json')
      .send({
        secret: null,
        transactionId: MultiSigTX.txId
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        done()
      })
  })

  it('Using undefined passphrase. Should fail', done => {
    node.api
      .post('/multisignatures/sign')
      .set('Accept', 'application/json')
      .send({
        secret: undefined,
        transactionId: MultiSigTX.txId
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        done()
      })
  })

  it('Using random passphrase. Should fail (account is not associated)', done => {
    node.api
      .post('/multisignatures/sign')
      .set('Accept', 'application/json')
      .send({
        secret: 'Just 4 R4nd0m P455W0RD',
        transactionId: MultiSigTX.txId
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(res.body));
        expect(body).to.have.property('success').to.be.false
        done()
      })
  })

  it('Use valid phrases, Should be ok', async () => {
    for (let i = 0; i < totalMembers; i++) {
      const account = Accounts[i]
      await confirmTransaction(account, MultiSigTX.txId)
    }
  })
})

describe('Sending another transaction', () => {
  let sendTrsId

  it('When other transactions are still pending. Should be ok', done => {
    node.onNewBlock(async () => {
      try {
        sendTrsId = await sendDDNfromMultisigAccount(
          100000000,
          node.Gaccount.address
        )
        // todo
        done()
      } catch (err) {
        done(err)
      }
    })
  })

  it('Get unconfirmed transaction, Should be ok.', done => {
    node.api
      .get(`/transactions/unconfirmed/get?id=${sendTrsId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        debug('Get unconfirmed transaction, ok', JSON.stringify(body))
        expect(err).be.not.ok

        expect(body).to.have.property('success').to.be.true
        expect(body)
          .to.have.property('transaction')
          .that.is.an('object')

        done()
      })
  })

  // it("Confirm the send transaction, Should be ok.", async () => {
  //     for (let i = 0; i < totalMembers; i++) {
  //         const account = Accounts[i];
  //         await confirmTransaction(account, sendTrsId);
  //     }
  // });
})
