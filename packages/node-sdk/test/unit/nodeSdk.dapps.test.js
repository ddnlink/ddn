// passed
import Debug from 'debug'
import DdnUtils from '@ddn/utils'
import { Transfer } from './dapp/transfer'
import { node } from '../ddn-js'

const debug = Debug('debug')

const dappDemo = {
  icon: 'http://ebookchain.org/static/media/logo.5e78d8c2.png',
  link: 'https://github.com/ddnlink/ddn-dapp-demo/archive/v0.1.0.zip'
}

let DappName = ''
let dappLink
const DappToInstall = {}
let randomCoin = 0
let transactionCount = 0
const transactionList = []

// Used for calculating amounts
let expectedFee = '0' // DdnUtils.bignum update
let totalTxFee = '0' // DdnUtils.bignum update

// Create random accounts
const Account1 = node.randomTxAccount()
const Account2 = node.randomTxAccount()
const Account3 = node.randomTxAccount()
const Account4 = node.randomTxAccount()
const Account5 = node.randomTxAccount()

beforeAll(done => {
  node.api.post('/accounts/open')
    .set('Accept', 'application/json')
    .send({
      secret: Account1.password,
      secondSecret: Account1.secondPassword
    })
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, { body }) => {
      node.expect(err).be.not.ok

      // debug(JSON.stringify(body));
      debug(`Opening Account 1 with password: ${Account1.password}`)
      node.expect(body).to.have.property('success').to.be.true
      if (body.success === true && body.account !== null) {
        Account1.address = body.account.address
        Account1.publicKey = body.account.publicKey
        Account1.balance = body.account.balance
      } else {
        debug('Unable to open account1, tests will fail')
        debug(`Data sent: secret: ${Account1.password} , secondSecret: ${Account1.secondPassword}`)
        node.expect('TEST').to.equal('FAILED')
      }
      done()
    })
})

beforeAll(done => {
  node.api.post('/accounts/open')
    .set('Accept', 'application/json')
    .send({
      secret: Account2.password,
      secondSecret: Account2.secondPassword
    })
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, { body }) => {
      node.expect(err).be.not.ok

      // debug("register second password");
      debug(`Opening Account 2 with password: ${Account2.password}`)
      node.expect(body).to.have.property('success').to.be.true
      if (body.success === true && body.account !== null) {
        Account2.address = body.account.address
        Account2.publicKey = body.account.publicKey
        Account2.balance = body.account.balance
      } else {
        debug('Unable to open account2, tests will fail')
        debug(`Data sent: secret: ${Account2.password} , secondSecret: ${Account2.secondPassword}`)
        node.expect('TEST').to.equal('FAILED')
      }
      done()
    })
})

beforeAll(done => {
  node.api.post('/accounts/open')
    .set('Accept', 'application/json')
    .send({
      secret: Account3.password,
      secondSecret: Account3.secondPassword
    })
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, { body }) => {
      node.expect(err).be.not.ok

      // debug(JSON.stringify(body));
      debug(`Opening Account 3 with password: ${Account3.password}`)
      node.expect(body).to.have.property('success').to.be.true
      if (body.success === true && body.account !== null) {
        Account3.address = body.account.address
        Account3.publicKey = body.account.publicKey
        Account3.balance = body.account.balance
      } else {
        debug('Unable to open account3, tests will fail')
        debug(`Data sent: secret: ${Account3.password} , secondSecret: ${Account3.secondPassword}`)
        node.expect('TEST').to.equal('FAILED')
      }
      done()
    })
})

