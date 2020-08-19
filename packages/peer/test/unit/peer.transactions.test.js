/**
 * passed
 */
import Debug from 'debug'
import { bignum } from '@ddn/utils'
import { node } from '../ddn-js'

const debug = Debug('debug')

// Account info for a RANDOM account (which we create later) - 0 DDN amount | Will act as delegate
const Account1 = node.randomTxAccount()
const Account2 = node.randomTxAccount()
const Account3 = node.randomTxAccount()

let transactionCount = 0
const transactionList = []
let offsetTimestamp = 0

// Used for calculating amounts
let expectedFee = '0' // bignum update
let totalTxFee = '0'
// const randomCoin = "0";

beforeAll(async () => {
  let res = await node.openAccountAsync({ secret: Account1.password, secondSecret: Account1.secondPassword })
  node.expect(res.body).to.have.property('success').to.be.true
  Account1.address = res.body.account.address
  Account1.publicKey = res.body.account.publicKey
  Account1.balance = res.body.account.balance

  res = await node.openAccountAsync({ secret: Account2.password, secondSecret: Account2.secondPassword })
  node.expect(res.body).to.have.property('success').to.be.true
  Account2.address = res.body.account.address
  Account2.publicKey = res.body.account.publicKey
  Account2.balance = res.body.account.balance

  res = await node.openAccountAsync({ secret: Account3.password, secondSecret: Account3.secondPassword })
  node.expect(res.body).to.have.property('success').to.be.true
  Account3.address = res.body.account.address
  Account3.publicKey = res.body.account.publicKey
  Account3.balance = res.body.account.balance

  let randomCoin = node.randomCoin()
  res = await node.giveMoneyAsync(Account1.address, randomCoin)
  expectedFee = node.constants.net.fees.transfer
  debug('giveMoneyAsync response', res.body)

  node.expect(res.body).to.have.property('success').to.be.true
  Account1.transactions.push(transactionCount)
  transactionCount += 1

  // bignum update
  // totalTxFee += (expectedFee / node.normalizer);
  totalTxFee = bignum.plus(totalTxFee, expectedFee)

  Account1.balance += randomCoin
  transactionList[transactionCount - 1] = {
    sender: node.Gaccount.address,
    recipient: Account1.address,
    brutoSent: (randomCoin + expectedFee) / node.normalizer,

    // bignum update fee: expectedFee / node.normalizer,
    fee: expectedFee,

    nettoSent: randomCoin / node.normalizer,
    txId: res.body.transactionId,
    type: node.AssetTypes.TRANSFER
  }

  randomCoin = node.randomCoin()
  expectedFee = node.constants.net.fees.transfer
  res = await node.giveMoneyAsync(Account2.address, randomCoin)
  node.expect(res.body).to.have.property('success').to.be.true
  Account2.transactions.push(transactionCount)
  transactionCount += 1

  // bignum update
  // totalTxFee += (expectedFee / node.normalizer);
  totalTxFee = bignum.plus(totalTxFee, bignum.divide(expectedFee, node.normalizer))

  Account2.balance += randomCoin
  transactionList[transactionCount - 1] = {
    sende: node.Gaccount.address,
    recipient: Account2.address,
    brutoSent: randomCoin / node.normalizer + expectedFee,

    fee: expectedFee,

    nettoSent: randomCoin / node.normalizer,
    txId: res.body.transactionId,
    type: node.AssetTypes.TRANSFER
  }

  await node.onNewBlockAsync()
})