beforeAll(done => {
  node.api.post('/accounts/open')
    .set('Accept', 'application/json')
    .send({
      secret: Account4.password,
      secondSecret: Account4.secondPassword
    })
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, { body }) => {
      node.expect(err).be.not.ok

      // debug(JSON.stringify(body));
      debug(`Opening Account 4 with password: ${Account4.password}`)
      node.expect(body).to.have.property('success').to.be.true
      if (body.success === true && body.account !== null) {
        Account4.address = body.account.address
        Account4.publicKey = body.account.publicKey
        Account4.balance = body.account.balance
      } else {
        debug('Unable to open account4, tests will fail')
        debug(`Data sent: secret: ${Account4.password} , secondSecret: ${Account4.secondPassword}`)
        node.expect('TEST').to.equal('FAILED')
      }
      done()
    })
})

beforeAll(done => {
  node.api.post('/accounts/open')
    .set('Accept', 'application/json')
    .send({
      secret: Account5.password,
      secondSecret: Account5.secondPassword
    })
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, { body }) => {
      node.expect(err).be.not.ok

      // debug(JSON.stringify(body));
      debug(`Opening Account 5 with password: ${Account5.password}`)
      node.expect(body).to.have.property('success').to.be.true
      if (body.success === true && body.account !== null) {
        Account5.address = body.account.address
        Account5.publicKey = body.account.publicKey
        Account5.balance = body.account.balance
      } else {
        debug('Unable to open account5, tests will fail')
        debug(`Data sent: secret: ${Account5.password} , secondSecret: ${Account5.secondPassword}`)
        node.expect('TEST').to.equal('FAILED')
      }
      done()
    })
})

beforeAll(done => {
  // Send money to account 1 address
  randomCoin = node.randomCoin()
  node.api.put('/transactions')
    .set('Accept', 'application/json')
    .send({
      secret: node.Gaccount.password,
      amount: `${randomCoin}`,
      recipientId: Account1.address
    })
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, { body }) => {
      node.expect(err).be.not.ok

      // debug(JSON.stringify(body));
      node.expect(body).to.have.property('success').to.be.true
      if (body.success === true && body.transactionId !== null) {
        transactionCount += 1
        Account1.transactions.push(transactionCount)
        Account1.balance += randomCoin
      } else {
        debug(`Sent: secret: ${node.Gaccount.password}, amount: ${randomCoin}, recipientId: ${Account1.address}`)
        node.expect('TEST').to.equal('FAILED')
      }
      done()
    })
})

beforeAll(done => {
  randomCoin = node.randomCoin()
  expectedFee = randomCoin // node.expectedFee(randomCoin)
  node.api.put('/transactions')
    .set('Accept', 'application/json')
    .send({
      secret: node.Gaccount.password,
      amount: `${randomCoin}`,
      recipientId: Account2.address
    })
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, { body }) => {
      node.expect(err).be.not.ok

      node.expect(body).to.have.property('success').to.be.true
      if (body.success === true && body.transactionId !== null) {
        Account2.transactions.push(transactionCount)
        transactionCount += 1

        // DdnUtils.bignum update
        // totalTxFee += (expectedFee / node.normalizer);
        totalTxFee = DdnUtils.bignum.plus(totalTxFee, DdnUtils.bignum.divide(expectedFee, node.normalizer))

        Account2.balance += randomCoin
        transactionList[transactionCount - 1] = {
          sender: node.Gaccount.address,
          recipient: Account2.address,
          brutoSent: (randomCoin + expectedFee) / node.normalizer,

          // DdnUtils.bignum update "fee": expectedFee / node.normalizer,
          fee: DdnUtils.bignum.divide(expectedFee, node.normalizer),

          nettoSent: randomCoin / node.normalizer,
          txId: body.transactionId,
          type: node.AssetTypes.TRANSFER
        }
      } else {
        debug(`Sent: secret: ${node.Gaccount.password}, amount: ${randomCoin}, recipientId: ${Account2.address}`)
        node.expect('TEST').to.equal('FAILED')
      }
      done()
    })
})

beforeAll(done => {
  // Wait for new block to ensure all data has been received
  node.onNewBlock(err => {
    // Add 2nd password for Account 2
    node.expect(err).be.not.ok

    node.api.put('/signatures')
      .set('Accept', 'application/json')
      .send({
        secret: Account2.password,
        secondSecret: Account2.secondPassword
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        debug('signatures', body)
        node.expect(err).be.not.ok

        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('transaction').that.is.an('object')
        done()
      })
  })

  debug(`ACCOUNT 1: ${Account1.address}`)
  debug(`ACCOUNT 2: ${Account2.address}`)
  debug(`ACCOUNT 3: ${Account3.address}`)
  debug(`ACCOUNT 4: ${Account4.address}`)
  debug(`ACCOUNT 5: ${Account5.address}`)
})

// 注册 dapp
describe('PUT /dapps', () => {
  // dappLink = `http://www.ebookchain.org/dapp-${node.randomIssuerName()}.zip`;
  dappLink = dappDemo.link

  it('Using invalid secret. Should fail', done => {
    node.api.put('/dapps')
      .set('Accept', 'application/json')
      .send({
        secret: 'justAR4nd0m Passw0rd',
        category: node.randomProperty(node.DappCategory),
        type: node.DappType.DAPP,
        name: node.randomDelegateName(),
        description: 'A dapp that should not be added',
        tags: 'handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate',
        link: dappLink,
        icon: dappDemo.icon
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        debug('PUT /dapps 01', body)
        node.expect(err).be.not.ok

        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Category is number, Using invalid Category, Should fail', async done => {
    await node.onNewBlockAsync()

    node.api.put('/dapps')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        secret: Account1.password,
        category: 'Error category',
        type: node.DappType.DAPP,
        name: node.randomDelegateName(),
        description: 'A dapp that should not be added',
        tags: 'handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate',
        link: dappLink,
        icon: dappDemo.icon
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        node.expect(err).be.not.ok

        debug('PUT /dapps 02', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error').to.include('Invalid parameters')
        done()
      })
  })

  it('Using no dapp name. Should fail', done => {
    node.api.put('/dapps')
      .set('Accept', 'application/json')
      .send({
        secret: Account1.password,
        category: node.randomProperty(node.DappCategory),
        type: node.DappType.DAPP,
        description: 'A dapp that should not be added',
        tags: 'handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate',
        link: dappLink,
        icon: dappDemo.icon
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        node.expect(err).be.not.ok

        debug('PUT /dapps 03', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using very long description. Should fail', done => {
    node.api.put('/dapps')
      .set('Accept', 'application/json')
      .send({
        secret: Account1.password,
        category: node.randomProperty(node.DappCategory),
        type: node.DappType.DAPP,
        name: node.randomDelegateName(),
        description: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient c',
        link: dappLink,
        icon: dappDemo.icon
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        node.expect(err).be.not.ok

        debug('PUT /dapps 04', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using very long tag. Should fail', done => {
    node.api.put('/dapps')
      .set('Accept', 'application/json')
      .send({
        secret: Account1.password,
        category: node.randomProperty(node.DappCategory),
        type: node.DappType.DAPP,
        name: node.randomDelegateName(),
        description: 'A dapp that should not be added',
        tags: 'develop,rice,voiceless,zonked,crooked,consist,price,extend,sail,treat,pie,massive,fail,maid,summer,verdant,visitor,bushes,abrupt,beg,black-and-white,flight,twist',
        link: dappLink,
        icon: dappDemo.icon
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        node.expect(err).be.not.ok

        debug('PUT /dapps 05', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using very long name. Should fail', done => {
    node.api.put('/dapps')
      .set('Accept', 'application/json')
      .send({
        secret: Account1.password,
        category: node.randomProperty(node.DappCategory),
        type: node.DappType.DAPP,
        name: 'Lorem ipsum dolor sit amet, conse',
        description: 'A dapp that should not be added',
        tags: 'handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate',
        link: dappLink,
        icon: dappDemo.icon
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('PUT /dapps 06', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using no link. Should fail', done => {
    node.api.put('/dapps')
      .set('Accept', 'application/json')
      .send({
        secret: Account1.password,
        category: node.randomProperty(node.DappCategory),
        type: node.DappType.DAPP,
        name: node.randomDelegateName(),
        description: 'A dapp that should not be added',
        tags: 'handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('PUT /dapps 07', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using invalid parameter types. Should fail', done => {
    node.api.put('/dapps')
      .set('Accept', 'application/json')
      .send({
        secret: Account1.password,
        category: 'String',
        type: 'Type',
        name: 1234,
        description: 1234,
        tags: 1234,
        link: 1234,
        icon: 1234
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('PUT /dapps 08', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using account with 0 coin account. Should fail', done => {
    node.api.put('/dapps')
      .set('Accept', 'application/json')
      .send({
        secret: Account3.password,
        category: node.randomProperty(node.DappCategory),
        type: node.DappType.DAPP,
        name: node.randomDelegateName(),
        description: 'A dapp that should not be added',
        tags: 'handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate',
        link: dappLink,
        icon: dappDemo.icon
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('PUT /dapps 09', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        done()
      })
  })

  it('Using invalid 2nd passphrase. Should fail', done => {
    node.api.put('/dapps')
      .set('Accept', 'application/json')
      .send({
        secret: Account2.password,
        secondSecret: null,
        category: node.randomProperty(node.DappCategory),
        type: node.DappType.DAPP,
        name: node.randomDelegateName(),
        description: 'A dapp that should not be added',
        tags: 'handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate',
        link: dappLink,
        icon: dappDemo.icon
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        node.expect(err).be.not.ok

        debug('PUT /dapps 10', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        done()
      })
  })

  it('Using invalid type. Should fail', done => {
    DappName = node.randomDelegateName()

    node.api.put('/dapps')
      .set('Accept', 'application/json')
      .send({
        secret: Account1.password,
        secondSecret: null,
        category: node.randomProperty(node.DappCategory),
        type: 'INVALIDTYPE',
        name: DappName,
        description: 'A dapp that should not be added',
        tags: 'handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate',
        link: dappLink,
        icon: dappDemo.icon
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, { body }) => {
        node.expect(err).be.not.ok

        debug('PUT /dapps 11', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        done()
      })
  })

  it('Using valid Link. Should be ok', done => {
    const delegates = [
      Account1.publicKey,
      Account2.publicKey,
      Account3.publicKey,
      Account4.publicKey,
      Account5.publicKey
    ]

    node.onNewBlock(() => {
      DappName = node.randomDelegateName()
      node.api.put('/dapps')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password,
          category: node.randomProperty(node.DappCategory),
          type: node.DappType.DAPP,
          name: DappName,
          description: 'A dapp added via API autotest',
          tags: 'handy dizzy',
          link: dappLink,
          icon: dappDemo.icon,
          delegates: delegates.join(','),
          unlock_delegates: 3
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, { body }) => {
          debug('PUT /dapps 12', body)
          node.expect(err).be.not.ok
          node.expect(body).to.have.property('success').to.be.true
          node.expect(body).to.have.property('transactionId')
          DappToInstall.transactionId = body.transactionId
          done()
        })
    })
  })

  it('Using existing dapp name. Should fail', done => {
    node.onNewBlock(err => {
      node.expect(err).be.not.ok

      node.api.put('/dapps')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password,
          category: node.randomProperty(node.DappCategory),
          type: node.DappType.DAPP,
          name: DappName,
          description: 'A dapp that should not be added',
          tags: 'handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate',
          link: dappLink,
          icon: dappDemo.icon
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, { body }) => {
          node.expect(err).be.not.ok

          debug('PUT /dapps 13', body)
          node.expect(body).to.have.property('success').to.be.false
          done()
        })
    })
  })

  it('Using existing dapp link. Should fail', done => {
    node.onNewBlock(err => {
      node.expect(err).be.not.ok

      node.api.put('/dapps')
        .set('Accept', 'application/json')
        .send({
          secret: Account1.password,
          category: node.randomProperty(node.DappCategory),
          type: node.DappType.DAPP,
          name: node.randomDelegateName(),
          description: 'A dapp that should not be added',
          tags: 'handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate',
          link: dappLink,
          icon: dappDemo.icon
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, { body }) => {
          node.expect(err).be.not.ok

          debug('PUT /dapps 14', JSON.stringify(body))
          node.expect(body).to.have.property('success').to.be.false
          node.expect(body).to.have.property('error')
          done()
        })
      done()
    })
  })
})

// 检索 Dapps
describe('GET /dapps', () => {
  let Dapp

  it('Using no limit. Should be ok', done => {
    node.onNewBlock(_err => {
      node.api.get('/dapps')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // debug(JSON.stringify(body));
          node.expect(body).to.have.property('success').to.be.true
          node.expect(body).to.have.property('result')
          node.expect(body.result).to.have.property('rows').that.is.an('array')
          Dapp = body.result.rows[0]
          DappToInstall.transactionId = Dapp.transaction_id
          done()
        })
    })
  })

  it('Using invalid parameter type (link). Should fail', done => {
    const category = 'a category'
    const name = 1234
    const type = 'type'
    const link = 1234
    const icon = 1234

    node.api.get(`/dapps?category=${category}&name=${name}&type=${type}&link=${link}&icon=${icon}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Ordered by ascending category. Should be ok', done => {
    // FIXME: 2020.6.17 Bug 1. 不能使用 orderBy, 应该使用 sort, 不能使用 :asc 或 :dasc，而是使用默认参数
    const orderBy = 'category' // 默认就是 asc，参数 :asc 不需要放进去

    node.api.get(`/dapps?sort=${orderBy}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('/dapps?orderBy asc', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('result')
        node.expect(body.result).to.have.property('rows').that.is.an('array')
        const dapps = body.result.rows
        if (dapps[0] !== null) {
          for (let i = 0; i < dapps.length; i++) {
            if (dapps[i + 1] !== null) {
              node.expect(dapps[i].category).to.be.at.most(dapps[i + 1].category)
            }
          }
        }
        done()
      })
  })

  it('Ordered by descending category. Should be ok', done => {
    const orderBy = 'category:desc' // 参数错误

    node.api.get(`/dapps?sort=${orderBy}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('/dapps?orderBy desc', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('result')
        node.expect(body.result).to.have.property('rows').that.is.an('array')
        const dapps = body.result.rows
        if (dapps[0] !== null) {
          for (let i = 0; i < dapps.length; i++) {
            if (dapps[i + 1] !== null) {
              node.expect(dapps[i].category).to.be.at.least(dapps[i + 1].category)
            }
          }
        }
        done()
      })
  })

  it('Using limit. Should be ok', done => {
    const limit = 3

    node.api.get(`/dapps?limit=${limit}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('result')
        node.expect(body.result).to.have.property('rows').that.is.an('array')
        node.expect((body.result.rows).length).to.be.at.most(limit)
        done()
      })
  })

  it('Using category. Should be ok', done => {
    const randomCategory = node.randomProperty(node.DappCategory, true)

    node.api.get(`/dapps/category/${randomCategory}/all`)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('result')
        node.expect(body.result).to.have.property('rows').that.is.an('array')
        const dapps = body.result.rows
        if ((dapps).length > 0) {
          node.expect(dapps[0].category).to.equal(node.DappCategory[randomCategory])
        }
        done()
      })
  })

  it('Using name. Should be ok', done => {
    let name = ''

    if (Dapp !== {} && Dapp !== null) {
      name = Dapp.name
    } else {
      name = 'test'
    }

    debug('dapp name', name)
    node.api.get(`/dapps/name/${name}/all`)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(body));
        if (name === 'test') {
          node.expect(body).to.have.property('success')
        } else {
          node.expect(body).to.have.property('success').to.be.true
          node.expect(body).to.have.property('result')
          node.expect(body.result).to.have.property('rows').that.is.an('array')
          const dapps = body.result.rows
          node.expect(dapps.length).to.equal(1)
          node.expect(dapps[0].name).to.equal(name)
        }
        done()
      })
  })

  it('Using type. Should be ok', done => {
    const type = node.randomProperty(node.DappType)

    node.api.get(`/dapps/type/${type}/all`)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('result')
        node.expect(body.result).to.have.property('rows').that.is.an('array')
        const dapps = body.result.rows
        for (let i = 0; i < dapps.length; i++) {
          if (dapps[i] !== null) {
            node.expect(dapps[i].type).to.equal(type)
          }
        }
        done()
      })
  })

  //  FIXME: 这个有问题
  // it("Using link. Should be ok", done => {
  //     const link = dappLink;

  //     node.api.get(`/dapps/link/${link}`)
  //         .expect("Content-Type", /json/)
  //         .expect(200)
  //         .end((err, { body }) => {
  //             debug("get /dapps/link ok", JSON.stringify(body));
  //             node.expect(body).to.have.property("success").to.be.true;
  //             node.expect(body).to.have.property("result");
  //             // node.expect(body.result).to.have.property("rows").that.is.an("array");
  //             const dapp = body.result;
  //             node.expect(dapp.link).to.equal(link);
  //             done();
  //         });
  // });

  // it("Using offset. Should be ok", done => {
  //     const offset = 1;
  //     let secondDapp;

  //     node.api.get("/dapps")
  //         .expect("Content-Type", /json/)
  //         .expect(200)
  //         .end((err, { body }) => {
  //             // debug(JSON.stringify(body));
  //             node.expect(body).to.have.property("success").to.be.true;
  //             node.expect(body).to.have.property("result");
  //             node.expect(body.result).to.have.property("rows").that.is.an("array");
  //             const dapps = body.result.rows;
  //             if (dapps[1] !== null) {
  //                 secondDapp = dapps[1];
  //                 debug("offset", offset);
  //                 node.api.get(`/dapps?offset=${offset}`)
  //                     .expect("Content-Type", /json/)
  //                     .expect(200)
  //                     .end((err, { body }) => {
  //                         // debug(JSON.stringify(body));
  //                         node.expect(body).to.have.property("success").to.be.true;
  //                         node.expect(dapps[0]).to.deep.equal(secondDapp);
  //                     });
  //             } else {
  //                 // debug(JSON.stringify(body));
  //                 debug("Only 1 dapp or something went wrong. Cannot check offset");
  //             }
  //             done();
  //         });
  // });
})

// to delete start
// describe("GET /dapps?id=", function () {

//     it("Using unknown id. Should fail", function (done) {
//         var dappId = "UNKNOWN_ID";

//         node.api.get("/dapps/get?id=" + dappId)
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end(function (err, res) {
//                 // debug(JSON.stringify(body));
//                 node.expect(body).to.have.property("success").to.be.false;
//                 node.expect(body).to.have.property("error");
//                 done();
//             });
//     });

//     it("Using no id. Should fail", function (done) {
//         node.api.get("/dapps/get?id=")
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end(function (err, res) {
//                 // debug(JSON.stringify(body));
//                 node.expect(body).to.have.property("success").to.be.false;
//                 node.expect(body).to.have.property("error");
//                 done();
//             });
//     });

//     it("Using valid id. Should be ok", function (done) {
//         var dappId = DappToInstall.transactionId;

//         node.api.get("/dapps?id=" + dappId)
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end(function (err, res) {
//                 debug('GET /dapps?id= 01', JSON.stringify(body));
//                 node.expect(body).to.have.property("success").to.be.true;
//                 node.expect(body).to.have.property("dapp");
//                 if (body.success === true && body.dapp !== null) {
//                     node.expect(body.dapp.transactionId).to.equal(dappId);
//                 } else {
//                     // debug(JSON.stringify(body));
//                     debug("Request failed or dapps array is null");
//                 }
//                 done();
//             });
//     });

// });
// to delete end

describe('GET /dapps/dappId/:id', () => {
  it('Using valid id. Should be ok', async (done) => {
    await node.onNewBlockAsync()

    const dappId = DappToInstall.transactionId

    node.api.get(`/dapps/dappId/${dappId}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('GET /dapps/dappId/:id', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('dapp')
        node.expect(body.dapp.transaction_id).to.equal(dappId)
        done()
      })
  })
})

// 安装 dapp
describe('POST /dapps/install', () => {
  it('Using no id. Should fail', done => {
    node.api.post('/dapps/install')
      .set('Accept', 'application/json')
      .send({
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using invalid id. Should fail', done => {
    node.api.post('/dapps/install')
      .set('Accept', 'application/json')
      .send({
        id: 'DAPP ID',
        master: node.config.dapp.masterpassword
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using valid id. Should be ok', async done => {
    await node.onNewBlockAsync()

    const dappId = DappToInstall.transactionId

    node.api.post('/dapps/install')
      .set('Accept', 'application/json')
      .send({
        id: dappId,
        master: node.config.dapp.masterpassword
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('/dapps/install valid, ok', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('path')
        done()
      })
  }, 50000)
})

// 检索已安装的 dapp
describe('GET /dapps/installed', () => {
  it('Should be ok', done => {
    let flag = 0

    node.api.get('/dapps/installed')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('/dapps/installed, ok', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('result')
        node.expect(body.result).to.have.property('rows').that.is.an('array')
        const dapps = body.result.rows
        for (let i = 0; i < dapps.length; i++) {
          if (dapps[i] !== null) {
            if (dapps[i].transactionId === DappToInstall.transactionId) {
              flag += 1
            }
          }
        }
        node.expect(flag).to.equal(1)
        done()
      })
  })
})

describe('GET /dapps/installedIds', () => {
  it('Should be ok', done => {
    let flag = 0

    node.api.get('/dapps/installedIds')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('ids').that.is.an('array')
        for (let i = 0; i < body.ids.length; i++) {
          if (body.ids[i] !== null) {
            if (body.ids[i] === DappToInstall.transactionId) {
              flag += 1
            }
          }
        }
        node.expect(flag).to.equal(1)
        done()
      })
  })
})

// TODO: add search api
// describe("GET /dapps/search?q=", () => {

//     it("Using invalid parameters. Should fail", done => {
//         const q = 1234; const category = "good"; const installed = "true";

//         node.api.get(`/dapps/search?q=${q}&category=${category}&installed=${installed}`)
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end((err, { body }) => {
//                 // debug(JSON.stringify(body));
//                 node.expect(body).to.have.property("success").to.be.false;
//                 node.expect(body).to.have.property("error");
//                 done();
//             });
//     });

//     it("Using valid parameters. Should be ok", done => {
//         const q = "a";
//         const category = node.randomProperty(node.DappCategory, true);
//         const installed = 1;

//         node.api.get(`/dapps/search?q=${q}&installed=${installed}&category=${node.DappCategory[category]}`)
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end((err, { body }) => {
//                 // debug(JSON.stringify(body));
//                 node.expect(body).to.have.property("success").to.be.true;
//                 node.expect(body).to.have.property("dapps").that.is.an("array");
//                 done();
//             });
//     });

//     it("Using installed = 0. Should be ok", done => {
//         const q = "s";
//         const category = node.randomProperty(node.DappCategory);
//         const installed = 0;

//         node.api.get(`/dapps/search?q=${q}&installed=${installed}&category=${category}`)
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end((err, { body }) => {
//                 // debug(JSON.stringify(body));
//                 node.expect(body).to.have.property("success").to.be.true;
//                 node.expect(body).to.have.property("dapps").that.is.an("array");
//                 done();
//             });
//     });
// });

// 运行 dapp
describe('POST /dapps/launch', () => {
  it('Using no id. Should fail', done => {
    // const dappId = DappToInstall.transactionId;

    node.api.post('/dapps/launch')
      .set('Accept', 'application/json')
      .send({
        master: node.config.dapp.masterpassword
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('launch no id, fail', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error').include('Invalid parameters')
        done()
      })
  })

  it('Using unknown id. Should fail', done => {
    const dappId = 'UNKNOWN_ID'

    node.api.post('/dapps/launch')
      .set('Accept', 'application/json')
      .send({
        id: dappId,
        master: node.config.dapp.masterpassword
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('launch unknow id, fail', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error').include('DApp not found')
        done()
      })
  })

  it('Using valid id. Should be ok', done => {
    const dappId = DappToInstall.transactionId

    node.api.post('/dapps/launch')
      .set('Accept', 'application/json')
      .send({
        id: dappId,
        master: node.config.dapp.masterpassword
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('launch valid id, ok', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        node.api.get('/dapps/launched')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((_err, { body }) => {
            debug('get launch, ok', JSON.stringify(body))
            node.expect(body).to.have.property('success').to.be.true
            node.expect(body).to.have.property('launched').that.is.an('array')
            let flag = 0
            for (let i = 0; i < body.launched.length; i++) {
              if (body.launched[i] !== null) {
                if (body.launched[i] === dappId) {
                  flag += 1
                }
              }
            }
            node.expect(flag).to.equal(1)
          })
        done()
      })
  })
})

// 停止 dapp
describe('POST /dapps/stop', () => {
  it('Using no id. Should fail', done => {
    node.api.post('/dapps/stop')
      .set('Accept', 'application/json')
      .send({})
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('stop no id, fail', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using unknown id. Should fail', done => {
    const dappId = 'UNKNOWN_ID'

    node.api.post('/dapps/stop')
      .set('Accept', 'application/json')
      .send({
        id: dappId,
        master: node.config.dapp.masterpassword
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('stop unknow id, fail', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using valid id. Should be ok', done => {
    const dappId = DappToInstall.transactionId

    node.api.post('/dapps/stop')
      .set('Accept', 'application/json')
      .send({
        id: dappId,
        master: node.config.dapp.masterpassword
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('stop valid id, ok', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        done()
      })
  })
})

// 类别
describe('GET /dapps/categories', () => {
  it('Should be ok', done => {
    node.api.get('/dapps/categories')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('GET /dapps/categories ok', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('categories').that.is.an('object')
        for (const i in node.DappCategory) {
          node.expect(body.categories[i]).to.equal(node.DappCategory[i])
        }
        done()
      })
  })
})

// 卸载 dapp
describe('POST /dapps/uninstall', () => {
  it('Using no id. Should fail', done => {
    node.api.post('/dapps/uninstall')
      .set('Accept', 'application/json')
      .send({
        id: null,
        master: node.config.dapp.masterpassword
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('uninstall no id, fail', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using unknown id. Should fail', done => {
    const dappId = 'UNKNOWN_ID'

    node.api.post('/dapps/uninstall')
      .set('Accept', 'application/json')
      .send({
        id: dappId,
        master: node.config.dapp.masterpassword
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('uninstall unkown id, fail', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error')
        done()
      })
  })

  it('Using valid id. Should be ok', done => {
    const dappId = DappToInstall.transactionId

    node.api.post('/dapps/uninstall')
      .set('Accept', 'application/json')
      .send({
        id: dappId,
        master: node.config.dapp.masterpassword
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, { body }) => {
        debug('uninstall valid id, fail', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        done()
      })
  })
})

// 测试交易
Transfer()