describe('GET /api/transactions', () => {
  it('Using valid parameters. Should be ok', done => {
    const senderId = node.Gaccount.address
    const blockId = ''
    const recipientId = Account1.address
    const limit = 10
    const offset = 0
    const orderBy = 't_amount:asc'

    const sqlString = `/transactions?blockId=${blockId}&senderId=${senderId}&recipientId=${recipientId}&limit=${limit}&offset=${offset}&orderBy=${orderBy}`
    debug('sql string', sqlString)

    node.api.get(sqlString)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug('valid parameters ok', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('transactions').that.is.an('array')
        node.expect(body.transactions).to.have.length.within(1, limit)
        if (body.transactions.length > 0) {
          for (let i = 0; i < body.transactions.length; i++) {
            if (typeof body.transactions[i + 1] !== 'undefined') {
              const bRet = bignum.isLessThanOrEqualTo(body.transactions[i].amount, body.transactions[i + 1].amount)
              node.expect(bRet).to.be.true
            }
          }
        }
        done()
      })
  })

  it('Using limit > 100. Should fail', done => {
    const senderId = node.Gaccount.address
    const blockId = ''
    const recipientId = Account1.address
    const limit = 999999
    const offset = 0
    const orderBy = 't_amount:asc'

    node.api.get(`/transactions?blockId=${blockId}&senderId=${senderId}&recipientId=${recipientId}&limit=${limit}&offset=${offset}&orderBy=${orderBy}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Ordered by ascending timestamp. Should be ok', done => {
    const blockId = ''
    const recipientId = ''
    const limit = 100
    const offset = 0
    const orderBy = 't_timestamp:asc'

    node.onNewBlock(_err => {
      node.api.get(`/transactions?blockId=${blockId}&recipientId=${recipientId}&limit=${limit}&offset=${offset}&orderBy=${orderBy}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // console.log(JSON.stringify(res.body));
          node.expect(body).to.have.property('success').to.be.true
          node.expect(body).to.have.property('transactions').that.is.an('array')
          node.expect(body.transactions).to.have.length.within(transactionCount, limit)
          if (body.transactions.length > 0) {
            let flag = 0
            for (let i = 0; i < body.transactions.length; i++) {
              if (typeof body.transactions[i + 1] !== 'undefined') {
                node.expect(body.transactions[i].timestamp).to.be.at.most(body.transactions[i + 1].timestamp)
                if (flag === 0) {
                  offsetTimestamp = body.transactions[i + 1].timestamp
                  flag = 1
                }
              }
            }
          } else {
            // console.log('Request failed. Expected success');
            node.expect('TEST').to.equal('FAILED')
          }
          done()
        })
    })
  })

  it('Using offset. Should be ok', done => {
    // const senderId = '';
    const blockId = ''
    const recipientId = ''
    const limit = 100
    const offset = 1
    const orderBy = 't_timestamp:asc'

    node.onNewBlock(_err => {
      node.api.get(`/transactions?blockId=${blockId}&recipientId=${recipientId}&limit=${limit}&offset=${offset}&orderBy=${orderBy}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // console.log(JSON.stringify(res.body));
          node.expect(body).to.have.property('success').to.be.true
          node.expect(body).to.have.property('transactions').that.is.an('array')
          node.expect(body.transactions).to.have.length.within(transactionCount, limit)
          if (body.transactions.length > 0) {
            node.expect(body.transactions[0].timestamp).be.equal(offsetTimestamp)
          }
          done()
        })
    })
  })

  it('Using string offset. Should fail', done => {
    const blockId = ''
    const recipientId = ''
    const limit = 100
    const offset = 'ONE'
    const orderBy = 't_timestamp:asc'

    node.api.get(`/transactions?blockId=${blockId}&recipientId=${recipientId}&limit=${limit}&offset=${offset}&orderBy=${orderBy}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using no limit. Should be ok', done => {
    const senderId = node.Gaccount.address
    const blockId = ''
    const recipientId = Account1.address
    const offset = 0
    const orderBy = 't_amount:desc'

    node.api.get(`/transactions?blockId=${blockId}&senderId=${senderId}&recipientId=${recipientId}&offset=${offset}&orderBy=${orderBy}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('transactions').that.is.an('array')
        if (body.transactions.length > 0) {
          for (let i = 0; i < body.transactions.length; i++) {
            if (typeof body.transactions[i + 1] !== 'undefined') {
              const bRet = bignum.isGreaterThanOrEqualTo(body.transactions[i].amount, body.transactions[i + 1].amount)
              // node.expect(res.body.transactions[i].amount).to.be.at.most(res.body.transactions[i + 1].amount);
              node.expect(bRet).to.be.true
            }
          }
        }
        done()
      })
  })

  it('Using completely invalid fields. Should fail', done => {
    const senderId = 'notAReadAddress'
    const blockId = 'about5'
    const recipientId = 'DDNLIOnair3'
    const limit = 'aLOT'
    const offset = 'Boris'
    const orderBy = 't_blockId:asc'

    node.api.get(`/transactions?blockId=${blockId}&senderId=${senderId}&recipientId=${recipientId}&limit=${limit}&offset=${offset}&orderBy=${orderBy}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using partially invalid fields. Should fail', done => {
    const senderId = 'notAReadAddress'
    const blockId = 'about5'
    const recipientId = Account1.address
    const limit = 'aLOT'
    const offset = 'Boris'
    const orderBy = 't_blockId:asc'

    node.onNewBlock(err => {
      node.expect(err).to.be.not.ok
      node.api.get(`/transactions?blockId=${blockId}&senderId=${senderId}&recipientId=${recipientId}&limit=${limit}&offset=${offset}&orderBy=${orderBy}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // console.log(JSON.stringify(res.body));
          node.expect(body).to.have.property('success').to.be.false
          node.expect(body).to.have.property('error')
          done()
        })
    })
  })
})

describe('PUT /api/transactions', () => {
  it('Using valid parameters. Should be ok', done => {
    node.onNewBlock(err => {
      node.expect(err).to.be.not.ok
      const amountToSend = 100000000
      node.api.put('/transactions')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password,
          amount: `${amountToSend}`,
          recipientId: Account2.address
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // console.log(JSON.stringify(res.body));
          node.expect(body).to.have.property('success').to.be.true
          node.expect(body).to.have.property('transactionId')
          expectedFee = '0.1' // node.constants.net.fees.transfer

          Account1.balance = bignum.minus(Account1.balance, amountToSend, expectedFee)

          Account2.balance += amountToSend
          Account1.transactions.push(transactionCount)
          transactionList[transactionCount] = {
            sender: Account1.address,
            recipient: Account2.address,
            brutoSent: bignum.divide(bignum.plus(amountToSend, bignum.multiply(expectedFee, node.constants.fixedPoint)), node.normalizer),

            fee: '0.1',

            nettoSent: bignum.divide(amountToSend, node.normalizer),
            txId: body.transactionId,
            type: node.AssetTypes.TRANSFER
          }
          debug('transactionList[0] = ', transactionList[0])
          transactionCount += 1

          done()
        })
    })
  })

  it('Using negative amount. Should fail', done => {
    const amountToSend = -100000000

    node.api.put('/transactions')
      .set('Accept', 'application/json')
      .send({
        secret: Account1.password,
        amount: amountToSend,
        recipientId: Account2.address
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using float amount. Should fail', done => {
    const amountToSend = '1.2'
    node.api.put('/transactions')
      .set('Accept', 'application/json')
      .send({
        secret: Account1.password,
        amount: amountToSend,
        recipientId: Account2.address
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('Using float amount fail', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error').include('Invalid transaction amount')
        done()
      })
  })

  it('Using entire balance. Should fail', function (done) {
    setTimeout(() => {
      node.api.put('/transactions')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password,
          amount: Account1.balance + '',
          recipientId: Account2.address
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          debug('Using entire balance fail', JSON.stringify(body))
          node.expect(body).to.have.property('success').to.be.false
          node.expect(body).to.have.property('error')
          done()
        })
    }, 1000)
  })

  it('Using zero amount. Should fail', function (done) {
    setTimeout(() => {
      node.api.put('/transactions')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password,
          amount: `${0}`,
          recipientId: Account2.address
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // console.log(JSON.stringify(res.body));
          node.expect(body).to.have.property('success').to.be.false
          node.expect(body).to.have.property('error')
          done()
        })
    }, 1000)
  })

  it('Using positive overflown amount. Should fail', function (done) {
    setTimeout(() => {
      node.api.put('/transactions')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password,
          amount: `${1298231812939123812939123912939123912931823912931823912903182309123912830123981283012931283910231203}`,
          recipientId: Account2.address
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // console.log(JSON.stringify(res.body));
          node.expect(body).to.have.property('success').to.be.false
          node.expect(body).to.have.property('error')
          done()
        })
    }, 1000)
  })

  it('Using negative overflown amount. Should fail', function (done) {
    setTimeout(() => {
      node.api.put('/transactions')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password,
          amount: -1298231812939123812939123912939123912931823912931823912903182309123912830123981283012931283910231203,
          recipientId: Account2.address
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // console.log(JSON.stringify(res.body));
          node.expect(body).to.have.property('success').to.be.false
          node.expect(body).to.have.property('error')
          done()
        })
    }, 1000)
  })

  it('Using small fractional amount. Should be ok', function (done) {
    setTimeout(() => {
      node.api.put('/transactions')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password,
          amount: `${1}`,
          recipientId: Account2.address
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          node.expect(body).to.have.property('success').to.be.true
          node.expect(body).to.have.property('transactionId')
          done()
        })
    }, 1000)
  })

  it('Using no passphase. Should fail', done => {
    const amountToSend = 100000000
    node.api.put('/transactions')
      .set('Accept', 'application/json')
      .send({
        amount: `${amountToSend}`,
        recipientId: Account2.address
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using no recipient. Should fail', done => {
    const amountToSend = 100000000
    node.api.put('/transactions')
      .set('Accept', 'application/json')
      .send({
        secret: Account1.password,
        amount: amountToSend
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })
})

describe('GET /transactions/get?id=', () => {
  it('Using valid id. Should be ok', done => {
    const transactionInCheck = transactionList[0]
    debug('Using valid id, transactionInCheck', transactionInCheck)
    const sqlString = `/transactions/get?id=${transactionInCheck.txId}`
    debug('Using valid id, sqlString', sqlString)

    node.api.get(sqlString)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('Using valid id, ok', JSON.stringify(body))
        debug('node.normalizer', node.normalizer)
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('transaction').that.is.an('object')
        node.expect(body.transaction.id).to.equal(transactionInCheck.txId)
        const amountResult = bignum.divide(body.transaction.amount, node.normalizer).isEqualTo(transactionInCheck.nettoSent)
        const feeResult = bignum.isEqualTo(bignum.divide(body.transaction.fee, node.normalizer), transactionInCheck.fee)
        debug('body.transaction.amount', body.transaction.amount)
        debug('body.transaction.fee', body.transaction.fee)
        debug('bignum.divide(body.transaction.fee, node.normalizer)', bignum.divide(body.transaction.fee, node.normalizer).toString())
        debug('transactionInCheck.fee', transactionInCheck.fee)
        node.expect(amountResult).to.be.true
        node.expect(feeResult).to.be.true
        node.expect(body.transaction.recipientId).to.equal(transactionInCheck.recipient)
        node.expect(body.transaction.senderId).to.equal(transactionInCheck.sender)
        node.expect(body.transaction.type).to.equal(transactionInCheck.type)
        done()
      })
  })

  it('Using invalid id. Should fail', done => {
    node.api.get('/transactions/get?id=NotTxId')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })
})

describe('GET /transactions', () => {
  it('Using type. Should be ok', done => {
    node.api.get(`/transactions?type=${node.AssetTypes.TRANSFER}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug('get /transactions?type= ok', JSON.stringify(body))

        node.expect(body).to.have.property('success').to.be.true
        if (body.success === true && body.transactions !== null) {
          for (let i = 0; i < body.transactions.length; i++) {
            if (typeof body.transactions[i] !== 'undefined') {
              node.expect(body.transactions[i].type).to.equal(node.AssetTypes.TRANSFER)
            }
          }
        } else {
          // console.log('Request failed or transaction list is null');
          node.expect('TEST').to.equal('FAILED')
        }
        done()
      })
  })
})

describe('GET /transactions/unconfirmed/get?id=', () => {
  it('Using valid id. Should be ok ', done => {
    node.api.get(`/transactions/unconfirmed/get?id=${transactionList[transactionCount - 1].txId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property('success')
        if (body.success === true) {
          if (body.transaction !== null) {
            node.expect(body.transaction.id).to.equal(transactionList[transactionCount - 1].txId)
          }
        } else {
          // console.log('Transaction already processed');
          node.expect(body).to.have.property('error')
        }
        done()
      })
  })
})

describe('GET /transactions/unconfirmed', () => {
  it('Should be ok', done => {
    node.api.get('/transactions/unconfirmed')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // console.log(JSON.stringify(res.body));
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('transactions').that.is.an('array')
        done()
      })
  })
})

describe('PUT /signatures', () => {
  it('When account has no funds. Should fail', function (done) {
    setTimeout(() => {
      node.api.put('/signatures')
        .set('Accept', 'application/json')
        .send({
          secret: Account3.password,
          secondSecret: Account3.password
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          node.expect(body).to.have.property('success').to.be.false
          node.expect(body).to.have.property('error')
          done()
        })
    }, 1000)
  })

  it('Using invalid passphrase. Should fail', done => {
    node.onNewBlock(() => {
      node.api.put('/signatures')
        .set('Accept', 'application/json')
        .send({
          secret: 'Account1.password',
          secondSecret: Account1.password
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // console.log(JSON.stringify(res.body));
          node.expect(body).to.have.property('success').to.be.false
          node.expect(body).to.have.property('error')
          done()
        })
    })
  })

  it('Using no second passphrase. Should fail', function (done) {
    setTimeout(() => {
      node.api.put('/signatures')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // console.log(JSON.stringify(res.body));
          node.expect(body).to.have.property('success').to.be.false
          node.expect(body).to.have.property('error')
          done()
        })
    }, 1000)
  })

  it('Using valid parameters. Should be ok ', done => {
    node.onNewBlock(() => {
      node.api.put('/signatures')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password,
          secondSecret: Account1.secondPassword
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // console.log(JSON.stringify(res.body));
          node.expect(body).to.have.property('success').to.be.true
          node.expect(body).to.have.property('transaction').that.is.an('object')
          if (body.success === true && body.transaction !== null) {
            const fee = bignum.multiply(node.constants.net.fees.signature, node.constants.fixedPoint).toString()

            // console.log(Account1)
            node.expect(body.transaction).to.have.property('type').to.equal(node.AssetTypes.SIGNATURE)
            node.expect(body.transaction).to.have.property('senderPublicKey').to.equal(Account1.publicKey)
            node.expect(body.transaction).to.have.property('senderId').to.equal(Account1.address)
            node.expect(body.transaction).to.have.property('fee').to.equal(fee)
            Account1.transactions.push(transactionCount)
            transactionCount += 1

            Account1.balance = bignum.minus(Account1.balance, fee)

            transactionList[transactionCount - 1] = {
              sender: Account1.address,
              recipient: 'SYSTEM',
              brutoSent: 0,
              fee: node.constants.net.fees.signature,
              nettoSent: 0,
              txId: body.transaction.id,
              type: node.AssetTypes.SIGNATURE
            }
          } else {
            node.expect('TEST').to.equal('FAILED')
          }
          done()
        })
    })
  })
})

describe('PUT /transactions (with second passphase now enabled)', () => {
  it('Without specifying second passphase on account. Should fail', done => {
    const amountToSend = 100000000
    node.onNewBlock(err => {
      node.expect(err).to.be.not.ok

      node.api.put('/transactions')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password,
          recipientId: Account2.address,
          amount: amountToSend
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // console.log(JSON.stringify(res.body));
          node.expect(body).to.have.property('success').to.be.false
          node.expect(body).to.have.property('error')
          done()
        })
    })
  })

  it('Using second passphase but without primary passphase. Should fail', function (done) {
    const amountToSend = 100000000

    setTimeout(() => {
      node.api.put('/transactions')
        .set('Accept', 'application/json')
        .send({
          secondSecret: Account1.secondPassword,
          recipientId: Account2.address,
          amount: amountToSend
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          node.expect(body).to.have.property('success').to.be.false
          node.expect(body).to.have.property('error')
          done()
        })
    }, 1000)
  })
})

describe('PUT /delegates (with second passphase now enabled)', () => {
  it('Without specifying second passphase on account. Should fail', function (done) {
    setTimeout(() => {
      node.api.put('/delegates')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password,
          username: Account1.delegateName
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          node.expect(body).to.have.property('success').to.be.false
          node.expect(body).to.have.property('error')
          done()
        })
    }, 1000)
  })
})
